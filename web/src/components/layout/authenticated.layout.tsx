import { Outlet } from "react-router-dom";
import AppHeader from "./app.header";

export default function AuthenticatedLayout() {
   return (
      <>
         <AppHeader />
         <main>
            <Outlet />
         </main>
      </>
   );
}
