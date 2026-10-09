import time
from collections.abc import Callable

from app.schemas.receta import Categoria, Receta, RecetaResumen
from app.services.providers.base import RecetasProvider


class ProviderCache:
    def __init__(self, inner: RecetasProvider, ttl_seconds: int):
        self.inner = inner
        self.ttl_seconds = ttl_seconds
        self._store: dict[tuple, tuple[float, object]] = {}

    def buscar_por_nombre(self, q: str) -> list[Receta]:
        return self._cached(("buscar_por_nombre", q), lambda: self.inner.buscar_por_nombre(q))

    def buscar_por_ingredientes(self, ingredientes: list[str]) -> list[RecetaResumen]:
        clave = ("buscar_por_ingredientes", tuple(ingredientes))
        return self._cached(clave, lambda: self.inner.buscar_por_ingredientes(ingredientes))

    def buscar_por_categoria(self, categoria: str) -> list[RecetaResumen]:
        return self._cached(("buscar_por_categoria", categoria), lambda: self.inner.buscar_por_categoria(categoria))

    def obtener(self, receta_id: str) -> Receta | None:
        return self._cached(("obtener", receta_id), lambda: self.inner.obtener(receta_id))

    def aleatoria(self) -> Receta | None:
        return self.inner.aleatoria()

    def categorias(self) -> list[Categoria]:
        return self._cached(("categorias",), lambda: self.inner.categorias())

    def _cached(self, key: tuple, fn: Callable):
        ahora = time.monotonic()
        guardado = self._store.get(key)
        if guardado and ahora - guardado[0] < self.ttl_seconds:
            return guardado[1]
        valor = fn()
        self._store[key] = (ahora, valor)
        return valor
