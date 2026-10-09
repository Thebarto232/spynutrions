from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.errors import ProveedorError, error_detalle
from app.schemas.receta import Receta, RecetaResumen
from app.services.deps import get_provider, get_traductor
from app.services.providers.base import RecetasProvider
from app.services.traduccion import Traductor, a_ingles, clave_categoria, traducir_recetas, traducir_resumenes

router = APIRouter(prefix="/api/recetas", tags=["recetas"])


def _llamar(fn):
    try:
        return fn()
    except ProveedorError:
        raise HTTPException(
            status_code=502,
            detail=error_detalle(
                "proveedor_no_disponible",
                "El proveedor de recetas no está disponible. Inténtalo de nuevo.",
            ),
        ) from None


@router.get("/buscar", response_model=list[Receta])
def buscar(
    q: str = Query(default=""),
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    if not q.strip():
        raise HTTPException(
            status_code=422,
            detail=error_detalle("consulta_invalida", "Escribe un nombre para buscar."),
        )
    consulta = a_ingles(q.strip(), traductor)
    recetas = _llamar(lambda: provider.buscar_por_nombre(consulta))
    return traducir_recetas(recetas, traductor)


@router.get("/ingredientes", response_model=list[RecetaResumen])
def por_ingredientes(
    i: str = Query(default=""),
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    ingredientes = [parte.strip() for parte in i.split(",") if parte.strip()]
    if not ingredientes:
        raise HTTPException(
            status_code=422,
            detail=error_detalle("consulta_invalida", "Escribe al menos un ingrediente."),
        )
    en_ingles = [a_ingles(nombre, traductor).replace(" ", "_") for nombre in ingredientes]
    resumenes = _llamar(lambda: provider.buscar_por_ingredientes(en_ingles))
    return traducir_resumenes(resumenes, traductor)


@router.get("/categoria", response_model=list[RecetaResumen])
def por_categoria(
    c: str = Query(default=""),
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    if not c.strip():
        raise HTTPException(
            status_code=422,
            detail=error_detalle("consulta_invalida", "Elige una categoría."),
        )
    resumenes = _llamar(lambda: provider.buscar_por_categoria(clave_categoria(c)))
    return traducir_resumenes(resumenes, traductor)


@router.get("/aleatoria", response_model=Receta)
def aleatoria(
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    receta = _llamar(provider.aleatoria)
    if receta is None:
        raise HTTPException(
            status_code=502,
            detail=error_detalle(
                "proveedor_no_disponible",
                "El proveedor de recetas no está disponible. Inténtalo de nuevo.",
            ),
        )
    return traducir_recetas([receta], traductor)[0]


@router.get("/{receta_id}", response_model=Receta)
def detalle(
    receta_id: str,
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    receta = _llamar(lambda: provider.obtener(receta_id))
    if receta is None:
        raise HTTPException(
            status_code=404,
            detail=error_detalle("receta_no_encontrada", "No encontramos esa receta."),
        )
    return traducir_recetas([receta], traductor)[0]
