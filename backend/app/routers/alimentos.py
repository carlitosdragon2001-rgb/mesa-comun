from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import get_session
from app.models import Alimento, Plato
from app.schemas import AlimentoCreate

router = APIRouter(tags=["alimentos y platos"])


@router.get("/alimentos", response_model=list[Alimento])
def listar_alimentos(session: Session = Depends(get_session)):
    return session.exec(select(Alimento)).all()


@router.post("/alimentos", response_model=Alimento)
def crear_alimento(data: AlimentoCreate, session: Session = Depends(get_session)):
    alimento = Alimento(**data.model_dump())
    session.add(alimento)
    session.commit()
    session.refresh(alimento)
    return alimento


@router.get("/platos", response_model=list[Plato])
def listar_platos(session: Session = Depends(get_session)):
    return session.exec(select(Plato)).all()
