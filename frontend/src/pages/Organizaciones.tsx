import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useOrganizacionActiva } from "../OrganizacionContext";
import { useToast } from "../Toast";
import type { Organizacion, TipoOrganizacion } from "../types";

const TIPOS: { value: TipoOrganizacion; label: string; descripcion: string }[] = [
  { value: "familia", label: "Familia", descripcion: "Hogar con perfiles de distintas edades y necesidades." },
  {
    value: "residencia_estudiantes",
    label: "Residencia de estudiantes",
    descripcion: "Decenas o cientos de residentes jóvenes, presupuesto ajustado y alta rotación por curso académico.",
  },
  {
    value: "residencia_mayores",
    label: "Residencia de mayores",
    descripcion: "Perfiles con necesidades de textura, dietas terapéuticas y mayor volumen.",
  },
  {
    value: "centro_deportivo",
    label: "Centro deportivo",
    descripcion: "Perfiles de atletas con objetivos de rendimiento y aporte proteico.",
  },
];

export default function Organizaciones() {
  const { organizacion, setOrganizacion } = useOrganizacionActiva();
  const { notificar } = useToast();
  const [organizaciones, setOrganizaciones] = useState<Organizacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoOrganizacion>("familia");
  const [presupuesto, setPresupuesto] = useState(150);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setCargando(true);
    try {
      const datos = await api.get<Organizacion[]>("/organizaciones");
      setOrganizaciones(datos);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      const nueva = await api.post<Organizacion>("/organizaciones", {
        nombre,
        tipo,
        presupuesto_semanal: presupuesto,
      });
      setOrganizaciones((prev) => [...prev, nueva]);
      setOrganizacion(nueva);
      setNombre("");
      notificar(`Organización "${nueva.nombre}" creada y seleccionada`, "exito");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink mb-3.5">Nueva organización</h2>
        <form onSubmit={crear} className="grid gap-3 sm:grid-cols-[2fr_2fr_1fr_auto] items-end">
          <label className="text-sm text-ink-soft">
            Nombre
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-berry focus:outline-none"
              placeholder="Familia Pérez, Residencia El Roble..."
            />
          </label>
          <label className="text-sm text-ink-soft">
            Tipo
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoOrganizacion)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-berry focus:outline-none"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-ink-soft">
            Presupuesto semanal (€)
            <input
              required
              type="number"
              min={1}
              value={presupuesto}
              onChange={(e) => setPresupuesto(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-2.5 py-1.5 text-sm text-ink focus:border-berry focus:outline-none"
            />
          </label>
          <button
            disabled={guardando}
            className="rounded-lg bg-berry px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-berry-dark disabled:opacity-50"
          >
            Crear
          </button>
        </form>
        <p className="mt-2 text-xs text-ink-muted">
          {TIPOS.find((t) => t.value === tipo)?.descripcion}
        </p>
        {error && <p className="mt-2 text-sm text-critical">{error}</p>}
      </section>

      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3.5">Organizaciones existentes</h2>
        {cargando ? (
          <p className="text-sm text-ink-muted">Cargando…</p>
        ) : organizaciones.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no hay ninguna organización creada.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organizaciones.map((org) => {
              const activa = organizacion?.id === org.id;
              return (
                <div
                  key={org.id}
                  className={`rounded-2xl p-4 shadow-sm transition hover:shadow-md ${
                    activa ? "border-2 border-berry bg-berry/5" : "border border-ink/10 bg-paper-raised"
                  }`}
                >
                  <p className="font-medium text-ink">{org.nombre}</p>
                  <p className="text-xs text-ink-muted">{TIPOS.find((t) => t.value === org.tipo)?.label}</p>
                  <p className="mt-2 text-sm text-ink-soft">
                    Presupuesto: {org.presupuesto_semanal.toFixed(2)} €/semana
                  </p>
                  <button
                    onClick={() => setOrganizacion(org)}
                    disabled={activa}
                    className="mt-3 rounded-lg border border-ink/20 px-3 py-1 text-sm transition hover:bg-paper-sunken disabled:opacity-50"
                  >
                    {activa ? "Organización activa" : "Seleccionar"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
