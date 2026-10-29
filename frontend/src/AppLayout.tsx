import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useOrganizacionActiva } from "./OrganizacionContext";
import { IconoCalendario, IconoCarrito, IconoInicio, IconoNfc, IconoPerfiles } from "./components/icons";

export const NOMBRE_TIPO: Record<string, string> = {
  familia: "Familia",
  residencia_estudiantes: "Residencia de estudiantes",
  residencia_mayores: "Residencia de mayores",
  centro_deportivo: "Centro deportivo",
};

const enlacesEscritorio = [
  { to: "/app/inicio", label: "Inicio" },
  { to: "/app/organizaciones", label: "Organizaciones" },
  { to: "/app/perfiles", label: "Perfiles" },
  { to: "/app/menu", label: "Menú semanal" },
  { to: "/app/compra", label: "Lista de la compra" },
  { to: "/app/seguimiento", label: "Seguimiento" },
  { to: "/app/escanear", label: "Escanear NFC" },
];

const pestañas = [
  { to: "/app/inicio", label: "Inicio", Icono: IconoInicio },
  { to: "/app/menu", label: "Menú", Icono: IconoCalendario },
  { to: "/app/compra", label: "Compra", Icono: IconoCarrito },
  { to: "/app/perfiles", label: "Perfiles", Icono: IconoPerfiles },
];

export default function AppLayout() {
  const { organizacion } = useOrganizacionActiva();
  const { pathname } = useLocation();
  const escaneando = pathname.startsWith("/app/escanear");

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper-raised/95 backdrop-blur [padding-top:env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5 font-display text-lg font-semibold">
            <svg viewBox="0 0 26 26" className="h-6 w-6 flex-none" fill="none">
              <circle cx="13" cy="13" r="11.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M13 5.2V13L18 16.6" stroke="#bc5b2a" strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="13" cy="13" r="1.6" fill="currentColor" />
            </svg>
            Mesa Común
          </Link>
          {organizacion && (
            <Link
              to="/app/organizaciones"
              className="min-w-0 truncate rounded-full border border-sage/30 bg-sage/10 px-3 py-1 text-xs text-sage sm:text-sm"
            >
              {organizacion.nombre}
              <span className="hidden sm:inline"> · {NOMBRE_TIPO[organizacion.tipo]}</span>
            </Link>
          )}
        </div>
        {/* Navegación de escritorio: en móvil se usa la barra inferior */}
        <nav className="mx-auto hidden max-w-5xl flex-wrap gap-1 px-5 pb-2.5 sm:flex sm:px-8">
          {enlacesEscritorio.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? "bg-berry text-white" : "text-ink-soft hover:bg-paper-sunken"
                }`
              }
            >
              {enlace.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* pb-28 deja hueco a la barra inferior en móvil */}
      <main className="mx-auto max-w-5xl px-4 py-5 pb-28 sm:px-8 sm:py-6 sm:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-paper-raised/95 backdrop-blur [padding-bottom:env(safe-area-inset-bottom)] sm:hidden">
        <div className="relative mx-auto flex max-w-md items-stretch justify-between px-2">
          {pestañas.slice(0, 2).map((p) => (
            <PestañaMovil key={p.to} {...p} />
          ))}

          <div className="relative w-16 shrink-0">
            <Link
              to="/app/escanear"
              aria-label="Escanear etiqueta NFC"
              className={`absolute -top-5 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full shadow-lg transition active:scale-95 ${
                escaneando ? "bg-berry-dark" : "bg-berry"
              } text-white ring-4 ring-paper`}
            >
              <IconoNfc className="h-7 w-7" />
            </Link>
          </div>

          {pestañas.slice(2).map((p) => (
            <PestañaMovil key={p.to} {...p} />
          ))}
        </div>
      </nav>
    </div>
  );
}

function PestañaMovil({
  to,
  label,
  Icono,
}: {
  to: string;
  label: string;
  Icono: (props: { className?: string }) => React.ReactElement;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 px-1 py-2.5 text-[0.65rem] font-medium transition ${
          isActive ? "text-berry" : "text-ink-muted"
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icono className={`h-5 w-5 ${isActive ? "text-berry" : "text-ink-muted"}`} />
          {label}
        </>
      )}
    </NavLink>
  );
}
