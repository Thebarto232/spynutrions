import pytest
from sqlalchemy.orm import Session

from app.core.db import engine
from app.core.errors import FavoritoYaExiste
from app.models.base import Base
from app.models.favorito import FavoritoModel
from app.schemas.receta import Receta
from app.services.favoritos import eliminar, guardar, listar

RECETA = Receta(
    id="test-52772",
    nombre="Prueba",
    imagen=None,
    categoria="Chicken",
    ingredientes=[],
    pasos=["Hervir"],
    tiempo=None,
)


@pytest.fixture
def session():
    Base.metadata.create_all(engine)
    connection = engine.connect()
    transaction = connection.begin()
    db = Session(bind=connection, join_transaction_mode="create_savepoint")
    yield db
    db.close()
    transaction.rollback()
    connection.close()


def test_no_duplica_y_listar_no_depende_del_proveedor(session: Session):
    guardado = guardar(session, RECETA)
    assert guardado.id > 0
    with pytest.raises(FavoritoYaExiste):
        guardar(session, RECETA)
    assert [item.receta.id for item in listar(session)] == ["test-52772"]


def test_eliminar_desconocido(session: Session):
    assert eliminar(session, 999999) is False
    fila = session.get(FavoritoModel, 999999)
    assert fila is None
