import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useOrganizacionActiva } from "../OrganizacionContext";
import { useToast } from "../Toast";
import SinOrganizacion from "../components/SinOrganizacion";
import { IconoCarrito, IconoCheck } from "../components/icons";
import { useCheckState } from "../lib/useCheckState";
import type { Adaptacion, ListaCompra, Perfil, Plato, PlanMenu, Restriccion, TipoComida } from "../types";

const FRANJAS: TipoComida[] = ["desayuno", "comida", "cena"];
const NOMBRE_FRANJA: Record<TipoComida, string> = { desayuno: "Desayuno", comida: "Comida", cena: "Cena" };
const DIAS_CORTO = ["L", "M", "X", "J", "V", "S", "D"];
const DIAS_LARGO = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function etiquetaAdaptacion(texto: string): string {
  const t = texto.toLowerCase();
  if (t.includes("textura")) return "textura";
  if (t.includes("picante")) return "sin picante";
  if (t.includes("proteína")) return "extra proteína";
  if (t.includes("vegano")) return "vegano";
  if (t.includes("vegetarian")) return "vegetariano";
  if (t.includes("no atendida")) return "compromiso";
  return "adaptado";
}

export default function MenuSemanal() {
  const { organizacion } = useOrganizacionActiva();
  const { notificar } = useToast();
  const [plan, setPlan] = useState<PlanMenu | null>(null);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [restricciones, setRestricciones] = useState<Restriccion[]>([]);
  const [platosPorId, setPlatosPorId] = useState<Record<number, Plato>>({});
  const [lista, setLista] = useState<ListaCompra | null>(null);
  const [semana, setSemana] = useState("2026-W34");
  const [dias, setDias] = useState(7);
  const [maxRepeticiones, setMaxRepeticiones] = useState(3);
  const [generando, setGenerando] = useState(false);
  const [generandoLista, setGenerandoLista] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personaFiltro, setPersonaFiltro] = useState<number | "todos">("todos");
  // En móvil la cuadrícula de 7 días no cabe: se muestra un día a la vez.
  const [diaActivo, setDiaActivo] = useState(0);
  const { estado: marcados, toggle: alternarMarcado } = useCheckState(lista?.id);

  useEffect(() => {
    if (!organizacion) return;
    api.get<Plato[]>("/platos").then((platos) => {
      setPlatosPorId(Object.fromEntries(platos.map((p) => [p.id, p])));
    });
    api.get<Perfil[]>(`/perfiles?organizacion_id=${organizacion.id}`).then(setPerfiles);
    api.get<Restriccion[]>(`/restricciones?organizacion_id=${organizacion.id}`).then(setRestricciones);
    api.get<PlanMenu[]>(`/planes?organizacion_id=${organizacion.id}`).then(async (planes) => {
      if (planes.length === 0) return;
      setPlan(planes[0]);
      try {
        setLista(await api.get<ListaCompra>(`/compra/${planes[0].id}`));
      } catch {
        /* aún no se ha generado lista para este plan */
      }
    });
  }, [organizacion?.id]);

  async function generar() {
    setGenerando(true);
    setError(null);
    try {
      const nuevo = await api.post<PlanMenu>("/planes/generar", {
        organizacion_id: organizacion!.id,
        semana,
        dias,
        max_repeticiones_plato: maxRepeticiones,
      });
      setPlan(nuevo);
      setLista(null);
      notificar("Menú semanal generado", "exito");
    } catch (e) {
      setError((e as Error).message);
      notificar("No se ha podido generar el plan", "error");
    } finally {
      setGenerando(false);
    }
  }

  async function generarLista() {
    if (!plan) return;
    setGenerandoLista(true);
    try {
      setLista(await api.post<ListaCompra>(`/compra/generar/${plan.id}`));
    } catch (e) {
      notificar((e as Error).message, "error");
    } finally {
      setGenerandoLista(false);
    }
  }

  function exportar() {
    if (!lista) return;
    const categorias = Array.from(new Set(lista.items.map((i) => i.categoria))).sort();
    const lineas = [`Lista de la compra — ${organizacion!.nombre} — semana ${plan?.semana}`, ""];
    for (const cat of categorias) {
      lineas.push(cat.toUpperCase());
      for (const item of lista.items.filter((i) => i.categoria === cat)) {
        lineas.push(`  [ ] ${item.nombre} — ${item.cantidad_g >= 1000 ? `${(item.cantidad_g / 1000).toFixed(2)} kg` : `${Math.round(item.cantidad_g)} g`} — ${item.coste.toFixed(2)} €`);
      }
      lineas.push("");
    }
    lineas.push(`Total estimado: ${lista.presupuesto_estimado.toFixed(2)} €`);
    const blob = new Blob([lineas.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lista-compra-${plan?.semana ?? "semana"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const perfilesActivos = perfiles.filter((p) => !p.excluido_de_planificacion);
  const restriccionesActivas = new Set(restricciones.map((r) => r.codigo)).size;

  const kpis = useMemo(() => {
    if (!plan) return null;
    let kcal = 0;
    let proteina = 0;
    for (const a of plan.asignaciones) {
      const plato = platosPorId[a.plato_id];
      if (plato) {
        kcal += plato.kcal_total;
        proteina += plato.proteinas_total;
      }
    }
    const diasPlan = new Set(plan.asignaciones.map((a) => a.dia)).size || 1;
    return { kcalDia: kcal / diasPlan, proteinaDia: proteina / diasPlan };
  }, [plan, platosPorId]);

  // Después de todos los hooks: si saliera antes, al activar una organización
  // con esta vista montada cambiaría el número de hooks entre renders.
  if (!organizacion) return <SinOrganizacion />;

  const asignacionPorCelda = (dia: number, franja: TipoComida) => plan?.asignaciones.find((a) => a.dia === dia && a.franja === franja);
  const adaptacionesPorCelda = (dia: number, franja: TipoComida): Adaptacion[] =>
    plan?.adaptaciones_individuales.filter((a) => a.dia === dia && a.franja === franja) ?? [];
  const celdaAfectaFiltro = (adaptaciones: Adaptacion[]) =>
    personaFiltro === "todos" || adaptaciones.some((a) => a.perfil_id === personaFiltro);

  const presupuestoUsado = plan ? (plan.coste_total / organizacion.presupuesto_semanal) * 100 : 0;
  const categorias = lista ? Array.from(new Set(lista.items.map((i) => i.categoria))).sort() : [];

  // Al reducir los días planificados el día seleccionado puede quedar fuera de rango.
  const diaMostrado = Math.min(diaActivo, Math.max(dias - 1, 0));
  const costeDiaMostrado =
    plan?.asignaciones.filter((a) => a.dia === diaMostrado).reduce((s, a) => s + a.coste, 0) ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-berry">
          Planificación semanal {plan && `· ${plan.semana}`}
        </span>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Panel de menú y lista de la compra</h1>
        <p className="text-sm text-ink-muted">
          {organizacion.nombre} · {perfilesActivos.length} perfiles activos
        </p>
      </div>

      <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <label className="text-sm text-ink-soft">
            Semana
            <input value={semana} onChange={(e) => setSemana(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm" />
          </label>
          <label className="text-sm text-ink-soft">
            Días
            <input type="number" min={1} max={14} value={dias} onChange={(e) => setDias(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm" />
          </label>
          <label className="text-sm text-ink-soft">
            Máx. repeticiones/plato
            <input type="number" min={1} value={maxRepeticiones} onChange={(e) => setMaxRepeticiones(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm" />
          </label>
          <button onClick={generar} disabled={generando} className="w-full rounded-xl bg-berry px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-berry-dark active:scale-[0.99] disabled:opacity-50 sm:w-auto sm:rounded-lg sm:py-2">
            {generando ? "Optimizando…" : "Generar / Optimizar"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-critical">{error}</p>}
      </section>

      {plan && (
        <>
          {perfilesActivos.length > 1 && perfilesActivos.length <= 10 && (
            <div className="flex flex-wrap gap-1 rounded-full bg-paper-sunken p-1 w-fit">
              <button
                onClick={() => setPersonaFiltro("todos")}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${personaFiltro === "todos" ? "bg-berry text-white shadow-sm" : "text-ink-soft hover:bg-paper-raised"}`}
              >
                Todos
              </button>
              {perfilesActivos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPersonaFiltro(p.id)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${personaFiltro === p.id ? "bg-berry text-white shadow-sm" : "text-ink-soft hover:bg-paper-raised"}`}
                >
                  {p.nombre}
                </button>
              ))}
            </div>
          )}
          {perfilesActivos.length > 10 && (
            <label className="flex w-fit items-center gap-2 text-sm text-ink-soft">
              Ver adaptaciones de
              <select
                value={personaFiltro}
                onChange={(e) => setPersonaFiltro(e.target.value === "todos" ? "todos" : Number(e.target.value))}
                className="rounded-lg border border-ink/20 bg-paper-raised px-2.5 py-1.5 text-sm focus:border-berry focus:outline-none"
              >
                <option value="todos">Todos ({perfilesActivos.length} perfiles)</option>
                {perfilesActivos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}

          {plan.alertas.length > 0 && (
            <div className="space-y-1.5 rounded-2xl border border-warn/30 bg-warn-bg p-4">
              {plan.alertas.map((a, i) => (
                <p key={i} className="flex gap-2 text-sm text-warn">
                  <span aria-hidden="true">⚠</span> {a}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3.5">
            <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">Calorías / día</div>
              <div className="mt-1 font-display text-xl font-semibold tabular-nums">{kpis ? Math.round(kpis.kcalDia).toLocaleString("es-ES") : "—"} kcal</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">Proteína / día</div>
              <div className="mt-1 font-display text-xl font-semibold tabular-nums">{kpis ? Math.round(kpis.proteinaDia) : "—"} g</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">Restricciones activas</div>
              <div className="mt-1 font-display text-xl font-semibold tabular-nums">{restriccionesActivas}</div>
            </div>
            <div className="rounded-2xl border border-good/25 bg-good-bg p-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-good/80">Presupuesto semanal</div>
              <div className="mt-1 font-display text-xl font-semibold tabular-nums text-good">
                {plan.coste_total.toFixed(2)} € <span className="text-sm font-normal">/ {organizacion.presupuesto_semanal.toFixed(2)} €</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-good/15">
                <div className="h-full rounded-full bg-good" style={{ width: `${Math.min(presupuestoUsado, 100)}%` }} />
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
            <div>
            {/* Vista de móvil: selector de día + tarjetas apiladas */}
            <div className="sm:hidden">
              <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
                {Array.from({ length: dias }).map((_, dia) => (
                  <button
                    key={dia}
                    onClick={() => setDiaActivo(dia)}
                    aria-label={DIAS_LARGO[dia % 7]}
                    className={`h-11 w-11 flex-none rounded-2xl text-sm font-semibold transition active:scale-95 ${
                      dia === diaMostrado ? "bg-berry text-white shadow-sm" : "bg-paper-sunken text-ink-soft"
                    }`}
                  >
                    {DIAS_CORTO[dia % 7]}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <h2 className="font-display text-lg font-semibold text-ink">{DIAS_LARGO[diaMostrado % 7]}</h2>
                <span className="text-sm tabular-nums text-ink-muted">{costeDiaMostrado.toFixed(2)} €</span>
              </div>

              <div className="mt-2 space-y-2.5">
                {FRANJAS.map((franja) => {
                  const asignacion = asignacionPorCelda(diaMostrado, franja);
                  const adaptaciones = adaptacionesPorCelda(diaMostrado, franja).filter(
                    (a) => personaFiltro === "todos" || a.perfil_id === personaFiltro,
                  );
                  const etiquetas = Array.from(new Set(adaptaciones.map((a) => etiquetaAdaptacion(a.adaptaciones[0]))));
                  return (
                    <div
                      key={franja}
                      className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-berry">
                          {NOMBRE_FRANJA[franja]}
                        </span>
                        {asignacion && (
                          <span className="text-xs tabular-nums text-ink-muted">{asignacion.coste.toFixed(2)} €</span>
                        )}
                      </div>
                      {asignacion ? (
                        <>
                          <p className="mt-1 font-display text-base font-semibold leading-snug text-ink">
                            {asignacion.plato_nombre}
                          </p>
                          {platosPorId[asignacion.plato_id] && (
                            <p className="mt-0.5 text-xs tabular-nums text-ink-muted">
                              {Math.round(platosPorId[asignacion.plato_id].kcal_total).toLocaleString("es-ES")} kcal ·{" "}
                              {Math.round(platosPorId[asignacion.plato_id].proteinas_total)} g proteína
                            </p>
                          )}
                          {etiquetas.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {etiquetas.map((etiqueta) => (
                                <span
                                  key={etiqueta}
                                  className="rounded-full bg-good-bg px-2 py-0.5 text-[0.7rem] font-medium text-good"
                                >
                                  {etiqueta}
                                </span>
                              ))}
                              <span className="rounded-full bg-paper-sunken px-2 py-0.5 text-[0.7rem] text-ink-muted">
                                {adaptaciones.length} {adaptaciones.length === 1 ? "persona" : "personas"}
                              </span>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-ink-muted">Sin cubrir</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden overflow-x-auto rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm sm:block">
              <table className="w-full border-separate border-spacing-y-1.5 text-sm">
                <thead>
                  <tr>
                    <th className="w-20 text-left text-xs font-medium text-ink-muted">Franja</th>
                    {Array.from({ length: dias }).map((_, dia) => (
                      <th key={dia} className="min-w-32 px-1 text-xs font-medium text-ink-muted">
                        <span title={DIAS_LARGO[dia % 7]}>{DIAS_CORTO[dia % 7]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FRANJAS.map((franja) => (
                    <tr key={franja}>
                      <td className="align-top text-xs font-semibold text-ink-soft">{NOMBRE_FRANJA[franja]}</td>
                      {Array.from({ length: dias }).map((_, dia) => {
                        const asignacion = asignacionPorCelda(dia, franja);
                        const adaptaciones = adaptacionesPorCelda(dia, franja);
                        const resaltada = celdaAfectaFiltro(adaptaciones);
                        return (
                          <td key={dia} className="px-1 align-top">
                            {asignacion ? (
                              <div className={`rounded-xl border p-2 text-xs transition ${resaltada ? "border-ink/10 bg-paper" : "border-ink/5 bg-paper/40 opacity-40"}`}>
                                <p className="font-medium leading-snug text-ink">{asignacion.plato_nombre}</p>
                                <p className="mt-0.5 tabular-nums text-ink-muted">{asignacion.coste.toFixed(2)} €</p>
                                {Array.from(
                                  new Set(
                                    adaptaciones
                                      .filter((a) => personaFiltro === "todos" || a.perfil_id === personaFiltro)
                                      .map((a) => etiquetaAdaptacion(a.adaptaciones[0])),
                                  ),
                                )
                                  .slice(0, 2)
                                  .map((etiqueta) => (
                                    <span key={etiqueta} className="mr-1 mt-1 inline-block rounded-full bg-good-bg px-1.5 py-0.5 text-[10px] font-medium text-good">
                                      {etiqueta}
                                    </span>
                                  ))}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-ink/15 p-2 text-xs text-ink-muted">Sin cubrir</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-ink-muted">Las etiquetas indican adaptación individual por restricción de perfil.</p>
            </div>
            </div>

            <aside className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-display text-base font-semibold text-ink">
                  <IconoCarrito className="h-4 w-4 text-berry" /> Lista de la compra
                </h3>
                {!lista && (
                  <button onClick={generarLista} disabled={generandoLista} className="rounded-full bg-berry px-3 py-1 text-xs font-semibold text-white hover:bg-berry-dark disabled:opacity-50">
                    {generandoLista ? "…" : "Generar"}
                  </button>
                )}
              </div>
              {!lista ? (
                <p className="text-sm text-ink-muted">Genera la lista de la compra derivada de este menú.</p>
              ) : (
                <>
                  <div className="max-h-[480px] space-y-4 overflow-y-auto pr-1">
                    {categorias.map((cat) => {
                      const items = lista.items.filter((i) => i.categoria === cat);
                      const subtotal = items.reduce((s, i) => s + i.coste, 0);
                      return (
                        <div key={cat}>
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-sm font-semibold capitalize text-ink">{cat}</span>
                            <span className="text-xs tabular-nums text-ink-muted">{subtotal.toFixed(2)} €</span>
                          </div>
                          <ul className="space-y-1">
                            {items.map((item) => {
                              const marcado = !!marcados[item.alimento_id];
                              return (
                                <li key={item.alimento_id}>
                                  <button onClick={() => alternarMarcado(item.alimento_id)} className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-sm hover:bg-paper-sunken/60">
                                    <span className={`flex h-4 w-4 flex-none items-center justify-center rounded border ${marcado ? "border-berry bg-berry text-white" : "border-ink/25"}`}>
                                      {marcado && <IconoCheck className="h-3 w-3" />}
                                    </span>
                                    <span className={`flex-1 ${marcado ? "text-ink-muted line-through" : "text-ink"}`}>{item.nombre}</span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 border-t border-ink/10 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted">Total estimado</span>
                      <span className="font-display text-lg font-semibold tabular-nums">{lista.presupuesto_estimado.toFixed(2)} €</span>
                    </div>
                    <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${lista.presupuesto_restante >= 0 ? "bg-good-bg text-good" : "bg-critical-bg text-critical"}`}>
                      {lista.presupuesto_restante >= 0 ? "Dentro del presupuesto" : "Presupuesto superado"}
                    </span>
                    <button onClick={exportar} className="mt-3 w-full rounded-lg bg-berry py-2 text-sm font-semibold text-white transition hover:bg-berry-dark">
                      Exportar lista de la compra
                    </button>
                  </div>
                </>
              )}
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
