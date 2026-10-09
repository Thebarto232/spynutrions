"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { resalteMs } from "@/lib/motion";
import type { Compra } from "@/lib/types";

export function ListaCompras({
  compras,
  cargando = false,
  error = null,
}: {
  compras: Compra[];
  cargando?: boolean;
  error?: string | null;
}) {
  const resaltada = useResalteLista();
  const [hechas, setHechas] = useState<Set<string>>(new Set());

  function alternar(nombre: string, marcado: boolean) {
    setHechas((actual) => {
      const siguiente = new Set(actual);
      if (marcado) siguiente.add(nombre);
      else siguiente.delete(nombre);
      return siguiente;
    });
  }

  return (
    <Card className="relative">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary transition-opacity duration-[var(--motion-media)] ease-[var(--motion-ease)] ${
          resaltada ? "opacity-100" : "opacity-0"
        }`}
      />
      <CardHeader>
        <CardTitle className="font-serif text-3xl">Lista de compras</CardTitle>
        <CardDescription>Ingredientes reunidos de los siete días.</CardDescription>
        {resaltada ? <p className="text-sm font-medium text-primary">Lista actualizada</p> : null}
      </CardHeader>
      <CardContent>
        {cargando ? (
          <div className="space-y-2" aria-busy="true" aria-live="polite">
            <p className="sr-only">Cargando la lista de compras…</p>
            <Skeleton className="h-5 w-2/3" aria-hidden="true" />
            <Skeleton className="h-5 w-1/2" aria-hidden="true" />
            <Skeleton className="h-5 w-3/5" aria-hidden="true" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo armar la lista</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : compras.length === 0 ? (
          <p className="text-sm text-muted-foreground">El plan no tiene ingredientes para comprar.</p>
        ) : (
          <ScrollArea className="h-72 pr-3">
            <ul className="columns-1 gap-8 text-sm sm:columns-2">
              {compras.map((item) => (
                <li key={item.nombre} className="mb-2 break-inside-avoid">
                  <Label className="flex cursor-pointer items-start gap-2 font-normal">
                    <Checkbox
                      checked={hechas.has(item.nombre)}
                      onCheckedChange={(marcado) => alternar(item.nombre, marcado === true)}
                    />
                    <span className={hechas.has(item.nombre) ? "text-muted-foreground line-through" : undefined}>
                      {item.nombre}
                      {item.cantidades.length > 0 ? ` — ${item.cantidades.join(" / ")}` : ""}
                    </span>
                  </Label>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function useResalteLista() {
  const [activa, setActiva] = useState(false);

  useEffect(() => {
    let timer = 0;
    function marcar() {
      setActiva(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setActiva(false), resalteMs);
    }
    window.addEventListener("sazon-lista-lista", marcar);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("sazon-lista-lista", marcar);
    };
  }, []);

  return activa;
}
