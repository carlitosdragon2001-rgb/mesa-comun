@echo off
REM Arranca la demo completa con doble clic: la API y la interfaz en HTTPS.
REM Se abren dos ventanas de consola; cerrarlas detiene la demo.
cd /d "%~dp0"
set "PATH=C:\Program Files\nodejs;%PATH%"

start "Mesa Comun - API" cmd /k backend\venv\Scripts\python.exe -m uvicorn app.main:app --port 8000 --app-dir backend
start "Mesa Comun - Web" cmd /k "cd frontend && npm run movil"

echo.
echo   Mesa Comun esta arrancando.
echo.
echo   En este portatil:                https://localhost:5173/app/inicio
echo   Desde el movil (punto de acceso): https://192.168.137.1:5173/app/inicio
echo.
echo   Cierra las dos ventanas que se han abierto para detener la demo.
echo.
timeout /t 8 >nul
