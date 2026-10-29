"""Organizaciones de ejemplo para la demo: una familia, una residencia de
estudiantes a escala real (~1.000 plazas) y una residencia de mayores, cada una
con perfiles, restricciones y preferencias. Se cargan una sola vez (si ya
existe alguna Organizacion, no se repite). La familia reutiliza los nombres y
restricciones de los wireframes del TFG (Marta y Diego, intolerancia a la
lactosa, alergia a frutos secos) para que la demo se reconozca directamente;
la residencia de estudiantes se genera de forma procedural para poder probar
el motor de optimización y la interfaz con un volumen de perfiles comparable
al caso de negocio (apdo. "precio semanal para grandes residencias").
"""

import random

from app.models import (
    Organizacion,
    Perfil,
    Preferencia,
    Restriccion,
    TipoOrganizacion,
    TipoPreferencia,
    TipoRestriccion,
)

# (nombre, rol, parentesco, edad, sexo, peso_kg, altura_cm, restricciones[(tipo, codigo)], preferencias[(tipo, codigo)])
FAMILIA = [
    (
        "Marta Ruiz", "adulto", "Cónyuge", 34, "mujer", 63.0, 168.0,
        [("intolerancia", "lactosa"), ("alergia", "frutos_secos"), ("alergia", "marisco")],
        [("salud", "mantenimiento")],
    ),
    (
        "Javier García", "adulto", "Cónyuge", 36, "hombre", 80.0, 178.0,
        [],
        [("salud", "ganancia_muscular")],
    ),
    (
        "Diego García", "menor", "Hijo", 12, "hombre", 42.0, 150.0,
        [("alergia", "frutos_secos")],
        [("salud", "alto_rendimiento")],
    ),
    (
        "Lucía García", "menor", "Hija", 8, "mujer", 28.0, 128.0,
        [("afeccion_medica", "gluten")],
        [("gusto", "evitar_picante")],
    ),
]

MAYORES = [
    ("Dolores", "persona_mayor", None, 82, "mujer", None, None, [("textura", "triturado")], []),
    ("Antonio", "persona_mayor", None, 76, "hombre", None, None, [("alergia", "frutos_secos")], []),
]

# Coste de materia prima de referencia usado en todo el caso de negocio
# (≈5,00 €/residente/día × 7 días, ver Landing "precio semanal para grandes
# residencias"), para que el presupuesto de la demo sea coherente con esas cifras.
COSTE_SEMANAL_POR_ESTUDIANTE = 35.0
N_ESTUDIANTES_DEMO = 1000

NOMBRES_M = [
    "Alejandro", "Pablo", "Daniel", "David", "Adrián", "Álvaro", "Javier", "Sergio", "Carlos", "Diego",
    "Marcos", "Iván", "Rubén", "Hugo", "Mario", "Raúl", "Manuel", "Antonio", "Francisco", "Jorge",
    "Pedro", "Miguel", "Ángel", "Fernando", "José",
]
NOMBRES_F = [
    "Lucía", "María", "Paula", "Laura", "Sara", "Carmen", "Elena", "Marta", "Andrea", "Claudia",
    "Alba", "Sofía", "Irene", "Nerea", "Aitana", "Julia", "Noa", "Valeria", "Beatriz", "Cristina",
    "Patricia", "Raquel", "Silvia", "Rocío", "Ana",
]
APELLIDOS = [
    "García", "Rodríguez", "González", "Fernández", "López", "Martínez", "Sánchez", "Pérez", "Gómez", "Martín",
    "Jiménez", "Ruiz", "Hernández", "Díaz", "Moreno", "Álvarez", "Romero", "Alonso", "Gutiérrez", "Navarro",
    "Torres", "Domínguez", "Vázquez", "Ramos", "Gil", "Ramírez", "Serrano", "Blanco", "Suárez", "Molina",
    "Morales", "Ortega", "Delgado", "Castro", "Ortiz", "Rubio", "Marín", "Sanz", "Iglesias", "Núñez",
]


def generar_estudiantes(n: int = N_ESTUDIANTES_DEMO, semilla: int = 42) -> list[tuple]:
    """Genera perfiles de estudiantes de forma procedural, con una distribución
    de restricciones y preferencias orientativa (no clínica) sobre prevalencias
    habituales en población joven: ~2% alergia a frutos secos, ~10% intolerancia
    a la lactosa, ~18% alguna preferencia de gusto, etc. Semilla fija para que
    la demo sea reproducible entre arranques."""
    rnd = random.Random(semilla)
    resultado = []
    for _ in range(n):
        sexo = rnd.choice(["mujer", "hombre"])
        nombre_pila = rnd.choice(NOMBRES_F if sexo == "mujer" else NOMBRES_M)
        apellido = rnd.choice(APELLIDOS)
        nombre = f"{nombre_pila} {apellido}"
        edad = rnd.randint(18, 25)
        if sexo == "mujer":
            peso = round(rnd.uniform(48, 68), 1)
            altura = round(rnd.uniform(155, 172), 1)
        else:
            peso = round(rnd.uniform(60, 88), 1)
            altura = round(rnd.uniform(168, 190), 1)

        restricciones: list[tuple[str, str]] = []
        r = rnd.random()
        if r < 0.02:
            restricciones.append(("alergia", "frutos_secos"))
        elif r < 0.035:
            restricciones.append(("alergia", "marisco"))
        elif r < 0.045:
            restricciones.append(("alergia", "huevo"))
        r2 = rnd.random()
        if r2 < 0.10:
            restricciones.append(("intolerancia", "lactosa"))
        elif r2 < 0.115:
            restricciones.append(("afeccion_medica", "gluten"))
        elif r2 < 0.125:
            restricciones.append(("afeccion_medica", "fodmap_alto"))

        preferencias: list[tuple[str, str]] = []
        rp = rnd.random()
        if rp < 0.06:
            preferencias.append(("gusto", "vegetariano"))
        elif rp < 0.08:
            preferencias.append(("gusto", "vegano"))
        elif rp < 0.12:
            preferencias.append(("gusto", "reducir_carne_roja"))
        elif rp < 0.16:
            preferencias.append(("gusto", "evitar_picante"))
        elif rp < 0.18:
            preferencias.append(("gusto", "prefiere_carne"))
        rs = rnd.random()
        if rs < 0.15:
            preferencias.append(("salud", "perdida_peso"))
        elif rs < 0.25:
            preferencias.append(("salud", "ganancia_muscular"))
        elif rs < 0.32:
            preferencias.append(("salud", "alto_rendimiento"))
        elif rs < 0.45:
            preferencias.append(("salud", "mantenimiento"))

        resultado.append((nombre, "estudiante", None, edad, sexo, peso, altura, restricciones, preferencias))
    return resultado


def _cargar_grupo(session, nombre_org, tipo, presupuesto, personas) -> None:
    organizacion = Organizacion(nombre=nombre_org, tipo=tipo, presupuesto_semanal=presupuesto)
    session.add(organizacion)
    session.flush()

    for nombre, rol, parentesco, edad, sexo, peso, altura, restricciones, preferencias in personas:
        perfil = Perfil(
            organizacion_id=organizacion.id,
            nombre=nombre,
            rol=rol,
            parentesco=parentesco,
            edad=edad,
            sexo=sexo,
            peso_kg=peso,
            altura_cm=altura,
        )
        session.add(perfil)
        session.flush()
        for tipo_r, codigo in restricciones:
            session.add(Restriccion(perfil_id=perfil.id, tipo=TipoRestriccion(tipo_r), codigo=codigo))
        for tipo_p, codigo in preferencias:
            session.add(Preferencia(perfil_id=perfil.id, tipo=TipoPreferencia(tipo_p), codigo=codigo))


def cargar_organizaciones_demo(session) -> None:
    from sqlmodel import select

    ya_existe = session.exec(select(Organizacion).limit(1)).first()
    if ya_existe:
        return

    _cargar_grupo(session, "Familia García", TipoOrganizacion.familia, 55.0, FAMILIA)
    _cargar_grupo(
        session,
        "Residencia Universitaria Rector Estanislao del Campo",
        TipoOrganizacion.residencia_estudiantes,
        N_ESTUDIANTES_DEMO * COSTE_SEMANAL_POR_ESTUDIANTE,
        generar_estudiantes(),
    )
    _cargar_grupo(session, "Residencia El Roble", TipoOrganizacion.residencia_mayores, 120.0, MAYORES)
    session.commit()
