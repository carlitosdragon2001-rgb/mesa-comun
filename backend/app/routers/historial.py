from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Historial, PlanMenu
from app.schemas import CambioPuntualRequest
from app.services import generar_y_guardar_plan

router = APIRouter(prefix="/historial", tags=["seguimiento y cambios"])


@router.get("", response_model=list[Historial])
def listar_historial(organizacion_id: int | None = None, session: Session = Depends(get_session)):
    query = select(Historial)
    if organizacion_id is not None:
        query = query.where(Historial.organizacion_id == organizacion_id)
    return session.exec(query.order_by(Historial.fecha.desc())).all()


@router.post("/cambio", response_model=Historial)
def registrar_cambio(data: CambioPuntualRequest, session: Session = Depends(get_session)):
    """Registra un cambio puntual (apdo. 5.6/6.4: nueva restricción, variación de
    presupuesto o disponibilidad...) y, si se solicita, recalcula el plan de la
    organización. El motor siempre vuelve a aplicar primero el filtrado (6.1) y
    después la puntuación (6.2), así que cualquier cambio queda reflejado sin
    necesidad de repetir la captación completa de datos del resto del grupo."""
    plan_recalculado_id = None
    if data.regenerar_plan:
        semana = data.semana
        if not semana:
            ultimo_plan = session.exec(
                select(PlanMenu)
                .where(PlanMenu.organizacion_id == data.organizacion_id)
                .order_by(PlanMenu.created_at.desc())
            ).first()
            if not ultimo_plan:
                raise HTTPException(
                    400,
                    "No hay ningún plan previo para esta organización; indica 'semana' "
                    "para generar el primero.",
                )
            semana = ultimo_plan.semana
        nuevo_plan = generar_y_guardar_plan(
            session=session, organizacion_id=data.organizacion_id, semana=semana
        )
        plan_recalculado_id = nuevo_plan.id

    historial = Historial(
        organizacion_id=data.organizacion_id,
        perfil_id=data.perfil_id,
        tipo_cambio=data.tipo_cambio,
        descripcion=data.descripcion,
        plan_recalculado_id=plan_recalculado_id,
    )
    session.add(historial)
    session.commit()
    session.refresh(historial)
    return historial
