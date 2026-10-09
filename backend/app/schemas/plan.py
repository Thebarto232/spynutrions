from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.receta import Receta

Sexo = Literal["mujer", "hombre"]
Actividad = Literal["sedentario", "ligero", "moderado", "intenso"]
Objetivo = Literal["bajar_grasa", "mantener", "ganar_masa"]
TipoCorporal = Literal["ectomorfo", "mesomorfo", "endomorfo"]
Momento = Literal["desayuno", "almuerzo", "cena"]
Dia = Literal["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"]


class Consulta(BaseModel):
    edad: int = Field(ge=14, le=100)
    sexo: Sexo
    peso_kg: float = Field(gt=25, lt=300)
    estatura_cm: float = Field(gt=120, lt=230)
    actividad: Actividad
    objetivo: Objetivo
    tipo_corporal: TipoCorporal
    vegetariano: bool = False
    sin_gluten: bool = False
    alergias: str = Field(default="", max_length=200)
    disgustos: str = Field(default="", max_length=200)


class Macros(BaseModel):
    proteina_g: int
    carbohidratos_g: int
    grasa_g: int
    proteina_pct: int
    carbohidratos_pct: int
    grasa_pct: int


class Diagnostico(BaseModel):
    imc: float
    clasificacion_imc: str
    tmb: int
    gasto: int
    calorias_objetivo: int
    macros: Macros
    nota_tipo_corporal: str
    recomendaciones: list[str]
    aviso: str


class Comida(BaseModel):
    momento: Momento
    receta: Receta
    calorias_estimadas: int
    nota_calorias: str


class DiaPlan(BaseModel):
    dia: Dia
    comidas: list[Comida]


class Compra(BaseModel):
    nombre: str
    cantidades: list[str]


class PlanSemanal(BaseModel):
    diagnostico: Diagnostico
    dias: list[DiaPlan]
    compras: list[Compra]
    avisos: list[str]


class RegenerarDia(BaseModel):
    consulta: Consulta
    dia: Dia
    excluir_ids: list[str] = Field(default_factory=list, max_length=40)
