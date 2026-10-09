from functools import lru_cache

import httpx

from app.core.config import get_settings
from app.services.providers.base import RecetasProvider
from app.services.providers.cache import ProviderCache
from app.services.providers.themealdb import TheMealDBProvider
from app.services.traduccion import Traductor


@lru_cache
def get_provider() -> RecetasProvider:
    settings = get_settings()
    if not settings.mealdb_api_key:
        raise RuntimeError("MEALDB_API_KEY es obligatoria")
    cliente = httpx.Client(timeout=10.0)
    proveedor = TheMealDBProvider(settings.mealdb_base_url, cliente)
    return ProviderCache(proveedor, settings.cache_ttl_seconds)


@lru_cache
def get_traductor() -> Traductor:
    return Traductor(httpx.Client(timeout=8.0))
