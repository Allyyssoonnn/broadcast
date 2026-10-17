import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../../lib/firebase";
import { AuthContext, type AuthContextType } from "./auth.context";

export function AuthProvider({ children }: { children: React.ReactNode }) {
   const [authState, setAuthState] = useState<AuthContextType>({
      user: null,
      loading: true,
   });

   useEffect(
      () =>
         onAuthStateChanged(auth, (user) => {
            setAuthState({ user, loading: false });
         }),
      [],
   );

   return <AuthContext.Provider value={authState}>{children}</AuthContext.Provider>;
}
