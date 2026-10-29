from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Historial, Perfil, Preferencia, Restriccion, TipoCambioHistorial
from app.schemas import PreferenciaCreate, RestriccionCreate

router = APIRouter(tags=["restricciones y preferencias"])


@router.get("/restricciones", response_model=list[Restriccion])
def listar_restricciones(
    perfil_id: int | None = None,
    organizacion_id: int | None = None,
    session: Session = Depends(get_session),
):
    query = select(Restriccion)
    if perfil_id is not None:
        query = query.where(Restriccion.perfil_id == perfil_id)
    if organizacion_id is not None:
        # Evita el problema N+1 de pedir las restricciones perfil a perfil
        # cuando una organización tiene cientos o miles de perfiles (p. ej. una
        # residencia de estudiantes a escala real): una sola consulta con join
        # en vez de una petición HTTP por perfil.
        query = query.join(Perfil, Perfil.id == Restriccion.perfil_id).where(Perfil.organizacion_id == organizacion_id)
    return session.exec(query).all()


@router.post("/restricciones", response_model=Restriccion)
def crear_restriccion(data: RestriccionCreate, session: Session = Depends(get_session)):
    from app.models import Perfil

    perfil = session.get(Perfil, data.perfil_id)
    if not perfil:
        raise HTTPException(404, "Perfil no encontrado")
    restriccion = Restriccion(**data.model_dump())
    session.add(restriccion)
    session.add(
        Historial(
            organizacion_id=perfil.organizacion_id,
            perfil_id=perfil.id,
            tipo_cambio=TipoCambioHistorial.nueva_restriccion,
            descripcion=f"Nueva restricción obligatoria ({restriccion.tipo.value}: {restriccion.codigo}) para '{perfil.nombre}'.",
        )
    )
    session.commit()
    session.refresh(restriccion)
    return restriccion


@router.delete("/restricciones/{restriccion_id}")
def eliminar_restriccion(restriccion_id: int, session: Session = Depends(get_session)):
    restriccion = session.get(Restriccion, restriccion_id)
    if not restriccion:
        raise HTTPException(404, "Restricción no encontrada")
    session.delete(restriccion)
    session.commit()
    return {"ok": True}


@router.get("/preferencias", response_model=list[Preferencia])
def listar_preferencias(perfil_id: int | None = None, session: Session = Depends(get_session)):
    query = select(Preferencia)
    if perfil_id is not None:
        query = query.where(Preferencia.perfil_id == perfil_id)
    return session.exec(query).all()


@router.post("/preferencias", response_model=Preferencia)
def crear_preferencia(data: PreferenciaCreate, session: Session = Depends(get_session)):
    from app.models import Perfil

    perfil = session.get(Perfil, data.perfil_id)
    if not perfil:
        raise HTTPException(404, "Perfil no encontrado")
    preferencia = Preferencia(**data.model_dump())
    session.add(preferencia)
    session.add(
        Historial(
            organizacion_id=perfil.organizacion_id,
            perfil_id=perfil.id,
            tipo_cambio=TipoCambioHistorial.nueva_preferencia,
            descripcion=f"Nueva preferencia flexible ({preferencia.tipo.value}: {preferencia.codigo}) para '{perfil.nombre}'.",
        )
    )
    session.commit()
    session.refresh(preferencia)
    return preferencia


@router.delete("/preferencias/{preferencia_id}")
def eliminar_preferencia(preferencia_id: int, session: Session = Depends(get_session)):
    preferencia = session.get(Preferencia, preferencia_id)
    if not preferencia:
        raise HTTPException(404, "Preferencia no encontrada")
    session.delete(preferencia)
    session.commit()
    return {"ok": True}
