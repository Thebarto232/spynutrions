"use client";

import { useState } from "react";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeDialog } from "@/components/recipe-dialog";
import { quitarFavorito } from "@/lib/api-cliente";
import type { Favorito, Receta } from "@/lib/types";

export function ListaFavoritas({ favoritas }: { favoritas: Favorito[] }) {
  const [guardadas, setGuardadas] = useState(favoritas);
  const [seleccionada, setSeleccionada] = useState<Receta | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function quitar(receta: Receta) {
    const actual = guardadas.find((favorito) => favorito.receta.id === receta.id);
    if (!actual) return;
    setAviso(null);
    try {
      await quitarFavorito(actual.id);
      setGuardadas((prev) => prev.filter((favorito) => favorito.id !== actual.id));
      if (seleccionada?.id === receta.id) setSeleccionada(null);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo quitar la favorita.");
    }
  }

  const favoritoAbierto = seleccionada
    ? guardadas.find((favorito) => favorito.receta.id === seleccionada.id)?.id ?? null
    : null;

  if (guardadas.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no guardaste ninguna.</p>;
  }

  return (
    <>
      {aviso ? <p className="mb-4 text-sm text-muted-foreground">{aviso}</p> : null}
      {/* v0: lista-favoritos */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guardadas.map((favorito) => (
          <RecipeCard
            key={favorito.id}
            receta={favorito.receta}
            esFavorita
            onToggleFavorita={() => quitar(favorito.receta)}
            onOpen={() => setSeleccionada(favorito.receta)}
          />
        ))}
      </div>
      <RecipeDialog
        receta={seleccionada}
        favoritoId={favoritoAbierto}
        onClose={() => setSeleccionada(null)}
        onFavoritoChange={(id) => {
          if (!seleccionada) return;
          if (id === null) {
            setGuardadas((prev) => prev.filter((favorito) => favorito.receta.id !== seleccionada.id));
            setSeleccionada(null);
          }
        }}
      />
    </>
  );
}
