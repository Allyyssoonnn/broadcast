import {FieldValue, getFirestore, Timestamp} from "firebase-admin/firestore";
import {onSchedule} from "firebase-functions/scheduler";

export const sendScheduledMessages = onSchedule("every 1 minutes", async () => {
  const db = getFirestore();

  const snap = await db
    .collection("messages")
    .where("status", "==", "scheduled")
    .where("scheduledAt", "<=", Timestamp.now())
    .limit(500)
    .get();

  if (snap.empty) return;

  await Promise.all(
    snap.docs.map((doc) =>
      db.runTransaction(async (tx) => {
        const message = (await tx.get(doc.ref)).data();

        if (
          !message ||
          message.status !== "scheduled" ||
          !message.scheduledAt ||
          message.scheduledAt.toMillis() > Date.now()
        ) {
          return;
        }

        tx.update(doc.ref, {
          status: "sent",
          sentAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }),
    ),
  );
});
