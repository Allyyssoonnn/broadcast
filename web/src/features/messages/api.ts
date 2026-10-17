import type { Unsubscribe } from "firebase/firestore";
import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app, db } from "../../lib/firebase";
import type { Message } from "./types";

const functions = getFunctions(app, "southamerica-east1");

function validateMessageInput({ content, contactIds, scheduledAt }: MessageInputPropType): MessageInputPropType {
   const cleanContent = content.trim();

   if (!cleanContent) throw new Error("Message content is required");
   if (contactIds.length === 0) throw new Error("At least one contact is required");

   if (cleanContent.length > 1000) throw new Error("Message must have at most 1000 characters");

   return { content: cleanContent, contactIds, scheduledAt };
}

const COLLECTION_NAME = "messages";

const messagesCollection = collection(db, COLLECTION_NAME);

export type MessageInputPropType = {
   content: string;
   contactIds: string[];
   scheduledAt?: Date | null;
};

export type MessageListenerType = {
   onSuccess: (messages: Message[]) => void;
   onError?: (error: Error) => void;
};

export function subscribeMessageListener(
   ownerId: string,
   connectionId: string,
   listener: MessageListenerType,
): Unsubscribe {
   const messageQuery = query(
      messagesCollection,
      where("ownerId", "==", ownerId),
      where("connectionId", "==", connectionId),
   );

   return onSnapshot(
      messageQuery,
      (snapshot) => {
         const messages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
         })) as Message[];

         listener.onSuccess(messages);
      },
      (error) => {
         listener.onError?.(error);
      },
   );
}

type CreateMessageResponse = {
   id: string;
};

export async function createMessage(connectionId: string, messageInput: MessageInputPropType): Promise<string> {
   const { content, contactIds, scheduledAt = null } = validateMessageInput(messageInput);

   const isScheduled = !!scheduledAt;

   if (isScheduled && scheduledAt!.getTime() <= Date.now()) {
      throw new Error("Scheduled date must be in the future");
   }

   const callable = httpsCallable<
      {
         connectionId: string;
         contactIds: string[];
         content: string;
         scheduledAtMs: number | null;
      },
      CreateMessageResponse
   >(functions, "createMessage");

   const messageResp = await callable({
      connectionId,
      contactIds,
      content: content,
      scheduledAtMs: scheduledAt?.getTime() ?? null,
   });

   return messageResp.data.id;
}

export async function updateMessage(messageId: string, messageInput: MessageInputPropType): Promise<void> {
   const { content, contactIds, scheduledAt = null } = validateMessageInput(messageInput);

   if (!scheduledAt || scheduledAt.getTime() <= Date.now()) {
      throw new Error("Scheduled date must be in the future");
   }

   const callable = httpsCallable<
      { messageId: string; contactIds: string[]; content: string; scheduledAtMs: number },
      { id: string }
   >(functions, "updateMessage");

   await callable({ messageId, contactIds, content, scheduledAtMs: scheduledAt.getTime() });
}

export async function deleteMessage(messageId: string): Promise<void> {
   const messageRef = doc(db, COLLECTION_NAME, messageId);

   await deleteDoc(messageRef);
}
