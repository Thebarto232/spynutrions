from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.errors import FavoritoYaExiste
from app.models.favorito import FavoritoModel
from app.schemas.receta import Favorito, Receta

PROVEEDOR = "themealdb"


def guardar(session: Session, receta: Receta) -> Favorito:
    existente = session.scalar(
        select(FavoritoModel).where(
            FavoritoModel.proveedor == PROVEEDOR,
            FavoritoModel.id_externo == receta.id,
        )
    )
    if existente:
        raise FavoritoYaExiste
    fila = FavoritoModel(proveedor=PROVEEDOR, id_externo=receta.id, receta=receta.model_dump())
    session.add(fila)
    session.flush()
    session.refresh(fila)
    return Favorito(id=fila.id, receta=receta)


def listar(session: Session) -> list[Favorito]:
    filas = session.scalars(select(FavoritoModel).order_by(FavoritoModel.creado_en.desc())).all()
    return [Favorito(id=fila.id, receta=Receta.model_validate(fila.receta)) for fila in filas]


def eliminar(session: Session, favorito_id: int) -> bool:
    fila = session.get(FavoritoModel, favorito_id)
    if fila is None:
        return False
    session.delete(fila)
    session.flush()
    return True
