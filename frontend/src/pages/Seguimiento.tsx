import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useOrganizacionActiva } from "../OrganizacionContext";
import { useToast } from "../Toast";
import SinOrganizacion from "../components/SinOrganizacion";
import { porcentajeEquidad, tiempoRelativo, UMBRAL_EQUIDAD } from "../lib/equidad";
import { parseFechaUtc } from "../lib/fecha";
import type { Historial, Perfil, TipoCambioHistorial } from "../types";

const TIPOS_CAMBIO: { value: TipoCambioHistorial; label: string }[] = [
  { value: "nueva_restriccion", label: "Nueva restricción obligatoria" },
  { value: "nueva_preferencia", label: "Nueva preferencia flexible" },
  { value: "cambio_presupuesto", label: "Cambio de presupuesto" },
  { value: "cambio_disponibilidad", label: "Cambio de disponibilidad de alimentos" },
  { value: "otro", label: "Otro cambio puntual" },
];

function formatearFecha(fecha: string): string {
  return parseFechaUtc(fecha).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Seguimiento() {
  const { organizacion } = useOrganizacionActiva();
  const { notificar } = useToast();
  const [historial, setHistorial] = useState<Historial[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);

  const [perfilId, setPerfilId] = useState<number | "">("");
  const [tipoCambio, setTipoCambio] = useState<TipoCambioHistorial>("nueva_restriccion");
  const [descripcion, setDescripcion] = useState("");
  const [regenerar, setRegenerar] = useState(true);
  const [enviando, setEnviando] = useState(false);

  async function cargar() {
    if (!organizacion) return;
    setCargando(true);
    const [h, p] = await Promise.all([
      api.get<Historial[]>(`/historial?organizacion_id=${organizacion.id}`),
      api.get<Perfil[]>(`/perfiles?organizacion_id=${organizacion.id}`),
    ]);
    setHistorial(h);
    setPerfiles(p);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, [organizacion?.id]);

  if (!organizacion) return <SinOrganizacion />;

  async function registrarCambio(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      const resultado = await api.post<Historial>("/historial/cambio", {
        organizacion_id: organizacion!.id,
        perfil_id: perfilId === "" ? null : perfilId,
        tipo_cambio: tipoCambio,
        descripcion,
        regenerar_plan: regenerar,
      });
      notificar(
        resultado.plan_recalculado_id ? `Cambio registrado y plan recalculado (plan #${resultado.plan_recalculado_id})` : "Cambio registrado",
        "exito",
      );
      setDescripcion("");
      cargar();
    } catch (e) {
      notificar((e as Error).message, "error");
    } finally {
      setEnviando(false);
    }
  }

  const perfilesAfectados = new Set(historial.filter((h) => h.perfil_id != null).map((h) => h.perfil_id)).size;
  const ultimaActualizacion = historial[0] ? tiempoRelativo(historial[0].fecha) : "—";

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-berry">Seguimiento y cambios</span>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Panel de seguimiento y cambios</h1>
        <p className="text-sm text-ink-muted">{organizacion.nombre} · histórico de perfiles y planes</p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">Cambios registrados</div>
          <div className="mt-1 font-display text-xl font-semibold tabular-nums">{historial.length}</div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">Última actualización</div>
          <div className="mt-1 font-display text-xl font-semibold">{ultimaActualizacion}</div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">Perfiles afectados</div>
          <div className="mt-1 font-display text-xl font-semibold tabular-nums">
            {perfilesAfectados} <span className="text-sm font-normal text-ink-muted">de {perfiles.length}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="space-y-2">
            <h2 className="font-display text-lg font-semibold text-ink">Histórico de cambios puntuales</h2>
            {cargando ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-2xl bg-paper-sunken/70" />
                ))}
              </div>
            ) : historial.length === 0 ? (
              <p className="text-sm text-ink-muted">Todavía no hay ningún cambio registrado.</p>
            ) : (
              <ul className="space-y-2">
                {historial.map((h) => {
                  const perfil = perfiles.find((p) => p.id === h.perfil_id);
                  return (
                    <li key={h.id} className="flex items-start justify-between gap-3 rounded-2xl border border-ink/10 bg-paper-raised p-3.5 text-sm shadow-sm">
                      <div className="min-w-0">
                        <span className="font-medium text-ink">
                          {perfil ? perfil.nombre : "Grupo"}
                          <span className="ml-1.5 font-normal text-ink-muted">
                            {TIPOS_CAMBIO.find((t) => t.value === h.tipo_cambio)?.label ?? h.tipo_cambio}
                          </span>
                        </span>
                        <p className="mt-0.5 text-ink-soft">{h.descripcion}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{formatearFecha(h.fecha)}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          h.plan_recalculado_id ? "bg-warn-bg text-warn" : "bg-good-bg text-good"
                        }`}
                      >
                        {h.plan_recalculado_id ? "Recalculado" : "Aplicado"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
            <h2 className="mb-3.5 font-display text-lg font-semibold text-ink">Dar de alta un cambio puntual</h2>
            <form onSubmit={registrarCambio} className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-ink-soft">
                Perfil afectado (opcional)
                <select
                  value={perfilId}
                  onChange={(e) => setPerfilId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-berry focus:outline-none"
                >
                  <option value="">General / toda la organización</option>
                  {perfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-ink-soft">
                Tipo de cambio
                <select
                  value={tipoCambio}
                  onChange={(e) => setTipoCambio(e.target.value as TipoCambioHistorial)}
                  className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-berry focus:outline-none"
                >
                  {TIPOS_CAMBIO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-ink-soft sm:col-span-2">
                Describir el cambio…
                <textarea
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-berry focus:outline-none"
                  rows={2}
                  placeholder="P. ej. 'B desarrolla una nueva intolerancia a la lactosa' o 'el presupuesto semanal baja a 90€'"
                />
              </label>
              <label className="flex items-center gap-1.5 text-sm text-ink-soft">
                <input type="checkbox" checked={regenerar} onChange={(e) => setRegenerar(e.target.checked)} />
                Recalcular el plan de menú vigente con este cambio
              </label>
              <button
                disabled={enviando}
                className="rounded-lg bg-berry px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-50 sm:w-fit"
              >
                {enviando ? "Registrando…" : "Registrar cambio"}
              </button>
            </form>
          </section>
        </div>

        <aside className="space-y-3.5">
          <h2 className="font-display text-lg font-semibold text-ink">Equidad entre perfiles</h2>
          {(() => {
            const activos = perfiles.filter((p) => !p.excluido_de_planificacion);
            const conPct = activos.map((p) => ({ perfil: p, pct: porcentajeEquidad(p.satisfaccion_acumulada) }));
            const enRiesgo = conPct.filter((x) => x.pct < UMBRAL_EQUIDAD).sort((a, b) => a.pct - b.pct);
            const listaCompacta = activos.length > 12;
            const MAX_MOSTRADOS = 20;

            if (activos.length === 0) {
              return (
                <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
                  <p className="text-sm text-ink-muted">Todavía no hay perfiles.</p>
                </div>
              );
            }

            return (
              <>
                {listaCompacta && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-good/25 bg-good-bg p-3.5">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-good/80">Estables</div>
                      <div className="mt-0.5 font-display text-lg font-semibold tabular-nums text-good">{activos.length - enRiesgo.length}</div>
                    </div>
                    <div className="rounded-2xl border border-critical/25 bg-critical-bg p-3.5">
                      <div className="text-[0.68rem] font-semibold uppercase tracking-wide text-critical/80">Cerca del umbral</div>
                      <div className="mt-0.5 font-display text-lg font-semibold tabular-nums text-critical">{enRiesgo.length}</div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
                  {(listaCompacta ? enRiesgo.slice(0, MAX_MOSTRADOS) : conPct).map(({ perfil: p, pct }) => {
                    const bajo = pct < UMBRAL_EQUIDAD;
                    return (
                      <div key={p.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-ink">{p.nombre}</span>
                          <span className={`tabular-nums font-semibold ${bajo ? "text-critical" : "text-good"}`}>{Math.round(pct)}%</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-paper-sunken">
                          <div className={`h-full rounded-full transition-all ${bajo ? "bg-critical" : "bg-good"}`} style={{ width: `${pct}%` }} />
                        </div>
                        {!listaCompacta && (
                          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${bajo ? "bg-critical-bg text-critical" : "bg-good-bg text-good"}`}>
                            {bajo ? "cerca del umbral" : "estable"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {listaCompacta && enRiesgo.length === 0 && <p className="text-sm text-ink-muted">Ningún perfil está cerca del umbral de equidad.</p>}
                  {listaCompacta && enRiesgo.length > MAX_MOSTRADOS && (
                    <p className="text-xs text-ink-muted">
                      Mostrando los {MAX_MOSTRADOS} perfiles con menor equidad, de {enRiesgo.length} por debajo del umbral.
                    </p>
                  )}
                </div>

                {enRiesgo.length > 0 && (
                  <div className="rounded-2xl border border-warn/30 bg-warn-bg p-3.5 text-xs leading-relaxed text-warn">
                    ⚠ {enRiesgo.length} {enRiesgo.length === 1 ? "perfil está" : "perfiles están"} por debajo del umbral de
                    equidad. El motor aplicará un refuerzo de prioridad en su favor en la próxima planificación
                    semanal (apdo. 6.3).
                  </div>
                )}
              </>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}
