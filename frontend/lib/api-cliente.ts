"use client";

import type { Favorito, Receta } from "@/lib/types";
import { pedir } from "@/lib/pedir";

export function obtenerReceta(id: string) {
  return pedir<Receta>("", `/api/recetas/${encodeURIComponent(id)}`);
}

export function guardarFavorito(id: string) {
  return pedir<Favorito>("", "/api/favoritos", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

export function quitarFavorito(id: number) {
  return pedir<void>("", `/api/favoritos/${id}`, { method: "DELETE" });
}
