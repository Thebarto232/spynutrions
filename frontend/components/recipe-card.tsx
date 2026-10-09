"use client";

import Image from "next/image";
import { ArrowUpRight, Heart } from "lucide-react";
import type { Receta, RecetaResumen } from "@/lib/types";
import { esRecetaCompleta, resumenCorto, pasosUtiles } from "@/lib/presentacion";

type Props = {
  receta: Receta | RecetaResumen;
  esFavorita: boolean;
  onToggleFavorita: () => void;
  onOpen: () => void;
};

export function RecipeCard({ receta, esFavorita, onToggleFavorita, onOpen }: Props) {
  const completa = esRecetaCompleta(receta) ? receta : null;
  const pasos = completa ? pasosUtiles(completa.pasos).length : null;
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-sm transition-transform duration-[var(--motion-media)] ease-[var(--motion-ease)] hover:-translate-y-0.5">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {receta.imagen ? (
          <Image
            src={receta.imagen}
            alt={receta.nombre}
            fill
            unoptimized
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden="true" />
        {receta.categoria ? (
          <span className="absolute left-4 top-4 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-card-foreground backdrop-blur">
            {receta.categoria}
          </span>
        ) : null}
        <button
          type="button"
          onClick={onToggleFavorita}
          aria-pressed={esFavorita}
          aria-label={esFavorita ? `Quitar ${receta.nombre} de favoritas` : `Guardar ${receta.nombre} en favoritas`}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-card/95 text-card-foreground shadow-md backdrop-blur transition-transform duration-[var(--motion-corta)] ease-[var(--motion-ease)] active:scale-[0.98]"
        >
          <Heart
            className={`size-5 transition-colors ${esFavorita ? "fill-primary text-primary" : "text-foreground"}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-serif text-2xl font-semibold leading-tight tracking-tight">{receta.nombre}</h3>
        {completa ? (
          <div className="mt-4 rounded-2xl bg-muted p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">En pocas palabras</p>
            <p className="mt-1.5 text-pretty text-sm leading-relaxed text-foreground/80">{resumenCorto(completa)}</p>
          </div>
        ) : null}
        {completa ? (
          <dl className="mt-5 grid grid-cols-2 gap-2 text-center text-sm">
            <div>
              <dt className="sr-only">Ingredientes</dt>
              <dd className="font-semibold">{completa.ingredientes.length} ingredientes</dd>
            </div>
            <div className="border-l">
              <dt className="sr-only">Pasos</dt>
              <dd className="font-semibold">{pasos} pasos</dd>
            </div>
          </dl>
        ) : null}
        <button
          type="button"
          onClick={onOpen}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Ver receta completa
          <ArrowUpRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}
