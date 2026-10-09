import pytest
from fastapi.testclient import TestClient

from app.core.errors import ProveedorError
from app.main import app
from app.schemas.receta import Categoria, Receta, RecetaResumen
from app.services.deps import get_provider, get_traductor
from app.services.traduccion import TraductorIdentico

RECETA = Receta(
    id="52772",
    nombre="Teriyaki",
    imagen="https://example.test/chicken.jpg",
    categoria="Chicken",
    ingredientes=[],
    pasos=["Hervir"],
    tiempo=None,
)


class FalsoProveedor:
    def __init__(self, falla: bool = False, vacia: bool = False):
        self.falla = falla
        self.vacia = vacia

    def buscar_por_nombre(self, q: str) -> list[Receta]:
        if self.falla:
            raise ProveedorError
        return [RECETA]

    def buscar_por_ingredientes(self, ingredientes: list[str]) -> list[RecetaResumen]:
        return [RecetaResumen(id="2", nombre="B", imagen="b", categoria=None)]

    def buscar_por_categoria(self, categoria: str) -> list[RecetaResumen]:
        return [RecetaResumen(id="3", nombre="C", imagen="c", categoria=categoria)]

    def obtener(self, receta_id: str) -> Receta | None:
        if receta_id == "52772":
            return RECETA
        return None

    def aleatoria(self) -> Receta | None:
        if self.vacia:
            return None
        return RECETA

    def categorias(self) -> list[Categoria]:
        return [Categoria(nombre="Chicken", imagen=None, descripcion="Aves")]


@pytest.fixture
def client():
    app.dependency_overrides[get_provider] = lambda: FalsoProveedor()
    app.dependency_overrides[get_traductor] = lambda: TraductorIdentico()
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_buscar_por_nombre(client: TestClient):
    response = client.get("/api/recetas/buscar", params={"q": "Arrabiata"})
    assert response.status_code == 200
    assert response.json()[0]["id"] == "52772"
    assert response.json()[0]["tiempo"] is None


def test_buscar_sin_texto(client: TestClient):
    response = client.get("/api/recetas/buscar", params={"q": "  "})
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "consulta_invalida"


def test_buscar_por_ingredientes(client: TestClient):
    response = client.get("/api/recetas/ingredientes", params={"i": "chicken,tomato"})
    assert response.status_code == 200
    assert response.json()[0]["id"] == "2"


def test_por_categoria(client: TestClient):
    response = client.get("/api/recetas/categoria", params={"c": "Chicken"})
    assert response.status_code == 200
    assert response.json()[0]["id"] == "3"
    assert response.json()[0]["categoria"] == "Pollo"


def test_categoria_vacia(client: TestClient):
    response = client.get("/api/recetas/categoria", params={"c": ""})
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "consulta_invalida"


def test_ingredientes_vacios(client: TestClient):
    response = client.get("/api/recetas/ingredientes", params={"i": ""})
    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "consulta_invalida"


def test_detalle(client: TestClient):
    response = client.get("/api/recetas/52772")
    assert response.status_code == 200
    assert response.json()["nombre"] == "Teriyaki"


def test_detalle_ausente(client: TestClient):
    response = client.get("/api/recetas/0")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "receta_no_encontrada"


def test_aleatoria(client: TestClient):
    response = client.get("/api/recetas/aleatoria")
    assert response.status_code == 200
    assert response.json()["id"] == "52772"


def test_aleatoria_sin_resultado():
    app.dependency_overrides[get_provider] = lambda: FalsoProveedor(vacia=True)
    with TestClient(app) as client:
        response = client.get("/api/recetas/aleatoria")
    app.dependency_overrides.clear()
    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "proveedor_no_disponible"


def test_categorias(client: TestClient):
    response = client.get("/api/categorias")
    assert response.status_code == 200
    assert response.json()[0]["nombre"] == "Chicken"


def test_proveedor_caido():
    app.dependency_overrides[get_provider] = lambda: FalsoProveedor(falla=True)
    with TestClient(app) as client:
        response = client.get("/api/recetas/buscar", params={"q": "arroz"})
    app.dependency_overrides.clear()
    assert response.status_code == 502
    assert response.json()["detail"]["code"] == "proveedor_no_disponible"
