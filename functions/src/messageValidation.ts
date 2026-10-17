import {FieldPath, getFirestore} from "firebase-admin/firestore";
import {HttpsError} from "firebase-functions/v2/https";

const MAX_CONTACTS = 500;
const CONTACTS_PER_QUERY = 30;

export const validateId = (value: unknown, message: string): string => {
  if (typeof value !== "string" || !value.trim() || value.includes("/")) {
    throw new HttpsError("invalid-argument", message);
  }
  return value;
};

export const validateContent = (content: unknown): string => {
  if (
    typeof content !== "string" ||
    !content.trim() ||
    content.trim().length > 1000
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Content must contain between 1 and 1000 characters.",
    );
  }
  return content.trim();
};

export const validateContactIds = (contactIds: unknown): string[] => {
  if (
    !Array.isArray(contactIds) ||
    contactIds.length === 0 ||
    contactIds.length > MAX_CONTACTS ||
    contactIds.some(
      (id) => typeof id !== "string" || !id.trim() || id.includes("/"),
    )
  ) {
    throw new HttpsError("invalid-argument", "Invalid recipients.");
  }

  if (new Set(contactIds).size !== contactIds.length) {
    throw new HttpsError(
      "invalid-argument",
      "Duplicate recipients are not allowed.",
    );
  }

  return contactIds as string[];
};

export const validateFutureMs = (value: unknown): number => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= Date.now()
  ) {
    throw new HttpsError(
      "invalid-argument",
      "Scheduled date must be in the future.",
    );
  }
  return value;
};

export const assertRecipientsBelong = async (
  uid: string,
  connectionId: string,
  contactIds: string[],
): Promise<void> => {
  const db = getFirestore();

  for (let i = 0; i < contactIds.length; i += CONTACTS_PER_QUERY) {
    const batchIds = contactIds.slice(i, i + CONTACTS_PER_QUERY);

    const snapshot = await db
      .collection("contacts")
      .where(FieldPath.documentId(), "in", batchIds)
      .get();

    const contactsById = new Map(
      snapshot.docs.map((contact) => [contact.id, contact.data()]),
    );

    for (const contactId of batchIds) {
      const contact = contactsById.get(contactId);

      if (
        !contact ||
        contact.ownerId !== uid ||
        contact.connectionId !== connectionId
      ) {
        throw new HttpsError(
          "permission-denied",
          "One or more recipients do not belong to this connection.",
        );
      }
    }
  }
};
