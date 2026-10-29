"""
Dataset semilla de platos.

Los nombres de los platos del apartado 6.5 del TFG (lasaña de carne con bechamel,
ensalada templada de pollo con nueces, curry de garbanzos con leche de coco y arroz,
revuelto de tofu con verduras, hamburguesas de lentejas con guarnición de verduras...)
se mantienen literalmente para poder reproducir esos cuatro casos como tests de
integración del motor de optimización (tests/test_casos_tfg.py).

Los atributos derivados (coste, kcal, proteínas, alérgenos, aptitudes) se calculan
automáticamente a partir de los ingredientes y del dataset de alimentos, no se
introducen a mano.
"""

from app.models import TipoComida, Textura

# (nombre, tipo_comida, [(alimento, gramos), ...], picante, textura_base)
PLATOS: list[tuple] = [
    # ---- Desayunos ----
    ("Tostada integral con aceite y tomate", TipoComida.desayuno,
     [("Pan integral", 60), ("Aceite de oliva virgen extra", 10), ("Tomate", 50)], False, Textura.normal),
    ("Porridge de avena con plátano", TipoComida.desayuno,
     [("Avena en copos", 50), ("Leche semidesnatada", 200), ("Plátano", 100)], False, Textura.blando),
    ("Yogur con frutos secos y miel", TipoComida.desayuno,
     [("Yogur natural", 125), ("Nueces", 20), ("Miel", 15)], False, Textura.normal),
    ("Tortitas de avena con fruta", TipoComida.desayuno,
     [("Avena en copos", 40), ("Huevo", 60), ("Leche semidesnatada", 80), ("Plátano", 80)], False, Textura.blando),
    ("Bocadillo de jamón cocido", TipoComida.desayuno,
     [("Pan blanco", 70), ("Jamón cocido", 40), ("Aceite de oliva virgen extra", 5)], False, Textura.normal),
    ("Batido de leche con cacao", TipoComida.desayuno,
     [("Leche entera", 200), ("Chocolate negro 70%", 15), ("Azúcar", 10)], False, Textura.normal),
    ("Tostada sin gluten con aguacate", TipoComida.desayuno,
     [("Pan sin gluten", 60), ("Aguacate", 70), ("Sal", 1)], False, Textura.normal),
    ("Yogur sin lactosa con fruta", TipoComida.desayuno,
     [("Yogur sin lactosa", 125), ("Fresas", 80), ("Miel", 10)], False, Textura.blando),
    ("Huevos revueltos con pan", TipoComida.desayuno,
     [("Huevo", 100), ("Pan blanco", 50), ("Aceite de oliva virgen extra", 8)], False, Textura.normal),
    ("Macedonia de frutas con queso fresco", TipoComida.desayuno,
     [("Manzana", 80), ("Naranja", 80), ("Uvas", 60), ("Queso fresco", 60)], False, Textura.blando),
    ("Cereales con bebida de avena", TipoComida.desayuno,
     [("Cereales de desayuno", 50), ("Bebida de avena", 200)], False, Textura.normal),
    ("Gachas de avena con manzana y canela", TipoComida.desayuno,
     [("Avena en copos", 50), ("Bebida de avena", 180), ("Manzana", 80),
      ("Especias suaves (hierbas provenzales)", 2)], False, Textura.blando),
    ("Tortilla de claras con espinacas", TipoComida.desayuno,
     [("Huevo", 120), ("Espinacas", 60), ("Aceite de oliva virgen extra", 6)], False, Textura.normal),

    # ---- Comidas / cenas: casos del TFG (6.5, caso 1) ----
    ("Lasaña de carne con bechamel", TipoComida.comida,
     [("Pasta de trigo", 100), ("Carne picada mixta", 150), ("Leche entera", 150),
      ("Queso curado", 40), ("Tomate", 100), ("Cebolla", 40)], False, Textura.blando),
    ("Ensalada templada de pollo con nueces", TipoComida.comida,
     [("Pechuga de pollo", 130), ("Nueces", 25), ("Lechuga", 80), ("Tomate", 60),
      ("Aceite de oliva virgen extra", 10)], False, Textura.normal),
    ("Curry de garbanzos con leche de coco y arroz", TipoComida.cena,
     [("Garbanzos secos", 100), ("Leche de coco", 120), ("Arroz blanco", 80),
      ("Cebolla", 40), ("Especias suaves (hierbas provenzales)", 5)], False, Textura.blando),
    ("Revuelto de tofu con verduras", TipoComida.cena,
     [("Tofu", 120), ("Calabacín", 80), ("Pimiento", 60), ("Cebolla", 30),
      ("Aceite de oliva virgen extra", 10)], False, Textura.normal),
    ("Hamburguesas de lentejas con guarnición de verduras", TipoComida.cena,
     [("Lentejas secas", 100), ("Pan rallado", 20), ("Huevo", 50), ("Zanahoria", 50),
      ("Calabacín", 50), ("Judía verde", 60), ("Especias suaves (hierbas provenzales)", 3)], False, Textura.normal),

    # ---- Caso 2 (celiaquía + SIBO + refuerzo huevo/lácteos) ----
    ("Revuelto de huevo con espinacas y queso", TipoComida.cena,
     [("Huevo", 120), ("Espinacas", 100), ("Queso fresco", 50), ("Aceite de oliva virgen extra", 8)],
     False, Textura.blando),
    ("Merluza al horno con patata", TipoComida.comida,
     [("Merluza", 150), ("Patata", 200), ("Aceite de oliva virgen extra", 10), ("Limón", 20)],
     False, Textura.blando),

    # ---- Caso 3 (presupuesto ajustado + disfagia, fácil de triturar) ----
    ("Puré de patata con carne picada", TipoComida.comida,
     [("Patata", 250), ("Carne picada mixta", 100), ("Cebolla", 30), ("Aceite de oliva virgen extra", 8)],
     False, Textura.triturado),
    ("Crema de calabacín", TipoComida.cena,
     [("Calabacín", 250), ("Patata", 100), ("Queso fresco", 30), ("Aceite de oliva virgen extra", 8)],
     False, Textura.triturado),
    ("Crema de calabaza", TipoComida.cena,
     [("Calabaza", 250), ("Patata", 80), ("Aceite de oliva virgen extra", 8)], False, Textura.triturado),

    # ---- Caso 4 (carne vs. vegetariano, sin solución única) ----
    ("Filete de ternera con patatas", TipoComida.comida,
     [("Ternera magra", 150), ("Patata", 200), ("Aceite de oliva virgen extra", 10)], False, Textura.normal),
    ("Guiso de garbanzos vegetariano", TipoComida.comida,
     [("Garbanzos secos", 120), ("Zanahoria", 60), ("Tomate", 60), ("Cebolla", 40),
      ("Aceite de oliva virgen extra", 10)], False, Textura.blando),

    # ---- Resto de comidas / cenas, para variedad semanal ----
    ("Pollo al horno con patatas", TipoComida.comida,
     [("Muslo de pollo", 180), ("Patata", 200), ("Aceite de oliva virgen extra", 10)], False, Textura.normal),
    ("Salmón a la plancha con verduras", TipoComida.cena,
     [("Salmón", 150), ("Brócoli", 100), ("Zanahoria", 60), ("Aceite de oliva virgen extra", 8)],
     False, Textura.normal),
    ("Pasta con tomate y albahaca", TipoComida.comida,
     [("Pasta de trigo", 100), ("Tomate", 150), ("Aceite de oliva virgen extra", 10)], False, Textura.normal),
    ("Pasta sin gluten con verduras", TipoComida.comida,
     [("Pasta sin gluten (maíz/arroz)", 100), ("Calabacín", 60), ("Pimiento", 60),
      ("Aceite de oliva virgen extra", 10)], False, Textura.normal),
    ("Arroz con pollo", TipoComida.comida,
     [("Arroz blanco", 90), ("Pechuga de pollo", 120), ("Pimiento", 50), ("Tomate", 50)], False, Textura.normal),
    ("Ensalada de garbanzos", TipoComida.comida,
     [("Garbanzos secos", 100), ("Tomate", 60), ("Pepino", 60), ("Aceite de oliva virgen extra", 10)],
     False, Textura.normal),
    ("Wok de tofu y verduras picante", TipoComida.cena,
     [("Tofu", 120), ("Pimiento", 60), ("Champiñones", 60), ("Guindilla", 5),
      ("Aceite de oliva virgen extra", 10)], True, Textura.normal),
    ("Pizza casera integral", TipoComida.cena,
     [("Harina de trigo", 120), ("Queso curado", 60), ("Tomate", 80), ("Jamón cocido", 50)], False, Textura.normal),
    ("Sopa de verduras", TipoComida.cena,
     [("Zanahoria", 60), ("Puerro", 60), ("Patata", 100), ("Apio", 40)], False, Textura.blando),
    ("Guiso de ternera con patatas", TipoComida.comida,
     [("Ternera magra", 150), ("Patata", 150), ("Zanahoria", 50), ("Cebolla", 40)], False, Textura.blando),
    ("Pescado al horno con limón", TipoComida.cena,
     [("Dorada", 180), ("Limón", 20), ("Aceite de oliva virgen extra", 10), ("Patata", 120)], False, Textura.normal),
    ("Bocadillo de atún", TipoComida.comida,
     [("Pan blanco", 70), ("Atún en lata", 80), ("Tomate", 40)], False, Textura.normal),
    ("Quinoa con verduras salteadas", TipoComida.comida,
     [("Quinoa", 90), ("Calabacín", 60), ("Pimiento", 60), ("Aceite de oliva virgen extra", 10)],
     False, Textura.normal),
    ("Fajitas de pollo picantes", TipoComida.cena,
     [("Pechuga de pollo", 130), ("Pimiento", 60), ("Cebolla", 40), ("Guindilla", 5),
      ("Tortitas de maíz", 60)], True, Textura.normal),
    ("Gazpacho", TipoComida.cena,
     [("Tomate", 250), ("Pimiento", 50), ("Pepino", 60), ("Ajo", 5), ("Aceite de oliva virgen extra", 15)],
     False, Textura.triturado),
    ("Paella de verduras", TipoComida.comida,
     [("Arroz blanco", 90), ("Pimiento", 50), ("Judía verde", 50), ("Tomate", 40),
      ("Aceite de oliva virgen extra", 10)], False, Textura.normal),
    ("Macarrones con queso", TipoComida.comida,
     [("Pasta de trigo", 100), ("Queso curado", 50), ("Leche entera", 80), ("Mantequilla", 15)],
     False, Textura.blando),
    ("Tortilla francesa con ensalada", TipoComida.cena,
     [("Huevo", 120), ("Lechuga", 60), ("Tomate", 50), ("Aceite de oliva virgen extra", 8)], False, Textura.normal),
    ("Brochetas de pavo con verduras", TipoComida.cena,
     [("Pavo", 150), ("Pimiento", 60), ("Calabacín", 60), ("Aceite de oliva virgen extra", 8)],
     False, Textura.normal),
    ("Arroz integral con salmón", TipoComida.comida,
     [("Arroz integral", 90), ("Salmón", 130), ("Espinacas", 50)], False, Textura.normal),
    ("Lentejas estofadas", TipoComida.comida,
     [("Lentejas secas", 110), ("Zanahoria", 50), ("Tomate", 50), ("Cebolla", 40)], False, Textura.blando),
    ("Sopa de pescado", TipoComida.cena,
     [("Merluza", 120), ("Patata", 80), ("Tomate", 60), ("Cebolla", 30)], False, Textura.blando),
    ("Ensalada de quinoa con aguacate", TipoComida.comida,
     [("Quinoa", 80), ("Aguacate", 70), ("Tomate", 50), ("Pepino", 50)], False, Textura.normal),
    ("Wrap sin gluten de pollo", TipoComida.comida,
     [("Tortitas de maíz", 70), ("Pechuga de pollo", 110), ("Lechuga", 40), ("Tomate", 40)],
     False, Textura.normal),
    ("Crema de coliflor", TipoComida.cena,
     [("Coliflor", 200), ("Patata", 80), ("Aceite de oliva virgen extra", 8)], False, Textura.triturado),
    ("Estofado de garbanzos con verduras", TipoComida.comida,
     [("Garbanzos secos", 110), ("Zanahoria", 50), ("Puerro", 40), ("Tomate", 50)], False, Textura.blando),
    ("Sardinas a la plancha con ensalada", TipoComida.cena,
     [("Sardinas", 150), ("Lechuga", 60), ("Tomate", 50), ("Aceite de oliva virgen extra", 10)],
     False, Textura.normal),
    ("Gambas al ajillo con arroz", TipoComida.cena,
     [("Gambas", 130), ("Ajo", 10), ("Arroz blanco", 80), ("Aceite de oliva virgen extra", 10)],
     True, Textura.normal),
]


def _agregados(ingredientes: list[tuple[str, float]], alimentos_por_nombre: dict[str, dict]) -> dict:
    coste = kcal = proteinas = 0.0
    alergenos: set[str] = set()
    vegetariano = vegano = True
    for nombre, gramos in ingredientes:
        datos = alimentos_por_nombre[nombre]
        factor = gramos / 100.0
        coste += (gramos / 1000.0) * datos["precio_ref_kg"]
        kcal += factor * datos["kcal_100g"]
        proteinas += factor * datos["proteinas_100g"]
        alergenos.update(datos["alergenos"])
        vegetariano = vegetariano and datos["vegetariano"]
        vegano = vegano and datos["vegano"]
    return {
        "coste_estimado": round(coste, 2),
        "kcal_total": round(kcal, 1),
        "proteinas_total": round(proteinas, 1),
        "alergenos": sorted(alergenos),
        "apto_vegetariano": vegetariano,
        "apto_vegano": vegano,
        "sin_gluten": "gluten" not in alergenos,
        "sin_lactosa": "lactosa" not in alergenos,
        "sin_frutos_secos": "frutos_secos" not in alergenos,
    }


def cargar_platos(session, alimentos_por_nombre: dict[str, dict], alimento_nombre_a_id: dict[str, int]) -> dict[str, int]:
    from app.models import Plato

    nombre_a_id: dict[str, int] = {}
    for nombre, tipo_comida, ingredientes, picante, textura_base in PLATOS:
        agregados = _agregados(ingredientes, alimentos_por_nombre)
        ingredientes_json = [
            {"alimento_id": alimento_nombre_a_id[ing_nombre], "nombre": ing_nombre, "cantidad_g": gramos}
            for ing_nombre, gramos in ingredientes
        ]
        plato = Plato(
            nombre=nombre,
            tipo_comida=tipo_comida,
            ingredientes=ingredientes_json,
            picante=picante,
            textura_base=textura_base,
            **agregados,
        )
        session.add(plato)
        session.flush()
        nombre_a_id[nombre] = plato.id
    session.commit()
    return nombre_a_id
