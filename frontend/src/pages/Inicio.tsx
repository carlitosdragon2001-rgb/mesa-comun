import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { NOMBRE_TIPO } from "../AppLayout";
import { useOrganizacionActiva } from "../OrganizacionContext";
import Avatar from "../components/Avatar";
import {
  IconoCalendario,
  IconoCarrito,
  IconoGrafico,
  IconoMas,
  IconoNfc,
  IconoPerfiles,
} from "../components/icons";
import { tiempoRelativo } from "../lib/equidad";
import type { Organizacion, Perfil, PlanMenu } from "../types";

const ACCIONES = [
  { to: "/app/escanear", label: "Escanear pegatina", ayuda: "Abre una ficha con NFC", Icono: IconoNfc },
  { to: "/app/nueva", label: "Dar de alta", ayuda: "Familia, residencia, centro…", Icono: IconoMas },
  { to: "/app/menu", label: "Menú semanal", ayuda: "Generar y revisar el plan", Icono: IconoCalendario },
  { to: "/app/compra", label: "Lista de la compra", ayuda: "Comprar con el móvil", Icono: IconoCarrito },
];

export default function Inicio() {
  const { organizacion, setOrganizacion } = useOrganizacionActiva();
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [plan, setPlan] = useState<PlanMenu | null>(null);
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get<Organizacion[]>("/organizaciones").then(setOrganizaciones).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!organizacion) {
      setCargando(false);
      return;
    }
    let cancelado = false;
    setCargando(true);
    Promise.all([
      api.get<Perfil[]>(`/perfiles?organizacion_id=${organizacion.id}`),
      api.get<PlanMenu[]>(`/planes?organizacion_id=${organizacion.id}`),
    ])
      .then(([p, planes]) => {
        if (cancelado) return;
        setPerfiles(p);
        setPlan(planes[0] ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [organizacion?.id]);

  const activos = perfiles.filter((p) => !p.excluido_de_planificacion);
  const porPersona = organizacion && activos.length > 0 ? organizacion.presupuesto_semanal / activos.length : null;

  return (
    <div className="animate-fade-in space-y-6">
      {organizacion ? (
        <section className="rounded-3xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-berry">
            {NOMBRE_TIPO[organizacion.tipo]}
          </span>
          <h1 className="mt-0.5 font-display text-2xl font-semibold leading-tight text-ink">{organizacion.nombre}</h1>

          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Kpi valor={cargando ? "…" : String(activos.length)} etiqueta="personas" />
            <Kpi valor={`${organizacion.presupuesto_semanal.toFixed(0)} €`} etiqueta="por semana" />
            <Kpi valor={porPersona ? `${porPersona.toFixed(2)} €` : "—"} etiqueta="por persona" />
          </div>

          {activos.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <div className="flex -space-x-2">
                {activos.slice(0, 6).map((p) => (
                  <Avatar key={p.id} nombre={p.nombre} size="sm" className="ring-2 ring-paper-raised" />
                ))}
              </div>
              <Link to="/app/perfiles" className="text-sm font-medium text-berry">
                {activos.length > 6 ? `y ${activos.length - 6} más` : "Ver perfiles"}
              </Link>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-3xl border border-ink/10 bg-paper-raised p-6 text-center shadow-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">Mesa Común</h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Empieza dando de alta una familia, una residencia o un centro deportivo.
          </p>
          <Link
            to="/app/nueva"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-berry py-3 text-sm font-semibold text-white active:scale-[0.99] sm:w-auto sm:px-6"
          >
            <IconoMas className="h-4 w-4" />
            Dar de alta
          </Link>
          {organizaciones.length > 0 && (
            <p className="mt-3 text-xs text-ink-muted">
              O{" "}
              <Link to="/app/organizaciones" className="font-medium text-berry underline">
                elige una de las {organizaciones.length} ya creadas
              </Link>
              .
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-2.5 font-display text-base font-semibold text-ink">Acciones rápidas</h2>
        <div className="grid grid-cols-2 gap-3">
          {ACCIONES.map(({ to, label, ayuda, Icono }) => (
            <Link
              key={to}
              to={to}
              className="flex flex-col gap-2 rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm transition hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-berry/10 text-berry">
                <Icono className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold leading-tight text-ink">{label}</span>
              <span className="text-xs leading-snug text-ink-muted">{ayuda}</span>
            </Link>
          ))}
          <Link
            to="/app/seguimiento"
            className="col-span-2 flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm transition hover:shadow-md active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-sage/15 text-sage">
              <IconoGrafico className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight text-ink">Seguimiento y equidad</span>
              <span className="block text-xs leading-snug text-ink-muted">
                Cambios registrados y reparto entre personas
              </span>
            </span>
          </Link>
        </div>
      </section>

      {organizacion && (
        <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
          <h2 className="font-display text-base font-semibold text-ink">Plan de esta semana</h2>
          {cargando ? (
            <p className="mt-1 text-sm text-ink-muted">Cargando…</p>
          ) : plan ? (
            <>
              <p className="mt-1 text-sm text-ink-soft">
                {plan.asignaciones.length} comidas planificadas · {plan.coste_total.toFixed(2)} € ·{" "}
                {tiempoRelativo(plan.created_at)}
              </p>
              {plan.alertas.length > 0 && (
                <p className="mt-2 rounded-xl bg-warn-bg px-3 py-2 text-xs text-warn">{plan.alertas[0]}</p>
              )}
              <Link
                to="/app/menu"
                className="mt-3.5 inline-flex w-full items-center justify-center rounded-xl border border-ink/20 py-2.5 text-sm font-semibold text-ink active:scale-[0.99] sm:w-auto sm:px-5"
              >
                Abrir el menú
              </Link>
            </>
          ) : (
            <>
              <p className="mt-1 text-sm text-ink-soft">
                Todavía no hay plan. El motor elige los platos respetando restricciones, presupuesto y variedad.
              </p>
              <Link
                to="/app/menu"
                className="mt-3.5 inline-flex w-full items-center justify-center rounded-xl bg-berry py-3 text-sm font-semibold text-white active:scale-[0.99] sm:w-auto sm:px-5"
              >
                Generar el menú
              </Link>
            </>
          )}
        </section>
      )}

      {organizaciones.length > 1 && (
        <section>
          <h2 className="mb-2.5 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <IconoPerfiles className="h-4 w-4 text-ink-muted" />
            Cambiar de organización
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none]">
            {organizaciones.map((org) => (
              <button
                key={org.id}
                onClick={() => setOrganizacion(org)}
                className={`shrink-0 rounded-2xl border px-3.5 py-2.5 text-left transition active:scale-[0.98] ${
                  organizacion?.id === org.id
                    ? "border-berry bg-berry/5"
                    : "border-ink/10 bg-paper-raised hover:bg-paper-sunken"
                }`}
              >
                <span className="block max-w-[11rem] truncate text-sm font-medium text-ink">{org.nombre}</span>
                <span className="block text-xs text-ink-muted">{NOMBRE_TIPO[org.tipo]}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Kpi({ valor, etiqueta }: { valor: string; etiqueta: string }) {
  return (
    <div className="rounded-2xl bg-paper-sunken px-3 py-2.5 text-center">
      <p className="font-display text-lg font-semibold leading-tight text-ink">{valor}</p>
      <p className="text-[0.7rem] leading-tight text-ink-muted">{etiqueta}</p>
    </div>
  );
}
