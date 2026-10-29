"""Motor de priorización y decisión (apartado 4.3 / capítulo 6 del TFG).

Formula la generación del menú semanal como un problema de programación lineal
entera mixta (MILP) resuelto con PuLP/CBC: variables binarias x[dia,franja,plato],
selección de un plato común por franja, restricción de presupuesto semanal,
restricción de variedad (máximo de repeticiones por plato), una función objetivo
que maximiza la puntuación agregada del apartado 6.2, y un término de equidad tipo
max-min (apartado 6.3: "ningún perfil quede sistemáticamente por debajo" de un
umbral de satisfacción) para que, ante preferencias enfrentadas sin restricción
obligatoria que decida (caso 4 del apdo. 6.5), el sistema reparta la semana entre
ambas en vez de maximizar solo la media y dejar a un perfil siempre insatisfecho.
El filtrado del apartado 6.1 se aplica antes de construir el modelo, restringiendo
directamente el conjunto de platos candidatos por franja.
"""

from dataclasses import dataclass, field

import pulp

from app.models import Perfil, Plato, Preferencia, Restriccion, TipoComida
from app.optimization import filtering
from app.optimization.adaptations import determinar_adaptaciones
from app.optimization.scoring import (
    score_agregado,
    score_coste,
    score_disponibilidad,
    score_perfil,
)

FRANJAS = [TipoComida.desayuno, TipoComida.comida, TipoComida.cena]
PESO_EQUIDAD = 1.2  # importancia relativa del término max-min frente a la media


@dataclass
class ResultadoPlan:
    asignaciones: list[dict] = field(default_factory=list)
    adaptaciones_individuales: list[dict] = field(default_factory=list)
    alertas: list[str] = field(default_factory=list)
    coste_total: float = 0.0


def _agrupar_por_perfil(items: list, campo: str = "perfil_id") -> dict[int, list]:
    agrupado: dict[int, list] = {}
    for item in items:
        agrupado.setdefault(getattr(item, campo), []).append(item)
    return agrupado


def _construir_modelo(
    nombre: str,
    x: dict[tuple[int, TipoComida, int], pulp.LpVariable],
    candidatos_por_franja: dict[TipoComida, list[Plato]],
    dias: int,
    max_repeticiones_plato: int,
    score_agregado_por_plato: dict[int, float],
    score_perfil_por_plato: dict[int, dict[int, float]],
    perfiles_activos: list[Perfil],
    incluir_presupuesto: bool,
    platos_por_id: dict[int, Plato],
    raciones: int,
    presupuesto_semanal: float,
    incluir_repeticion: bool = True,
) -> pulp.LpProblem:
    modelo = pulp.LpProblem(nombre, pulp.LpMaximize)

    min_satisfaccion = pulp.LpVariable("min_satisfaccion", lowBound=0)
    objetivo_calidad = pulp.lpSum(
        score_agregado_por_plato[plato_id] * var for (_, _, plato_id), var in x.items()
    )
    modelo += objetivo_calidad + PESO_EQUIDAD * min_satisfaccion

    for dia in range(dias):
        for franja in FRANJAS:
            variables_franja = [x[(dia, franja, p.id)] for p in candidatos_por_franja[franja]]
            if variables_franja:
                modelo += pulp.lpSum(variables_franja) == 1

    if incluir_repeticion:
        for franja in FRANJAS:
            for plato in candidatos_por_franja[franja]:
                variables_plato = [x[(dia, franja, plato.id)] for dia in range(dias)]
                modelo += pulp.lpSum(variables_plato) <= max_repeticiones_plato

    for perfil in perfiles_activos:
        satisfaccion_perfil = pulp.lpSum(
            score_perfil_por_plato[perfil.id][plato_id] * var for (_, _, plato_id), var in x.items()
        )
        modelo += min_satisfaccion <= satisfaccion_perfil

    if incluir_presupuesto:
        coste_expr = pulp.lpSum(
            platos_por_id[plato_id].coste_estimado * raciones * var
            for (_, _, plato_id), var in x.items()
        )
        modelo += coste_expr <= presupuesto_semanal

    return modelo


def generar_plan(
    perfiles: list[Perfil],
    restricciones: list[Restriccion],
    preferencias: list[Preferencia],
    platos: list[Plato],
    alimentos_por_id: dict[int, dict],
    presupuesto_semanal: float,
    dias: int = 7,
    max_repeticiones_plato: int = 3,
    temporada_actual: str = "todo_el_año",
) -> ResultadoPlan:
    resultado = ResultadoPlan()

    perfiles_activos = [p for p in perfiles if not p.excluido_de_planificacion]
    raciones = max(len(perfiles_activos), 1)
    restricciones_por_perfil = _agrupar_por_perfil(restricciones)
    preferencias_por_perfil = _agrupar_por_perfil(preferencias)

    prohibidos = filtering.codigos_prohibidos(perfiles, restricciones)

    candidatos_por_franja: dict[TipoComida, list[Plato]] = {}
    for franja in FRANJAS:
        candidatos = filtering.filtrar_candidatos(platos, franja, prohibidos)
        candidatos_por_franja[franja] = candidatos
        if not candidatos:
            resultado.alertas.append(
                f"No hay ningún plato de '{franja.value}' compatible con todas las restricciones "
                f"obligatorias del grupo ({', '.join(sorted(prohibidos)) or 'ninguna'}). "
                "Esa franja queda sin cubrir y requiere revisión manual (apdo. 4.4: alertas del sistema)."
            )

    # --- puntuación agregada y por perfil de cada plato candidato ---
    score_agregado_por_plato: dict[int, float] = {}
    score_perfil_por_plato: dict[int, dict[int, float]] = {p.id: {} for p in perfiles_activos}
    for franja, candidatos in candidatos_por_franja.items():
        if not candidatos:
            continue
        costes = [p.coste_estimado for p in candidatos]
        coste_min, coste_max = min(costes), max(costes)
        for plato in candidatos:
            coste_score = score_coste(plato, coste_min, coste_max)
            disponibilidad = score_disponibilidad(plato, alimentos_por_id, temporada_actual)
            score_agregado_por_plato[plato.id] = score_agregado(
                plato, perfiles, preferencias_por_perfil, coste_score, disponibilidad
            )
            for perfil in perfiles_activos:
                bonus = 0.5 if perfil.satisfaccion_acumulada < -1.5 else 0.0
                score_perfil_por_plato[perfil.id][plato.id] = score_perfil(
                    plato,
                    preferencias_por_perfil.get(perfil.id, []),
                    coste_score,
                    disponibilidad,
                    bonus_equidad=bonus,
                )

    # --- variables de decisión ---
    x: dict[tuple[int, TipoComida, int], pulp.LpVariable] = {}
    for dia in range(dias):
        for franja in FRANJAS:
            for plato in candidatos_por_franja[franja]:
                x[(dia, franja, plato.id)] = pulp.LpVariable(
                    f"x_{dia}_{franja.value}_{plato.id}", cat="Binary"
                )

    platos_por_id = {p.id: p for p in platos}

    # Se intenta resolver con todas las restricciones y, si no es posible, se
    # relajan en dos pasos sucesivos (primero el presupuesto, después el límite
    # de variedad) para poder seguir devolviendo un plan en vez de nada (apdo.
    # 6.4). La alerta se atribuye al paso que de verdad resuelve el problema,
    # no al primero que se intenta relajar: quitar el presupuesto y seguir sin
    # solución no significa que el presupuesto fuera la causa.
    def _resolver(nombre_intento: str, incluir_presupuesto: bool, incluir_repeticion: bool) -> tuple[pulp.LpProblem, bool]:
        modelo = _construir_modelo(
            nombre_intento, x, candidatos_por_franja, dias, max_repeticiones_plato,
            score_agregado_por_plato, score_perfil_por_plato, perfiles_activos,
            incluir_presupuesto=incluir_presupuesto, incluir_repeticion=incluir_repeticion,
            platos_por_id=platos_por_id, raciones=raciones,
            presupuesto_semanal=presupuesto_semanal,
        )
        estado = modelo.solve(pulp.PULP_CBC_CMD(msg=0))
        return modelo, pulp.LpStatus[estado] == "Optimal"

    _, resuelto = _resolver("plan_menu_semanal", True, True)
    if not resuelto:
        _, resuelto = _resolver("plan_menu_sin_presupuesto", False, True)
        if resuelto:
            resultado.alertas.append(
                "El presupuesto semanal es insuficiente para cubrir todas las franjas "
                "respetando las restricciones obligatorias; se genera el plan de mayor "
                "calidad posible, que supera el presupuesto disponible."
            )
        else:
            _resolver("plan_menu_sin_variedad", False, False)
            resultado.alertas.append(
                "Hay muy pocos platos compatibles con todas las restricciones obligatorias del "
                "grupo para cubrir la semana sin repetir más de lo permitido; el plan repite "
                "platos por encima del límite de variedad configurado. Conviene ampliar el "
                "catálogo de platos compatibles con estas restricciones."
            )

    coste_total = 0.0
    for (dia, franja, plato_id), var in x.items():
        if var.value() and var.value() > 0.5:
            plato = platos_por_id[plato_id]
            coste_dia = plato.coste_estimado * raciones
            coste_total += coste_dia
            resultado.asignaciones.append(
                {
                    "dia": dia,
                    "franja": franja.value,
                    "plato_id": plato_id,
                    "plato_nombre": plato.nombre,
                    "coste": round(coste_dia, 2),
                }
            )

            for perfil in perfiles_activos:
                adaptaciones = determinar_adaptaciones(
                    plato,
                    perfil,
                    restricciones_por_perfil.get(perfil.id, []),
                    preferencias_por_perfil.get(perfil.id, []),
                )
                if adaptaciones:
                    resultado.adaptaciones_individuales.append(
                        {
                            "perfil_id": perfil.id,
                            "perfil_nombre": perfil.nombre,
                            "dia": dia,
                            "franja": franja.value,
                            "plato_id": plato_id,
                            "adaptaciones": adaptaciones,
                        }
                    )

    resultado.coste_total = round(coste_total, 2)
    resultado.asignaciones.sort(key=lambda a: (a["dia"], FRANJAS.index(TipoComida(a["franja"]))))

    if coste_total > presupuesto_semanal and not any(
        "presupuesto semanal es insuficiente" in a for a in resultado.alertas
    ):
        resultado.alertas.append(
            f"El plan resultante cuesta {coste_total:.2f} € y supera el presupuesto semanal "
            f"de {presupuesto_semanal:.2f} €."
        )

    return resultado


def actualizar_satisfaccion(
    perfiles: list[Perfil],
    resultado: ResultadoPlan,
    preferencias_por_perfil: dict[int, list[Preferencia]],
    incremento: float = 0.5,
) -> None:
    """Salvaguarda de equidad (apdo. 6.3): tras generar el plan, ajusta el
    contador de satisfacción acumulada de cada perfil según si sus adaptaciones
    reflejan compromisos no atendidos (baja) o no ha necesitado ninguna adaptación
    de tipo preferencia (sube ligeramente), para que la siguiente generación le
    dé prioridad si viene arrastrando semanas por debajo del umbral."""
    compromisos_por_perfil: dict[int, int] = {}
    for adaptacion in resultado.adaptaciones_individuales:
        if any("no atendida" in a for a in adaptacion["adaptaciones"]):
            compromisos_por_perfil[adaptacion["perfil_id"]] = (
                compromisos_por_perfil.get(adaptacion["perfil_id"], 0) + 1
            )

    for perfil in perfiles:
        if perfil.excluido_de_planificacion:
            continue
        if compromisos_por_perfil.get(perfil.id, 0) > 0:
            perfil.satisfaccion_acumulada -= incremento
        else:
            perfil.satisfaccion_acumulada = min(perfil.satisfaccion_acumulada + incremento, 5.0)
