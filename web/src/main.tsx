import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { StyledEngineProvider } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRouter from "./App.tsx";
import { AuthProvider } from "./features/auth/auth.provider.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
   <StrictMode>
      <StyledEngineProvider enableCssLayer>
         <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
         <CssBaseline />

         <BrowserRouter>
            <AuthProvider>
               <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <AppRouter />
               </LocalizationProvider>
            </AuthProvider>
         </BrowserRouter>
      </StyledEngineProvider>
   </StrictMode>,
);
