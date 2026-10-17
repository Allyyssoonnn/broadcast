import {FieldValue, getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {validateId} from "./messageValidation";

export const deleteContact = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const contactId = validateId(request.data?.contactId, "Invalid contact ID.");

  const db = getFirestore();
  const contactRef = db.collection("contacts").doc(contactId);

  const contactSnap = await contactRef.get();
  const contact = contactSnap.data();

  if (!contactSnap.exists || contact?.ownerId !== uid) {
    throw new HttpsError("not-found", "Contact not found.");
  }

  const schedules = await db
    .collection("messages")
    .where("ownerId", "==", uid)
    .where("status", "==", "scheduled")
    .where("contactIds", "array-contains", contactId)
    .get();

  for (const scheduleDoc of schedules.docs) {
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(scheduleDoc.ref);
      const message = snapshot.data();

      if (
        !snapshot.exists ||
        message?.ownerId !== uid ||
        message?.status !== "scheduled" ||
        !Array.isArray(message.contactIds)
      ) {
        return;
      }

      const remainingContactIds = message.contactIds.filter(
        (id: unknown) => id !== contactId,
      );

      if (remainingContactIds.length === 0) {
        tx.delete(scheduleDoc.ref);
        return;
      }

      tx.update(scheduleDoc.ref, {
        contactIds: remainingContactIds,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  }

  await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(contactRef);
    const currentContact = snapshot.data();

    if (!snapshot.exists || currentContact?.ownerId !== uid) {
      throw new HttpsError("not-found", "Contact not found.");
    }

    tx.delete(contactRef);
  });

  return {
    success: true,
    updatedSchedules: schedules.size,
  };
});
