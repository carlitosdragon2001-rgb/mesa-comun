from pathlib import Path

from sqlmodel import Session, SQLModel, create_engine

DB_PATH = Path(__file__).resolve().parent.parent / "nutricion.db"
DATABASE_URL = f"sqlite:///{DB_PATH}"

connect_args = {"check_same_thread": False}
engine = create_engine(DATABASE_URL, echo=False, connect_args=connect_args)


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
