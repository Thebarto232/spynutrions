import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.db import engine, get_session
from app.core.errors import ProveedorError
from app.main import app
from app.models.base import Base
from app.schemas.receta import Receta
from app.services.deps import get_provider, get_traductor
from app.services.traduccion import TraductorIdentico

RECETA = Receta(
    id="fav-1",
    nombre="Sopa",
    imagen=None,
    categoria=None,
    ingredientes=[],
    pasos=["Cocer"],
    tiempo=None,
)


class FalsoProveedor:
    def __init__(self, falla_listar: bool = False):
        self.falla_listar = falla_listar

    def obtener(self, receta_id: str) -> Receta | None:
        if self.falla_listar:
            raise ProveedorError
        if receta_id == "fav-1":
            return RECETA
        return None

    def buscar_por_nombre(self, q: str):
        raise ProveedorError

    def buscar_por_ingredientes(self, ingredientes: list[str]):
        return []

    def aleatoria(self):
        return None

    def categorias(self):
        return []


@pytest.fixture
def client():
    Base.metadata.create_all(engine)
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")

    def override_session():
        yield session

    app.dependency_overrides[get_session] = override_session
    app.dependency_overrides[get_provider] = lambda: FalsoProveedor()
    app.dependency_overrides[get_traductor] = lambda: TraductorIdentico()
    with TestClient(app) as test_client:
        yield test_client
    session.close()
    transaction.rollback()
    connection.close()
    app.dependency_overrides.clear()


def test_guardar_listar_y_repetir(client: TestClient):
    creado = client.post("/api/favoritos", json={"id": "fav-1"})
    assert creado.status_code == 201
    favorito_id = creado.json()["id"]
    assert creado.json()["receta"]["nombre"] == "Sopa"

    repetido = client.post("/api/favoritos", json={"id": "fav-1"})
    assert repetido.status_code == 409
    assert repetido.json()["detail"]["code"] == "favorito_ya_existe"

    app.dependency_overrides[get_provider] = lambda: FalsoProveedor(falla_listar=True)
    lista = client.get("/api/favoritos")
    assert lista.status_code == 200
    assert lista.json()[0]["receta"]["id"] == "fav-1"

    borrado = client.delete(f"/api/favoritos/{favorito_id}")
    assert borrado.status_code == 204


def test_receta_inexistente(client: TestClient):
    response = client.post("/api/favoritos", json={"id": "no-existe"})
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "receta_no_encontrada"


def test_borrar_desconocido(client: TestClient):
    response = client.delete("/api/favoritos/999999")
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "favorito_no_encontrado"
