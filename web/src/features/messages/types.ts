import type { Timestamp } from "firebase/firestore";
export type MessageStatus = "scheduled" | "sent";

export type Message = {
   id: string;
   ownerId: string;
   connectionId: string;
   contactIds: string[];
   content: string;
   status: MessageStatus;
   scheduledAt: Timestamp | null;
   sentAt: Timestamp | null;
   createdAt: Timestamp;
   updatedAt: Timestamp;
};
