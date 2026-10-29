// Web NFC (NDEFReader) solo existe en Chrome/Edge para Android y únicamente en
// un "secure context" (HTTPS o localhost). No hay equivalente en iOS Safari ni
// en escritorio: ahí queda el QR o una app de terceros (p. ej. NFC Tools).
// Ver: https://developer.mozilla.org/docs/Web/API/Web_NFC_API

export type EstadoNfc = "disponible" | "sin_https" | "sin_soporte";

export function estadoNfc(): EstadoNfc {
  if (typeof window === "undefined") return "sin_soporte";
  if ("NDEFReader" in window) return "disponible";
  // Chrome Android oculta NDEFReader si la página no es segura: distinguir este
  // caso evita decirle al usuario "tu móvil no puede" cuando en realidad solo
  // le falta abrir la app por HTTPS.
  if (!window.isSecureContext) return "sin_https";
  return "sin_soporte";
}

export function nfcDisponible(): boolean {
  return estadoNfc() === "disponible";
}

export const MENSAJE_ESTADO_NFC: Record<EstadoNfc, string> = {
  disponible: "Listo para leer etiquetas NFC.",
  sin_https:
    "El NFC necesita una conexión segura (HTTPS). Abre la app por https:// y acepta el aviso del certificado.",
  sin_soporte:
    "Este navegador no puede leer NFC (solo Chrome en Android). Usa el QR o una app como NFC Tools.",
};

export async function grabarUrlEnEtiqueta(url: string): Promise<void> {
  // @ts-expect-error NDEFReader aún no está en los tipos estándar del DOM.
  const lector = new window.NDEFReader();
  await lector.write({ records: [{ recordType: "url", data: url }] });
}

/** Lee la primera etiqueta que se acerque y devuelve su URL (o texto). */
export function escanearEtiqueta(señal: AbortSignal): Promise<string> {
  return new Promise((resolver, rechazar) => {
    // @ts-expect-error NDEFReader aún no está en los tipos estándar del DOM.
    const lector = new window.NDEFReader();
    const decodificador = new TextDecoder();

    lector.addEventListener(
      "reading",
      (evento: { message: { records: { recordType: string; data?: DataView }[] } }) => {
        for (const registro of evento.message.records) {
          if (registro.recordType === "url" || registro.recordType === "text") {
            if (registro.data) {
              resolver(decodificador.decode(registro.data));
              return;
            }
          }
        }
        rechazar(new Error("La etiqueta no contiene ninguna URL ni texto."));
      },
      { once: true, signal: señal },
    );

    lector.addEventListener("readingerror", () => rechazar(new Error("No se pudo leer la etiqueta.")), {
      once: true,
      signal: señal,
    });

    señal.addEventListener("abort", () => rechazar(new DOMException("Escaneo cancelado", "AbortError")), {
      once: true,
    });

    lector.scan({ signal: señal }).catch(rechazar);
  });
}

/** Convierte la URL de una etiqueta en una ruta interna de la app ("/app/..."). */
export function rutaDesdeUrl(valor: string): string | null {
  try {
    const url = new URL(valor, window.location.origin);
    return url.pathname.startsWith("/app/") ? url.pathname + url.search : null;
  } catch {
    return null;
  }
}

/** Vibración corta de confirmación; se ignora donde no esté disponible. */
export function vibrar(patron: number | number[] = 40): void {
  try {
    navigator.vibrate?.(patron);
  } catch {
    /* algunos navegadores lanzan si la página no está en primer plano */
  }
}
