"use client";

import { RefreshCw } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RecetaCard } from "@/components/nutricion/receta-card";
import { elevacion, variantesItem, variantesLista } from "@/lib/motion";
import type { DiaPlan, Receta } from "@/lib/types";

export function DiaCard({
  dia,
  etiqueta,
  regenerando = false,
  cargando = false,
  error = null,
  onRegenerar,
  onVer,
}: {
  dia: DiaPlan;
  etiqueta: string;
  regenerando?: boolean;
  cargando?: boolean;
  error?: string | null;
  onRegenerar?: () => void;
  onVer: (receta: Receta) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="font-serif text-2xl">{etiqueta}</CardTitle>
        {onRegenerar ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  className="print:hidden"
                  disabled={regenerando || cargando}
                  onClick={onRegenerar}
                />
              }
            >
              <RefreshCw aria-hidden="true" />
              {regenerando ? "Cambiando el día…" : "Regenerar día"}
            </TooltipTrigger>
            <TooltipContent>Pide otras recetas para este día, con el mismo perfil.</TooltipContent>
          </Tooltip>
        ) : null}
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <p className="sr-only">Cargando las comidas de este día…</p>
            <Skeleton className="h-24 w-full" aria-hidden="true" />
            <Skeleton className="h-24 w-full" aria-hidden="true" />
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : dia.comidas.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Este día quedó sin platos. Regenera el día o quita una restricción.
          </p>
        ) : (
          <motion.ul className="space-y-4" variants={variantesLista} initial="oculto" animate="visible">
            {dia.comidas.map((comida) => (
              <motion.li key={`${dia.dia}-${comida.momento}-${comida.receta.id}`} variants={variantesItem} whileHover={elevacion}>
                <RecetaCard comida={comida} onVer={onVer} />
              </motion.li>
            ))}
          </motion.ul>
        )}
      </CardContent>
    </Card>
  );
}
