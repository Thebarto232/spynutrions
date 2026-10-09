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

export type Sexo = "mujer" | "hombre";
export type Actividad = "sedentario" | "ligero" | "moderado" | "intenso";
export type Objetivo = "bajar_grasa" | "mantener" | "ganar_masa";
export type TipoCorporal = "ectomorfo" | "mesomorfo" | "endomorfo";
export type Momento = "desayuno" | "almuerzo" | "cena";
export type DiaSemana = "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

export type Consulta = {
  edad: number;
  sexo: Sexo;
  peso_kg: number;
  estatura_cm: number;
  actividad: Actividad;
  objetivo: Objetivo;
  tipo_corporal: TipoCorporal;
  vegetariano: boolean;
  sin_gluten: boolean;
  alergias: string;
  disgustos: string;
};

export type Macros = {
  proteina_g: number;
  carbohidratos_g: number;
  grasa_g: number;
  proteina_pct: number;
  carbohidratos_pct: number;
  grasa_pct: number;
};

export type Diagnostico = {
  imc: number;
  clasificacion_imc: string;
  tmb: number;
  gasto: number;
  calorias_objetivo: number;
  macros: Macros;
  nota_tipo_corporal: string;
  recomendaciones: string[];
  aviso: string;
};

export type Comida = {
  momento: Momento;
  receta: Receta;
  calorias_estimadas: number;
  nota_calorias: string;
};

export type DiaPlan = {
  dia: DiaSemana;
  comidas: Comida[];
};

export type Compra = {
  nombre: string;
  cantidades: string[];
};

export type PlanSemanal = {
  diagnostico: Diagnostico;
  dias: DiaPlan[];
  compras: Compra[];
  avisos: string[];
};
