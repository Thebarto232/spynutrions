import httpx

from app.schemas.receta import Categoria, Favorito, Receta, RecetaResumen

_URL = "https://translate.googleapis.com/translate_a/t"

CATEGORIAS_ES = {
    "Beef": "Carne de res",
    "Breakfast": "Desayuno",
    "Chicken": "Pollo",
    "Dessert": "Postre",
    "Goat": "Cabra",
    "Lamb": "Cordero",
    "Miscellaneous": "Otras",
    "Pasta": "Pasta",
    "Pork": "Cerdo",
    "Seafood": "Mariscos",
    "Side": "Acompañamientos",
    "Starter": "Entrantes",
    "Vegan": "Vegano",
    "Vegetarian": "Vegetariana",
}


def etiqueta_categoria(nombre: str | None) -> str | None:
    if not nombre:
        return None
    return CATEGORIAS_ES.get(nombre, nombre)


def clave_categoria(texto: str) -> str:
    limpio = texto.strip()
    for clave, etiqueta in CATEGORIAS_ES.items():
        if limpio.casefold() in {clave.casefold(), etiqueta.casefold()}:
            return clave
    return limpio


class Traductor:
    def __init__(self, client: httpx.Client):
        self._client = client
        self._cache: dict[tuple[str, str, str], str] = {}

    def lote(self, textos: list[str], origen: str, destino: str) -> list[str]:
        resultado = list(textos)
        pendientes_idx: list[int] = []
        pendientes: list[str] = []
        for indice, texto in enumerate(textos):
            if not texto.strip():
                continue
            clave = (origen, destino, texto)
            if clave in self._cache:
                resultado[indice] = self._cache[clave]
            else:
                pendientes_idx.append(indice)
                pendientes.append(texto)
        if not pendientes:
            return resultado
        try:
            response = self._client.post(
                _URL,
                params={"client": "gtx", "sl": origen, "tl": destino, "dt": "t"},
                data={"q": pendientes},
            )
            response.raise_for_status()
            data = response.json()
        except (httpx.HTTPError, ValueError):
            return resultado
        if isinstance(data, str):
            data = [data]
        if not isinstance(data, list) or len(data) != len(pendientes):
            return resultado
        for indice, traducido in zip(pendientes_idx, data, strict=True):
            if not isinstance(traducido, str) or not traducido.strip():
                continue
            self._cache[(origen, destino, textos[indice])] = traducido
            resultado[indice] = traducido
        return resultado


class TraductorIdentico:
    def lote(self, textos: list[str], origen: str, destino: str) -> list[str]:
        return list(textos)


def a_ingles(texto: str, traductor: Traductor | TraductorIdentico) -> str:
    return traductor.lote([texto], "es", "en")[0]


def traducir_recetas(recetas: list[Receta], traductor: Traductor | TraductorIdentico) -> list[Receta]:
    if not recetas:
        return []
    planos: list[str] = []
    for receta in recetas:
        planos.extend(_campos_receta(receta))
    traducidos = traductor.lote(planos, "en", "es")
    salida: list[Receta] = []
    cursor = 0
    for receta in recetas:
        cantidad = 1 + len(receta.ingredientes) * 2 + len(receta.pasos)
        salida.append(_armar_receta(receta, traducidos[cursor : cursor + cantidad]))
        cursor += cantidad
    return salida


def traducir_resumenes(
    recetas: list[RecetaResumen],
    traductor: Traductor | TraductorIdentico,
) -> list[RecetaResumen]:
    if not recetas:
        return []
    nombres = traductor.lote([receta.nombre for receta in recetas], "en", "es")
    return [
        receta.model_copy(update={"nombre": nombres[indice], "categoria": etiqueta_categoria(receta.categoria)})
        for indice, receta in enumerate(recetas)
    ]


def traducir_categorias(
    categorias: list[Categoria],
    traductor: Traductor | TraductorIdentico,
) -> list[Categoria]:
    del traductor
    return [
        item.model_copy(update={"etiqueta": etiqueta_categoria(item.nombre) or item.nombre})
        for item in categorias
    ]


def traducir_favorito(favorito: Favorito, traductor: Traductor | TraductorIdentico) -> Favorito:
    receta = traducir_recetas([favorito.receta], traductor)[0]
    return favorito.model_copy(update={"receta": receta})


def _campos_receta(receta: Receta) -> list[str]:
    campos = [receta.nombre]
    for ingrediente in receta.ingredientes:
        campos.append(ingrediente.nombre)
        campos.append(ingrediente.cantidad)
    campos.extend(receta.pasos)
    return campos


def _armar_receta(receta: Receta, campos: list[str]) -> Receta:
    nombre = campos[0]
    ingredientes = []
    cursor = 1
    for ingrediente in receta.ingredientes:
        ingredientes.append(ingrediente.model_copy(update={"nombre": campos[cursor], "cantidad": campos[cursor + 1]}))
        cursor += 2
    pasos = campos[cursor:]
    return receta.model_copy(
        update={
            "nombre": nombre,
            "categoria": etiqueta_categoria(receta.categoria),
            "ingredientes": ingredientes,
            "pasos": pasos,
        }
    )
