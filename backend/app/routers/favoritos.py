from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.core.db import get_session
from app.core.errors import FavoritoYaExiste, ProveedorError, error_detalle
from app.schemas.receta import Favorito, FavoritoCrear
from app.services.deps import get_provider, get_traductor
from app.services.favoritos import eliminar, guardar, listar
from app.services.providers.base import RecetasProvider
from app.services.traduccion import Traductor, traducir_favorito

router = APIRouter(prefix="/api/favoritos", tags=["favoritos"])


@router.get("", response_model=list[Favorito])
def obtener_favoritos(
    session: Session = Depends(get_session),
    traductor: Traductor = Depends(get_traductor),
):
    return [traducir_favorito(favorito, traductor) for favorito in listar(session)]


@router.post("", response_model=Favorito, status_code=201)
def crear_favorito(
    body: FavoritoCrear,
    session: Session = Depends(get_session),
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    try:
        receta = provider.obtener(body.id)
    except ProveedorError:
        raise HTTPException(
            status_code=502,
            detail=error_detalle(
                "proveedor_no_disponible",
                "El proveedor de recetas no está disponible. Inténtalo de nuevo.",
            ),
        ) from None
    if receta is None:
        raise HTTPException(
            status_code=404,
            detail=error_detalle("receta_no_encontrada", "No encontramos esa receta."),
        )
    try:
        return traducir_favorito(guardar(session, receta), traductor)
    except FavoritoYaExiste:
        raise HTTPException(
            status_code=409,
            detail=error_detalle("favorito_ya_existe", "Esa receta ya está en favoritos."),
        ) from None


@router.delete("/{favorito_id}", status_code=204)
def quitar_favorito(favorito_id: int, session: Session = Depends(get_session)):
    if not eliminar(session, favorito_id):
        raise HTTPException(
            status_code=404,
            detail=error_detalle("favorito_no_encontrado", "Ese favorito no existe."),
        )
    return Response(status_code=204)
