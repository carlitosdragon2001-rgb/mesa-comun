from app.models import Perfil, Restriccion, TipoComida, TipoRestriccion
from app.optimization import filtering


def _perfil(id_, **kwargs):
    return Perfil(id=id_, organizacion_id=1, nombre=f"P{id_}", rol="adulto", edad=30, **kwargs)


def test_codigos_prohibidos_agrega_restricciones_de_todos_los_perfiles_activos():
    perfiles = [_perfil(1), _perfil(2)]
    restricciones = [
        Restriccion(perfil_id=1, tipo=TipoRestriccion.intolerancia, codigo="lactosa"),
        Restriccion(perfil_id=2, tipo=TipoRestriccion.alergia, codigo="frutos_secos"),
    ]
    assert filtering.codigos_prohibidos(perfiles, restricciones) == {"lactosa", "frutos_secos"}


def test_textura_no_filtra_platos():
    perfiles = [_perfil(1)]
    restricciones = [Restriccion(perfil_id=1, tipo=TipoRestriccion.textura, codigo="triturado")]
    assert filtering.codigos_prohibidos(perfiles, restricciones) == set()


def test_perfil_excluido_no_aporta_restricciones():
    perfiles = [_perfil(1, excluido_de_planificacion=True)]
    restricciones = [Restriccion(perfil_id=1, tipo=TipoRestriccion.alergia, codigo="gluten")]
    assert filtering.codigos_prohibidos(perfiles, restricciones) == set()


def test_filtrar_candidatos_excluye_lasana_por_lactosa_y_ensalada_por_frutos_secos(platos_por_nombre):
    platos = list(platos_por_nombre.values())
    prohibidos = {"lactosa", "frutos_secos"}
    candidatos = filtering.filtrar_candidatos(platos, TipoComida.cena, prohibidos)
    nombres = {p.nombre for p in candidatos}
    assert "Lasaña de carne con bechamel" not in nombres  # excluida: contiene lactosa
    assert "Ensalada templada de pollo con nueces" not in nombres  # excluida: contiene frutos secos y no es cena
    assert "Curry de garbanzos con leche de coco y arroz" in nombres
    assert "Revuelto de tofu con verduras" in nombres
    assert "Hamburguesas de lentejas con guarnición de verduras" in nombres


def test_filtrar_candidatos_caso_celiaquia_y_sibo(platos_por_nombre):
    platos = list(platos_por_nombre.values())
    prohibidos = {"gluten", "fodmap_alto"}
    candidatos = filtering.filtrar_candidatos(platos, TipoComida.cena, prohibidos)
    nombres = {p.nombre for p in candidatos}
    assert "Curry de garbanzos con leche de coco y arroz" not in nombres  # fodmap (garbanzos)
    assert "Revuelto de huevo con espinacas y queso" in nombres
