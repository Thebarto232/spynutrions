"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MOMENTOS } from "@/components/nutricion/etiquetas";
import { resalteMs } from "@/lib/motion";
import type { Comida, Momento, Receta } from "@/lib/types";

export function RecetaCard({ comida, onVer }: { comida: Comida; onVer: (receta: Receta) => void }) {
  const { receta } = comida;
  const resaltada = useResalte(receta.id, comida.momento);
  return (
    <Card className="relative flex-row items-stretch gap-4">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary transition-opacity duration-[var(--motion-media)] ease-[var(--motion-ease)] ${
          resaltada ? "opacity-100" : "opacity-0"
        }`}
      />
      <div className="relative hidden size-24 shrink-0 overflow-hidden rounded-lg bg-muted sm:block">
        {receta.imagen ? (
          <Image src={receta.imagen} alt="" fill unoptimized sizes="96px" className="object-cover" />
        ) : null}
      </div>
      <CardContent className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{MOMENTOS[comida.momento]}</p>
        {resaltada ? <p className="text-sm font-medium text-primary">Receta actualizada</p> : null}
        <h4 className="font-serif text-xl font-semibold leading-tight sm:text-2xl">{receta.nombre}</h4>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {receta.categoria ? <Badge variant="secondary">{receta.categoria}</Badge> : null}
          <Badge variant="outline">≈ {comida.calorias_estimadas} kcal</Badge>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{comida.nota_calorias}</p>
        <Button type="button" className="print:hidden mt-3" onClick={() => onVer(receta)}>
          Ver receta
        </Button>
      </CardContent>
    </Card>
  );
}

type Marca = { recetaId: string; momento: string; hasta: number };

let marca: Marca | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("sazon-plan-cambio", (event) => {
    const detail = (event as CustomEvent<{ recetaId?: string; momento?: string }>).detail;
    if (!detail?.recetaId || !detail.momento) return;
    marca = { recetaId: detail.recetaId, momento: detail.momento, hasta: Date.now() + resalteMs };
  });
}

function useResalte(recetaId: string, momento: Momento) {
  const [activa, setActiva] = useState(false);

  useEffect(() => {
    let timer = 0;
    function encender(hasta: number) {
      setActiva(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActiva(false), Math.max(0, hasta - Date.now()));
    }
    if (marca && marca.recetaId === recetaId && marca.momento === momento && marca.hasta > Date.now()) {
      encender(marca.hasta);
    }
    function alCambiar(event: Event) {
      const detail = (event as CustomEvent<{ recetaId?: string; momento?: string }>).detail;
      if (!detail || detail.recetaId !== recetaId || detail.momento !== momento) return;
      encender(Date.now() + resalteMs);
    }
    window.addEventListener("sazon-plan-cambio", alCambiar);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("sazon-plan-cambio", alCambiar);
    };
  }, [recetaId, momento]);

  return activa;
}
