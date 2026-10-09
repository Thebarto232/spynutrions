export type Ingrediente = {
  nombre: string;
  cantidad: string;
};

export type RecetaResumen = {
  id: string;
  nombre: string;
  imagen: string | null;
  categoria: string | null;
};

export type Receta = RecetaResumen & {
  ingredientes: Ingrediente[];
  pasos: string[];
  tiempo: string | null;
};

export type Categoria = {
  nombre: string;
  etiqueta: string | null;
  imagen: string | null;
  descripcion: string | null;
};

export type Favorito = {
  id: number;
  receta: Receta;
};
