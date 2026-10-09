from fastapi import APIRouter, Depends, HTTPException

from app.core.errors import ProveedorError, error_detalle
from app.schemas.plan import Consulta, DiaPlan, PlanSemanal, RegenerarDia
from app.services.deps import get_provider, get_traductor
from app.services.plan_semanal import armar_plan, regenerar_dia
from app.services.providers.base import RecetasProvider
from app.services.traduccion import Traductor

router = APIRouter(prefix="/api/plan", tags=["plan"])


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
    except LookupError:
        raise HTTPException(
            status_code=404,
            detail=error_detalle(
                "plan_sin_recetas",
                "No hay suficientes recetas con esas restricciones. Prueba a quitar alguna.",
            ),
        ) from None


@router.post("", response_model=PlanSemanal)
def crear_plan(
    consulta: Consulta,
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    return _llamar(lambda: armar_plan(consulta, provider, traductor))


@router.post("/dia", response_model=DiaPlan)
def cambiar_dia(
    pedido: RegenerarDia,
    provider: RecetasProvider = Depends(get_provider),
    traductor: Traductor = Depends(get_traductor),
):
    return _llamar(lambda: regenerar_dia(pedido, provider, traductor))
