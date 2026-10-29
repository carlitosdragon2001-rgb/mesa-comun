from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models import PlanMenu
from app.schemas import GenerarPlanRequest
from app.services import generar_y_guardar_plan

router = APIRouter(prefix="/planes", tags=["planes de menú"])


@router.post("/generar", response_model=PlanMenu)
def generar_plan_endpoint(data: GenerarPlanRequest, session: Session = Depends(get_session)):
    return generar_y_guardar_plan(
        session=session,
        organizacion_id=data.organizacion_id,
        semana=data.semana,
        dias=data.dias,
        max_repeticiones_plato=data.max_repeticiones_plato,
        temporada_actual=data.temporada_actual,
    )


@router.get("", response_model=list[PlanMenu])
def listar_planes(organizacion_id: int | None = None, session: Session = Depends(get_session)):
    query = select(PlanMenu)
    if organizacion_id is not None:
        query = query.where(PlanMenu.organizacion_id == organizacion_id)
    return session.exec(query.order_by(PlanMenu.created_at.desc())).all()


@router.get("/{plan_id}", response_model=PlanMenu)
def obtener_plan(plan_id: int, session: Session = Depends(get_session)):
    from fastapi import HTTPException

    plan = session.get(PlanMenu, plan_id)
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    return plan
