import os
from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

# En local la base de datos vive junto al código (backend/nutricion.db). En un
# contenedor esa carpeta suele ser de solo lectura, así que el despliegue indica
# con NUTRICION_DB dónde puede escribir (p. ej. /tmp/nutricion.db).
DB_PATH = Path(os.environ.get("NUTRICION_DB") or Path(__file__).resolve().parent.parent / "nutricion.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
