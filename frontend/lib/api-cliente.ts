"use client";

import type { Consulta, DiaPlan, DiaSemana, Favorito, PlanSemanal, Receta } from "@/lib/types";
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

export function crearPlan(consulta: Consulta) {
  return pedir<PlanSemanal>("", "/api/plan", {
    method: "POST",
    body: JSON.stringify(consulta),
  });
}

export function regenerarDia(consulta: Consulta, dia: DiaSemana, excluirIds: string[]) {
  return pedir<DiaPlan>("", "/api/plan/dia", {
    method: "POST",
    body: JSON.stringify({ consulta, dia, excluir_ids: excluirIds }),
  });
}
