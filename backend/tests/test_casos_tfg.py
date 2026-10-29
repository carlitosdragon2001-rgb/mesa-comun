"""Reproduce como tests de integración los cuatro casos conceptuales del apartado
6.5 del borrador del TFG, usando el motor de optimización real (filtrado + MILP)
en vez del cálculo ilustrativo a mano del documento."""

from app.models import (
    Perfil,
    Preferencia,
    Restriccion,
    TipoComida,
    TipoPreferencia,
    TipoRestriccion,
)
from app.optimization import filtering
from app.optimization.engine import generar_plan
from app.optimization.scoring import score_agregado, score_coste, score_disponibilidad


def _perfil(id_, nombre, edad, **kwargs):
    return Perfil(id=id_, organizacion_id=1, nombre=nombre, rol="miembro", edad=edad, **kwargs)


# ---- Caso 1: familia con intolerancia a lactosa (B), alergia a frutos secos (C) ----

def test_caso_1_filtrado_y_ganador(platos_por_nombre, alimentos_por_id):
    perfiles = [
        _perfil(1, "A", 42),
        _perfil(2, "B", 45),
        _perfil(3, "C", 10),
        _perfil(4, "D", 16),
    ]
    restricciones = [
        Restriccion(perfil_id=2, tipo=TipoRestriccion.intolerancia, codigo="lactosa"),
        Restriccion(perfil_id=3, tipo=TipoRestriccion.alergia, codigo="frutos_secos"),
    ]
    preferencias = [
        Preferencia(perfil_id=1, tipo=TipoPreferencia.salud, codigo="perdida_peso"),
        Preferencia(perfil_id=4, tipo=TipoPreferencia.salud, codigo="alto_rendimiento"),
        Preferencia(perfil_id=4, tipo=TipoPreferencia.gusto, codigo="vegetariano"),
    ]

    candidatos_nombres = [
        "Lasaña de carne con bechamel",
        "Ensalada templada de pollo con nueces",
        "Curry de garbanzos con leche de coco y arroz",
        "Revuelto de tofu con verduras",
        "Hamburguesas de lentejas con guarnición de verduras",
    ]
    candidatos = [platos_por_nombre[n] for n in candidatos_nombres]

    prohibidos = filtering.codigos_prohibidos(perfiles, restricciones)
    validos = [p for p in candidatos if filtering.plato_es_compatible(p, prohibidos)]
    nombres_validos = {p.nombre for p in validos}

    # El TFG descarta la lasaña (lactosa) y la ensalada con nueces (frutos secos).
    assert nombres_validos == {
        "Curry de garbanzos con leche de coco y arroz",
        "Revuelto de tofu con verduras",
        "Hamburguesas de lentejas con guarnición de verduras",
    }

    preferencias_por_perfil: dict[int, list[Preferencia]] = {}
    for pref in preferencias:
        preferencias_por_perfil.setdefault(pref.perfil_id, []).append(pref)

    costes = [p.coste_estimado for p in validos]
    puntuaciones = {
        p.nombre: score_agregado(
            p,
            perfiles,
            preferencias_por_perfil,
            score_coste(p, min(costes), max(costes)),
            score_disponibilidad(p, alimentos_por_id, "verano"),
        )
        for p in validos
    }
    ganador = max(puntuaciones, key=puntuaciones.get)
    # Igual que en el TFG: el plato vegetal, económico y con proteína suficiente
    # para D (deportista) es el que puntúa más alto entre las opciones válidas.
    assert ganador in {
        "Hamburguesas de lentejas con guarnición de verduras",
        "Revuelto de tofu con verduras",
    }


# ---- Caso 2: celiaquía (E) + SIBO (G) + bebé fuera de la planificación (H) ----

def test_caso_2_celiaquia_sibo_bebe_excluido(platos_por_nombre):
    perfiles = [
        _perfil(1, "E", 40),
        _perfil(2, "F", 42),
        _perfil(3, "G", 10),
        _perfil(4, "H", 0, excluido_de_planificacion=True),
    ]
    restricciones = [
        Restriccion(perfil_id=1, tipo=TipoRestriccion.afeccion_medica, codigo="gluten"),
        Restriccion(perfil_id=3, tipo=TipoRestriccion.afeccion_medica, codigo="fodmap_alto"),
    ]

    prohibidos = filtering.codigos_prohibidos(perfiles, restricciones)
    assert prohibidos == {"gluten", "fodmap_alto"}

    candidatos = filtering.filtrar_candidatos(
        list(platos_por_nombre.values()), TipoComida.cena, prohibidos
    )
    nombres = {p.nombre for p in candidatos}
    assert "Revuelto de huevo con espinacas y queso" in nombres
    assert "Curry de garbanzos con leche de coco y arroz" not in nombres
    assert "Lasaña de carne con bechamel" not in nombres


# ---- Caso 3: disfagia (I, no filtra) + presupuesto muy ajustado ----

def test_caso_3_disfagia_no_filtra_pero_presupuesto_ajustado_genera_alerta(
    platos, alimentos_por_id
):
    perfiles = [
        _perfil(1, "I", 78),
        _perfil(2, "J", 45),
        _perfil(3, "K", 42),
    ]
    restricciones = [
        Restriccion(perfil_id=1, tipo=TipoRestriccion.textura, codigo="triturado"),
    ]
    preferencias = [
        Preferencia(perfil_id=3, tipo=TipoPreferencia.gusto, codigo="reducir_carne_roja"),
    ]

    # La disfagia no debe excluir ningún plato (no es un alérgeno).
    prohibidos = filtering.codigos_prohibidos(perfiles, restricciones)
    assert prohibidos == set()

    resultado = generar_plan(
        perfiles=perfiles,
        restricciones=restricciones,
        preferencias=preferencias,
        platos=platos,
        alimentos_por_id=alimentos_por_id,
        presupuesto_semanal=5.0,  # deliberadamente insuficiente para 7 días x 3 perfiles
        dias=7,
        temporada_actual="invierno",
    )
    assert any("presupuesto" in alerta.lower() for alerta in resultado.alertas)
    # Con presupuesto muy ajustado, debe seguir generando un plan completo (21 franjas)
    assert len(resultado.asignaciones) == 21


def test_caso_3_disfagia_genera_adaptacion_de_textura(platos, alimentos_por_id):
    perfiles = [_perfil(1, "I", 78)]
    restricciones = [Restriccion(perfil_id=1, tipo=TipoRestriccion.textura, codigo="triturado")]

    resultado = generar_plan(
        perfiles=perfiles,
        restricciones=restricciones,
        preferencias=[],
        platos=platos,
        alimentos_por_id=alimentos_por_id,
        presupuesto_semanal=1000.0,
        dias=1,
        temporada_actual="invierno",
    )
    adaptaciones_textura = [
        a
        for a in resultado.adaptaciones_individuales
        if any("textura" in ad.lower() for ad in a["adaptaciones"])
    ]
    assert len(adaptaciones_textura) > 0


# ---- Caso 4: preferencias enfrentadas sin restricción obligatoria (N vs. O) ----

def test_caso_4_preferencias_enfrentadas_alterna_entre_platos(platos, alimentos_por_id):
    perfiles = [_perfil(1, "N", 35), _perfil(2, "O", 37)]
    preferencias = [
        Preferencia(perfil_id=1, tipo=TipoPreferencia.gusto, codigo="vegetariano"),
        Preferencia(perfil_id=1, tipo=TipoPreferencia.gusto, codigo="reducir_carne_roja"),
        Preferencia(perfil_id=2, tipo=TipoPreferencia.gusto, codigo="prefiere_carne"),
    ]

    resultado = generar_plan(
        perfiles=perfiles,
        restricciones=[],
        preferencias=preferencias,
        platos=platos,
        alimentos_por_id=alimentos_por_id,
        presupuesto_semanal=1000.0,
        dias=7,
        max_repeticiones_plato=3,
        temporada_actual="invierno",
    )
    comidas_y_cenas = [
        a["plato_nombre"] for a in resultado.asignaciones if a["franja"] in ("comida", "cena")
    ]
    contiene_carne = {
        "Filete de ternera con patatas", "Pollo al horno con patatas",
        "Guiso de ternera con patatas", "Arroz con pollo", "Brochetas de pavo con verduras",
        "Salmón a la plancha con verduras", "Gambas al ajillo con arroz",
        "Sardinas a la plancha con ensalada", "Pescado al horno con limón",
    }
    contiene_vegetariano = {
        "Guiso de garbanzos vegetariano", "Ensalada de garbanzos", "Paella de verduras",
        "Quinoa con verduras salteadas", "Lentejas estofadas", "Estofado de garbanzos con verduras",
        "Revuelto de tofu con verduras", "Wok de tofu y verduras picante",
        "Curry de garbanzos con leche de coco y arroz", "Crema de calabaza",
        "Crema de calabacín", "Sopa de verduras", "Crema de coliflor", "Gazpacho",
    }
    # Sin una restricción obligatoria que decida, el sistema no puede satisfacer a
    # ambos siempre: el compromiso (apdo. 6.3, término de equidad max-min) se
    # traduce en repartir la semana entre opciones alineadas con cada preferencia,
    # en vez de maximizar solo la media y dejar a uno de los dos siempre sin lo suyo.
    assert any(c in contiene_carne for c in comidas_y_cenas)
    assert any(c in contiene_vegetariano for c in comidas_y_cenas)
