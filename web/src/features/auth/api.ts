import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";

export const register = async (email: string, password: string) =>
   createUserWithEmailAndPassword(auth, email, password);

export const login = async (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);

export const logout = async () => signOut(auth);
