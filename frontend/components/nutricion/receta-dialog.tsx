"use client";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ContenidoReceta } from "@/components/recipe-dialog";
import type { Receta } from "@/lib/types";

export function RecetaDialog({
  receta,
  favoritoId,
  onClose,
  onFavoritoChange,
}: {
  receta: Receta | null;
  favoritoId: number | null;
  onClose: () => void;
  onFavoritoChange?: (id: number | null) => void;
}) {
  return (
    <Dialog
      open={receta !== null}
      onOpenChange={(abierto) => {
        if (!abierto) onClose();
      }}
    >
      <DialogContent className="max-h-[min(44rem,92vh)] overflow-y-auto sm:max-w-4xl">
        {receta ? (
          <>
            <DialogTitle className="sr-only">{receta.nombre}</DialogTitle>
            <DialogDescription className="sr-only">Ingredientes y pasos de {receta.nombre}.</DialogDescription>
            <ContenidoReceta
              key={receta.id}
              receta={receta}
              favoritoId={favoritoId}
              onClose={onClose}
              onFavoritoChange={onFavoritoChange}
            />
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
