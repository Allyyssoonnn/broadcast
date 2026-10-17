import { CircularProgress } from "@mui/material";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../features/auth/hooks";

export default function ProtectedRoute() {
   const { user, loading } = useAuth();

   if (loading) {
      return (
         <div className="flex h-screen items-center justify-center">
            <CircularProgress />
         </div>
      );
   }

   return user ? <Outlet /> : <Navigate to="/login" replace />;
}
