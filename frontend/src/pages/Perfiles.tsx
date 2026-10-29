import { useEffect, useRef, useState, type ComponentType } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { useOrganizacionActiva } from "../OrganizacionContext";
import { useToast } from "../Toast";
import SinOrganizacion from "../components/SinOrganizacion";
import Avatar from "../components/Avatar";
import CompartirPerfil from "../components/CompartirPerfil";
import { IconoAfeccion, IconoAlergia, IconoIntolerancia, IconoMas, IconoTextura } from "../components/icons";
import { calcularImc, clasificarImc } from "../lib/imc";
import type { Organizacion, Perfil, Preferencia, Restriccion, TipoPreferencia, TipoRestriccion } from "../types";

const CODIGOS_RESTRICCION = [
  "lactosa", "gluten", "frutos_secos", "huevo", "pescado", "marisco", "soja", "fodmap_alto",
];
const CODIGOS_TEXTURA = ["triturado", "blando"];
const CODIGOS_PREFERENCIA_GUSTO = [
  "vegetariano", "vegano", "evitar_picante", "reducir_carne_roja", "prefiere_carne",
];

const OBJETIVOS_SALUD: { codigo: string; label: string }[] = [
  { codigo: "perdida_peso", label: "Perder peso" },
  { codigo: "mantenimiento", label: "Mantener" },
  { codigo: "ganancia_muscular", label: "Ganar músculo" },
  { codigo: "alto_rendimiento", label: "Rendimiento" },
];

const CATEGORIAS_RESTRICCION: {
  tipo: TipoRestriccion;
  label: string;
  ayuda: string;
  Icono: ComponentType<{ className?: string }>;
  codigos: string[];
}[] = [
  { tipo: "alergia", label: "Alergias", ayuda: "frutos secos, marisco…", Icono: IconoAlergia, codigos: CODIGOS_RESTRICCION },
  { tipo: "intolerancia", label: "Intolerancias", ayuda: "lactosa, gluten…", Icono: IconoIntolerancia, codigos: CODIGOS_RESTRICCION },
  { tipo: "afeccion_medica", label: "Afecciones médicas", ayuda: "SIBO, celiaquía…", Icono: IconoAfeccion, codigos: CODIGOS_RESTRICCION },
  { tipo: "textura", label: "Textura (preparación)", ayuda: "disfagia…", Icono: IconoTextura, codigos: CODIGOS_TEXTURA },
];

function DatosBasicos({ perfil, onGuardado }: { perfil: Perfil; onGuardado: (p: Perfil) => void }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    parentesco: perfil.parentesco ?? "",
    sexo: perfil.sexo ?? "",
    peso_kg: perfil.peso_kg ?? "",
    altura_cm: perfil.altura_cm ?? "",
    nivel_actividad: perfil.nivel_actividad,
  });
  const { notificar } = useToast();

  const imc = calcularImc(perfil.peso_kg, perfil.altura_cm);

  async function guardar() {
    const actualizado = await api.patch<Perfil>(`/perfiles/${perfil.id}`, {
      parentesco: form.parentesco || null,
      sexo: form.sexo || null,
      peso_kg: form.peso_kg === "" ? null : Number(form.peso_kg),
      altura_cm: form.altura_cm === "" ? null : Number(form.altura_cm),
      nivel_actividad: form.nivel_actividad,
    });
    onGuardado(actualizado);
    setEditando(false);
    notificar("Datos actualizados", "exito");
  }

  return (
    <div className="rounded-xl bg-paper-sunken/60 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-ink-muted">Datos personales</span>
        <button
          onClick={() => setEditando((v) => !v)}
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${
            editando ? "border-berry bg-berry/10 text-berry" : "border-ink/20 text-ink-soft hover:bg-paper-raised"
          }`}
        >
          {editando ? "Editando…" : "Editar"}
        </button>
      </div>
      {editando ? (
        <div className="grid gap-2.5 sm:grid-cols-3">
          <label className="text-xs text-ink-soft">
            Parentesco
            <input
              value={form.parentesco}
              onChange={(e) => setForm({ ...form, parentesco: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper-raised px-2 py-1 text-sm"
              placeholder="Cónyuge, hijo…"
            />
          </label>
          <label className="text-xs text-ink-soft">
            Sexo
            <select
              value={form.sexo}
              onChange={(e) => setForm({ ...form, sexo: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper-raised px-2 py-1 text-sm"
            >
              <option value="">—</option>
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="text-xs text-ink-soft">
            Actividad
            <select
              value={form.nivel_actividad}
              onChange={(e) => setForm({ ...form, nivel_actividad: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper-raised px-2 py-1 text-sm"
            >
              <option value="sedentario">Sedentario</option>
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
            </select>
          </label>
          <label className="text-xs text-ink-soft">
            Peso (kg)
            <input
              type="number"
              value={form.peso_kg}
              onChange={(e) => setForm({ ...form, peso_kg: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper-raised px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-ink-soft">
            Altura (cm)
            <input
              type="number"
              value={form.altura_cm}
              onChange={(e) => setForm({ ...form, altura_cm: e.target.value })}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper-raised px-2 py-1 text-sm"
            />
          </label>
          <button
            onClick={guardar}
            className="rounded-lg bg-berry px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-berry-dark sm:col-span-3 sm:w-fit"
          >
            Guardar
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-soft">
          <span>{perfil.parentesco || "Sin parentesco"}</span>
          <span>{perfil.sexo || "Sexo no indicado"}</span>
          <span className="capitalize">{perfil.nivel_actividad}</span>
          {perfil.peso_kg && <span>{perfil.peso_kg} kg</span>}
          {perfil.altura_cm && <span>{perfil.altura_cm} cm</span>}
          {imc && (
            <span className="font-medium text-ink">
              IMC {imc.toFixed(1)} · {clasificarImc(imc)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function RestriccionCategoria({
  categoria,
  restricciones,
  onAdd,
  onRemove,
}: {
  categoria: (typeof CATEGORIAS_RESTRICCION)[number];
  restricciones: Restriccion[];
  onAdd: (codigo: string) => void;
  onRemove: (id: number) => void;
}) {
  const [codigo, setCodigo] = useState("");
  const activas = restricciones.filter((r) => r.tipo === categoria.tipo);
  const listId = `codigos-${categoria.tipo}-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className={`rounded-xl p-3.5 ${activas.length > 0 ? "bg-critical-bg" : "bg-paper-sunken/50"}`}>
      <div className="flex items-center gap-2 text-sm font-semibold text-ink">
        <categoria.Icono className={`h-4 w-4 ${activas.length > 0 ? "text-critical" : "text-ink-muted"}`} />
        {categoria.label}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {activas.map((r) => (
          <span
            key={r.id}
            className="inline-flex items-center gap-1 rounded-full bg-paper-raised px-2.5 py-1 text-xs font-medium text-ink shadow-sm"
          >
            {r.codigo}
            <button onClick={() => onRemove(r.id)} className="text-ink-muted hover:text-critical">
              ×
            </button>
          </span>
        ))}
        <input
          list={listId}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder={categoria.ayuda}
          className="w-28 rounded-full border border-dashed border-ink/25 bg-transparent px-2.5 py-1 text-xs placeholder:text-ink-muted focus:border-ink/40 focus:outline-none"
        />
        <datalist id={listId}>
          {categoria.codigos.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <button
          onClick={() => {
            if (!codigo) return;
            onAdd(codigo);
            setCodigo("");
          }}
          className="rounded-full border border-ink/20 px-2.5 py-1 text-xs font-medium hover:bg-paper-raised"
        >
          + Añadir
        </button>
      </div>
    </div>
  );
}

function PanelPerfil({
  perfil,
  onEliminado,
  destacado = false,
}: {
  perfil: Perfil;
  onEliminado: () => void;
  destacado?: boolean;
}) {
  const [abierto, setAbierto] = useState(destacado);
  const [perfilActual, setPerfilActual] = useState(perfil);
  const [restricciones, setRestricciones] = useState<Restriccion[]>([]);
  const [preferencias, setPreferencias] = useState<Preferencia[]>([]);
  const [cargado, setCargado] = useState(false);
  const [codigoGusto, setCodigoGusto] = useState("");
  const { notificar } = useToast();
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (destacado) contenedorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [destacado]);

  async function cargarDetalle() {
    const [r, p] = await Promise.all([
      api.get<Restriccion[]>(`/restricciones?perfil_id=${perfil.id}`),
      api.get<Preferencia[]>(`/preferencias?perfil_id=${perfil.id}`),
    ]);
    setRestricciones(r);
    setPreferencias(p);
    setCargado(true);
  }

  useEffect(() => {
    if (abierto && !cargado) cargarDetalle();
  }, [abierto]);

  async function agregarRestriccion(tipo: TipoRestriccion, codigo: string) {
    const nueva = await api.post<Restriccion>("/restricciones", { perfil_id: perfil.id, tipo, codigo });
    setRestricciones((prev) => [...prev, nueva]);
    notificar(`Restricción "${codigo}" añadida a ${perfil.nombre}`, "exito");
  }

  async function eliminarRestriccion(id: number) {
    await api.del(`/restricciones/${id}`);
    setRestricciones((prev) => prev.filter((r) => r.id !== id));
  }

  const objetivoActual = preferencias.find((p) => p.tipo === "salud");

  async function elegirObjetivo(codigo: string) {
    if (objetivoActual?.codigo === codigo) return;
    if (objetivoActual) await api.del(`/preferencias/${objetivoActual.id}`);
    const nueva = await api.post<Preferencia>("/preferencias", { perfil_id: perfil.id, tipo: "salud", codigo });
    setPreferencias((prev) => [...prev.filter((p) => p.tipo !== "salud"), nueva]);
  }

  const gustos = preferencias.filter((p) => p.tipo === "gusto");

  async function agregarGusto() {
    if (!codigoGusto) return;
    const nueva = await api.post<Preferencia>("/preferencias", {
      perfil_id: perfil.id,
      tipo: "gusto" as TipoPreferencia,
      codigo: codigoGusto,
    });
    setPreferencias((prev) => [...prev, nueva]);
    setCodigoGusto("");
  }

  async function eliminarPreferencia(id: number) {
    await api.del(`/preferencias/${id}`);
    setPreferencias((prev) => prev.filter((p) => p.id !== id));
  }

  async function eliminarPerfil() {
    if (!confirm(`¿Eliminar el perfil "${perfil.nombre}"?`)) return;
    await api.del(`/perfiles/${perfil.id}`);
    notificar(`Perfil "${perfil.nombre}" eliminado`, "info");
    onEliminado();
  }

  const imc = calcularImc(perfilActual.peso_kg, perfilActual.altura_cm);

  return (
    <div
      ref={contenedorRef}
      className={`overflow-hidden rounded-2xl border bg-paper-raised shadow-sm transition hover:shadow-md ${
        destacado ? "border-berry ring-2 ring-berry/30" : "border-ink/10"
      }`}
    >
      <button onClick={() => setAbierto(!abierto)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
        <Avatar nombre={perfil.nombre} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
            {perfilActual.rol}
            {perfilActual.parentesco && ` · ${perfilActual.parentesco}`} · {perfilActual.edad} años
          </div>
          <div className="truncate font-display text-base font-semibold text-ink">{perfil.nombre}</div>
        </div>
        {imc && (
          <span className="hidden shrink-0 rounded-full bg-paper-sunken px-2.5 py-1 text-xs text-ink-soft sm:inline">
            IMC {imc.toFixed(1)}
          </span>
        )}
        {perfilActual.excluido_de_planificacion && (
          <span className="shrink-0 rounded-full bg-warn-bg px-2.5 py-1 text-xs font-medium text-warn">excluido</span>
        )}
        <span className="text-ink-muted">{abierto ? "▲" : "▼"}</span>
      </button>

      {abierto && (
        <div className="space-y-4 border-t border-ink/10 px-4 py-4">
          <DatosBasicos perfil={perfilActual} onGuardado={setPerfilActual} />

          <CompartirPerfil perfilId={perfil.id} nombre={perfil.nombre} />

          <div>
            <h4 className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
              Restricciones obligatorias — excluyen recetas por completo
            </h4>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {CATEGORIAS_RESTRICCION.map((cat) => (
                <RestriccionCategoria
                  key={cat.tipo}
                  categoria={cat}
                  restricciones={restricciones}
                  onAdd={(codigo) => agregarRestriccion(cat.tipo, codigo)}
                  onRemove={eliminarRestriccion}
                />
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
              Preferencias flexibles — se priorizan, no excluyen
            </h4>
            <div className="mb-3">
              <span className="mb-1.5 block text-xs text-ink-muted">Objetivo de salud</span>
              <div className="inline-flex flex-wrap gap-1 rounded-full bg-paper-sunken p-1">
                {OBJETIVOS_SALUD.map((o) => (
                  <button
                    key={o.codigo}
                    onClick={() => elegirObjetivo(o.codigo)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      objetivoActual?.codigo === o.codigo
                        ? "bg-berry text-white shadow-sm"
                        : "text-ink-soft hover:bg-paper-raised"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-ink-muted">Gustos personales</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {gustos.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold"
                  >
                    {g.codigo}
                    <button onClick={() => eliminarPreferencia(g.id)} className="text-gold/60 hover:text-gold">
                      ×
                    </button>
                  </span>
                ))}
                <input
                  list="codigos-gusto"
                  value={codigoGusto}
                  onChange={(e) => setCodigoGusto(e.target.value)}
                  placeholder="vegetariano, evita picante…"
                  className="w-40 rounded-full border border-dashed border-ink/25 bg-transparent px-2.5 py-1 text-xs placeholder:text-ink-muted focus:border-ink/40 focus:outline-none"
                />
                <datalist id="codigos-gusto">
                  {CODIGOS_PREFERENCIA_GUSTO.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <button onClick={agregarGusto} className="rounded-full border border-ink/20 px-2.5 py-1 text-xs font-medium hover:bg-paper-sunken">
                  + Añadir
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-ink/10 pt-3">
            <span className="text-xs text-ink-muted">
              Equidad acumulada: {perfil.satisfaccion_acumulada.toFixed(1)}
            </span>
            <button onClick={eliminarPerfil} className="text-xs font-medium text-critical hover:underline">
              Eliminar perfil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Perfiles() {
  const { organizacion, setOrganizacion } = useOrganizacionActiva();
  const { perfilId } = useParams();
  const perfilDestacadoId = perfilId ? Number(perfilId) : null;
  const { notificar } = useToast();
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [cargando, setCargando] = useState(true);
  const [resolviendoEnlace, setResolviendoEnlace] = useState(!!perfilId);

  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("adulto");
  const [parentesco, setParentesco] = useState("");
  const [edad, setEdad] = useState(30);
  const [sexo, setSexo] = useState("");
  const [pesoKg, setPesoKg] = useState("");
  const [alturaCm, setAlturaCm] = useState("");
  const [nivelActividad, setNivelActividad] = useState("moderado");
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  // El formulario de alta ocupa una pantalla entera en el móvil: va plegado
  // para que lo primero que se vea sea la lista de personas.
  const [formAbierto, setFormAbierto] = useState(false);
  const TAMANO_PAGINA = 24;

  async function cargar() {
    if (!organizacion) return;
    setCargando(true);
    const datos = await api.get<Perfil[]>(`/perfiles?organizacion_id=${organizacion.id}`);
    setPerfiles(datos);
    setCargando(false);
  }

  useEffect(() => {
    cargar();
  }, [organizacion?.id]);

  // Enlace directo desde una pegatina NFC o un QR: /app/perfiles/:perfilId.
  // Resuelve a qué organización pertenece ese perfil y la activa, sin que
  // quien escanea tenga que buscarla a mano.
  useEffect(() => {
    if (!perfilDestacadoId) return;
    let cancelado = false;
    setResolviendoEnlace(true);
    (async () => {
      try {
        const destino = await api.get<Perfil>(`/perfiles/${perfilDestacadoId}`);
        if (cancelado) return;
        if (destino.organizacion_id !== organizacion?.id) {
          const org = await api.get<Organizacion>(`/organizaciones/${destino.organizacion_id}`);
          if (!cancelado) setOrganizacion(org);
        }
      } catch {
        if (!cancelado) notificar("No se ha encontrado el perfil de ese enlace", "error");
      } finally {
        if (!cancelado) setResolviendoEnlace(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [perfilDestacadoId]);

  if (resolviendoEnlace) return <p className="text-sm text-ink-muted">Abriendo perfil…</p>;
  if (!organizacion) return <SinOrganizacion />;

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const nuevo = await api.post<Perfil>("/perfiles", {
        organizacion_id: organizacion!.id,
        nombre,
        rol,
        parentesco: parentesco || undefined,
        edad,
        sexo: sexo || undefined,
        peso_kg: pesoKg === "" ? undefined : Number(pesoKg),
        altura_cm: alturaCm === "" ? undefined : Number(alturaCm),
        nivel_actividad: nivelActividad,
      });
      setPerfiles((prev) => [...prev, nuevo]);
      setNombre("");
      setParentesco("");
      setPesoKg("");
      setAlturaCm("");
      notificar(`Perfil "${nuevo.nombre}" añadido`, "exito");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <section className="rounded-2xl border border-ink/10 bg-paper-raised p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setFormAbierto((v) => !v)}
          aria-expanded={formAbierto}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="font-display text-lg font-semibold text-ink">Nuevo perfil</span>
          <span
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-full bg-berry text-white transition ${
              formAbierto ? "rotate-45" : ""
            }`}
          >
            <IconoMas className="h-4 w-4" />
          </span>
        </button>
        <form onSubmit={crear} className={`mt-3.5 gap-3 sm:grid-cols-4 ${formAbierto ? "grid" : "hidden"}`}>
          <label className="text-sm text-ink-soft sm:col-span-2">
            Nombre
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base text-ink focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Rol
            <input
              list="roles"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base text-ink focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm"
            />
            <datalist id="roles">
              <option value="adulto" />
              <option value="menor" />
              <option value="persona_mayor" />
              <option value="estudiante" />
            </datalist>
          </label>
          <label className="text-sm text-ink-soft">
            Parentesco
            <input
              value={parentesco}
              onChange={(e) => setParentesco(e.target.value)}
              placeholder="Cónyuge, hijo…"
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base text-ink focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Edad
            <input
              required
              type="number"
              min={0}
              value={edad}
              onChange={(e) => setEdad(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base text-ink focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Sexo
            <select
              value={sexo}
              onChange={(e) => setSexo(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base text-ink focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm"
            >
              <option value="">—</option>
              <option value="mujer">Mujer</option>
              <option value="hombre">Hombre</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <label className="text-sm text-ink-soft">
            Peso (kg)
            <input
              type="number"
              value={pesoKg}
              onChange={(e) => setPesoKg(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base text-ink focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Altura (cm)
            <input
              type="number"
              value={alturaCm}
              onChange={(e) => setAlturaCm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base text-ink focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm"
            />
          </label>
          <label className="text-sm text-ink-soft">
            Actividad
            <select
              value={nivelActividad}
              onChange={(e) => setNivelActividad(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 text-base text-ink focus:border-berry focus:outline-none sm:px-2.5 sm:py-1.5 sm:text-sm"
            >
              <option value="sedentario">Sedentario</option>
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
            </select>
          </label>
          <button className="rounded-lg bg-berry px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-berry-dark sm:col-span-4 sm:w-fit">
            Añadir perfil
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-critical">{error}</p>}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Perfiles de {organizacion.nombre} ({perfiles.length})
          </h2>
          {perfiles.length > 15 && (
            <input
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nombre…"
              className="w-full rounded-lg border border-ink/20 bg-paper-raised px-3 py-2.5 text-base focus:border-berry focus:outline-none sm:w-56 sm:px-2.5 sm:py-1.5 sm:text-sm"
            />
          )}
        </div>

        {cargando ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-paper-sunken/70" />
            ))}
          </div>
        ) : perfiles.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no hay perfiles dados de alta.</p>
        ) : (
          (() => {
            const destacado = perfiles.find((p) => p.id === perfilDestacadoId);
            const resto = perfiles
              .filter((p) => p.id !== perfilDestacadoId)
              .filter((p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
            const totalPaginas = Math.max(1, Math.ceil(resto.length / TAMANO_PAGINA));
            const paginaActual = Math.min(pagina, totalPaginas);
            const pagina_ = resto.slice((paginaActual - 1) * TAMANO_PAGINA, paginaActual * TAMANO_PAGINA);
            return (
              <>
                {destacado && <PanelPerfil perfil={destacado} onEliminado={cargar} destacado />}
                {pagina_.length === 0 ? (
                  <p className="text-sm text-ink-muted">Ningún perfil coincide con "{busqueda}".</p>
                ) : (
                  pagina_.map((p) => <PanelPerfil key={p.id} perfil={p} onEliminado={cargar} />)
                )}
                {totalPaginas > 1 && (
                  <div className="flex items-center justify-between pt-1 text-sm text-ink-soft">
                    <button
                      onClick={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="rounded-lg border border-ink/20 px-3 py-1 hover:bg-paper-sunken disabled:opacity-40"
                    >
                      ← Anterior
                    </button>
                    <span className="text-xs text-ink-muted">
                      Página {paginaActual} de {totalPaginas} · {resto.length} perfiles
                    </span>
                    <button
                      onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="rounded-lg border border-ink/20 px-3 py-1 hover:bg-paper-sunken disabled:opacity-40"
                    >
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            );
          })()
        )}
      </section>
    </div>
  );
}
