import { useEffect, useState } from "react";
import { useAuth } from "../auth/hooks";
import { subscribeMessageListener } from "./api";
import type { Message } from "./types";

export function useMessages(connectionId: string | null) {
   const { user } = useAuth();

   const [messages, setMessages] = useState<Message[]>([]);
   const [loading, setLoading] = useState<boolean>(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (!user?.uid || !connectionId) {
         return;
      }

      const unsubscribe = subscribeMessageListener(user.uid, connectionId, {
         onSuccess: (data) => {
            setMessages(data);
            setLoading(false);
         },
         onError: (err) => {
            setError(err.message);
            setLoading(false);
         },
      });

      return unsubscribe;
   }, [user?.uid, connectionId]);

   return {
      messages,
      loading,
      error,
   };
}
