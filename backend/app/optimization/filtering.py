"""Capa de filtrado (apartado 6.1 del TFG): reglas de filtrado, primera y más
estricta capa de la lógica de decisión. Aplican las restricciones obligatorias como
condiciones binarias de cumple/no cumple, sin ajuste ni puntuación parcial.
"""

from app.models import Perfil, Plato, Restriccion, TipoComida, TipoRestriccion

# Restricciones de tipo textura no excluyen alimentos: se resuelven como adaptación
# individual de preparación (apartado 6.5, caso de la disfagia), no como filtro.
TIPOS_RESTRICCION_QUE_FILTRAN = {
    TipoRestriccion.alergia,
    TipoRestriccion.intolerancia,
    TipoRestriccion.afeccion_medica,
}


def codigos_prohibidos(
    perfiles: list[Perfil], restricciones: list[Restriccion]
) -> set[str]:
    """Códigos de alérgeno/categoría que ningún plato común puede contener, agregando
    las restricciones obligatorias de todos los perfiles activos en la planificación
    (los excluidos, como el bebé del caso 2 del apartado 6.5, no participan)."""
    ids_activos = {p.id for p in perfiles if not p.excluido_de_planificacion}
    return {
        r.codigo
        for r in restricciones
        if r.perfil_id in ids_activos and r.tipo in TIPOS_RESTRICCION_QUE_FILTRAN
    }


def plato_es_compatible(plato: Plato, prohibidos: set[str]) -> bool:
    return not (set(plato.alergenos) & prohibidos)


def filtrar_candidatos(
    platos: list[Plato], tipo_comida: TipoComida, prohibidos: set[str]
) -> list[Plato]:
    return [
        p for p in platos if p.tipo_comida == tipo_comida and plato_es_compatible(p, prohibidos)
    ]


def perfiles_afectados_por_restriccion(
    plato: Plato, perfiles: list[Perfil], restricciones: list[Restriccion]
) -> list[int]:
    """Perfiles cuya restricción obligatoria excluiría este plato (para mensajes de alerta)."""
    afectados = []
    for perfil in perfiles:
        if perfil.excluido_de_planificacion:
            continue
        codigos_perfil = {
            r.codigo
            for r in restricciones
            if r.perfil_id == perfil.id and r.tipo in TIPOS_RESTRICCION_QUE_FILTRAN
        }
        if codigos_perfil & set(plato.alergenos):
            afectados.append(perfil.id)
    return afectados
