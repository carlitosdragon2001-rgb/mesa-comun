from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Organizacion
from app.schemas import OrganizacionCreate, OrganizacionUpdate

router = APIRouter(prefix="/organizaciones", tags=["organizaciones"])


@router.get("", response_model=list[Organizacion])
def listar_organizaciones(session: Session = Depends(get_session)):
    return session.exec(select(Organizacion)).all()


@router.post("", response_model=Organizacion)
def crear_organizacion(data: OrganizacionCreate, session: Session = Depends(get_session)):
    organizacion = Organizacion(**data.model_dump())
    session.add(organizacion)
    session.commit()
    session.refresh(organizacion)
    return organizacion


@router.get("/{organizacion_id}", response_model=Organizacion)
def obtener_organizacion(organizacion_id: int, session: Session = Depends(get_session)):
    organizacion = session.get(Organizacion, organizacion_id)
    if not organizacion:
        raise HTTPException(404, "Organización no encontrada")
    return organizacion


@router.patch("/{organizacion_id}", response_model=Organizacion)
def actualizar_organizacion(
    organizacion_id: int, data: OrganizacionUpdate, session: Session = Depends(get_session)
):
    organizacion = session.get(Organizacion, organizacion_id)
    if not organizacion:
        raise HTTPException(404, "Organización no encontrada")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(organizacion, campo, valor)
    session.add(organizacion)
    session.commit()
    session.refresh(organizacion)
    return organizacion


@router.delete("/{organizacion_id}")
def eliminar_organizacion(organizacion_id: int, session: Session = Depends(get_session)):
    organizacion = session.get(Organizacion, organizacion_id)
    if not organizacion:
        raise HTTPException(404, "Organización no encontrada")
    session.delete(organizacion)
    session.commit()
    return {"ok": True}
