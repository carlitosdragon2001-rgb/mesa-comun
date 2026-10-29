"""Puebla la base de datos con el dataset semilla de alimentos y platos.

Uso: python -m app.seed.run_seed
Es idempotente sobre una base de datos vacía; si ya hay alimentos cargados, no hace nada.
"""

from sqlmodel import Session, select

from app.database import engine, init_db
from app.models import Alimento
from app.seed.alimentos_seed import ALIMENTOS_POR_NOMBRE, cargar_alimentos
from app.seed.organizaciones_seed import cargar_organizaciones_demo
from app.seed.platos_seed import cargar_platos


def seed() -> None:
    init_db()
    with Session(engine) as session:
        ya_existe = session.exec(select(Alimento).limit(1)).first()
        if ya_existe:
            print("La base de datos ya contiene alimentos; no se vuelve a sembrar.")
            return
        alimento_nombre_a_id = cargar_alimentos(session)
        plato_nombre_a_id = cargar_platos(session, ALIMENTOS_POR_NOMBRE, alimento_nombre_a_id)
        cargar_organizaciones_demo(session)
        print(
            f"Sembrados {len(alimento_nombre_a_id)} alimentos, {len(plato_nombre_a_id)} platos "
            "y 2 organizaciones de ejemplo (residencia de estudiantes y residencia de mayores)."
        )


if __name__ == "__main__":
    seed()
