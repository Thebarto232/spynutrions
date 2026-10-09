import random

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.plan import Consulta, RegenerarDia
from app.schemas.receta import Ingrediente, Receta, RecetaResumen
from app.services.deps import get_provider, get_traductor
from app.services.metabolismo import calorias_objetivo, diagnosticar, imc, tmb
from app.services.plan_semanal import admite, armar_plan, estimar_calorias, regenerar_dia
from app.services.traduccion import TraductorIdentico

CONSULTA = Consulta(
    edad=30,
    sexo="mujer",
    peso_kg=60,
    estatura_cm=165,
    actividad="moderado",
    objetivo="mantener",
    tipo_corporal="mesomorfo",
)


def _receta(identificador: str, categoria: str, ingrediente: str = "Tomato") -> Receta:
    return Receta(
        id=identificador,
        nombre=f"{categoria} {identificador}",
        imagen=None,
        categoria=categoria,
        ingredientes=[Ingrediente(nombre=ingrediente, cantidad="1 cup")],
        pasos=["Cook"],
        tiempo=None,
    )


class Catalogo:
    def __init__(self, por_categoria: dict[str, list[Receta]] | None = None):
        self.por_categoria = {
            nombre: [_receta(f"{nombre}-{indice}", nombre) for indice in range(10)]
            for nombre in ("Breakfast", "Chicken", "Seafood", "Vegetarian", "Vegan", "Beef", "Pasta", "Pork", "Lamb")
        } if por_categoria is None else por_categoria
        if por_categoria is None:
            self.por_categoria["Breakfast"][0] = _receta("desayuno-harina", "Breakfast", "Wheat flour")

    def buscar_por_nombre(self, q: str) -> list[Receta]:
        if q == "salad":
            return [_receta("ensalada-1", "Vegetarian", "Lettuce")]
        return []

    def buscar_por_ingredientes(self, ingredientes: list[str]) -> list[RecetaResumen]:
        return []

    def buscar_por_categoria(self, categoria: str) -> list[RecetaResumen]:
        return [
            RecetaResumen(id=receta.id, nombre=receta.nombre, imagen=None, categoria=categoria)
            for receta in self.por_categoria.get(categoria, [])
        ]

    def obtener(self, receta_id: str) -> Receta | None:
        for recetas in self.por_categoria.values():
            for receta in recetas:
                if receta.id == receta_id:
                    return receta
        if receta_id == "ensalada-1":
            return _receta("ensalada-1", "Vegetarian", "Lettuce")
        return None

    def aleatoria(self) -> Receta | None:
        return None

    def categorias(self):
        return []


def test_mifflin_y_imc():
    assert tmb("mujer", 60, 165, 30) == pytest.approx(1320.25)
    assert imc(60, 165) == 22.0
    diag = diagnosticar(CONSULTA)
    assert diag.tmb == 1320
    assert diag.gasto == 2046
    assert diag.calorias_objetivo == 2046
    assert diag.clasificacion_imc == "en el rango habitual"
    assert diag.macros.proteina_pct + diag.macros.carbohidratos_pct + diag.macros.grasa_pct == 100
    assert "no reemplaza" in diag.aviso
    assert "guía general" in diag.nota_tipo_corporal


def test_deficit_tiene_piso_y_no_aplica_con_imc_bajo():
    assert calorias_objetivo(2000, "bajar_grasa", "mujer", 22) == 1700
    assert calorias_objetivo(1500, "bajar_grasa", "mujer", 22) == 1400
    assert calorias_objetivo(1800, "bajar_grasa", "mujer", 17) == 1800


def test_filtra_carne_gluten_y_alergia():
    consulta = CONSULTA.model_copy(update={"vegetariano": True, "sin_gluten": True, "alergias": "nuez"})
    pollo = _receta("1", "Chicken", "Chicken breast")
    harina = _receta("2", "Pasta", "Wheat flour")
    nuez = _receta("3", "Vegetarian", "Walnut")
    ok = _receta("4", "Vegetarian", "Tomato")
    assert admite(pollo, consulta, set()) is False
    assert admite(harina, consulta, set()) is False
    assert admite(nuez, consulta, {"walnut", "nuez"}) is False
    assert admite(ok, consulta, {"walnut"}) is True


def test_estima_calorias_por_categoria():
    assert estimar_calorias(_receta("1", "Chicken")) == 480 


def test_semana_no_repite_recetas():
    plan = armar_plan(CONSULTA, Catalogo(), TraductorIdentico(), random.Random(1))
    ids = [comida.receta.id for dia in plan.dias for comida in dia.comidas]
    assert len(plan.dias) == 7
    assert len(ids) == 21
    assert len(set(ids)) == 21
    almuerzos = {
        comida.receta.categoria
        for dia in plan.dias
        for comida in dia.comidas
        if comida.momento == "almuerzo"
    }
    assert len(almuerzos) > 1
    assert all(comida.nota_calorias.startswith("Estimación") for dia in plan.dias for comida in dia.comidas)
    assert plan.compras


def test_vegetariano_sin_gluten_evita_harina_y_carne():
    consulta = CONSULTA.model_copy(update={"vegetariano": True, "sin_gluten": True, "objetivo": "bajar_grasa"})
    plan = armar_plan(consulta, Catalogo(), TraductorIdentico(), random.Random(2))
    for dia in plan.dias:
        for comida in dia.comidas:
            nombres = " ".join(item.nombre for item in comida.receta.ingredientes).casefold()
            assert "chicken" not in nombres
            assert "flour" not in nombres


def test_regenerar_dia_no_repite_el_resto():
    plan = armar_plan(CONSULTA, Catalogo(), TraductorIdentico(), random.Random(3))
    otros = [comida.receta.id for dia in plan.dias[1:] for comida in dia.comidas]
    nuevo = regenerar_dia(
        RegenerarDia(consulta=CONSULTA, dia="lunes", excluir_ids=otros),
        Catalogo(),
        TraductorIdentico(),
        random.Random(4),
    )
    nuevos_ids = {comida.receta.id for comida in nuevo.comidas}
    assert nuevos_ids.isdisjoint(otros)
    assert len(nuevo.comidas) == 3


def test_endpoint_plan():
    app.dependency_overrides[get_provider] = lambda: Catalogo()
    app.dependency_overrides[get_traductor] = lambda: TraductorIdentico()
    with TestClient(app) as client:
        response = client.post("/api/plan", json=CONSULTA.model_dump())
    app.dependency_overrides.clear()
    assert response.status_code == 200
    cuerpo = response.json()
    assert cuerpo["diagnostico"]["aviso"].startswith("Esta herramienta es informativa")
    assert len(cuerpo["dias"]) == 7
    assert cuerpo["dias"][0]["comidas"][0]["receta"]["categoria"] == "Desayuno"


def test_endpoint_sin_recetas():
    vacio = Catalogo(por_categoria={})
    app.dependency_overrides[get_provider] = lambda: vacio
    app.dependency_overrides[get_traductor] = lambda: TraductorIdentico()
    with TestClient(app) as client:
        response = client.post("/api/plan", json=CONSULTA.model_dump())
    app.dependency_overrides.clear()
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "plan_sin_recetas"
