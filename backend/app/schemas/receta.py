from pydantic import BaseModel, Field


class Ingrediente(BaseModel):
    nombre: str
    cantidad: str


class RecetaResumen(BaseModel):
    id: str
    nombre: str
    imagen: str | None = None
    categoria: str | None = None


class Receta(RecetaResumen):
    ingredientes: list[Ingrediente]
    pasos: list[str]
    tiempo: str | None = None


class Categoria(BaseModel):
    nombre: str
    etiqueta: str | None = None
    imagen: str | None = None
    descripcion: str | None = None


class FavoritoCrear(BaseModel):
    id: str = Field(min_length=1)


class Favorito(BaseModel):
    id: int
    receta: Receta
