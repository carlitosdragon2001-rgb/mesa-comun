"""Orquesta la llamada al motor de optimización desde los routers de planes e
historial (evita duplicar la lógica de generación entre ambos)."""

from datetime import date

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models import (
    Alimento,
    Organizacion,
    Perfil,
    Plato,
    PlanMenu,
    Preferencia,
    Restriccion,
)
from app.optimization.engine import actualizar_satisfaccion, generar_plan

MESES_A_TEMPORADA = {
    12: "invierno", 1: "invierno", 2: "invierno",
    3: "primavera", 4: "primavera", 5: "primavera",
    6: "verano", 7: "verano", 8: "verano",
    9: "otoño", 10: "otoño", 11: "otoño",
}


def temporada_actual_por_defecto() -> str:
    return MESES_A_TEMPORADA[date.today().month]


def generar_y_guardar_plan(
    session: Session,
    organizacion_id: int,
    semana: str,
    dias: int = 7,
    max_repeticiones_plato: int = 3,
    temporada_actual: str | None = None,
) -> PlanMenu:
    organizacion = session.get(Organizacion, organizacion_id)
    if not organizacion:
        raise HTTPException(404, "Organización no encontrada")

    perfiles = session.exec(
        select(Perfil).where(Perfil.organizacion_id == organizacion_id)
    ).all()
    if not perfiles:
        raise HTTPException(400, "La organización no tiene perfiles dados de alta")

    perfil_ids = [p.id for p in perfiles]
    restricciones = session.exec(
        select(Restriccion).where(Restriccion.perfil_id.in_(perfil_ids))
    ).all()
    preferencias = session.exec(
        select(Preferencia).where(Preferencia.perfil_id.in_(perfil_ids))
    ).all()
    platos = session.exec(select(Plato)).all()
    alimentos = session.exec(select(Alimento)).all()
    alimentos_por_id = {a.id: {"estacionalidad": a.estacionalidad} for a in alimentos}

    resultado = generar_plan(
        perfiles=perfiles,
        restricciones=restricciones,
        preferencias=preferencias,
        platos=platos,
        alimentos_por_id=alimentos_por_id,
        presupuesto_semanal=organizacion.presupuesto_semanal,
        dias=dias,
        max_repeticiones_plato=max_repeticiones_plato,
        temporada_actual=temporada_actual or temporada_actual_por_defecto(),
    )

    preferencias_por_perfil: dict[int, list[Preferencia]] = {}
    for pref in preferencias:
        preferencias_por_perfil.setdefault(pref.perfil_id, []).append(pref)
    actualizar_satisfaccion(perfiles, resultado, preferencias_por_perfil)
    for perfil in perfiles:
        session.add(perfil)

    plan = PlanMenu(
        organizacion_id=organizacion_id,
        semana=semana,
        asignaciones=resultado.asignaciones,
        adaptaciones_individuales=resultado.adaptaciones_individuales,
        alertas=resultado.alertas,
        coste_total=resultado.coste_total,
    )
    session.add(plan)
    session.commit()
    session.refresh(plan)
    return plan
