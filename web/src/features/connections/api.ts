import {
   addDoc,
   collection,
   deleteDoc,
   doc,
   onSnapshot,
   query,
   serverTimestamp,
   updateDoc,
   where,
   type Unsubscribe,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Connection } from "./types";

function validateConnectionInput({ name }: ConnectionInputPropType): ConnectionInputPropType {
   const cleanName = name.trim();

   if (!cleanName) throw new Error("Connection name is required");

   return { name: cleanName };
}

const COLLECTION_NAME = "connections";

const connectionsCollection = collection(db, COLLECTION_NAME);

export type ConnectionInputPropType = {
   name: string;
};

export type ConnectionListenerType = {
   onSuccess: (connections: Connection[]) => void;
   onError?: (error: Error) => void;
};

export function subscribeConnectionListener(ownerId: string, listener: ConnectionListenerType): Unsubscribe {
   const connectionQuery = query(connectionsCollection, where("ownerId", "==", ownerId));

   return onSnapshot(
      connectionQuery,
      (snapshot) => {
         const connections = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
         })) as Connection[];

         listener.onSuccess(connections);
      },
      (error) => {
         listener.onError?.(error);
      },
   );
}

export async function createConnection(ownerId: string, connectionInput: ConnectionInputPropType): Promise<string> {
   const { name } = validateConnectionInput(connectionInput);

   const connectionResp = await addDoc(connectionsCollection, {
      ownerId,
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
   });

   return connectionResp.id;
}

export async function updateConnection(connectionId: string, connectionInput: ConnectionInputPropType): Promise<void> {
   const { name } = validateConnectionInput(connectionInput);

   const connectionRef = doc(db, COLLECTION_NAME, connectionId);

   await updateDoc(connectionRef, {
      name,
      updatedAt: serverTimestamp(),
   });
}

export async function deleteConnection(connectionId: string): Promise<void> {
   const connectionRef = doc(db, COLLECTION_NAME, connectionId);

   await deleteDoc(connectionRef);
}
