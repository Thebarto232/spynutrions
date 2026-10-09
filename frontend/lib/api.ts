import type { Categoria, Favorito, Receta, RecetaResumen } from "@/lib/types";
import { pedir } from "@/lib/pedir";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

export function buscarRecetas(q: string) {
  return pedir<Receta[]>(API_URL, `/api/recetas/buscar?q=${encodeURIComponent(q)}`);
}

export function buscarPorIngredientes(i: string) {
  return pedir<RecetaResumen[]>(API_URL, `/api/recetas/ingredientes?i=${encodeURIComponent(i)}`);
}

export function buscarPorCategoria(c: string) {
  return pedir<RecetaResumen[]>(API_URL, `/api/recetas/categoria?c=${encodeURIComponent(c)}`);
}

export function obtenerReceta(id: string) {
  return pedir<Receta>(API_URL, `/api/recetas/${encodeURIComponent(id)}`);
}

export function recetaAleatoria() {
  return pedir<Receta>(API_URL, "/api/recetas/aleatoria");
}

export function obtenerCategorias() {
  return pedir<Categoria[]>(API_URL, "/api/categorias");
}

export function listarFavoritos() {
  return pedir<Favorito[]>(API_URL, "/api/favoritos");
}

export function guardarFavorito(id: string) {
  return pedir<Favorito>(API_URL, "/api/favoritos", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export function quitarFavorito(id: number) {
  return pedir<void>(API_URL, `/api/favoritos/${id}`, { method: "DELETE" });
}
