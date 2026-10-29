import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useToast } from "../Toast";
import { grabarUrlEnEtiqueta, nfcDisponible } from "../lib/webNfc";

export default function CompartirPerfil({ perfilId, nombre }: { perfilId: number; nombre: string }) {
  const { notificar } = useToast();
  const [qr, setQr] = useState<string | null>(null);
  const [grabando, setGrabando] = useState(false);
  const url = `${window.location.origin}/app/perfiles/${perfilId}`;

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 132, color: { dark: "#2e2415", light: "#00000000" } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(url);
      notificar("Enlace copiado", "exito");
    } catch {
      notificar("No se ha podido copiar el enlace", "error");
    }
  }

  async function grabarNfc() {
    setGrabando(true);
    try {
      await grabarUrlEnEtiqueta(url);
      notificar(`Etiqueta grabada con el perfil de ${nombre}`, "exito");
    } catch (e) {
      notificar(`No se pudo grabar la etiqueta: ${(e as Error).message}`, "error");
    } finally {
      setGrabando(false);
    }
  }

  return (
    <div className="rounded-xl bg-paper-sunken/60 p-3.5">
      <span className="mb-2 block text-[0.68rem] font-semibold uppercase tracking-wide text-ink-muted">
        Vincular con pegatina NFC o QR
      </span>
      <div className="flex flex-wrap items-center gap-3.5">
        {qr && (
          <img src={qr} alt={`Código QR del perfil de ${nombre}`} className="h-20 w-20 flex-none rounded-lg bg-paper-raised p-1.5 shadow-sm" />
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-ink-muted">
            Al escanear la pegatina (NFC) o el QR, se abre directamente el perfil de <strong className="text-ink-soft">{nombre}</strong> listo para editar.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="truncate rounded-lg border border-ink/15 bg-paper-raised px-2 py-1 text-xs text-ink-soft">{url}</code>
            <button onClick={copiarEnlace} className="rounded-full border border-ink/20 px-2.5 py-1 text-xs font-medium hover:bg-paper-raised">
              Copiar enlace
            </button>
            {nfcDisponible() ? (
              <button
                onClick={grabarNfc}
                disabled={grabando}
                className="rounded-full bg-berry px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-berry-dark disabled:opacity-50"
              >
                {grabando ? "Acerca la etiqueta…" : "Grabar en etiqueta NFC"}
              </button>
            ) : (
              <span className="text-xs text-ink-muted">
                Grabado NFC solo disponible en Chrome/Android — copia el enlace en una app como NFC Tools, o usa el QR.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
