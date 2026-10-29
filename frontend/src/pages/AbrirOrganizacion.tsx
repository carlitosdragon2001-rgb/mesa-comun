import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useOrganizacionActiva } from "../OrganizacionContext";
import { useToast } from "../Toast";
import type { Organizacion } from "../types";

/**
 * Destino de las pegatinas NFC de una organización: selecciona la ficha que
 * trae la etiqueta y lleva al inicio ya con ella activa.
 */
export default function AbrirOrganizacion() {
  const { orgId } = useParams();
  const navegar = useNavigate();
  const { setOrganizacion } = useOrganizacionActiva();
  const { notificar } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const org = await api.get<Organizacion>(`/organizaciones/${orgId}`);
        if (cancelado) return;
        setOrganizacion(org);
        notificar(`${org.nombre} abierta desde la etiqueta`, "exito");
        navegar("/app/inicio", { replace: true });
      } catch {
        if (!cancelado) setError("Esa etiqueta apunta a una organización que ya no existe.");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [orgId]);

  if (error) {
    return (
      <div className="rounded-2xl border border-warn/30 bg-warn-bg p-4 text-sm text-warn">
        <p className="font-medium">{error}</p>
        <button
          onClick={() => navegar("/app/organizaciones", { replace: true })}
          className="mt-2 rounded-lg border border-warn/40 px-3 py-1.5 text-xs font-semibold"
        >
          Ver organizaciones
        </button>
      </div>
    );
  }

  return <p className="text-sm text-ink-muted">Abriendo la ficha de la etiqueta…</p>;
}
