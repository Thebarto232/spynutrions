import httpx

from app.core.errors import ProveedorError
from app.schemas.receta import Categoria, Ingrediente, Receta, RecetaResumen
from app.services.pasos import separar_pasos


class TheMealDBProvider:
    def __init__(self, base_url: str, client: httpx.Client):
        self.base_url = base_url.rstrip("/")
        self.client = client

    def buscar_por_nombre(self, q: str) -> list[Receta]:
        meals = self._meals("search.php", {"s": q})
        return [mapear_receta(meal) for meal in meals]

    def buscar_por_ingredientes(self, ingredientes: list[str]) -> list[RecetaResumen]:
        listas: list[list[RecetaResumen]] = []
        for ingrediente in ingredientes:
            nombre = ingrediente.strip()
            if not nombre:
                continue
            meals = self._meals("filter.php", {"i": nombre})
            listas.append([mapear_resumen(meal) for meal in meals])
        if not listas:
            return []
        comunes = set.intersection(*( {item.id for item in lista} for lista in listas ))
        return [item for item in listas[0] if item.id in comunes]

    def buscar_por_categoria(self, categoria: str) -> list[RecetaResumen]:
        meals = self._meals("filter.php", {"c": categoria})
        resumenes: list[RecetaResumen] = []
        for meal in meals:
            resumen = mapear_resumen(meal)
            resumenes.append(resumen.model_copy(update={"categoria": categoria}))
        return resumenes

    def obtener(self, receta_id: str) -> Receta | None:
        meals = self._meals("lookup.php", {"i": receta_id})
        if not meals:
            return None
        return mapear_receta(meals[0])

    def aleatoria(self) -> Receta | None:
        meals = self._meals("random.php", {})
        if not meals:
            return None
        return mapear_receta(meals[0])

    def categorias(self) -> list[Categoria]:
        data = self._get("categories.php", {})
        categorias = data.get("categories") or []
        return [
            Categoria(
                nombre=item.get("strCategory") or "",
                imagen=item.get("strCategoryThumb"),
                descripcion=item.get("strCategoryDescription"),
            )
            for item in categorias
        ]

    def _meals(self, path: str, params: dict[str, str]) -> list[dict]:
        data = self._get(path, params)
        meals = data.get("meals") or []
        return meals

    def _get(self, path: str, params: dict[str, str]) -> dict:
        try:
            response = self.client.get(f"{self.base_url}/{path}", params=params)
        except httpx.HTTPError as exc:
            raise ProveedorError("No se pudo contactar a TheMealDB") from exc
        if response.status_code >= 400:
            raise ProveedorError("TheMealDB respondió con error")
        try:
            data = response.json()
        except ValueError as exc:
            raise ProveedorError("TheMealDB devolvió una respuesta ilegible") from exc
        if not isinstance(data, dict):
            raise ProveedorError("TheMealDB devolvió una respuesta ilegible")
        return data


def mapear_resumen(meal: dict) -> RecetaResumen:
    return RecetaResumen(
        id=str(meal.get("idMeal") or ""),
        nombre=meal.get("strMeal") or "",
        imagen=meal.get("strMealThumb"),
        categoria=meal.get("strCategory"),
    )


def mapear_receta(meal: dict) -> Receta:
    ingredientes: list[Ingrediente] = []
    for indice in range(1, 21):
        nombre = (meal.get(f"strIngredient{indice}") or "").strip()
        cantidad = (meal.get(f"strMeasure{indice}") or "").strip()
        if nombre:
            ingredientes.append(Ingrediente(nombre=nombre, cantidad=cantidad))
    return Receta(
        id=str(meal.get("idMeal") or ""),
        nombre=meal.get("strMeal") or "",
        imagen=meal.get("strMealThumb"),
        categoria=meal.get("strCategory"),
        ingredientes=ingredientes,
        pasos=separar_pasos(meal.get("strInstructions")),
        tiempo=None,
    )
