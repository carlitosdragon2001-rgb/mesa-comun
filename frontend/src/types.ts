export type TipoOrganizacion = "familia" | "residencia_estudiantes" | "residencia_mayores" | "centro_deportivo";
export type TipoRestriccion = "alergia" | "intolerancia" | "afeccion_medica" | "textura";
export type TipoPreferencia = "salud" | "gusto" | "organizativa";
export type TipoComida = "desayuno" | "comida" | "cena";
export type TipoCambioHistorial =
  | "nueva_restriccion"
  | "nueva_preferencia"
  | "cambio_presupuesto"
  | "cambio_disponibilidad"
  | "alta_perfil"
  | "baja_perfil"
  | "otro";

export interface Organizacion {
  id: number;
  nombre: string;
  tipo: TipoOrganizacion;
  presupuesto_semanal: number;
  created_at: string;
}

export interface Perfil {
  id: number;
  organizacion_id: number;
  nombre: string;
  rol: string;
  parentesco?: string | null;
  edad: number;
  sexo?: string | null;
  peso_kg?: number | null;
  altura_cm?: number | null;
  nivel_actividad: string;
  excluido_de_planificacion: boolean;
  satisfaccion_acumulada: number;
}

export interface Restriccion {
  id: number;
  perfil_id: number;
  tipo: TipoRestriccion;
  codigo: string;
  descripcion?: string | null;
}

export interface Preferencia {
  id: number;
  perfil_id: number;
  tipo: TipoPreferencia;
  codigo: string;
  peso: number;
  descripcion?: string | null;
}

export interface Alimento {
  id: number;
  nombre: string;
  categoria: string;
  alergenos: string[];
  kcal_100g: number;
  proteinas_100g: number;
  precio_ref_kg: number;
}

export interface Plato {
  id: number;
  nombre: string;
  tipo_comida: TipoComida;
  coste_estimado: number;
  kcal_total: number;
  proteinas_total: number;
  apto_vegetariano: boolean;
  apto_vegano: boolean;
  sin_gluten: boolean;
  sin_lactosa: boolean;
  picante: boolean;
  textura_base: string;
  alergenos: string[];
}

export interface Asignacion {
  dia: number;
  franja: TipoComida;
  plato_id: number;
  plato_nombre: string;
  coste: number;
}

export interface Adaptacion {
  perfil_id: number;
  perfil_nombre: string;
  dia: number;
  franja: TipoComida;
  plato_id: number;
  adaptaciones: string[];
}

export interface PlanMenu {
  id: number;
  organizacion_id: number;
  semana: string;
  asignaciones: Asignacion[];
  adaptaciones_individuales: Adaptacion[];
  alertas: string[];
  coste_total: number;
  created_at: string;
}

export interface ItemCompra {
  alimento_id: number;
  nombre: string;
  categoria: string;
  cantidad_g: number;
  coste: number;
}

export interface ListaCompra {
  id: number;
  plan_menu_id: number;
  items: ItemCompra[];
  presupuesto_estimado: number;
  presupuesto_restante: number;
  created_at: string;
}

export interface Historial {
  id: number;
  organizacion_id: number;
  perfil_id?: number | null;
  fecha: string;
  tipo_cambio: TipoCambioHistorial;
  descripcion: string;
  plan_recalculado_id?: number | null;
}
