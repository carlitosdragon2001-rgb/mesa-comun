"""Capa de adaptaciones individuales (apartado 6.3 del TFG).

Sobre la base común decidida por el motor de optimización, esta capa determina, por
perfil y plato, los ajustes que no cambian la selección del plato pero sí su ración:
textura (disfagia), evitar picante, refuerzo de proteína, o el compromiso explícito
cuando una preferencia no puede atenderse esa semana (apartado 6.5, caso 4).
"""

from app.models import Perfil, Plato, Preferencia, Restriccion, TipoRestriccion
from app.optimization.scoring import CARNE_ROJA, PROTEINA_ALTO_RENDIMIENTO_MIN


def determinar_adaptaciones(
    plato: Plato,
    perfil: Perfil,
    restricciones_perfil: list[Restriccion],
    preferencias_perfil: list[Preferencia],
) -> list[str]:
    adaptaciones: list[str] = []

    for restriccion in restricciones_perfil:
        if restriccion.tipo == TipoRestriccion.textura:
            if restriccion.codigo == "triturado" and plato.textura_base != "triturado":
                adaptaciones.append("Adaptar textura: ración triturada/puré")
            elif restriccion.codigo == "blando" and plato.textura_base == "normal":
                adaptaciones.append("Adaptar textura: ración de consistencia blanda")

    for pref in preferencias_perfil:
        if pref.tipo != "gusto" and pref.tipo != "salud":
            continue
        if pref.codigo == "evitar_picante" and plato.picante:
            adaptaciones.append("Ración sin especias picantes")
        if pref.codigo in ("alto_rendimiento", "aporte_proteico_alto", "ganancia_muscular"):
            if plato.proteinas_total < PROTEINA_ALTO_RENDIMIENTO_MIN:
                adaptaciones.append("Ración extra de proteína (huevo, legumbre o pieza adicional)")
        if pref.codigo == "reducir_carne_roja":
            contiene_carne_roja = any(ing["nombre"] in CARNE_ROJA for ing in plato.ingredientes)
            if contiene_carne_roja:
                adaptaciones.append(
                    "Preferencia de reducir carne roja no atendida esta semana (compromiso, apdo. 6.3)"
                )
        if pref.codigo == "vegetariano" and not plato.apto_vegetariano:
            adaptaciones.append("Sustituir base animal por alternativa vegetariana en la ración individual")
        if pref.codigo == "vegano" and not plato.apto_vegano:
            adaptaciones.append("Sustituir por alternativa vegana en la ración individual")

    return adaptaciones
