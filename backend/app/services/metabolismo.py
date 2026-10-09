"""Cálculos de una guía nutricional. No son un diagnóstico clínico."""

from app.schemas.plan import Actividad, Consulta, Diagnostico, Macros, Objetivo, Sexo, TipoCorporal

AVISO = "Esta herramienta es informativa y no reemplaza la consulta con un nutricionista o médico."

NOTA_TIPO = (
    "El tipo corporal es una guía general para repartir los macros. "
    "No determina por sí solo qué dieta te conviene."
)

# Factores habituales sobre la fórmula de Mifflin-St Jeor.
FACTORES: dict[Actividad, float] = {
    "sedentario": 1.2,
    "ligero": 1.375,
    "moderado": 1.55,
    "intenso": 1.725,
}

# Porcentajes de proteína, carbohidrato y grasa. Suman 100.
REPARTO: dict[TipoCorporal, tuple[int, int, int]] = {
    "ectomorfo": (25, 50, 25),
    "mesomorfo": (30, 40, 30),
    "endomorfo": (35, 30, 35),
}


def tmb(sexo: Sexo, peso_kg: float, estatura_cm: float, edad: int) -> float:
    # Mifflin-St Jeor. La constante final cambia según la ecuación de referencia.
    base = 10 * peso_kg + 6.25 * estatura_cm - 5 * edad
    return base + (5 if sexo == "hombre" else -161)


def imc(peso_kg: float, estatura_cm: float) -> float:
    metros = estatura_cm / 100
    return round(peso_kg / (metros * metros), 1)


def clasificar_imc(valor: float) -> str:
    if valor < 18.5:
        return "por debajo del rango habitual"
    if valor < 25:
        return "en el rango habitual"
    if valor < 30:
        return "por encima del rango habitual"
    return "muy por encima del rango habitual"


def calorias_objetivo(gasto: float, objetivo: Objetivo, sexo: Sexo, valor_imc: float) -> int:
    # Con IMC bajo no aplicamos déficit, aunque el objetivo sea bajar grasa.
    if objetivo == "bajar_grasa" and valor_imc >= 18.5:
        piso = 1400 if sexo == "mujer" else 1600
        return max(round(gasto * 0.85), piso)
    if objetivo == "ganar_masa":
        return round(gasto * 1.12)
    return round(gasto)


def macros_de(calorias: int, tipo: TipoCorporal) -> Macros:
    proteina, carbos, grasa = REPARTO[tipo]
    return Macros(
        proteina_g=round(calorias * proteina / 100 / 4),
        carbohidratos_g=round(calorias * carbos / 100 / 4),
        grasa_g=round(calorias * grasa / 100 / 9),
        proteina_pct=proteina,
        carbohidratos_pct=carbos,
        grasa_pct=grasa,
    )


def diagnosticar(consulta: Consulta) -> Diagnostico:
    valor_imc = imc(consulta.peso_kg, consulta.estatura_cm)
    basal = tmb(consulta.sexo, consulta.peso_kg, consulta.estatura_cm, consulta.edad)
    gasto = basal * FACTORES[consulta.actividad]
    meta = calorias_objetivo(gasto, consulta.objetivo, consulta.sexo, valor_imc)
    return Diagnostico(
        imc=valor_imc,
        clasificacion_imc=clasificar_imc(valor_imc),
        tmb=round(basal),
        gasto=round(gasto),
        calorias_objetivo=meta,
        macros=macros_de(meta, consulta.tipo_corporal),
        nota_tipo_corporal=NOTA_TIPO,
        recomendaciones=_recomendaciones(consulta, valor_imc),
        aviso=AVISO,
    )


def _recomendaciones(consulta: Consulta, valor_imc: float) -> list[str]:
    textos = {
        "bajar_grasa": "Esta semana prioriza pollo, pescado y platos con verdura, y deja los postres fuera.",
        "mantener": "La semana mezcla platos de proteína, verdura y algún cereal para sostener tu gasto.",
        "ganar_masa": "Las comidas incluyen más carne, pollo o pasta para acompañar el superávit.",
    }
    notas = [
        textos[consulta.objetivo],
        "Reparte la proteína entre el desayuno, el almuerzo y la cena.",
    ]
    if valor_imc < 18.5 and consulta.objetivo == "bajar_grasa":
        notas.append("Tu IMC está por debajo del rango habitual, así que el plan no aplica un déficit.")
    if consulta.vegetariano:
        notas.append("Las recetas salen de las categorías vegetariana y vegana, y se revisan los ingredientes.")
    return notas
