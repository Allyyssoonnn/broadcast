import { useEffect, useState } from "react";
import { useAuth } from "../auth/hooks";
import { subscribeConnectionListener } from "./api";
import type { Connection } from "./types";

export function useConnections() {
   const { user } = useAuth();

   const [connections, setConnections] = useState<Connection[]>([]);
   const [loading, setLoading] = useState<boolean>(true);
   const [error, setError] = useState<string | null>(null);

   useEffect(() => {
      if (!user?.uid) {
         return;
      }

      const unsubscribe = subscribeConnectionListener(user.uid, {
         onSuccess: (data) => {
            setConnections(data);
            setLoading(false);
         },
         onError: (err) => {
            setError(err.message);
            setLoading(false);
         },
      });

      return unsubscribe;
   }, [user?.uid]);

   return {
      connections,
      loading,
      error,
   };
}
