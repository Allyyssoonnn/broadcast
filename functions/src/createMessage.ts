import {FieldValue, getFirestore, Timestamp} from "firebase-admin/firestore";
import {HttpsError, onCall} from "firebase-functions/v2/https";
import {
  assertRecipientsBelong,
  validateContactIds,
  validateContent,
  validateFutureMs,
  validateId,
} from "./messageValidation";

type CreateMessageRequest = {
  connectionId: string;
  contactIds: string[];
  content: string;
  scheduledAtMs: number | null;
};

export const createMessage = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const data = request.data as CreateMessageRequest;

  const connectionId = validateId(data.connectionId, "Invalid connection.");
  const content = validateContent(data.content);
  const contactIds = validateContactIds(data.contactIds);
  const scheduledAtMs =
    data.scheduledAtMs === null ? null : validateFutureMs(data.scheduledAtMs);

  const db = getFirestore();

  const connectionSnapshot = await db
    .collection("connections")
    .doc(connectionId)
    .get();

  if (
    !connectionSnapshot.exists ||
    connectionSnapshot.data()?.ownerId !== uid
  ) {
    throw new HttpsError(
      "permission-denied",
      "You do not have access to this connection.",
    );
  }

  await assertRecipientsBelong(uid, connectionId, contactIds);

  const messageRef = db.collection("messages").doc();

  await messageRef.set({
    ownerId: uid,
    connectionId,
    contactIds,
    content,
    status: scheduledAtMs === null ? "sent" : "scheduled",
    scheduledAt:
      scheduledAtMs === null ? null : Timestamp.fromMillis(scheduledAtMs),
    sentAt: scheduledAtMs === null ? FieldValue.serverTimestamp() : null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {id: messageRef.id};
});
