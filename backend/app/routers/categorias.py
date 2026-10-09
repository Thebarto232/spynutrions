from fastapi import APIRouter, Depends, HTTPException

from app.core.errors import ProveedorError, error_detalle
from app.schemas.receta import Categoria
from app.services.deps import get_provider, get_traductor
from app.services.providers.base import RecetasProvider
from app.services.traduccion import Traductor, traducir_categorias

router = APIRouter(prefix="/api/categorias", tags=["categorias"])


@router.get("", response_model=list[Categoria])
def categorias(
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    try:
        return traducir_categorias(provider.categorias(), traductor)
    except ProveedorError:
        raise HTTPException(
            status_code=502,
            detail=error_detalle(
                "proveedor_no_disponible",
                "El proveedor de recetas no está disponible. Inténtalo de nuevo.",
            ),
        ) from None
