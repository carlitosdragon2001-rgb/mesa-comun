"""Test de integración sobre la API HTTP completa: crear una organización, dar de
alta perfiles con restricciones/preferencias, generar un plan y su lista de la
compra, y registrar un cambio puntual que recalcula el plan."""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.database import get_session
from app.main import app
from app.seed.alimentos_seed import cargar_alimentos
from app.seed.platos_seed import cargar_platos
from app.seed.alimentos_seed import ALIMENTOS_POR_NOMBRE


@pytest.fixture
def client():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        alimento_nombre_a_id = cargar_alimentos(session)
        cargar_platos(session, ALIMENTOS_POR_NOMBRE, alimento_nombre_a_id)

    def get_session_override():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_session_override
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_flujo_completo_familia(client: TestClient):
    org = client.post(
        "/organizaciones",
        json={"nombre": "Familia Pérez", "tipo": "familia", "presupuesto_semanal": 150},
    ).json()

    b = client.post(
        "/perfiles",
        json={"organizacion_id": org["id"], "nombre": "B", "rol": "adulto", "edad": 45},
    ).json()
    c = client.post(
        "/perfiles",
        json={"organizacion_id": org["id"], "nombre": "C", "rol": "menor", "edad": 10},
    ).json()

    r1 = client.post(
        "/restricciones",
        json={"perfil_id": b["id"], "tipo": "intolerancia", "codigo": "lactosa"},
    )
    assert r1.status_code == 200
    r2 = client.post(
        "/restricciones",
        json={"perfil_id": c["id"], "tipo": "alergia", "codigo": "frutos_secos"},
    )
    assert r2.status_code == 200

    plan_resp = client.post(
        "/planes/generar",
        json={"organizacion_id": org["id"], "semana": "2026-W33", "dias": 7},
    )
    assert plan_resp.status_code == 200
    plan = plan_resp.json()
    assert len(plan["asignaciones"]) == 21

    platos_por_id = {p["id"]: p for p in client.get("/platos").json()}
    for asignacion in plan["asignaciones"]:
        alergenos = set(platos_por_id[asignacion["plato_id"]]["alergenos"])
        assert "lactosa" not in alergenos
        assert "frutos_secos" not in alergenos

    compra_resp = client.post(f"/compra/generar/{plan['id']}")
    assert compra_resp.status_code == 200
    compra = compra_resp.json()
    assert compra["presupuesto_estimado"] > 0
    assert len(compra["items"]) > 0

    cambio_resp = client.post(
        "/historial/cambio",
        json={
            "organizacion_id": org["id"],
            "perfil_id": b["id"],
            "tipo_cambio": "nueva_restriccion",
            "descripcion": "B desarrolla también alergia al gluten.",
            "regenerar_plan": True,
        },
    )
    assert cambio_resp.status_code == 200
    cambio = cambio_resp.json()
    assert cambio["plan_recalculado_id"] is not None

    historial = client.get(f"/historial?organizacion_id={org['id']}").json()
    assert len(historial) >= 3  # alta de B, alta de C, cambio puntual (además de alertas internas)
