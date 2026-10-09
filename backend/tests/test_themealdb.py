import httpx
import pytest

from app.core.errors import ProveedorError
from app.schemas.receta import Ingrediente
from app.services.providers.cache import ProviderCache
from app.services.providers.themealdb import TheMealDBProvider

MEAL = {
    "idMeal": "52772",
    "strMeal": "Teriyaki Chicken Casserole",
    "strCategory": "Chicken",
    "strMealThumb": "https://example.test/chicken.jpg",
    "strInstructions": "1. Hervir el arroz\n2. Servir caliente",
    "strIngredient1": "soy sauce",
    "strMeasure1": "3/4 cup",
    "strIngredient2": "water",
    "strMeasure2": "1 cup",
    "strIngredient3": " ",
    "strMeasure3": " ",
}

BASE = "https://meal.test/api/json/v1/1"


def proveedor(handler) -> ProviderCache:
    cliente = httpx.Client(transport=httpx.MockTransport(handler))
    return ProviderCache(TheMealDBProvider(BASE, cliente), ttl_seconds=60)


def test_lookup_normaliza_y_cachea():
    requests: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(str(request.url))
        return httpx.Response(200, json={"meals": [MEAL]})

    provider = proveedor(handler)
    primera = provider.obtener("52772")
    segunda = provider.obtener("52772")

    assert primera == segunda
    assert len(requests) == 1
    assert primera.tiempo is None
    assert primera.pasos == ["Hervir el arroz", "Servir caliente"]
    assert primera.ingredientes[0] == Ingrediente(nombre="soy sauce", cantidad="3/4 cup")
    assert len(primera.ingredientes) == 2


def test_ingredientes_intersectan():
    def handler(request: httpx.Request) -> httpx.Response:
        ingrediente = request.url.params["i"]
        if ingrediente == "chicken":
            meals = [
                {"idMeal": "1", "strMeal": "A", "strMealThumb": "a"},
                {"idMeal": "2", "strMeal": "B", "strMealThumb": "b"},
            ]
        elif ingrediente == "tomato":
            meals = [{"idMeal": "2", "strMeal": "B", "strMealThumb": "b"}]
        else:
            meals = None
        return httpx.Response(200, json={"meals": meals})

    provider = proveedor(handler)
    resultado = provider.buscar_por_ingredientes(["chicken", "tomato"])
    vacio = provider.buscar_por_ingredientes(["chicken", "nada"])

    assert [item.id for item in resultado] == ["2"]
    assert resultado[0].categoria is None
    assert vacio == []


def test_error_de_proveedor_no_se_disfraza_de_lista_vacia():
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, json={"meals": None})

    provider = proveedor(handler)
    with pytest.raises(ProveedorError):
        provider.buscar_por_nombre("arroz")
