import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useOrganizacionActiva } from "../OrganizacionContext";
import SinOrganizacion from "../components/SinOrganizacion";
import { IconoCheck } from "../components/icons";
import { useCheckState } from "../lib/useCheckState";
import type { ListaCompra as ListaCompraType, PlanMenu } from "../types";

type Filtro = "todo" | "pendiente" | "comprado";

export default function ListaCompra() {
  const { organizacion } = useOrganizacionActiva();
  const [plan, setPlan] = useState<PlanMenu | null>(null);
  const [lista, setLista] = useState<ListaCompraType | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todo");
  const { estado: marcados, toggle: alternarMarcado } = useCheckState(lista?.id);

  useEffect(() => {
    if (!organizacion) return;
    api.get<PlanMenu[]>(`/planes?organizacion_id=${organizacion.id}`).then(async (planes) => {
      if (planes.length === 0) return;
      setPlan(planes[0]);
      try {
        setLista(await api.get<ListaCompraType>(`/compra/${planes[0].id}`));
      } catch {
        // todavía no se ha generado ninguna lista para este plan
      }
    });
  }, [organizacion?.id]);

  if (!organizacion) return <SinOrganizacion />;

  async function generar() {
    if (!plan) return;
    setGenerando(true);
    setError(null);
    try {
      setLista(await api.post<ListaCompraType>(`/compra/generar/${plan.id}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerando(false);
    }
  }

  if (!plan) {
    return (
      <p className="text-sm text-ink-muted">
        Todavía no hay ningún plan de menú generado para {organizacion.nombre}. Genera uno primero en "Menú semanal".
      </p>
    );
  }

  const items = lista?.items ?? [];
  const pendientes = items.filter((i) => !marcados[i.alimento_id]);
  const comprados = items.filter((i) => marcados[i.alimento_id]);
  const visibles = filtro === "todo" ? items : filtro === "pendiente" ? pendientes : comprados;
  const categorias = Array.from(new Set(visibles.map((i) => i.categoria))).sort();
  const restante = lista?.presupuesto_restante ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-berry">
            Lista de la compra · semana {plan.semana}
          </span>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink">Lista de la compra</h1>
          <p className="text-sm text-ink-muted">
            {organizacion.nombre} · {plan.asignaciones.length} comidas · presupuesto semanal {organizacion.presupuesto_semanal.toFixed(2)} €
          </p>
        </div>
        <button onClick={generar} disabled={generando} className="rounded-lg bg-berry px-4 py-2 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-50">
          {generando ? "Generando…" : lista ? "Regenerar lista" : "Generar lista de la compra"}
        </button>
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      {lista && (
        <>
          <div className="flex flex-wrap gap-1 rounded-full bg-paper-sunken p-1 w-fit">
            {([
              ["todo", "Todo"],
              ["pendiente", "Pendiente"],
              ["comprado", "Comprado"],
            ] as [Filtro, string][]).map(([valor, etiqueta]) => (
              <button
                key={valor}
                onClick={() => setFiltro(valor)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  filtro === valor ? "bg-berry text-white shadow-sm" : "text-ink-soft hover:bg-paper-raised"
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
            <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">Coste estimado</div>
              <div className="mt-1 font-display text-xl font-semibold tabular-nums">{lista.presupuesto_estimado.toFixed(2)} €</div>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-paper-raised p-4 shadow-sm">
              <div className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">Ítems pendientes</div>
              <div className="mt-1 font-display text-xl font-semibold tabular-nums">
                {pendientes.length} <span className="text-sm font-normal text-ink-muted">de {items.length}</span>
              </div>
            </div>
            <div className={`rounded-2xl border p-4 ${restante >= 0 ? "border-good/25 bg-good-bg" : "border-critical/25 bg-critical-bg"}`}>
              <div className={`text-[0.7rem] font-semibold uppercase tracking-wide ${restante >= 0 ? "text-good/80" : "text-critical/80"}`}>Presupuesto restante</div>
              <div className={`mt-1 font-display text-xl font-semibold tabular-nums ${restante >= 0 ? "text-good" : "text-critical"}`}>
                {restante.toFixed(2)} € · {((Math.abs(restante) / organizacion.presupuesto_semanal) * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <p className="text-xs text-ink-muted">Marca los artículos según los vayas metiendo en el carro.</p>

          <div className="grid gap-4 sm:grid-cols-2">
            {categorias.map((categoria) => (
              <section key={categoria} className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
                <h3 className="mb-2 flex items-center justify-between text-sm font-semibold capitalize text-ink">
                  {categoria}
                  <span className="text-xs font-normal tabular-nums text-ink-muted">
                    {visibles.filter((i) => i.categoria === categoria).reduce((s, i) => s + i.coste, 0).toFixed(2)} €
                  </span>
                </h3>
                <ul className="space-y-1">
                  {visibles
                    .filter((i) => i.categoria === categoria)
                    .map((item) => {
                      const marcado = !!marcados[item.alimento_id];
                      return (
                        <li key={item.alimento_id}>
                          <button onClick={() => alternarMarcado(item.alimento_id)} className="flex w-full items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left text-sm hover:bg-paper-sunken/60">
                            <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border transition ${marcado ? "border-berry bg-berry text-white" : "border-ink/25"}`}>
                              {marcado && <IconoCheck className="h-3.5 w-3.5" />}
                            </span>
                            <span className="flex-1">
                              <span className={marcado ? "text-ink-muted line-through" : "text-ink"}>{item.nombre}</span>
                              <span className="ml-1.5 text-xs text-ink-muted">
                                {item.cantidad_g >= 1000 ? `${(item.cantidad_g / 1000).toFixed(2)} kg` : `${Math.round(item.cantidad_g)} g`}
                              </span>
                            </span>
                            <span className="tabular-nums text-ink-soft">{item.coste.toFixed(2)} €</span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))}
            {visibles.length === 0 && <p className="text-sm text-ink-muted">No hay artículos en este filtro.</p>}
          </div>
        </>
      )}
    </div>
  );
}
