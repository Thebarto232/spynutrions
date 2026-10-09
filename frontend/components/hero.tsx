import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pasosUtiles, resumenCorto } from "@/lib/presentacion";
import type { Receta } from "@/lib/types";

export function Hero({ receta }: { receta: Receta | null }) {
  const pasos = receta ? pasosUtiles(receta.pasos) : [];

  return (
    <section id="portada" className="relative isolate bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-6 pb-12 pt-28 lg:min-h-svh lg:grid-cols-12 lg:gap-12 lg:py-16">
        <div className="lg:col-span-6">
          {receta?.categoria ? (
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-ink-foreground/10 px-3 py-1 text-xs font-medium uppercase tracking-widest text-accent">
              <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
              {receta.categoria}
            </p>
          ) : null}
          <h1 className="text-balance font-serif text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
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
            <dl className="mt-8 grid max-w-md grid-cols-2 gap-4 border-t border-ink-foreground/15 pt-6">
              <div>
                <dt className="text-xs text-ink-foreground/60">Ingredientes</dt>
                <dd className="font-serif text-3xl font-semibold">{receta.ingredientes.length}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-foreground/60">Pasos</dt>
                <dd className="font-serif text-3xl font-semibold">{pasos.length}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        <div className="relative lg:col-span-6">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[2rem] bg-ink-foreground/10 ring-1 ring-ink-foreground/10 sm:aspect-square lg:aspect-auto lg:h-[min(28rem,calc(100svh-12rem))] lg:w-[min(28rem,calc(100svh-12rem))] lg:max-w-full">
            {receta?.imagen ? (
              <Image
                src={receta.imagen}
                alt={receta.nombre}
                fill
                priority
                unoptimized
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
