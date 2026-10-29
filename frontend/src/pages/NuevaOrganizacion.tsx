import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useOrganizacionActiva } from "../OrganizacionContext";
import { useToast } from "../Toast";
import Avatar from "../components/Avatar";
import { IconoAtras, IconoCheck, IconoMas, IconoNfc } from "../components/icons";
import { MENSAJE_ESTADO_NFC, estadoNfc, grabarUrlEnEtiqueta, vibrar } from "../lib/webNfc";
import type { Organizacion, Perfil, TipoOrganizacion, TipoRestriccion } from "../types";

/** Coste de referencia por persona y semana, usado para proponer el presupuesto. */
const COSTE_REFERENCIA: Record<TipoOrganizacion, number> = {
  familia: 14,
  residencia_estudiantes: 35,
  residencia_mayores: 60,
  centro_deportivo: 45,
};

const TIPOS: {
  value: TipoOrganizacion;
  label: string;
  descripcion: string;
  emoji: string;
  rol: string;
  edadPorDefecto: number;
  personasPorDefecto: number;
}[] = [
  {
    value: "familia",
    label: "Familia",
    descripcion: "Un hogar con edades y necesidades distintas.",
    emoji: "🏠",
    rol: "adulto",
    edadPorDefecto: 40,
    personasPorDefecto: 4,
  },
  {
    value: "residencia_estudiantes",
    label: "Residencia de estudiantes",
    descripcion: "Decenas o cientos de residentes, presupuesto ajustado.",
    emoji: "🎓",
    rol: "estudiante",
    edadPorDefecto: 20,
    personasPorDefecto: 100,
  },
  {
    value: "residencia_mayores",
    label: "Residencia de mayores",
    descripcion: "Texturas adaptadas y dietas terapéuticas.",
    emoji: "🧑‍🦳",
    rol: "persona_mayor",
    edadPorDefecto: 82,
    personasPorDefecto: 40,
  },
  {
    value: "centro_deportivo",
    label: "Centro deportivo",
    descripcion: "Atletas con objetivos de rendimiento.",
    emoji: "🏃",
    rol: "deportista",
    edadPorDefecto: 24,
    personasPorDefecto: 20,
  },
];

const RESTRICCIONES_RAPIDAS: { tipo: TipoRestriccion; codigo: string; label: string }[] = [
  { tipo: "intolerancia", codigo: "lactosa", label: "Sin lactosa" },
  { tipo: "intolerancia", codigo: "gluten", label: "Sin gluten" },
  { tipo: "alergia", codigo: "frutos_secos", label: "Frutos secos" },
  { tipo: "alergia", codigo: "marisco", label: "Marisco" },
  { tipo: "alergia", codigo: "huevo", label: "Huevo" },
  { tipo: "textura", codigo: "triturado", label: "Triturado" },
];

const GUSTOS_RAPIDOS = ["vegetariano", "vegano", "evitar_picante"];

const PASOS = ["Tipo", "Datos", "Personas", "Listo"];

export default function NuevaOrganizacion() {
  const navegar = useNavigate();
  const { setOrganizacion } = useOrganizacionActiva();
  const { notificar } = useToast();

  const [paso, setPaso] = useState(0);
  const [tipo, setTipo] = useState<TipoOrganizacion>("familia");
  const [nombre, setNombre] = useState("");
  const [personas, setPersonas] = useState(4);
  const [presupuesto, setPresupuesto] = useState(COSTE_REFERENCIA.familia * 4);
  const [presupuestoEditado, setPresupuestoEditado] = useState(false);
  const [organizacion, setOrganizacionCreada] = useState<Organizacion | null>(null);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const definicion = TIPOS.find((t) => t.value === tipo)!;
  const estado = estadoNfc();

  function elegirTipo(nuevo: TipoOrganizacion) {
    const def = TIPOS.find((t) => t.value === nuevo)!;
    setTipo(nuevo);
    setPersonas(def.personasPorDefecto);
    if (!presupuestoEditado) setPresupuesto(Math.round(COSTE_REFERENCIA[nuevo] * def.personasPorDefecto));
    setPaso(1);
  }

  function cambiarPersonas(valor: number) {
    setPersonas(valor);
    if (!presupuestoEditado) setPresupuesto(Math.round(COSTE_REFERENCIA[tipo] * Math.max(valor, 0)));
  }

  async function crearOrganizacion() {
    setGuardando(true);
    setError(null);
    try {
      const nueva = await api.post<Organizacion>("/organizaciones", {
        nombre: nombre.trim(),
        tipo,
        presupuesto_semanal: presupuesto,
      });
      setOrganizacionCreada(nueva);
      setOrganizacion(nueva);
      setPaso(2);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  const porPersona = personas > 0 ? presupuesto / personas : 0;

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-start gap-2.5">
        <button
          onClick={() => (paso === 0 ? navegar("/app/inicio") : setPaso(paso - 1))}
          aria-label="Volver"
          disabled={paso === 3}
          className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full border border-ink/15 text-ink-soft transition active:scale-95 disabled:opacity-30"
        >
          <IconoAtras className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-berry">
            Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}
          </span>
          <h1 className="font-display text-2xl font-semibold leading-tight text-ink">
            {paso === 0 && "¿Qué vas a dar de alta?"}
            {paso === 1 && `Datos de la ${definicion.label.toLowerCase()}`}
            {paso === 2 && "Añade a las personas"}
            {paso === 3 && "Todo listo"}
          </h1>
        </div>
      </div>

      <div className="flex gap-1.5" aria-hidden="true">
        {PASOS.map((p, i) => (
          <span
            key={p}
            className={`h-1.5 flex-1 rounded-full transition ${i <= paso ? "bg-berry" : "bg-paper-sunken"}`}
          />
        ))}
      </div>

      {error && <p className="rounded-xl bg-critical-bg px-3 py-2 text-sm text-critical">{error}</p>}

      {paso === 0 && (
        <div className="grid gap-3">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => elegirTipo(t.value)}
              className="flex items-center gap-3.5 rounded-2xl border border-ink/10 bg-paper-raised p-4 text-left shadow-sm transition hover:shadow-md active:scale-[0.99]"
            >
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-berry/10 text-xl">
                {t.emoji}
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-semibold text-ink">{t.label}</span>
                <span className="block text-xs leading-snug text-ink-muted">{t.descripcion}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {paso === 1 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            crearOrganizacion();
          }}
          className="space-y-4"
        >
          <label className="block text-sm font-medium text-ink-soft">
            Nombre
            <input
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === "familia" ? "Familia García" : "Residencia El Roble"}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper px-3.5 py-3 text-base text-ink focus:border-berry focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-ink-soft">
            ¿Cuántas personas comen?
            <input
              required
              type="number"
              inputMode="numeric"
              min={1}
              max={5000}
              value={personas}
              onChange={(e) => cambiarPersonas(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper px-3.5 py-3 text-base text-ink focus:border-berry focus:outline-none"
            />
          </label>

          <label className="block text-sm font-medium text-ink-soft">
            Presupuesto semanal (€)
            <input
              required
              type="number"
              inputMode="decimal"
              min={1}
              value={presupuesto}
              onChange={(e) => {
                setPresupuestoEditado(true);
                setPresupuesto(Number(e.target.value));
              }}
              className="mt-1.5 w-full rounded-xl border border-ink/20 bg-paper px-3.5 py-3 text-base text-ink focus:border-berry focus:outline-none"
            />
          </label>

          <p className="rounded-xl bg-paper-sunken px-3.5 py-3 text-xs leading-relaxed text-ink-soft">
            Son <strong className="text-ink">{porPersona.toFixed(2)} € por persona y semana</strong> (
            {(porPersona / 7).toFixed(2)} €/día). La referencia para este tipo de centro es{" "}
            {COSTE_REFERENCIA[tipo].toFixed(0)} €/persona y semana.
          </p>

          <button
            disabled={guardando || !nombre.trim()}
            className="w-full rounded-xl bg-berry py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            {guardando ? "Creando…" : "Continuar"}
          </button>
        </form>
      )}

      {paso === 2 && organizacion && (
        <PasoPersonas
          organizacion={organizacion}
          rolPorDefecto={definicion.rol}
          edadPorDefecto={definicion.edadPorDefecto}
          personasPrevistas={personas}
          perfiles={perfiles}
          onPerfiles={setPerfiles}
          onTerminar={() => setPaso(3)}
        />
      )}

      {paso === 3 && organizacion && (
        <div className="space-y-4">
          <section className="rounded-3xl border border-ink/10 bg-paper-raised p-5 text-center shadow-sm">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-good-bg text-good">
              <IconoCheck className="h-6 w-6" />
            </span>
            <h2 className="mt-3 font-display text-xl font-semibold text-ink">{organizacion.nombre}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {perfiles.length} {perfiles.length === 1 ? "persona" : "personas"} ·{" "}
              {organizacion.presupuesto_semanal.toFixed(0)} €/semana
            </p>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
              <IconoNfc className="h-4 w-4 text-berry" />
              Pegatina NFC
            </h3>
            <p className="mt-1 text-sm text-ink-soft">
              Graba una pegatina para abrir esta ficha con solo acercar el móvil.
            </p>
            <button
              disabled={estado !== "disponible"}
              onClick={async () => {
                try {
                  await grabarUrlEnEtiqueta(`${window.location.origin}/app/organizaciones/${organizacion.id}`);
                  vibrar(60);
                  notificar("Pegatina grabada", "exito");
                } catch (e) {
                  notificar(`No se pudo grabar: ${(e as Error).message}`, "error");
                }
              }}
              className="mt-3 w-full rounded-xl border border-berry/40 bg-berry/5 py-3 text-sm font-semibold text-berry transition active:scale-[0.99] disabled:opacity-40"
            >
              Grabar pegatina
            </button>
            {estado !== "disponible" && <p className="mt-2 text-xs text-ink-muted">{MENSAJE_ESTADO_NFC[estado]}</p>}
          </section>

          <div className="grid gap-2.5">
            <Link
              to="/app/menu"
              className="w-full rounded-xl bg-berry py-3.5 text-center text-sm font-semibold text-white active:scale-[0.99]"
            >
              Generar el menú semanal
            </Link>
            <Link
              to="/app/perfiles"
              className="w-full rounded-xl border border-ink/20 py-3 text-center text-sm font-semibold text-ink active:scale-[0.99]"
            >
              Revisar los perfiles
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function PasoPersonas({
  organizacion,
  rolPorDefecto,
  edadPorDefecto,
  personasPrevistas,
  perfiles,
  onPerfiles,
  onTerminar,
}: {
  organizacion: Organizacion;
  rolPorDefecto: string;
  edadPorDefecto: number;
  personasPrevistas: number;
  perfiles: Perfil[];
  onPerfiles: (p: Perfil[]) => void;
  onTerminar: () => void;
}) {
  const { notificar } = useToast();
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState(edadPorDefecto);
  const [restricciones, setRestricciones] = useState<string[]>([]);
  const [gustos, setGustos] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Alta masiva: una residencia de cientos de plazas no se teclea persona a
  // persona, pero el motor necesita un perfil por comensal para repartir
  // equidad y coste.
  const [grupoCantidad, setGrupoCantidad] = useState(Math.max(personasPrevistas - 1, 0));
  const [progreso, setProgreso] = useState<number | null>(null);

  function alternar(lista: string[], valor: string, set: (v: string[]) => void) {
    set(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  async function añadir() {
    if (!nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      const perfil = await api.post<Perfil>("/perfiles", {
        organizacion_id: organizacion.id,
        nombre: nombre.trim(),
        rol: rolPorDefecto,
        edad,
        nivel_actividad: "moderado",
      });
      await Promise.all([
        ...restricciones.map((codigo) => {
          const r = RESTRICCIONES_RAPIDAS.find((x) => x.codigo === codigo)!;
          return api.post("/restricciones", { perfil_id: perfil.id, tipo: r.tipo, codigo: r.codigo });
        }),
        ...gustos.map((codigo) => api.post("/preferencias", { perfil_id: perfil.id, tipo: "gusto", codigo })),
      ]);
      onPerfiles([...perfiles, perfil]);
      setNombre("");
      setRestricciones([]);
      setGustos([]);
      notificar(`${perfil.nombre} añadido`, "exito");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGuardando(false);
    }
  }

  async function añadirGrupo() {
    if (grupoCantidad < 1) return;
    setError(null);
    setProgreso(0);
    const creados: Perfil[] = [];
    const inicio = perfiles.length + 1;
    const LOTE = 25;
    try {
      for (let i = 0; i < grupoCantidad; i += LOTE) {
        const lote = Array.from({ length: Math.min(LOTE, grupoCantidad - i) }, (_, j) => {
          const n = inicio + i + j;
          return api.post<Perfil>("/perfiles", {
            organizacion_id: organizacion.id,
            nombre: `${etiquetaGrupo(rolPorDefecto)} ${String(n).padStart(3, "0")}`,
            rol: rolPorDefecto,
            edad: edadPorDefecto,
            nivel_actividad: "moderado",
          });
        });
        creados.push(...(await Promise.all(lote)));
        setProgreso(creados.length);
      }
      onPerfiles([...perfiles, ...creados]);
      notificar(`${creados.length} perfiles creados`, "exito");
    } catch (e) {
      setError((e as Error).message);
      if (creados.length) onPerfiles([...perfiles, ...creados]);
    } finally {
      setProgreso(null);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
        <h2 className="font-display text-base font-semibold text-ink">Nueva persona</h2>
        <div className="mt-3 space-y-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="w-full rounded-xl border border-ink/20 bg-paper px-3.5 py-3 text-base text-ink focus:border-berry focus:outline-none"
          />
          <label className="block text-sm font-medium text-ink-soft">
            Edad: <span className="font-display text-base text-ink">{edad}</span>
            <input
              type="range"
              min={1}
              max={100}
              value={edad}
              onChange={(e) => setEdad(Number(e.target.value))}
              className="mt-1.5 w-full accent-[#bc5b2a]"
            />
          </label>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Restricciones</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {RESTRICCIONES_RAPIDAS.map((r) => (
                <Chip
                  key={r.codigo}
                  activo={restricciones.includes(r.codigo)}
                  onClick={() => alternar(restricciones, r.codigo, setRestricciones)}
                >
                  {r.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Preferencias</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {GUSTOS_RAPIDOS.map((g) => (
                <Chip key={g} activo={gustos.includes(g)} onClick={() => alternar(gustos, g, setGustos)}>
                  {g.replace(/_/g, " ")}
                </Chip>
              ))}
            </div>
          </div>

          <button
            onClick={añadir}
            disabled={guardando || !nombre.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-berry py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            <IconoMas className="h-4 w-4" />
            {guardando ? "Añadiendo…" : "Añadir persona"}
          </button>
          {error && <p className="text-sm text-critical">{error}</p>}
        </div>
      </section>

      {personasPrevistas > 5 && (
        <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
          <h2 className="font-display text-base font-semibold text-ink">Alta rápida del resto</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Dijiste {personasPrevistas} personas. Crea el resto de plazas de golpe y edita después las que tengan
            restricciones propias.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={5000}
              value={grupoCantidad}
              onChange={(e) => setGrupoCantidad(Number(e.target.value))}
              className="w-24 rounded-xl border border-ink/20 bg-paper px-3 py-3 text-base text-ink focus:border-berry focus:outline-none"
            />
            <button
              onClick={añadirGrupo}
              disabled={progreso !== null || grupoCantidad < 1}
              className="flex-1 rounded-xl border border-berry/40 bg-berry/5 py-3 text-sm font-semibold text-berry transition active:scale-[0.99] disabled:opacity-40"
            >
              {progreso !== null ? `Creando ${progreso}/${grupoCantidad}…` : "Crear plazas"}
            </button>
          </div>
        </section>
      )}

      {perfiles.length > 0 && (
        <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
          <h2 className="font-display text-base font-semibold text-ink">
            {perfiles.length} {perfiles.length === 1 ? "persona" : "personas"} en {organizacion.nombre}
          </h2>
          <ul className="mt-3 divide-y divide-ink/5">
            {perfiles.slice(-8).reverse().map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2">
                <Avatar nombre={p.nombre} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{p.nombre}</span>
                <span className="text-xs text-ink-muted">{p.edad} años</span>
              </li>
            ))}
          </ul>
          {perfiles.length > 8 && (
            <p className="mt-2 text-xs text-ink-muted">Se muestran las 8 últimas.</p>
          )}
        </section>
      )}

      <button
        onClick={onTerminar}
        disabled={perfiles.length === 0}
        className="w-full rounded-xl bg-ink py-3.5 text-sm font-semibold text-paper transition active:scale-[0.99] disabled:opacity-30"
      >
        {perfiles.length === 0 ? "Añade al menos una persona" : "Terminar"}
      </button>
    </div>
  );
}

function etiquetaGrupo(rol: string): string {
  if (rol === "estudiante") return "Residente";
  if (rol === "persona_mayor") return "Residente";
  if (rol === "deportista") return "Atleta";
  return "Comensal";
}

function Chip({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
        activo ? "border-berry bg-berry text-white" : "border-ink/20 bg-paper text-ink-soft"
      }`}
    >
      {children}
    </button>
  );
}
