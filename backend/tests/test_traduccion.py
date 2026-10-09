import httpx

from app.schemas.receta import Ingrediente, Receta
from app.services.traduccion import Traductor, traducir_recetas


class _Marca:
    def lote(self, textos: list[str], origen: str, destino: str) -> list[str]:
        return [f"{destino}:{texto}" if texto else texto for texto in textos]


def test_traduce_nombre_categoria_ingredientes_y_pasos():
    receta = Receta(
        id="1",
        nombre="Chicken",
        imagen=None,
        categoria="Beef",
        ingredientes=[Ingrediente(nombre="soy sauce", cantidad="1 cup")],
        pasos=["Boil the water"],
        tiempo=None,
    )
    salida = traducir_recetas([receta], _Marca())[0]
    assert salida.nombre == "es:Chicken"
    assert salida.categoria == "Carne de res"
    assert salida.ingredientes[0].nombre == "es:soy sauce"
    assert salida.ingredientes[0].cantidad == "es:1 cup"
    assert salida.pasos == ["es:Boil the water"]


def test_categoria_vacia_sigue_vacia():
    receta = Receta(id="1", nombre="A", imagen=None, categoria=None, ingredientes=[], pasos=[], tiempo=None)
    salida = traducir_recetas([receta], _Marca())[0]
    assert salida.categoria is None


def test_si_el_traductor_falla_deja_el_ingles():
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(500)

    traductor = Traductor(httpx.Client(transport=httpx.MockTransport(handler)))
    assert traductor.lote(["Chicken"], "en", "es") == ["Chicken"]


def test_lote_cachea():
    llamadas: list[int] = []

    def handler(_request: httpx.Request) -> httpx.Response:
        llamadas.append(1)
        return httpx.Response(200, json=["Pollo"])

    traductor = Traductor(httpx.Client(transport=httpx.MockTransport(handler)))
    assert traductor.lote(["Chicken"], "en", "es") == ["Pollo"]
    assert traductor.lote(["Chicken"], "en", "es") == ["Pollo"]
    assert llamadas == [1]
