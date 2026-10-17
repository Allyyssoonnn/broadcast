import {
   addDoc,
   collection,
   doc,
   onSnapshot,
   query,
   serverTimestamp,
   updateDoc,
   where,
   type Unsubscribe,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, db } from "../../lib/firebase";
import type { Contact } from "./types";

const functions = getFunctions(app, "southamerica-east1");

function validateContactInput({ name, phone }: ContactInputPropType): ContactInputPropType {
   const cleanName = name.trim();
   const cleanPhone = phone.trim();

   if (!cleanName) throw new Error("Contact name is required");
   if (!cleanPhone) throw new Error("Contact phone is required");

   return { name: cleanName, phone: cleanPhone };
}

const COLLECTION_NAME = "contacts";

const contactsCollection = collection(db, COLLECTION_NAME);

export type ContactInputPropType = {
   name: string;
   phone: string;
};

export type ContactListenerType = {
   onSuccess: (contacts: Contact[]) => void;
   onError?: (error: Error) => void;
};

export function subscribeContactListener(
   ownerId: string,
   connectionId: string,
   listener: ContactListenerType,
): Unsubscribe {
   const contactQuery = query(
      contactsCollection,
      where("ownerId", "==", ownerId),
      where("connectionId", "==", connectionId),
   );

   return onSnapshot(
      contactQuery,
      (snapshot) => {
         const contacts = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
         })) as Contact[];

         listener.onSuccess(contacts);
      },
      (error) => {
         listener.onError?.(error);
      },
   );
}

export async function createContact(
   ownerId: string,
   connectionId: string,
   contactInput: ContactInputPropType,
): Promise<string> {
   const { name, phone } = validateContactInput(contactInput);

   const contactResp = await addDoc(contactsCollection, {
      ownerId,
      connectionId,
      name,
      phone,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
   });

   return contactResp.id;
}

export async function updateContact(contactId: string, contactInput: ContactInputPropType): Promise<void> {
   const { name, phone } = validateContactInput(contactInput);

   const contactRef = doc(db, COLLECTION_NAME, contactId);

   await updateDoc(contactRef, {
      name,
      phone,
      updatedAt: serverTimestamp(),
   });
}

export async function deleteContact(contactId: string): Promise<void> {
   const callable = httpsCallable<{ contactId: string }, { success: boolean; updatedSchedules: number }>(
      functions,
      "deleteContact",
   );

   await callable({ contactId });
}
