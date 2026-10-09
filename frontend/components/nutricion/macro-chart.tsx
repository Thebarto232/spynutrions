"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import type { Macros } from "@/lib/types";

const config = {
  gramos: { label: "Gramos" },
  proteina: { label: "Proteína", color: "var(--primary)" },
  carbohidratos: { label: "Carbohidratos", color: "var(--accent)" },
  grasa: { label: "Grasa", color: "var(--foreground)" },
} satisfies ChartConfig;

export function MacroChart({
  macros,
  cargando = false,
  error = null,
}: {
  macros: Macros | null;
  cargando?: boolean;
  error?: string | null;
}) {
  if (cargando) {
    return <Skeleton className="aspect-[2/1] w-full" aria-busy="true" aria-label="Cargando el reparto" />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo dibujar el reparto</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!macros) {
    return <p className="text-sm text-muted-foreground">El reparto aparece cuando haya un diagnóstico.</p>;
  }

  const datos = [
    { macro: "proteina", gramos: macros.proteina_g, fill: "var(--color-proteina)" },
    { macro: "carbohidratos", gramos: macros.carbohidratos_g, fill: "var(--color-carbohidratos)" },
    { macro: "grasa", gramos: macros.grasa_g, fill: "var(--color-grasa)" },
  ];

  return (
    <div>
      <ChartContainer config={config} className="aspect-[2/1] w-full min-h-40">
        <BarChart data={datos} accessibilityLayer>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="macro"
            tickLine={false}
            axisLine={false}
            tickFormatter={(valor) => String(config[valor as keyof typeof config]?.label ?? valor)}
          />
          <YAxis tickLine={false} axisLine={false} width={36} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="gramos" radius={6} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
      <BarrasPorcentaje
        barras={[
          { id: "proteina", etiqueta: "Proteína", pct: macros.proteina_pct },
          { id: "carbohidratos", etiqueta: "Carbohidratos", pct: macros.carbohidratos_pct },
          { id: "grasa", etiqueta: "Grasa", pct: macros.grasa_pct },
        ]}
      />
    </div>
  );
}

function BarrasPorcentaje({ barras }: { barras: { id: string; etiqueta: string; pct: number }[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {barras.map((barra) => {
        const pct = Math.max(0, Math.min(100, barra.pct));
        return (
          <li key={barra.id}>
            <Progress value={pct}>
              <ProgressLabel className="font-normal">{barra.etiqueta}</ProgressLabel>
              <ProgressValue>{() => `${pct}%`}</ProgressValue>
            </Progress>
          </li>
        );
      })}
    </ul>
  );
}
