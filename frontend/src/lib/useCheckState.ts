import { useEffect, useState } from "react";

function leer(key: string): Record<number, boolean> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "{}");
  } catch {
    return {};
  }
}

/** Estado de "marcado" (carro/comprado) por ítem de la lista de la compra,
 * persistido en localStorage por id de lista. Se re-sincroniza cuando
 * `listaId` cambia (por ejemplo, cuando la lista termina de cargar de forma
 * asíncrona después del primer render), en vez de fijarse solo una vez. */
export function useCheckState(listaId: number | undefined) {
  const key = `compra-estado-${listaId ?? "sin-lista"}`;
  const [estado, setEstado] = useState<Record<number, boolean>>(() => leer(key));

  useEffect(() => {
    setEstado(leer(key));
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(estado));
    } catch {
      /* almacenamiento no disponible: el check queda solo en memoria */
    }
  }, [estado, key]);

  const toggle = (alimentoId: number) => setEstado((prev) => ({ ...prev, [alimentoId]: !prev[alimentoId] }));
  return { estado, toggle };
}
