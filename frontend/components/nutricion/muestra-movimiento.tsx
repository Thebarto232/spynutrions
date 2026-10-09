"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { DiaCard } from "@/components/nutricion/dia-card";
import { Escribiendo } from "@/components/nutricion/escribiendo";
import { FuentesList } from "@/components/nutricion/fuentes-list";
import { RecetaDialog } from "@/components/nutricion/receta-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { transicion, varianteEntrada } from "@/lib/motion";
import type { DiaPlan, DiaSemana, Receta } from "@/lib/types";

const receta: Receta = {
  id: "muestra",
  nombre: "Pollo al horno",
  imagen: null,
  categoria: "Chicken",
  ingredientes: [{ nombre: "pollo", cantidad: "1" }],
  pasos: ["Hornea hasta que esté cocido."],
  tiempo: null,
};

const dias: Record<"lunes" | "martes", DiaPlan> = {
  lunes: {
    dia: "lunes",
    comidas: [
      {
        momento: "desayuno",
        receta,
        calorias_estimadas: 420,
        nota_calorias: "Estimación aproximada. TheMealDB no publica calorías.",
      },
      {
        momento: "cena",
        receta: { ...receta, id: "muestra-cena", nombre: "Sopa de lentejas", categoria: "Vegetarian" },
        calorias_estimadas: 450,
        nota_calorias: "Estimación aproximada. TheMealDB no publica calorías.",
      },
    ],
  },
  martes: {
    dia: "martes",
    comidas: [
      {
        momento: "almuerzo",
        receta: { ...receta, id: "muestra-martes", nombre: "Pasta al pesto", categoria: "Pasta" },
        calorias_estimadas: 700,
        nota_calorias: "Estimación aproximada. TheMealDB no publica calorías.",
      },
    ],
  },
};

export function MuestraMovimiento() {
  const [dia, setDia] = useState<DiaSemana>("lunes");
  const [cargando, setCargando] = useState(false);
  const [marcado, setMarcado] = useState(false);
  const [abierta, setAbierta] = useState<Receta | null>(null);
  const activo = dias[dia === "martes" ? "martes" : "lunes"];

  return (
    <section className="space-y-8">
      <header>
        <h2 className="font-serif text-2xl font-semibold">Movimiento</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Cambiar de día, cargar, escribir, confirmar y abrir una receta. El texto sigue ahí si las animaciones están apagadas.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={dia === "lunes" ? "default" : "outline"} onClick={() => setDia("lunes")}>
          Lunes
        </Button>
        <Button type="button" variant={dia === "martes" ? "default" : "outline"} onClick={() => setDia("martes")}>
          Martes
        </Button>
      </div>
      <div className="relative">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div className="w-full" key={activo.dia} initial={varianteEntrada.initial} animate={varianteEntrada.animate} exit={{ opacity: 0 }} transition={transicion()}>
          <DiaCard dia={activo} etiqueta={activo.dia === "lunes" ? "Lunes" : "Martes"} onVer={setAbierta} />
        </motion.div>
      </AnimatePresence>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setCargando((valor) => !valor)}>
          {cargando ? "Mostrar contenido" : "Ver carga"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDia("lunes");
            window.dispatchEvent(new CustomEvent("sazon-plan-cambio", { detail: { recetaId: "muestra-cena", momento: "cena" } }));
            window.dispatchEvent(new CustomEvent("sazon-lista-lista"));
            toast.success("Comida actualizada", { description: "Cambié la cena del lunes por Sopa de lentejas." });
          }}
        >
          Resaltar comida
        </Button>
        <Button type="button" onClick={() => toast.success("Comida actualizada", { description: "Cambié la cena del lunes por Pollo al horno." })}>
          Probar aviso
        </Button>
        <Button type="button" variant="outline" onClick={() => setAbierta(receta)}>
          Abrir receta
        </Button>
      </div>
      {cargando ? (
        <div aria-busy="true" aria-live="polite">
          <p className="text-sm text-muted-foreground">Buscando recetas…</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-40" aria-hidden="true" />
            <Skeleton className="h-40" aria-hidden="true" />
            <Skeleton className="h-40" aria-hidden="true" />
          </div>
        </div>
      ) : null}
      <FuentesList
        fuentes={[{ id: "muestra", titulo: "TheMealDB", detalle: "Recetas de ejemplo." }]}
        cargando={cargando}
      />
      <Escribiendo />
      <div className="flex items-center gap-2">
        <Checkbox id="muestra-check" checked={marcado} onCheckedChange={(valor) => setMarcado(valor === true)} />
        <Label htmlFor="muestra-check">{marcado ? "Marcado" : "Sin marcar"}</Label>
      </div>
      <RecetaDialog receta={abierta} favoritoId={null} onClose={() => setAbierta(null)} />
    </section>
  );
}
