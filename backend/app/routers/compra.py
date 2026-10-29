from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.database import get_session
from app.models import Alimento, ListaCompra, Organizacion, Perfil, PlanMenu, Plato

router = APIRouter(prefix="/compra", tags=["lista de la compra"])


@router.post("/generar/{plan_menu_id}", response_model=ListaCompra)
def generar_lista_compra(plan_menu_id: int, session: Session = Depends(get_session)):
    plan = session.get(PlanMenu, plan_menu_id)
    if not plan:
        raise HTTPException(404, "Plan no encontrado")
    organizacion = session.get(Organizacion, plan.organizacion_id)
    raciones = max(
        len(
            session.exec(
                select(Perfil).where(
                    Perfil.organizacion_id == plan.organizacion_id,
                    Perfil.excluido_de_planificacion == False,  # noqa: E712
                )
            ).all()
        ),
        1,
    )

    platos_por_id = {p.id: p for p in session.exec(select(Plato)).all()}
    alimentos_por_id = {a.id: a for a in session.exec(select(Alimento)).all()}

    cantidades: dict[int, float] = {}
    for asignacion in plan.asignaciones:
        plato = platos_por_id.get(asignacion["plato_id"])
        if not plato:
            continue
        for ingrediente in plato.ingredientes:
            alimento_id = ingrediente["alimento_id"]
            cantidades[alimento_id] = cantidades.get(alimento_id, 0.0) + ingrediente["cantidad_g"] * raciones

    items = []
    coste_total = 0.0
    for alimento_id, gramos in sorted(cantidades.items(), key=lambda kv: alimentos_por_id[kv[0]].categoria):
        alimento = alimentos_por_id[alimento_id]
        coste = round((gramos / 1000.0) * alimento.precio_ref_kg, 2)
        coste_total += coste
        items.append(
            {
                "alimento_id": alimento_id,
                "nombre": alimento.nombre,
                "categoria": alimento.categoria,
                "cantidad_g": round(gramos, 1),
                "coste": coste,
            }
        )

    lista = ListaCompra(
        plan_menu_id=plan_menu_id,
        items=items,
        presupuesto_estimado=round(coste_total, 2),
        presupuesto_restante=round(organizacion.presupuesto_semanal - coste_total, 2),
    )
    session.add(lista)
    session.commit()
    session.refresh(lista)
    return lista


@router.get("/{plan_menu_id}", response_model=ListaCompra)
def obtener_lista_compra(plan_menu_id: int, session: Session = Depends(get_session)):
    lista = session.exec(
        select(ListaCompra)
        .where(ListaCompra.plan_menu_id == plan_menu_id)
        .order_by(ListaCompra.created_at.desc())
    ).first()
    if not lista:
        raise HTTPException(404, "No hay lista de la compra generada para este plan")
    return lista
