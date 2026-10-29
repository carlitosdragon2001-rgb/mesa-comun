import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Tono = "exito" | "error" | "info";
interface ToastItem {
  id: number;
  mensaje: string;
  tono: Tono;
}

interface ToastContextValue {
  notificar: (mensaje: string, tono?: Tono) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const ESTILOS: Record<Tono, string> = {
  exito: "border-good/30 bg-good-bg text-good",
  error: "border-critical/30 bg-critical-bg text-critical",
  info: "border-ink/15 bg-paper-raised text-ink",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const notificar = useCallback((mensaje: string, tono: Tono = "info") => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, mensaje, tono }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ notificar }}>
      {children}
      {/* bottom-24 en móvil para no quedar debajo de la barra de pestañas */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-4">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm animate-[toast-in_0.2s_ease-out] rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg ${ESTILOS[t.tono]}`}
          >
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
