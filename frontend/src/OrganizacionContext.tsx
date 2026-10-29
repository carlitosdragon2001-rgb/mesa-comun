import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Organizacion } from "./types";

interface OrganizacionContextValue {
  organizacion: Organizacion | null;
  setOrganizacion: (org: Organizacion | null) => void;
}

const OrganizacionContext = createContext<OrganizacionContextValue | undefined>(undefined);

const STORAGE_KEY = "organizacion_activa";

export function OrganizacionProvider({ children }: { children: ReactNode }) {
  const [organizacion, setOrganizacionState] = useState<Organizacion | null>(() => {
    const guardada = localStorage.getItem(STORAGE_KEY);
    return guardada ? JSON.parse(guardada) : null;
  });

  useEffect(() => {
    if (organizacion) localStorage.setItem(STORAGE_KEY, JSON.stringify(organizacion));
    else localStorage.removeItem(STORAGE_KEY);
  }, [organizacion]);

  return (
    <OrganizacionContext.Provider value={{ organizacion, setOrganizacion: setOrganizacionState }}>
      {children}
    </OrganizacionContext.Provider>
  );
}

export function useOrganizacionActiva() {
  const ctx = useContext(OrganizacionContext);
  if (!ctx) throw new Error("useOrganizacionActiva debe usarse dentro de OrganizacionProvider");
  return ctx;
}
