"""Arma la semana con TheMealDB. El caché del proveedor evita repetir las mismas peticiones."""

import random
import re

from app.schemas.plan import (
    Comida,
    Compra,
    Consulta,
    Dia,
    DiaPlan,
    Momento,
    PlanSemanal,
    RegenerarDia,
)
from app.schemas.receta import Receta, RecetaResumen
from app.services.metabolismo import diagnosticar
from app.services.providers.base import RecetasProvider
from app.services.traduccion import Traductor, TraductorIdentico, traducir_recetas

DIAS: tuple[Dia, ...] = ("lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo")
MOMENTOS: tuple[Momento, ...] = ("desayuno", "almuerzo", "cena")
NOTA_CALORIAS = "Estimación aproximada. TheMealDB no publica calorías."

# TheMealDB no tiene categoría Salad: en bajar grasa se busca "salad" con search.php.
_POR_OBJETIVO: dict[str, dict[Momento, tuple[str, ...]]] = {
    "bajar_grasa": {
        "desayuno": ("Breakfast",),
        "almuerzo": ("Chicken", "Seafood", "Vegetarian"),
        "cena": ("Seafood", "Chicken", "Vegetarian"),
    },
    "ganar_masa": {
        "desayuno": ("Breakfast",),
        "almuerzo": ("Beef", "Chicken", "Pasta"),
        "cena": ("Lamb", "Beef", "Chicken"),
    },
    "mantener": {
        "desayuno": ("Breakfast",),
        "almuerzo": ("Chicken", "Seafood", "Vegetarian", "Beef"),
        "cena": ("Chicken", "Pasta", "Seafood", "Pork"),
    },
}

_CARNES = (
    "chicken", "beef", "pork", "lamb", "bacon", "ham", "fish", "salmon", "prawn",
    "shrimp", "tuna", "anchov", "sausage", "turkey", "duck", "meat", "steak",
    "mince", "goat", "chorizo",
)
_GLUTEN = (
    "flour", "wheat", "pasta", "bread", "noodle", "barley", "rye", "couscous",
    "tortilla", "breadcrumb", "spaghetti", "macaroni", "lasagne", "lasagna",
    "pitta", "pita", "bun", "soy sauce", "beer", "semolina",
)
_BASE_KCAL = {
    "Breakfast": 420,
    "Chicken": 480,
    "Seafood": 430,
    "Vegetarian": 450,
    "Vegan": 430,
    "Beef": 640,
    "Pasta": 700,
    "Lamb": 660,
    "Pork": 600,
    "Side": 220,
    "Starter": 280,
    "Goat": 620,
    "Dessert": 480,
}


def estimar_calorias(receta: Receta) -> int:
    base = _BASE_KCAL.get(receta.categoria or "", 500)
    extra = min(max(0, len(receta.ingredientes) - 8) * 25, 200)
    return base + extra


def admite(receta: Receta, consulta: Consulta, prohibidos: set[str]) -> bool:
    texto = " ".join([receta.nombre, *(item.nombre for item in receta.ingredientes)]).casefold()
    if consulta.vegetariano and any(palabra in texto for palabra in _CARNES):
        return False
    if consulta.sin_gluten and any(palabra in texto for palabra in _GLUTEN):
        return False
    return not any(len(termino) >= 2 and termino in texto for termino in prohibidos)


def armar_plan(
    consulta: Consulta,
    provider: RecetasProvider,
    traductor: Traductor | TraductorIdentico,
    rng: random.Random | None = None,
) -> PlanSemanal:
    azar = rng or random.Random()
    prohibidos = _prohibidos(consulta, traductor)
    usados: set[str] = set()
    avisos: list[str] = []
    dias = [
        _dia(dia, consulta, provider, traductor, azar, prohibidos, usados, avisos)
        for dia in DIAS
    ]
    if not any(dia.comidas for dia in dias):
        raise LookupError("sin_recetas")
    return PlanSemanal(
        diagnostico=diagnosticar(consulta),
        dias=dias,
        compras=_compras(dias),
        avisos=avisos,
    )


def regenerar_dia(
    pedido: RegenerarDia,
    provider: RecetasProvider,
    traductor: Traductor | TraductorIdentico,
    rng: random.Random | None = None,
) -> DiaPlan:
    azar = rng or random.Random()
    prohibidos = _prohibidos(pedido.consulta, traductor)
    usados = set(pedido.excluir_ids)
    avisos: list[str] = []
    return _dia(pedido.dia, pedido.consulta, provider, traductor, azar, prohibidos, usados, avisos)


def _dia(
    dia: Dia,
    consulta: Consulta,
    provider: RecetasProvider,
    traductor: Traductor | TraductorIdentico,
    rng: random.Random,
    prohibidos: set[str],
    usados: set[str],
    avisos: list[str],
) -> DiaPlan:
    comidas: list[Comida] = []
    for momento in MOMENTOS:
        elegida = _elegir(consulta, momento, provider, rng, prohibidos, usados, len(usados))
        if elegida is None:
            avisos.append(f"No encontramos {momento} para el {dia} con esas restricciones.")
            continue
        usados.add(elegida.id)
        calorias = estimar_calorias(elegida)
        traducida = traducir_recetas([elegida], traductor)[0]
        comidas.append(
            Comida(
                momento=momento,
                receta=traducida,
                calorias_estimadas=calorias,
                nota_calorias=NOTA_CALORIAS,
            )
        )
    return DiaPlan(dia=dia, comidas=comidas)


def _elegir(
    consulta: Consulta,
    momento: Momento,
    provider: RecetasProvider,
    rng: random.Random,
    prohibidos: set[str],
    usados: set[str],
    turno: int,
) -> Receta | None:
    vistos = 0
    ya: set[str] = set()
    for candidato in _candidatos(consulta, momento, provider, rng, turno):
        if not candidato.id or candidato.id in usados or candidato.id in ya:
            continue
        ya.add(candidato.id)
        receta = candidato if isinstance(candidato, Receta) else provider.obtener(candidato.id)
        vistos += 1
        if receta is not None and receta.id not in usados and admite(receta, consulta, prohibidos):
            return receta
        # Cortamos para no vaciar una categoría entera cuando el filtro descarta casi todo.
        if vistos >= 20:
            return None
    return None


def _candidatos(
    consulta: Consulta,
    momento: Momento,
    provider: RecetasProvider,
    rng: random.Random,
    turno: int,
) -> list[Receta | RecetaResumen]:
    categorias = list(_categorias(consulta, momento))
    if categorias:
        giro = turno % len(categorias)
        categorias = categorias[giro:] + categorias[:giro]
    grupos: list[list[Receta | RecetaResumen]] = []
    for categoria in categorias:
        grupo = list(provider.buscar_por_categoria(categoria))
        rng.shuffle(grupo)
        grupos.append(grupo)
    if consulta.objetivo == "bajar_grasa" and momento != "desayuno" and not consulta.vegetariano:
        ensaladas = list(provider.buscar_por_nombre("salad"))
        rng.shuffle(ensaladas)
        grupos.append(ensaladas)
    # Intercala categorías para que la semana no se llene con una sola.
    pool: list[Receta | RecetaResumen] = []
    while any(grupos):
        for grupo in grupos:
            if grupo:
                pool.append(grupo.pop())
    return pool


def _categorias(consulta: Consulta, momento: Momento) -> tuple[str, ...]:
    if consulta.vegetariano:
        if momento == "desayuno":
            return ("Breakfast", "Vegetarian", "Vegan")
        return ("Vegetarian", "Vegan")
    categorias = _POR_OBJETIVO[consulta.objetivo][momento]
    if consulta.sin_gluten:
        return tuple(categoria for categoria in categorias if categoria != "Pasta")
    return categorias


def _prohibidos(consulta: Consulta, traductor: Traductor | TraductorIdentico) -> set[str]:
    originales = _terminos(f"{consulta.alergias},{consulta.disgustos}")
    if not originales:
        return set()
    traducidos = [texto.casefold() for texto in traductor.lote(originales, "es", "en")]
    return {texto.casefold() for texto in originales} | set(traducidos)


def _terminos(texto: str) -> list[str]:
    return [parte.strip() for parte in re.split(r"[,;\n]", texto) if len(parte.strip()) >= 2]


def _compras(dias: list[DiaPlan]) -> list[Compra]:
    grupos: dict[str, Compra] = {}
    for dia in dias:
        for comida in dia.comidas:
            for item in comida.receta.ingredientes:
                clave = item.nombre.strip().casefold()
                if not clave:
                    continue
                grupo = grupos.get(clave)
                if grupo is None:
                    grupo = Compra(nombre=item.nombre.strip(), cantidades=[])
                    grupos[clave] = grupo
                cantidad = item.cantidad.strip()
                if cantidad and cantidad not in grupo.cantidades:
                    grupo.cantidades.append(cantidad)
    return sorted(grupos.values(), key=lambda compra: compra.nombre.casefold())
