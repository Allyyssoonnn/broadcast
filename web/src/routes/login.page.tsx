import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type SubmitEvent } from "react";
import { Navigate } from "react-router-dom";
import { login, register } from "../features/auth/api";
import { useAuth } from "../features/auth/hooks";

export default function LoginPage() {
   const { user } = useAuth();
   const [mode, setMode] = useState<"login" | "signup">("login");
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");
   const [error, setError] = useState("");
   const [busy, setBusy] = useState(false);

   if (user) return <Navigate to="/broadcast" replace />;

   const handleSubmit = async (e: SubmitEvent) => {
      e.preventDefault();
      setError("");
      setBusy(true);
      try {
         await (mode === "login" ? login : register)(email, password);
      } catch {
         setError(
            mode === "login"
               ? "Invalid e-mail or password."
               : "Unable to create the account (email in use or password with fewer than 6 characters).",
         );
      } finally {
         setBusy(false);
      }
   };

   return (
      <div className="flex min-h-screen items-center justify-center p-4">
         <Paper className="w-full max-w-sm p-6" variant="outlined">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
               <Typography variant="h5">{mode === "login" ? "Sign In" : "Create Account"}</Typography>

               <TextField
                  label="E-mail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
               />

               <TextField
                  label="Password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
               />

               {error && <Alert severity="error">{error}</Alert>}

               <Button type="submit" variant="contained" disabled={busy}>
                  {mode === "login" ? "Sign In" : "Sign Up"}
               </Button>

               <Button
                  onClick={() => {
                     setMode(mode === "login" ? "signup" : "login");
                     setError("");
                  }}
               >
                  {mode === "login" ? "Don't have an account?" : "Already have an account?"}
               </Button>
            </form>
         </Paper>
      </div>
   );
}
