# Gestión nutricional multiusuario — prototipo funcional del TFG

Aplicación que optimiza el presupuesto y la selección de alimentos de un menú
semanal, priorizando las restricciones obligatorias y preferencias flexibles de
varios perfiles a la vez, en cuatro tipos de organización: **familias**,
**residencias de estudiantes**, **residencias de mayores** y **centros
deportivos**.

Implementa de verdad la lógica de decisión descrita en los capítulos 3 y 6 del
borrador del TFG (filtrado de restricciones obligatorias → puntuación de
preferencias flexibles → optimización → adaptaciones individuales), mediante un
motor de programación lineal entera mixta (MILP) real, no un ejemplo ilustrativo.

## Estructura

```
backend/    API en FastAPI + SQLModel (SQLite) + motor de optimización (PuLP/CBC)
frontend/   Interfaz en React + TypeScript + Vite + Tailwind
```

## Puesta en marcha

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt      # Windows
# source venv/bin/activate && pip install -r requirements.txt   # macOS/Linux
venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

La API queda disponible en `http://127.0.0.1:8000` (documentación interactiva en
`http://127.0.0.1:8000/docs`). Al arrancar por primera vez, siembra
automáticamente ~100 alimentos, ~50 platos y tres organizaciones de ejemplo en
`backend/nutricion.db` (SQLite): Familia García (4 perfiles), Residencia El
Roble (2 perfiles) y la Residencia Universitaria Rector Estanislao del Campo
con **1.000 perfiles generados de forma procedural** (nombres, edad, sexo,
peso/altura, restricciones y preferencias con una distribución aleatoria pero
reproducible — semilla fija), con el presupuesto semanal ajustado a esa escala
(1.000 × 5,00 €/día × 7 días = 35.000 €/semana, coherente con el resto del
caso de negocio). Sirve para probar el motor de optimización y la interfaz a
un volumen real, no solo con un puñado de perfiles.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`:

- `/` — página de presentación ("Mesa Común"): caso de negocio para residencias de
  estudiantes con cifras de ahorro, escenarios, retorno de la inversión y precios.
- `/app/*` — la herramienta funcional (inicio, alta guiada, escaneo NFC, perfiles,
  menú semanal, lista de la compra, seguimiento), accesible desde el botón
  "Probar la demo".

### Demo en el móvil (presentación del TFG)

La interfaz es *mobile-first*: barra de pestañas inferior, botón central de NFC,
menú semanal día a día y formularios con objetivos táctiles grandes. Para
probarla en un teléfono de la misma red Wi-Fi:

```bash
cd frontend
npm run movil
```

`npm run movil` sirve por **HTTPS** con un certificado autofirmado
(`@vitejs/plugin-basic-ssl`). Es imprescindible: **Web NFC solo funciona en un
"secure context"**, y `http://192.168.x.x` no lo es. Pasos:

1. Arranca el backend en el portátil (`...uvicorn app.main:app --port 8000`).
2. Arranca `npm run movil`; Vite imprime la URL de red, p. ej.
   `https://192.168.1.42:5173`.
3. Abre esa URL en **Chrome para Android** y acepta el aviso de "conexión no
   privada" (Configuración avanzada → Continuar). La API se sirve por proxy bajo
   `/api` en ese mismo origen, así que no hay CORS ni contenido mixto.
4. Opcional: "Añadir a pantalla de inicio" instala la app como PWA (manifiesto,
   icono y arranque a pantalla completa en `/app/inicio`).

El escaneo NFC desde dentro de la app (`/app/escanear`) requiere Chrome en
Android con NFC activado. En iOS o en el portátil la app lo detecta y lo dice,
y ofrece abrir la misma ficha desde una lista — y las pegatinas siguen
funcionando igual, porque al acercarlas el sistema abre la URL en el navegador.

## Tests

```bash
cd backend
venv\Scripts\python.exe -m pytest tests/ -v
```

Incluye tests unitarios del filtrado y la puntuación, un test de integración
sobre la API HTTP completa, y **los cuatro casos conceptuales del apartado 6.5
del TFG** (familia con intolerancia a lactosa y alergia a frutos secos;
celiaquía + SIBO + perfil fuera de la planificación; disfagia con presupuesto
ajustado; preferencias enfrentadas sin restricción obligatoria) reproducidos
como especificación ejecutable del motor real.

## Identidad visual

La interfaz usa la dirección de marca "Mesa Común": paleta cálida terracota
sobre crema (tokens `ink`/`paper`/`berry`/`sage`/`gold`) y tipografía Fraunces +
Work Sans, inspirada en los wireframes del borrador R3 del TFG (apdo. 7.4).
Todo está definido como tokens de tema en `frontend/src/index.css` (`@theme` de
Tailwind v4), así que un cambio de color ahí se propaga a toda la app. Las
fuentes están en `frontend/public/fonts/`.

## Flujo de uso

0. **Landing (`/`)** — caso de negocio dirigido a residencias de estudiantes:
   ahorro estimado en tres escenarios, retorno de la inversión y planes de precio
   por plaza. El botón "Probar la demo" lleva a la herramienta funcional.
1. **Inicio (`/app/inicio`)** — pantalla de arranque en el móvil: organización
   activa con sus KPIs (personas, presupuesto semanal, coste por persona),
   acciones rápidas, estado del plan de la semana y cambio rápido de
   organización.
2. **Alta guiada (`/app/nueva`)** — asistente de cuatro pasos para meter los
   datos de una familia, residencia o centro desde el teléfono: tipo → nombre,
   nº de comensales y presupuesto (propuesto a partir de un coste de referencia
   por persona y tipo de centro) → personas, una a una con restricciones y
   preferencias en *chips*, más un alta rápida en bloque para las plazas
   restantes de una residencia → resumen y grabado de la pegatina NFC.
3. **Escanear (`/app/escanear`)** — lectura real de etiquetas con
   `NDEFReader.scan()`: al acercar la pegatina, la app lee su URL, vibra y abre
   la ficha correspondiente (perfil u organización) dentro de la propia app, sin
   pasar por el navegador. También graba pegatinas nuevas para la organización
   activa.
4. **Organizaciones** — crear una organización (familia, residencia de
   estudiantes, residencia de mayores o centro deportivo) y su presupuesto
   semanal.
5. **Perfiles** — dar de alta los perfiles del grupo (con parentesco, sexo,
   peso/altura e IMC calculado), sus restricciones obligatorias agrupadas por
   categoría (alergias, intolerancias, afecciones médicas, textura) y sus
   preferencias flexibles (objetivo de salud como control segmentado, gustos
   personales). Cada perfil tiene un enlace directo (`/app/perfiles/:id`, con
   QR y, en Chrome/Android, grabado NFC vía Web NFC) que abre su propia ficha
   lista para editar y cambia automáticamente a la organización a la que
   pertenece — pensado para pegatinas o chapas NFC físicas por persona.
6. **Menú semanal** — panel combinado de menú y lista de la compra: genera y
   optimiza el plan, muestra KPIs (calorías/proteína media, restricciones
   activas, presupuesto), permite filtrar por perfil para ver sus adaptaciones,
   y genera la lista de la compra como checklist marcable en la misma vista,
   exportable a un fichero de texto. En el móvil la cuadrícula semanal se
   sustituye por un selector de día y tarjetas apiladas (desayuno, comida y
   cena, con calorías, proteína y adaptaciones de cada plato).
7. **Lista de la compra** — vista dedicada "modo compra", con filtros
   Todo/Pendiente/Comprado (el estado se comparte con el panel de menú vía
   localStorage) y estadísticas de presupuesto restante.
8. **Seguimiento** — registrar cambios puntuales y recalcular el plan
   automáticamente, con un panel de "equidad entre perfiles" que visualiza la
   satisfacción acumulada real del motor (apdo. 6.3) como barras de progreso.

## Fuera de alcance de esta versión

- Autenticación/roles de acceso reales — incluido el enlace de perfil por NFC/QR:
  es un enlace directo sin login, así que quien lo escanea puede editar ese
  perfil sin más comprobación (coherente con que el resto de la app tampoco
  tiene autenticación todavía).
- Precios conectados a supermercados reales (se usan precios de referencia).
- Despliegue en la nube; pensada para ejecutarse en local.
