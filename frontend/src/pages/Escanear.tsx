import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { NOMBRE_TIPO } from "../AppLayout";
import { useOrganizacionActiva } from "../OrganizacionContext";
import { useToast } from "../Toast";
import { IconoAtras, IconoNfc } from "../components/icons";
import type { Organizacion } from "../types";
import {
  MENSAJE_ESTADO_NFC,
  escanearEtiqueta,
  estadoNfc,
  grabarUrlEnEtiqueta,
  rutaDesdeUrl,
  vibrar,
} from "../lib/webNfc";

type Fase = "reposo" | "escuchando" | "leida" | "error";

export default function Escanear() {
  const navegar = useNavigate();
  const { organizacion } = useOrganizacionActiva();
  const { notificar } = useToast();
  const [fase, setFase] = useState<Fase>("reposo");
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const estado = estadoNfc();
  const disponible = estado === "disponible";

  // Sin NFC (portátil, iPhone, proyector de la presentación) hay que poder
  // llegar a la misma ficha a la que llevaría la pegatina.
  useEffect(() => {
    if (disponible) return;
    api.get<Organizacion[]>("/organizaciones").then(setOrganizaciones).catch(() => undefined);
  }, [disponible]);

  // Si se abandona la pantalla con el escaneo activo, hay que cortarlo: si no, el
  // lector sigue vivo en segundo plano y vuelve a disparar al acercar una etiqueta.
  useEffect(() => () => abortRef.current?.abort(), []);

  async function empezarEscaneo() {
    abortRef.current?.abort();
    const control = new AbortController();
    abortRef.current = control;
    setFase("escuchando");
    setMensaje(null);
    try {
      const contenido = await escanearEtiqueta(control.signal);
      vibrar([30, 40, 30]);
      const ruta = rutaDesdeUrl(contenido);
      if (ruta) {
        setFase("leida");
        setMensaje(contenido);
        setTimeout(() => navegar(ruta), 450);
      } else {
        setFase("leida");
        setMensaje(contenido);
      }
    } catch (e) {
      if ((e as DOMException).name === "AbortError") {
        setFase("reposo");
        return;
      }
      setFase("error");
      setMensaje((e as Error).message);
    }
  }

  function cancelar() {
    abortRef.current?.abort();
    setFase("reposo");
  }

  async function grabarOrganizacion() {
    if (!organizacion) return;
    setGrabando(true);
    try {
      const url = `${window.location.origin}/app/organizaciones/${organizacion.id}`;
      await grabarUrlEnEtiqueta(url);
      vibrar(60);
      notificar(`Pegatina grabada con "${organizacion.nombre}"`, "exito");
    } catch (e) {
      notificar(`No se pudo grabar: ${(e as Error).message}`, "error");
    } finally {
      setGrabando(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-berry">Etiquetas NFC</span>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Escanear pegatina</h1>
        <p className="text-sm text-ink-muted">
          Acerca el móvil a la pegatina para abrir directamente su ficha: una persona, una familia o una residencia.
        </p>
      </div>

      <div className="flex flex-col items-center gap-5 rounded-3xl border border-ink/10 bg-paper-raised px-5 py-9 shadow-sm">
        <button
          onClick={fase === "escuchando" ? cancelar : empezarEscaneo}
          disabled={!disponible}
          aria-label={fase === "escuchando" ? "Cancelar escaneo" : "Empezar a escanear"}
          className={`relative flex h-36 w-36 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-40 ${
            fase === "escuchando" ? "bg-berry-dark" : fase === "leida" ? "bg-good" : "bg-berry"
          } text-white shadow-lg`}
        >
          {fase === "escuchando" && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-berry/40" />
              <span className="absolute -inset-3 animate-pulse rounded-full border-2 border-berry/30" />
            </>
          )}
          <IconoNfc className="relative h-16 w-16" />
        </button>

        <div className="min-h-[3.5rem] text-center">
          {fase === "reposo" && (
            <p className="text-sm text-ink-soft">
              {disponible
                ? "Pulsa y acerca la pegatina a la parte de atrás del móvil."
                : "Lectura NFC no disponible en este navegador."}
            </p>
          )}
          {fase === "escuchando" && (
            <p className="font-display text-lg font-semibold text-berry">Acerca la pegatina…</p>
          )}
          {fase === "leida" && (
            <div>
              <p className="font-display text-lg font-semibold text-good">Etiqueta leída</p>
              <p className="mt-1 break-all text-xs text-ink-muted">{mensaje}</p>
              {mensaje && !rutaDesdeUrl(mensaje) && (
                <p className="mt-1 text-xs text-warn">Esta etiqueta no apunta a una ficha de la app.</p>
              )}
            </div>
          )}
          {fase === "error" && (
            <div>
              <p className="font-display text-lg font-semibold text-critical">No se pudo leer</p>
              <p className="mt-1 text-xs text-ink-muted">{mensaje}</p>
            </div>
          )}
        </div>

        {fase === "escuchando" && (
          <button onClick={cancelar} className="rounded-full border border-ink/20 px-4 py-1.5 text-sm font-medium">
            Cancelar
          </button>
        )}
        {(fase === "leida" || fase === "error") && (
          <button
            onClick={empezarEscaneo}
            className="rounded-full border border-ink/20 px-4 py-1.5 text-sm font-medium hover:bg-paper-sunken"
          >
            Escanear otra
          </button>
        )}
      </div>

      {!disponible && (
        <div className="rounded-2xl border border-warn/30 bg-warn-bg p-4 text-sm text-warn">
          <p className="font-medium">{MENSAJE_ESTADO_NFC[estado]}</p>
          <p className="mt-1.5 text-xs leading-relaxed">
            El escaneo desde la propia app solo existe en Chrome para Android. En cualquier otro dispositivo la
            pegatina sigue funcionando: al acercarla, el sistema abre la URL en el navegador igualmente.
          </p>
        </div>
      )}

      {!disponible && organizaciones.length > 0 && (
        <section>
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Abrir una ficha sin pegatina</h2>
          <ul className="divide-y divide-ink/5 overflow-hidden rounded-2xl border border-ink/10 bg-paper-raised shadow-sm">
            {organizaciones.map((org) => (
              <li key={org.id}>
                <Link
                  to={`/app/organizaciones/${org.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition hover:bg-paper-sunken"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{org.nombre}</span>
                    <span className="block text-xs text-ink-muted">{NOMBRE_TIPO[org.tipo]}</span>
                  </span>
                  <IconoAtras className="h-4 w-4 rotate-180 text-ink-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-ink">Grabar una pegatina nueva</h2>
        {organizacion ? (
          <>
            <p className="mt-1 text-sm text-ink-soft">
              Graba una pegatina que abra directamente{" "}
              <strong className="text-ink">{organizacion.nombre}</strong>. Para pegatinas de una persona concreta,
              usa el botón que hay dentro de cada perfil.
            </p>
            <button
              onClick={grabarOrganizacion}
              disabled={!disponible || grabando}
              className="mt-3.5 w-full rounded-xl bg-berry py-3 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-40 sm:w-auto sm:px-5"
            >
              {grabando ? "Acerca la pegatina…" : "Grabar esta organización"}
            </button>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-muted">
            Selecciona primero una organización para poder grabarla en una pegatina.
          </p>
        )}
      </section>
    </div>
  );
}
