import {FieldValue, Timestamp, getFirestore} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
  assertRecipientsBelong,
  validateContactIds,
  validateContent,
  validateFutureMs,
  validateId,
} from "./messageValidation";

type UpdateMessageRequest = {
  messageId: string;
  contactIds: string[];
  content: string;
  scheduledAtMs: number;
};

export const updateMessage = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const data = request.data as UpdateMessageRequest;

  const messageId = validateId(data.messageId, "Invalid message.");
  const content = validateContent(data.content);
  const contactIds = validateContactIds(data.contactIds);
  const scheduledAtMs = validateFutureMs(data.scheduledAtMs);

  const db = getFirestore();
  const messageRef = db.collection("messages").doc(messageId);

  await db.runTransaction(async (tx) => {
    const message = (await tx.get(messageRef)).data();

    if (!message || message.ownerId !== uid) {
      throw new HttpsError("permission-denied", "Message not found.");
    }

    if (message.status !== "scheduled") {
      throw new HttpsError(
        "failed-precondition",
        "Only scheduled messages can be edited.",
      );
    }

    await assertRecipientsBelong(uid, message.connectionId, contactIds);

    tx.update(messageRef, {
      content,
      contactIds,
      scheduledAt: Timestamp.fromMillis(scheduledAtMs),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  return {id: messageId};
});
