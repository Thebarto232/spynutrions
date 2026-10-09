import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pasosUtiles, resumenCorto } from "@/lib/presentacion";
import type { Receta } from "@/lib/types";

export function Hero({ receta }: { receta: Receta | null }) {
  const pasos = receta ? pasosUtiles(receta.pasos) : [];

  return (
    <section id="portada" className="relative overflow-hidden bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-12 lg:pb-28 lg:pt-40">
        <div className="lg:col-span-6">
          {receta?.categoria ? (
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              {receta.categoria}
            </p>
          ) : null}
          <h1 className="text-balance font-serif text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            {receta?.nombre ?? "Buscando una receta…"}
          </h1>
          <p className="mt-6 max-w-lg text-pretty text-lg leading-relaxed text-ink-foreground/70">
            {receta ? resumenCorto(receta) : "En un momento aparece un plato de TheMealDB."}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            {receta ? (
              <Link
                href={`/receta/${receta.id}`}
                className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Ver esta receta
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ) : null}
            <Link
              href="/#recetas"
              className="inline-flex items-center gap-2 rounded-full px-5 py-4 text-sm font-semibold underline-offset-4 hover:underline"
            >
              Ver el recetario
            </Link>
          </div>
          {receta ? (
            <dl className="mt-14 grid max-w-md grid-cols-2 gap-6 border-t border-ink-foreground/15 pt-8">
              <div>
                <dt className="sr-only">Ingredientes</dt>
                <dd className="font-serif text-3xl font-semibold">{receta.ingredientes.length}</dd>
                <dd className="mt-1 text-xs text-ink-foreground/60">ingredientes</dd>
              </div>
              <div>
                <dt className="sr-only">Pasos</dt>
                <dd className="font-serif text-3xl font-semibold">{pasos.length}</dd>
                <dd className="mt-1 text-xs text-ink-foreground/60">pasos</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="relative lg:col-span-6">
          <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-ink-foreground/10 ring-1 ring-ink-foreground/10">
            {receta?.imagen ? (
              <Image
                src={receta.imagen}
                alt={receta.nombre}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
