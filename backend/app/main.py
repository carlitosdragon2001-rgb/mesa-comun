from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import init_db
from app.routers import (
    alimentos,
    compra,
    historial,
    organizaciones,
    perfiles,
    planes,
    restricciones_preferencias,
)
from app.seed.run_seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    seed()
    yield


app = FastAPI(
    title="Gestión nutricional multiusuario",
    description=(
        "API del prototipo funcional del TFG: optimización de presupuesto y "
        "alimentos priorizando restricciones obligatorias y preferencias "
        "flexibles en entornos multiusuario (familias, residencias de mayores, "
        "centros deportivos)."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(organizaciones.router)
app.include_router(perfiles.router)
app.include_router(restricciones_preferencias.router)
app.include_router(alimentos.router)
app.include_router(planes.router)
app.include_router(compra.router)
app.include_router(historial.router)


@app.get("/estado")
def estado():
    return {"status": "ok", "app": "nutricion-multiusuario"}


# En desarrollo el frontend lo sirve Vite (puerto 5173) y esta carpeta no
# existe. En el despliegue, la imagen copia aquí el build de producción y la
# API sirve también la interfaz, así que todo vive en un único origen: sin
# CORS, sin segunda URL y con el mismo certificado para Web NFC.
FRONTEND_DIST = Path(__file__).resolve().parent.parent / "static"

if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")
    app.mount("/fonts", StaticFiles(directory=FRONTEND_DIST / "fonts"), name="fonts")

    @app.get("/{ruta:path}")
    def spa(ruta: str):
        # Las rutas de la API están declaradas antes, así que solo llegan aquí
        # las de la interfaz (/, /app/inicio, /app/perfiles/3…). React Router
        # resuelve la ruta en el navegador: todas devuelven el mismo index.html.
        fichero = FRONTEND_DIST / ruta
        if ruta and fichero.is_file():
            return FileResponse(fichero)
        return FileResponse(FRONTEND_DIST / "index.html")

else:

    @app.get("/")
    def root():
        return {"status": "ok", "app": "nutricion-multiusuario"}
