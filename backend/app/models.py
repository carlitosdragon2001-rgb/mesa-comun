from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class TipoOrganizacion(str, Enum):
    familia = "familia"
    residencia_estudiantes = "residencia_estudiantes"
    residencia_mayores = "residencia_mayores"
    centro_deportivo = "centro_deportivo"


class TipoRestriccion(str, Enum):
    alergia = "alergia"
    intolerancia = "intolerancia"
    afeccion_medica = "afeccion_medica"
    textura = "textura"


class TipoPreferencia(str, Enum):
    salud = "salud"
    gusto = "gusto"
    organizativa = "organizativa"


class TipoComida(str, Enum):
    desayuno = "desayuno"
    comida = "comida"
    cena = "cena"


class Textura(str, Enum):
    normal = "normal"
    blando = "blando"
    triturado = "triturado"


class TipoCambioHistorial(str, Enum):
    nueva_restriccion = "nueva_restriccion"
    nueva_preferencia = "nueva_preferencia"
    cambio_presupuesto = "cambio_presupuesto"
    cambio_disponibilidad = "cambio_disponibilidad"
    alta_perfil = "alta_perfil"
    baja_perfil = "baja_perfil"
    otro = "otro"


class Organizacion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    tipo: TipoOrganizacion
    presupuesto_semanal: float
    created_at: datetime = Field(default_factory=utcnow)


class Perfil(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizacion_id: int = Field(foreign_key="organizacion.id", index=True)
    nombre: str
    rol: str
    parentesco: Optional[str] = None
    edad: int
    sexo: Optional[str] = None
    peso_kg: Optional[float] = None
    altura_cm: Optional[float] = None
    nivel_actividad: str = "moderado"
    excluido_de_planificacion: bool = False
    satisfaccion_acumulada: float = 0.0
    created_at: datetime = Field(default_factory=utcnow)


class Restriccion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    perfil_id: int = Field(foreign_key="perfil.id", index=True)
    tipo: TipoRestriccion
    codigo: str  # p.ej. "lactosa", "frutos_secos", "gluten", "fermentables_sibo"; para textura: "triturado"/"blando"
    descripcion: Optional[str] = None


class Preferencia(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    perfil_id: int = Field(foreign_key="perfil.id", index=True)
    tipo: TipoPreferencia
    codigo: str  # p.ej. "perdida_peso", "alto_rendimiento", "vegetariano", "evitar_picante", "reducir_carne_roja"
    peso: float = 1.0
    descripcion: Optional[str] = None


class Alimento(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    categoria: str
    alergenos: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    kcal_100g: float
    proteinas_100g: float
    grasas_100g: float
    hidratos_100g: float
    precio_ref_kg: float
    estacionalidad: list[str] = Field(default_factory=lambda: ["todo_el_año"], sa_column=Column(JSON))
    vegetariano: bool = True
    vegano: bool = True


class Plato(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    nombre: str
    tipo_comida: TipoComida
    ingredientes: list[dict] = Field(default_factory=list, sa_column=Column(JSON))  # [{alimento_id, cantidad_g}]
    coste_estimado: float = 0.0
    kcal_total: float = 0.0
    proteinas_total: float = 0.0
    apto_vegetariano: bool = False
    apto_vegano: bool = False
    sin_gluten: bool = False
    sin_lactosa: bool = False
    sin_frutos_secos: bool = False
    picante: bool = False
    textura_base: Textura = Textura.normal
    alergenos: list[str] = Field(default_factory=list, sa_column=Column(JSON))


class PlanMenu(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizacion_id: int = Field(foreign_key="organizacion.id", index=True)
    semana: str
    asignaciones: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    adaptaciones_individuales: list[dict] = Field(default_factory=list, sa_column=Column(JSON))
    alertas: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    coste_total: float = 0.0
    created_at: datetime = Field(default_factory=utcnow)


class ListaCompra(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    plan_menu_id: int = Field(foreign_key="planmenu.id", index=True)
    items: list[dict] = Field(default_factory=list, sa_column=Column(JSON))  # [{alimento_id, nombre, cantidad_g, coste}]
    presupuesto_estimado: float = 0.0
    presupuesto_restante: float = 0.0
    created_at: datetime = Field(default_factory=utcnow)


class Historial(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    organizacion_id: int = Field(foreign_key="organizacion.id", index=True)
    perfil_id: Optional[int] = Field(default=None, foreign_key="perfil.id")
    fecha: datetime = Field(default_factory=utcnow)
    tipo_cambio: TipoCambioHistorial
    descripcion: str
    plan_recalculado_id: Optional[int] = Field(default=None, foreign_key="planmenu.id")
