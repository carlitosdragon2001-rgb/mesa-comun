"""Fixtures que construyen alimentos y platos en memoria (sin base de datos) a
partir del dataset semilla real, para poder testear el motor de optimización de
forma aislada y rápida."""

import pytest

from app.models import Alimento
from app.seed.alimentos_seed import ALIMENTOS, ALIMENTOS_POR_NOMBRE
from app.seed.platos_seed import PLATOS, _agregados


@pytest.fixture(scope="session")
def alimento_nombre_a_id() -> dict[str, int]:
    return {fila[0]: i + 1 for i, fila in enumerate(ALIMENTOS)}


@pytest.fixture(scope="session")
def alimentos(alimento_nombre_a_id) -> list[Alimento]:
    resultado = []
    for i, fila in enumerate(ALIMENTOS):
        nombre = fila[0]
        datos = ALIMENTOS_POR_NOMBRE[nombre]
        resultado.append(Alimento(id=i + 1, nombre=nombre, **datos))
    return resultado


@pytest.fixture(scope="session")
def alimentos_por_id(alimentos) -> dict[int, dict]:
    return {a.id: {"estacionalidad": a.estacionalidad} for a in alimentos}


@pytest.fixture(scope="session")
def platos(alimento_nombre_a_id):
    from app.models import Plato

    resultado = []
    for i, (nombre, tipo_comida, ingredientes, picante, textura_base) in enumerate(PLATOS):
        agregados = _agregados(ingredientes, ALIMENTOS_POR_NOMBRE)
        ingredientes_json = [
            {"alimento_id": alimento_nombre_a_id[ing_nombre], "nombre": ing_nombre, "cantidad_g": gramos}
            for ing_nombre, gramos in ingredientes
        ]
        resultado.append(
            Plato(
                id=i + 1,
                nombre=nombre,
                tipo_comida=tipo_comida,
                ingredientes=ingredientes_json,
                picante=picante,
                textura_base=textura_base,
                **agregados,
            )
        )
    return resultado


@pytest.fixture
def platos_por_nombre(platos):
    return {p.nombre: p for p in platos}
