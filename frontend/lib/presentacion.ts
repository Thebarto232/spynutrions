import type { Ingrediente, Receta, RecetaResumen } from "@/lib/types";

export function esRecetaCompleta(receta: Receta | RecetaResumen): receta is Receta {
  return "ingredientes" in receta && "pasos" in receta;
}

export function textoIngrediente(item: Ingrediente) {
  return [item.cantidad, item.nombre].filter(Boolean).join(" ");
}

export function pasosUtiles(pasos: string[]) {
  return pasos.map((paso) => paso.trim()).filter((paso) => paso && !/^(step|paso)\s*\d+$/i.test(paso));
}

export function resumenCorto(receta: Receta) {
  const texto = pasosUtiles(receta.pasos)[0];
  if (!texto) return "Abre la receta para ver los ingredientes y los pasos.";
  return texto.length > 180 ? `${texto.slice(0, 177).trimEnd()}…` : texto;
}
