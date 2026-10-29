from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Historial, Perfil, TipoCambioHistorial
from app.schemas import PerfilCreate, PerfilUpdate

router = APIRouter(prefix="/perfiles", tags=["perfiles"])


@router.get("", response_model=list[Perfil])
def listar_perfiles(organizacion_id: int | None = None, session: Session = Depends(get_session)):
    query = select(Perfil)
    if organizacion_id is not None:
        query = query.where(Perfil.organizacion_id == organizacion_id)
    return session.exec(query).all()


@router.post("", response_model=Perfil)
def crear_perfil(data: PerfilCreate, session: Session = Depends(get_session)):
    perfil = Perfil(**data.model_dump())
    session.add(perfil)
    session.flush()  # asigna perfil.id sin cerrar la transacción todavía

    session.add(
        Historial(
            organizacion_id=perfil.organizacion_id,
            perfil_id=perfil.id,
            tipo_cambio=TipoCambioHistorial.alta_perfil,
            descripcion=f"Alta del perfil '{perfil.nombre}' ({perfil.rol}).",
        )
    )
    session.commit()
    session.refresh(perfil)
    return perfil


@router.get("/{perfil_id}", response_model=Perfil)
def obtener_perfil(perfil_id: int, session: Session = Depends(get_session)):
    perfil = session.get(Perfil, perfil_id)
    if not perfil:
        raise HTTPException(404, "Perfil no encontrado")
    return perfil


@router.patch("/{perfil_id}", response_model=Perfil)
def actualizar_perfil(perfil_id: int, data: PerfilUpdate, session: Session = Depends(get_session)):
    perfil = session.get(Perfil, perfil_id)
    if not perfil:
        raise HTTPException(404, "Perfil no encontrado")
    for campo, valor in data.model_dump(exclude_unset=True).items():
        setattr(perfil, campo, valor)
    session.add(perfil)
    session.commit()
    session.refresh(perfil)
    return perfil


@router.delete("/{perfil_id}")
def eliminar_perfil(perfil_id: int, session: Session = Depends(get_session)):
    perfil = session.get(Perfil, perfil_id)
    if not perfil:
        raise HTTPException(404, "Perfil no encontrado")
    session.delete(perfil)
    session.commit()
    return {"ok": True}
