import { parseFechaUtc } from "./fecha";

// La satisfacción acumulada del motor (apdo. 6.3) no tiene un rango fijo: sube
// hasta un máximo de 5 y baja sin suelo cuando un perfil encadena compromisos.
// Para mostrarla como un porcentaje legible se usa 0 = neutral (satisfaccion=0)
// y cada punto de satisfacción equivale a 10 puntos porcentuales; el umbral de
// aviso se fija un poco por encima de -1,5, que es cuando el motor ya empieza a
// aplicar el refuerzo de equidad en la siguiente planificación.
export function porcentajeEquidad(satisfaccion: number): number {
  return Math.max(0, Math.min(100, 50 + satisfaccion * 10));
}

export const UMBRAL_EQUIDAD = 40;

export function tiempoRelativo(fechaIso: string): string {
  const diffMs = Date.now() - parseFechaUtc(fechaIso).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 1) return "justo ahora";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "hace 1 día";
  return `hace ${dias} días`;
}
