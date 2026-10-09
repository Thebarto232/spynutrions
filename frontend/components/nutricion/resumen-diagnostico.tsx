import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { MacroChart } from "@/components/nutricion/macro-chart";
import { NumeroAnimado } from "@/components/nutricion/numero-animado";
import type { Diagnostico } from "@/lib/types";

export function ResumenDiagnostico({
  diagnostico,
  cargando = false,
  error = null,
}: {
  diagnostico: Diagnostico | null;
  cargando?: boolean;
  error?: string | null;
}) {
  if (cargando) {
    return (
      <Card aria-busy="true" aria-live="polite">
        <CardHeader>
          <p className="sr-only">Cargando el diagnóstico…</p>
          <Skeleton className="h-8 w-48" aria-hidden="true" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" aria-hidden="true" />
          <Skeleton className="h-40 w-full" aria-hidden="true" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo mostrar el diagnóstico</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!diagnostico) {
    return <p className="text-sm text-muted-foreground">Prepara la semana para ver el diagnóstico.</p>;
  }

  const cubreGasto =
    diagnostico.gasto > 0
      ? Math.max(0, Math.min(100, Math.round((diagnostico.calorias_objetivo / diagnostico.gasto) * 100)))
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-3xl">Nota de la consulta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{diagnostico.aviso}</p>
        <dl className="grid gap-6 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-muted-foreground">IMC</dt>
            <dd className="mt-1 font-serif text-4xl font-semibold">
              <NumeroAnimado valor={diagnostico.imc} decimales={1} />
            </dd>
            <dd className="mt-2">
              <Badge variant="secondary">{diagnostico.clasificacion_imc}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Calorías objetivo</dt>
            <dd className="mt-1 font-serif text-4xl font-semibold">
              <NumeroAnimado valor={diagnostico.calorias_objetivo} />
            </dd>
            <dd className="mt-2 text-sm text-muted-foreground">kcal al día · gasto estimado {diagnostico.gasto}</dd>
            <dd className="mt-3">
              <Progress value={cubreGasto}>
                <ProgressLabel className="font-normal">Respecto al gasto</ProgressLabel>
                <ProgressValue>{() => `${cubreGasto}%`}</ProgressValue>
              </Progress>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Metabolismo basal</dt>
            <dd className="mt-1 font-serif text-4xl font-semibold">
              <NumeroAnimado valor={diagnostico.tmb} />
            </dd>
            <dd className="text-sm">kcal</dd>
          </div>
        </dl>
        <MacroChart macros={diagnostico.macros} />
        <p className="max-w-2xl text-sm leading-relaxed">{diagnostico.nota_tipo_corporal}</p>
        {diagnostico.recomendaciones.length > 0 ? (
          <ul className="max-w-2xl list-disc space-y-1 pl-5 text-sm leading-relaxed">
            {diagnostico.recomendaciones.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Este diagnóstico no trae recomendaciones.</p>
        )}
      </CardContent>
    </Card>
  );
}

export function PlanEsqueleto() {
  return (
    <div className="mt-10 space-y-4" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">Buscando recetas para los siete días…</p>
      <Skeleton className="h-40 w-full" aria-hidden="true" />
      <Skeleton className="h-24 w-full" aria-hidden="true" />
      <Skeleton className="h-16 w-full" aria-hidden="true" />
      <Skeleton className="h-24 w-full" aria-hidden="true" />
    </div>
  );
}
