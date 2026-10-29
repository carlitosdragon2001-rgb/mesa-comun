"""
Dataset semilla de alimentos.

Valores nutricionales de referencia (kcal, proteínas, grasas, hidratos por 100 g)
inspirados en los rangos publicados por BEDCA (Base de Datos Española de Composición
de Alimentos, www.bedca.net) para los alimentos más consumidos en España. BEDCA no
ofrece una API REST pública estable, así que este dataset se mantiene como semilla
local versionada en vez de depender de scraping en tiempo de ejecución (ver plan).

Los precios de referencia (€/kg) son estimaciones orientativas de supermercado, no
conectadas a un proveedor real (limitación reconocida, igual que en el propio TFG).

Etiquetas de alérgeno/restricción usadas en `alergenos` (deben coincidir con el
`codigo` de las Restricciones para que el filtrado obligatorio funcione):
  lactosa, gluten, frutos_secos, huevo, pescado, marisco, soja, fodmap_alto
"""

# (nombre, categoria, alergenos, kcal_100g, proteinas_100g, grasas_100g, hidratos_100g,
#  precio_ref_kg, estacionalidad, vegetariano, vegano)
ALIMENTOS: list[tuple] = [
    # Cereales y derivados
    ("Arroz blanco", "cereal", [], 130, 2.7, 0.3, 28.2, 1.8, ["todo_el_año"], True, True),
    ("Arroz integral", "cereal", [], 123, 2.6, 1.0, 25.8, 2.4, ["todo_el_año"], True, True),
    ("Pasta de trigo", "cereal", ["gluten"], 131, 5.3, 1.1, 25.0, 1.6, ["todo_el_año"], True, True),
    ("Pasta sin gluten (maíz/arroz)", "cereal", [], 143, 3.0, 0.8, 30.5, 3.2, ["todo_el_año"], True, True),
    ("Pan blanco", "cereal", ["gluten"], 265, 9.0, 1.2, 51.0, 2.2, ["todo_el_año"], True, True),
    ("Pan integral", "cereal", ["gluten"], 246, 8.8, 2.5, 41.3, 2.6, ["todo_el_año"], True, True),
    ("Pan sin gluten", "cereal", [], 250, 4.5, 3.5, 49.0, 5.5, ["todo_el_año"], True, True),
    ("Avena en copos", "cereal", [], 372, 13.5, 7.0, 59.0, 2.1, ["todo_el_año"], True, True),
    ("Quinoa", "cereal", [], 368, 14.1, 6.1, 64.2, 5.8, ["todo_el_año"], True, True),
    ("Cuscús", "cereal", ["gluten"], 112, 3.8, 0.2, 23.2, 2.9, ["todo_el_año"], True, True),
    ("Harina de trigo", "cereal", ["gluten"], 340, 10.3, 1.0, 71.0, 1.1, ["todo_el_año"], True, True),
    ("Cereales de desayuno", "cereal", ["gluten"], 378, 7.5, 1.5, 82.0, 4.0, ["todo_el_año"], True, True),
    ("Tortitas de maíz", "cereal", [], 384, 8.2, 3.5, 78.0, 4.5, ["todo_el_año"], True, True),

    # Legumbres (alto contenido en fermentables/FODMAP)
    ("Lentejas secas", "legumbre", ["fodmap_alto"], 116, 9.0, 0.4, 20.1, 2.3, ["todo_el_año"], True, True),
    ("Garbanzos secos", "legumbre", ["fodmap_alto"], 121, 8.9, 2.1, 20.5, 2.6, ["todo_el_año"], True, True),
    ("Alubias blancas", "legumbre", ["fodmap_alto"], 118, 8.2, 0.5, 21.0, 2.7, ["todo_el_año"], True, True),
    ("Alubias rojas", "legumbre", ["fodmap_alto"], 109, 7.8, 0.4, 19.5, 2.8, ["todo_el_año"], True, True),
    ("Guisantes", "legumbre", ["fodmap_alto"], 81, 5.4, 0.4, 14.5, 3.0, ["primavera", "verano"], True, True),
    ("Soja texturizada", "legumbre", ["soja", "fodmap_alto"], 336, 50.0, 1.0, 30.0, 6.5, ["todo_el_año"], True, True),
    ("Tofu", "legumbre", ["soja"], 76, 8.1, 4.8, 1.9, 4.2, ["todo_el_año"], True, True),
    ("Hummus", "legumbre", ["fodmap_alto", "soja"], 166, 7.9, 9.6, 14.3, 6.0, ["todo_el_año"], True, True),

    # Verduras y hortalizas
    ("Tomate", "verdura", [], 18, 0.9, 0.2, 3.9, 1.9, ["verano"], True, True),
    ("Pimiento", "verdura", [], 31, 1.0, 0.3, 6.0, 2.6, ["verano"], True, True),
    ("Calabacín", "verdura", [], 17, 1.2, 0.3, 3.1, 1.7, ["verano"], True, True),
    ("Berenjena", "verdura", [], 25, 1.0, 0.2, 5.9, 1.8, ["verano"], True, True),
    ("Cebolla", "verdura", ["fodmap_alto"], 40, 1.1, 0.1, 9.3, 1.3, ["todo_el_año"], True, True),
    ("Ajo", "verdura", ["fodmap_alto"], 149, 6.4, 0.5, 33.1, 5.0, ["todo_el_año"], True, True),
    ("Zanahoria", "verdura", [], 41, 0.9, 0.2, 9.6, 1.2, ["todo_el_año"], True, True),
    ("Patata", "verdura", [], 77, 2.0, 0.1, 17.5, 1.1, ["todo_el_año"], True, True),
    ("Brócoli", "verdura", [], 34, 2.8, 0.4, 6.6, 2.8, ["invierno"], True, True),
    ("Coliflor", "verdura", ["fodmap_alto"], 25, 1.9, 0.3, 5.0, 2.4, ["invierno"], True, True),
    ("Espinacas", "verdura", [], 23, 2.9, 0.4, 3.6, 2.9, ["invierno"], True, True),
    ("Acelgas", "verdura", [], 19, 1.8, 0.2, 3.7, 2.2, ["todo_el_año"], True, True),
    ("Lechuga", "verdura", [], 15, 1.4, 0.2, 2.9, 1.6, ["todo_el_año"], True, True),
    ("Pepino", "verdura", [], 12, 0.7, 0.1, 2.2, 1.5, ["verano"], True, True),
    ("Champiñones", "verdura", ["fodmap_alto"], 22, 3.1, 0.3, 3.3, 3.5, ["todo_el_año"], True, True),
    ("Calabaza", "verdura", [], 26, 1.0, 0.1, 6.5, 1.6, ["otoño"], True, True),
    ("Judía verde", "verdura", [], 31, 1.8, 0.1, 7.0, 2.5, ["verano"], True, True),
    ("Puerro", "verdura", ["fodmap_alto"], 61, 1.5, 0.3, 14.2, 2.1, ["invierno"], True, True),
    ("Apio", "verdura", [], 16, 0.7, 0.2, 3.0, 2.0, ["todo_el_año"], True, True),

    # Frutas
    ("Manzana", "fruta", ["fodmap_alto"], 52, 0.3, 0.2, 13.8, 2.0, ["otoño"], True, True),
    ("Plátano", "fruta", [], 89, 1.1, 0.3, 22.8, 1.5, ["todo_el_año"], True, True),
    ("Naranja", "fruta", [], 47, 0.9, 0.1, 11.8, 1.4, ["invierno"], True, True),
    ("Pera", "fruta", ["fodmap_alto"], 57, 0.4, 0.1, 15.2, 2.1, ["otoño"], True, True),
    ("Fresas", "fruta", [], 32, 0.7, 0.3, 7.7, 4.5, ["primavera"], True, True),
    ("Uvas", "fruta", [], 69, 0.7, 0.2, 18.1, 2.8, ["otoño"], True, True),
    ("Melón", "fruta", [], 34, 0.8, 0.2, 8.2, 1.6, ["verano"], True, True),
    ("Sandía", "fruta", [], 30, 0.6, 0.2, 7.6, 1.2, ["verano"], True, True),
    ("Kiwi", "fruta", [], 61, 1.1, 0.5, 14.7, 3.5, ["invierno"], True, True),
    ("Melocotón", "fruta", [], 39, 0.9, 0.3, 9.5, 2.4, ["verano"], True, True),
    ("Piña", "fruta", [], 50, 0.5, 0.1, 13.1, 2.6, ["todo_el_año"], True, True),
    ("Mandarina", "fruta", [], 53, 0.8, 0.3, 13.3, 2.2, ["invierno"], True, True),
    ("Aguacate", "fruta", [], 160, 2.0, 14.7, 8.5, 4.0, ["todo_el_año"], True, True),
    ("Limón", "fruta", [], 29, 1.1, 0.3, 9.3, 1.9, ["todo_el_año"], True, True),

    # Carnes
    ("Pechuga de pollo", "carne", [], 165, 31.0, 3.6, 0.0, 6.5, ["todo_el_año"], False, False),
    ("Muslo de pollo", "carne", [], 209, 26.0, 10.9, 0.0, 5.0, ["todo_el_año"], False, False),
    ("Pavo", "carne", [], 135, 29.0, 1.7, 0.0, 8.0, ["todo_el_año"], False, False),
    ("Ternera magra", "carne", [], 172, 26.0, 7.0, 0.0, 11.5, ["todo_el_año"], False, False),
    ("Lomo de cerdo", "carne", [], 143, 27.0, 3.5, 0.0, 7.5, ["todo_el_año"], False, False),
    ("Carne picada mixta", "carne", [], 215, 20.0, 15.0, 0.0, 7.0, ["todo_el_año"], False, False),
    ("Jamón cocido", "carne", [], 113, 18.0, 4.0, 1.0, 9.0, ["todo_el_año"], False, False),
    ("Jamón serrano", "carne", [], 241, 31.0, 13.0, 0.0, 22.0, ["todo_el_año"], False, False),
    ("Chorizo", "carne", [], 455, 24.0, 38.0, 2.0, 9.5, ["todo_el_año"], False, False),
    ("Salchichas", "carne", ["gluten"], 260, 12.0, 22.0, 3.0, 5.5, ["todo_el_año"], False, False),

    # Pescados y marisco
    ("Merluza", "pescado", ["pescado"], 86, 17.8, 1.3, 0.0, 12.0, ["todo_el_año"], False, False),
    ("Salmón", "pescado", ["pescado"], 208, 20.4, 13.4, 0.0, 16.0, ["todo_el_año"], False, False),
    ("Atún fresco", "pescado", ["pescado"], 144, 23.3, 4.9, 0.0, 18.0, ["verano"], False, False),
    ("Atún en lata", "pescado", ["pescado"], 128, 26.0, 2.0, 0.0, 10.0, ["todo_el_año"], False, False),
    ("Sardinas", "pescado", ["pescado"], 208, 24.6, 11.5, 0.0, 6.5, ["verano"], False, False),
    ("Gambas", "marisco", ["marisco"], 99, 20.3, 1.7, 0.2, 19.0, ["todo_el_año"], False, False),
    ("Bacalao", "pescado", ["pescado"], 82, 17.8, 0.7, 0.0, 13.5, ["todo_el_año"], False, False),
    ("Dorada", "pescado", ["pescado"], 96, 19.0, 2.0, 0.0, 14.5, ["todo_el_año"], False, False),

    # Lácteos y huevo
    ("Leche entera", "lacteo", ["lactosa"], 61, 3.2, 3.3, 4.8, 0.95, ["todo_el_año"], True, False),
    ("Leche semidesnatada", "lacteo", ["lactosa"], 46, 3.3, 1.6, 4.8, 0.95, ["todo_el_año"], True, False),
    ("Leche sin lactosa", "lacteo", [], 47, 3.3, 1.6, 4.9, 1.4, ["todo_el_año"], True, False),
    ("Bebida de avena", "lacteo", [], 46, 0.4, 1.5, 7.5, 1.9, ["todo_el_año"], True, True),
    ("Bebida de soja", "lacteo", ["soja"], 39, 3.3, 1.9, 1.5, 1.8, ["todo_el_año"], True, True),
    ("Yogur natural", "lacteo", ["lactosa"], 61, 3.5, 3.3, 4.7, 2.5, ["todo_el_año"], True, False),
    ("Yogur sin lactosa", "lacteo", [], 63, 3.5, 3.3, 5.0, 3.6, ["todo_el_año"], True, False),
    ("Queso fresco", "lacteo", ["lactosa"], 98, 11.0, 4.5, 3.5, 8.5, ["todo_el_año"], True, False),
    ("Queso curado", "lacteo", ["lactosa"], 392, 26.0, 32.0, 1.3, 18.0, ["todo_el_año"], True, False),
    ("Mantequilla", "lacteo", ["lactosa"], 717, 0.9, 81.0, 0.1, 7.5, ["todo_el_año"], True, False),
    ("Nata para cocinar", "lacteo", ["lactosa"], 292, 2.2, 30.0, 3.4, 3.0, ["todo_el_año"], True, False),
    ("Huevo", "huevo", ["huevo"], 155, 13.0, 11.0, 1.1, 3.0, ["todo_el_año"], True, False),

    # Frutos secos
    ("Almendras", "fruto_seco", ["frutos_secos"], 579, 21.2, 49.9, 21.6, 9.5, ["todo_el_año"], True, True),
    ("Nueces", "fruto_seco", ["frutos_secos"], 654, 15.2, 65.2, 13.7, 11.0, ["todo_el_año"], True, True),
    ("Avellanas", "fruto_seco", ["frutos_secos"], 628, 15.0, 60.8, 16.7, 12.0, ["todo_el_año"], True, True),
    ("Anacardos", "fruto_seco", ["frutos_secos"], 553, 18.2, 43.8, 30.2, 10.5, ["todo_el_año"], True, True),
    ("Cacahuetes", "fruto_seco", ["frutos_secos"], 567, 25.8, 49.2, 16.1, 6.0, ["todo_el_año"], True, True),
    ("Pipas de girasol", "fruto_seco", ["frutos_secos"], 584, 20.8, 51.5, 20.0, 5.5, ["todo_el_año"], True, True),

    # Grasas, especias y otros
    ("Aceite de oliva virgen extra", "grasa", [], 884, 0.0, 100.0, 0.0, 6.5, ["todo_el_año"], True, True),
    ("Aceite de girasol", "grasa", [], 884, 0.0, 100.0, 0.0, 2.2, ["todo_el_año"], True, True),
    ("Leche de coco", "grasa", [], 230, 2.3, 24.0, 3.3, 3.8, ["todo_el_año"], True, True),
    ("Azúcar", "otro", [], 387, 0.0, 0.0, 100.0, 1.1, ["todo_el_año"], True, True),
    ("Sal", "otro", [], 0, 0.0, 0.0, 0.0, 0.5, ["todo_el_año"], True, True),
    ("Pimentón picante", "otro", [], 282, 14.1, 12.0, 34.0, 12.0, ["todo_el_año"], True, True),
    ("Guindilla", "otro", [], 40, 1.9, 0.4, 8.8, 8.0, ["todo_el_año"], True, True),
    ("Especias suaves (hierbas provenzales)", "otro", [], 300, 8.0, 5.0, 55.0, 15.0, ["todo_el_año"], True, True),
    ("Miel", "otro", ["fodmap_alto"], 304, 0.3, 0.0, 82.4, 6.5, ["todo_el_año"], True, True),
    ("Chocolate negro 70%", "otro", ["lactosa"], 598, 7.8, 42.6, 45.9, 9.0, ["todo_el_año"], True, False),
    ("Pan rallado", "cereal", ["gluten"], 395, 13.0, 5.0, 72.0, 2.5, ["todo_el_año"], True, True),
]


ALIMENTOS_POR_NOMBRE: dict[str, dict] = {
    fila[0]: {
        "categoria": fila[1],
        "alergenos": fila[2],
        "kcal_100g": fila[3],
        "proteinas_100g": fila[4],
        "grasas_100g": fila[5],
        "hidratos_100g": fila[6],
        "precio_ref_kg": fila[7],
        "estacionalidad": fila[8],
        "vegetariano": fila[9],
        "vegano": fila[10],
    }
    for fila in ALIMENTOS
}


def cargar_alimentos(session) -> dict[str, int]:
    """Inserta los alimentos y devuelve un mapa nombre -> id."""
    from app.models import Alimento

    nombre_a_id: dict[str, int] = {}
    for (
        nombre,
        categoria,
        alergenos,
        kcal,
        proteinas,
        grasas,
        hidratos,
        precio_kg,
        estacionalidad,
        vegetariano,
        vegano,
    ) in ALIMENTOS:
        alimento = Alimento(
            nombre=nombre,
            categoria=categoria,
            alergenos=alergenos,
            kcal_100g=kcal,
            proteinas_100g=proteinas,
            grasas_100g=grasas,
            hidratos_100g=hidratos,
            precio_ref_kg=precio_kg,
            estacionalidad=estacionalidad,
            vegetariano=vegetariano,
            vegano=vegano,
        )
        session.add(alimento)
        session.flush()
        nombre_a_id[nombre] = alimento.id
    session.commit()
    return nombre_a_id
