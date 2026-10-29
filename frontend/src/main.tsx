import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.tsx";
import { OrganizacionProvider } from "./OrganizacionContext.tsx";
import { ToastProvider } from "./Toast.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <OrganizacionProvider>
          <App />
        </OrganizacionProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
);
