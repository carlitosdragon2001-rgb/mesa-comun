"""Capa de puntuación (apartado 6.2 del TFG).

Implementa de verdad la fórmula ilustrativa del borrador:

    Puntuación = 0,4 · Salud + 0,3 · Preferencias + 0,2 · Coste + 0,1 · Disponibilidad

calculada por perfil sobre una escala 0-5 y agregada por organización promediando
las puntuaciones individuales de los perfiles implicados (excluidos los que no
participan en la planificación).
"""

from app.models import Perfil, Plato, Preferencia

PESO_SALUD = 0.4
PESO_PREFERENCIAS = 0.3
PESO_COSTE = 0.2
PESO_DISPONIBILIDAD = 0.1

# Umbrales orientativos de kcal por ración para objetivos de salud (apdo. 3.4/6.2).
KCAL_OBJETIVO_PERDIDA_PESO = 450
KCAL_ALTO_RENDIMIENTO_MIN = 550
PROTEINA_ALTO_RENDIMIENTO_MIN = 30

CARNE_ROJA = {
    "Ternera magra",
    "Lomo de cerdo",
    "Carne picada mixta",
    "Chorizo",
    "Jamón serrano",
    "Jamón cocido",
    "Salchichas",
}


def _clamp(valor: float, minimo: float = 0.0, maximo: float = 5.0) -> float:
    return max(minimo, min(maximo, valor))


def score_salud(plato: Plato, preferencias_perfil: list[Preferencia]) -> float:
    objetivos = {p.codigo for p in preferencias_perfil if p.tipo == "salud"}
    if "perdida_peso" in objetivos:
        exceso = plato.kcal_total - KCAL_OBJETIVO_PERDIDA_PESO
        return _clamp(5 - exceso / 100.0)
    if "alto_rendimiento" in objetivos or "aporte_proteico_alto" in objetivos or "ganancia_muscular" in objetivos:
        deficit_kcal = KCAL_ALTO_RENDIMIENTO_MIN - plato.kcal_total
        deficit_prot = PROTEINA_ALTO_RENDIMIENTO_MIN - plato.proteinas_total
        return _clamp(5 - max(deficit_kcal / 150.0, deficit_prot / 8.0, 0))
    return 3.0  # mantenimiento / sin objetivo específico: neutral


def score_preferencias(
    plato: Plato, preferencias_perfil: list[Preferencia]
) -> float:
    gustos = {p.codigo: p for p in preferencias_perfil if p.tipo == "gusto"}
    score = 3.0
    if "vegetariano" in gustos:
        score += 2.0 if plato.apto_vegetariano else -3.0
    if "vegano" in gustos:
        score += 2.0 if plato.apto_vegano else -3.0
    if "evitar_picante" in gustos and plato.picante:
        score -= 2.5
    if "reducir_carne_roja" in gustos:
        contiene_carne_roja = any(
            ing["nombre"] in CARNE_ROJA for ing in plato.ingredientes
        )
        if contiene_carne_roja:
            score -= 2.0
    if "prefiere_carne" in gustos:
        contiene_carne = any(
            ing["nombre"] in CARNE_ROJA
            or ing.get("nombre") in {"Pechuga de pollo", "Muslo de pollo", "Pavo"}
            for ing in plato.ingredientes
        )
        score += 1.5 if contiene_carne else -3.0
    return _clamp(score)


def score_coste(plato: Plato, coste_min: float, coste_max: float) -> float:
    if coste_max <= coste_min:
        return 3.0
    posicion = (plato.coste_estimado - coste_min) / (coste_max - coste_min)
    return _clamp(5 - posicion * 5)


def score_disponibilidad(plato: Plato, alimentos_por_id: dict[int, dict], temporada_actual: str) -> float:
    total = len(plato.ingredientes)
    if total == 0:
        return 5.0
    fuera_temporada = 0
    for ing in plato.ingredientes:
        datos = alimentos_por_id.get(ing["alimento_id"])
        if not datos:
            continue
        estacionalidad = datos["estacionalidad"]
        if "todo_el_año" not in estacionalidad and temporada_actual not in estacionalidad:
            fuera_temporada += 1
    return _clamp(5 - (fuera_temporada / total) * 5)


def score_perfil(
    plato: Plato,
    preferencias_perfil: list[Preferencia],
    coste_score: float,
    disponibilidad_score: float,
    bonus_equidad: float = 0.0,
) -> float:
    salud = score_salud(plato, preferencias_perfil)
    preferencias = score_preferencias(plato, preferencias_perfil)
    base = (
        PESO_SALUD * salud
        + PESO_PREFERENCIAS * preferencias
        + PESO_COSTE * coste_score
        + PESO_DISPONIBILIDAD * disponibilidad_score
    )
    return _clamp(base + bonus_equidad, 0.0, 5.0)


def score_agregado(
    plato: Plato,
    perfiles: list[Perfil],
    preferencias_por_perfil: dict[int, list[Preferencia]],
    coste_score: float,
    disponibilidad_score: float,
    umbral_equidad: float = -1.5,
    bonus_equidad_valor: float = 0.5,
) -> float:
    """Promedia la puntuación por perfil para los perfiles activos en la
    planificación. Aplica la salvaguarda de equidad del apartado 6.3: los perfiles
    cuya satisfacción acumulada está por debajo del umbral reciben un pequeño
    refuerzo en su puntuación individual antes de promediar, para no ceder siempre
    en beneficio del resto del grupo."""
    activos = [p for p in perfiles if not p.excluido_de_planificacion]
    if not activos:
        return 0.0
    total = 0.0
    for perfil in activos:
        bonus = bonus_equidad_valor if perfil.satisfaccion_acumulada < umbral_equidad else 0.0
        total += score_perfil(
            plato,
            preferencias_por_perfil.get(perfil.id, []),
            coste_score,
            disponibilidad_score,
            bonus_equidad=bonus,
        )
    return total / len(activos)
