import { useEffect, useState } from "react";
import { useAuth } from "../auth/hooks";
import { subscribeContactListener } from "./api";
import type { Contact } from "./types";

export function useContacts(connectionId: string | null) {
   const { user } = useAuth();

   const [contacts, setContacts] = useState<Contact[]>([]);
   const [loading, setLoading] = useState<boolean>(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (!user?.uid || !connectionId) {
         return;
      }

      const unsubscribe = subscribeContactListener(user.uid, connectionId, {
         onSuccess: (data) => {
            setContacts(data);
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
      contacts,
      loading,
      error,
   };
}
