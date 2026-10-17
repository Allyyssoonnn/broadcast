import { Navigate, Route, Routes } from "react-router-dom";
import AuthenticatedLayout from "./components/layout/authenticated.layout";
import BroadcastPage from "./routes/broadcast.page";
import LoginPage from "./routes/login.page";
import ProtectedRoute from "./routes/protected.route";

export default function AppRouter() {
   return (
      <Routes>
         <Route path="*" element={<Navigate to="/broadcast" replace />} />

         <Route path="/login" element={<LoginPage />} />

         <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedLayout />}>
               <Route path="/broadcast" element={<BroadcastPage />} />
            </Route>
         </Route>
      </Routes>
   );
}
