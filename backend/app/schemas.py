from typing import Optional

from pydantic import BaseModel

from app.models import (
    TipoCambioHistorial,
    TipoComida,
    TipoOrganizacion,
    TipoPreferencia,
    TipoRestriccion,
)


class OrganizacionCreate(BaseModel):
    nombre: str
    tipo: TipoOrganizacion
    presupuesto_semanal: float


class OrganizacionUpdate(BaseModel):
    nombre: Optional[str] = None
    presupuesto_semanal: Optional[float] = None


class PerfilCreate(BaseModel):
    organizacion_id: int
    nombre: str
    rol: str
    parentesco: Optional[str] = None
    edad: int
    sexo: Optional[str] = None
    peso_kg: Optional[float] = None
    altura_cm: Optional[float] = None
    nivel_actividad: str = "moderado"
    excluido_de_planificacion: bool = False


class PerfilUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[str] = None
    parentesco: Optional[str] = None
    edad: Optional[int] = None
    sexo: Optional[str] = None
    peso_kg: Optional[float] = None
    altura_cm: Optional[float] = None
    nivel_actividad: Optional[str] = None
    excluido_de_planificacion: Optional[bool] = None


class RestriccionCreate(BaseModel):
    perfil_id: int
    tipo: TipoRestriccion
    codigo: str
    descripcion: Optional[str] = None


class PreferenciaCreate(BaseModel):
    perfil_id: int
    tipo: TipoPreferencia
    codigo: str
    peso: float = 1.0
    descripcion: Optional[str] = None


class AlimentoCreate(BaseModel):
    nombre: str
    categoria: str
    alergenos: list[str] = []
    kcal_100g: float
    proteinas_100g: float
    grasas_100g: float
    hidratos_100g: float
    precio_ref_kg: float
    estacionalidad: list[str] = ["todo_el_año"]
    vegetariano: bool = True
    vegano: bool = True


class GenerarPlanRequest(BaseModel):
    organizacion_id: int
    semana: str
    dias: int = 7
    max_repeticiones_plato: int = 3
    temporada_actual: Optional[str] = None  # primavera | verano | otoño | invierno


class CambioPuntualRequest(BaseModel):
    organizacion_id: int
    perfil_id: Optional[int] = None
    tipo_cambio: TipoCambioHistorial
    descripcion: str
    regenerar_plan: bool = True
    semana: Optional[str] = None
