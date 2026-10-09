import { ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { FuenteChat, MensajeChat } from "@/lib/chat-memoria";
import type { PlanSemanal } from "@/lib/types";

export type Fuente = {
  id: string;
  titulo: string;
  detalle: string;
  href?: string;
};

export function fuentesDelPlan(plan: PlanSemanal): Fuente[] {
  const notas = [
    ...new Set(
      plan.dias.flatMap((dia) => dia.comidas.map((comida) => comida.nota_calorias)).filter(Boolean),
    ),
  ];
  return [
    {
      id: "themealdb",
      titulo: "TheMealDB",
      detalle: "Recetas e imágenes de este plan.",
      href: "https://www.themealdb.com/",
    },
    ...notas.map((nota, indice) => ({
      id: `calorias-${indice}`,
      titulo: "Calorías",
      detalle: nota,
    })),
    ...plan.avisos.map((aviso, indice) => ({
      id: `aviso-${indice}`,
      titulo: "Aviso del plan",
      detalle: aviso,
    })),
  ];
}

export function fuentesDelMensaje(mensaje: MensajeChat): Fuente[] {
  return (mensaje.fuentes ?? [])
    .map((fuente) => ({
      id: `${fuente.pmid}-${fuente.url}`,
      titulo: fuente.titulo,
      detalle: detalleFuente(fuente),
      href: enlaceFuente(fuente.url) || undefined,
    }))
    .filter((fuente) => fuente.titulo);
}

function detalleFuente(fuente: FuenteChat) {
  return [fuente.revista, fuente.anio, fuente.tipo, fuente.pmid ? `PMID ${fuente.pmid}` : ""].filter(Boolean).join(" · ");
}

function enlaceFuente(url: string) {
  try {
    const parsed = new URL(url);
    const permitidos = new Set(["pubmed.ncbi.nlm.nih.gov", "europepmc.org", "doi.org"]);
    if (parsed.protocol === "https:" && permitidos.has(parsed.hostname)) return parsed.href;
  } catch {
    return "";
  }
  return "";
}

export function FuentesList({
  fuentes,
  cargando = false,
  error = null,
  compacta = false,
  nota = null,
}: {
  fuentes: Fuente[];
  cargando?: boolean;
  error?: string | null;
  compacta?: boolean;
  nota?: string | null;
}) {
  const cuerpo = (
    <>
      {cargando ? (
        <div className="space-y-3" aria-busy="true" aria-live="polite">
          <p className="sr-only">Cargando fuentes…</p>
          <Skeleton className="h-12 w-full" aria-hidden="true" />
          <Skeleton className="h-12 w-full" aria-hidden="true" />
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron mostrar las fuentes</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : fuentes.length === 0 && !nota ? (
        compacta ? null : <p className="text-sm text-muted-foreground">Todavía no hay fuentes para mostrar.</p>
      ) : (
        <>
          {compacta && fuentes.length > 0 ? <p className="font-medium">Fuentes</p> : null}
          {fuentes.length > 0 ? (
            <ul className={compacta ? "mt-1 space-y-1" : "space-y-3"}>
              {fuentes.map((fuente) => (
                <li key={fuente.id} className={compacta ? "break-words" : "rounded-lg border px-3 py-3"}>
                  {fuente.href ? (
                    <a
                      href={fuente.href}
                      target={compacta ? "_blank" : undefined}
                      rel={compacta ? "noopener noreferrer" : undefined}
                      aria-label={compacta ? `${fuente.titulo}, se abre en otra pestaña` : fuente.titulo}
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      <Badge variant="secondary">{fuente.titulo}</Badge>
                      {compacta ? null : <ExternalLink className="size-3.5" aria-hidden="true" />}
                    </a>
                  ) : (
                    <Badge variant="outline">{fuente.titulo}</Badge>
                  )}
                  <p className={compacta ? "text-muted-foreground" : "mt-1 text-sm leading-relaxed text-muted-foreground"}>
                    {compacta ? ` ${fuente.detalle}` : fuente.detalle}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
          {nota ? <p className="mt-1 text-muted-foreground">{nota}</p> : null}
        </>
      )}
    </>
  );

  if (compacta) {
    if (!cargando && !error && fuentes.length === 0 && !nota) return null;
    return <div className="mt-2 border-t border-border/70 pt-2 text-xs">{cuerpo}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Fuentes</CardTitle>
        <CardDescription>De dónde salen las recetas y las cifras de este plan.</CardDescription>
      </CardHeader>
      <CardContent>{cuerpo}</CardContent>
    </Card>
  );
}
