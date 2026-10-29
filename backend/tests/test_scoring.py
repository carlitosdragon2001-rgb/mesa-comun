from app.models import Preferencia, TipoPreferencia
from app.optimization import scoring


def _pref(codigo, tipo=TipoPreferencia.gusto, peso=1.0):
    return Preferencia(perfil_id=1, tipo=tipo, codigo=codigo, peso=peso)


def test_preferencia_vegetariana_favorece_platos_aptos(platos_por_nombre):
    tofu = platos_por_nombre["Revuelto de tofu con verduras"]
    ternera = platos_por_nombre["Filete de ternera con patatas"]
    prefs = [_pref("vegetariano")]
    assert scoring.score_preferencias(tofu, prefs) > scoring.score_preferencias(ternera, prefs)


def test_evitar_picante_penaliza_platos_picantes(platos_por_nombre):
    picante = platos_por_nombre["Wok de tofu y verduras picante"]
    prefs_neutras: list[Preferencia] = []
    prefs_evitar = [_pref("evitar_picante")]
    assert scoring.score_preferencias(picante, prefs_evitar) < scoring.score_preferencias(picante, prefs_neutras)


def test_reducir_carne_roja_penaliza_platos_con_carne_roja(platos_por_nombre):
    ternera = platos_por_nombre["Filete de ternera con patatas"]
    prefs = [_pref("reducir_carne_roja")]
    assert scoring.score_preferencias(ternera, prefs) < 3.0


def test_score_coste_favorece_lo_mas_barato(platos_por_nombre):
    barato = platos_por_nombre["Crema de calabaza"]
    caro = platos_por_nombre["Gambas al ajillo con arroz"]
    costes = [barato.coste_estimado, caro.coste_estimado]
    assert scoring.score_coste(barato, min(costes), max(costes)) > scoring.score_coste(caro, min(costes), max(costes))


def test_perdida_peso_favorece_platos_bajos_en_calorias(platos_por_nombre):
    ligero = platos_por_nombre["Gazpacho"]
    calorico = platos_por_nombre["Pizza casera integral"]
    prefs = [_pref("perdida_peso", tipo=TipoPreferencia.salud)]
    assert scoring.score_salud(ligero, prefs) > scoring.score_salud(calorico, prefs)
