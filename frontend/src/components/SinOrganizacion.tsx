import { Link } from "react-router-dom";

export default function SinOrganizacion() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
      No hay ninguna organización seleccionada.{" "}
      <Link to="/app/organizaciones" className="underline font-medium">
        Selecciona o crea una organización
      </Link>{" "}
      para continuar.
    </div>
  );
}
