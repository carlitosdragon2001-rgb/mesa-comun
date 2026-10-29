# Imagen única: compila la interfaz con Node y la sirve desde la propia API.
# Así el despliegue es un solo servicio y un solo origen (sin CORS, y con un
# certificado válido, que es lo que necesita Web NFC en el móvil).

FROM node:22-alpine AS frontend
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.13-slim
WORKDIR /app

# CBC, el solver que usa PuLP para el MILP del menú, viene incluido en el
# paquete de PuLP para Linux, así que no hace falta instalarlo aparte.
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/app ./app
COPY --from=frontend /frontend/dist ./static

ENV PYTHONUNBUFFERED=1
# Carpeta escribible para SQLite: los hosts gratuitos montan el código como
# solo lectura y el contenedor no arranca como root.
ENV NUTRICION_DB=/tmp/nutricion.db
# Hugging Face Spaces usa 7860; Render, Fly y similares inyectan $PORT.
ENV PORT=7860
EXPOSE 7860

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
