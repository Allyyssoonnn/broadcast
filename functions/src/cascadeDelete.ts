import {getFirestore} from "firebase-admin/firestore";
import {onDocumentDeleted} from "firebase-functions/firestore";

export const cascadeDelete = onDocumentDeleted(
  "connections/{connectionId}",
  async (event) => {
    const db = getFirestore();
    const {connectionId} = event.params;
    const writer = db.bulkWriter();

    for (const collectionName of ["contacts", "messages"]) {
      const snap = await db
        .collection(collectionName)
        .where("connectionId", "==", connectionId)
        .get();
      snap.docs.forEach((doc) => writer.delete(doc.ref));
    }

    await writer.close();
  },
);
