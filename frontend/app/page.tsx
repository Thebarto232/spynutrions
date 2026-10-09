import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  buscarPorCategoria,
  buscarPorIngredientes,
  buscarRecetas,
  listarFavoritos,
  obtenerCategorias,
  recetaAleatoria,
} from "@/lib/api";
import { Hero } from "@/components/hero";
import { Recetario } from "@/components/recetario";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Favorito, Receta, RecetaResumen } from "@/lib/types";

const CATEGORIA_INICIAL = "Chicken";

function RecetasEsqueleto() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24" aria-busy="true" aria-live="polite">
      <p className="text-sm text-muted-foreground">Buscando recetas…</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, indice) => (
          <Skeleton key={indice} className="h-80 rounded-3xl" aria-hidden="true" />
        ))}
      </div>
    </div>
  );
}

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; i?: string; c?: string }>;
}) {
  return (
    <>
      <SiteHeader tono="overlay" />
      <main>
        <Suspense fallback={<RecetasEsqueleto />}>
          <Inicio searchParams={searchParams} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Inicio({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; i?: string; c?: string }>;
}) {
  const params = await searchParams;
  const consulta = params.q?.trim() ?? "";
  const ingredientes = params.i?.trim() ?? "";
  const categoria = params.c?.trim() || (!consulta && !ingredientes ? CATEGORIA_INICIAL : "");

  const destacadaPromise = recetaAleatoria().catch(() => null);
  const categoriasPromise = obtenerCategorias().catch(() => []);
  const favoritasPromise = listarFavoritos().catch(() => [] as Favorito[]);

  let recetas: (Receta | RecetaResumen)[] = [];
  let error: string | null = null;
  const listaPromise = consulta
    ? buscarRecetas(consulta)
    : ingredientes
      ? buscarPorIngredientes(ingredientes)
      : categoria
        ? buscarPorCategoria(categoria)
        : Promise.resolve([]);

  const [destacada, categorias, favoritas, lista] = await Promise.all([
    destacadaPromise,
    categoriasPromise,
    favoritasPromise,
    listaPromise.catch((caught: unknown) => {
      error = caught instanceof Error ? caught.message : "No se pudo buscar.";
      return [] as (Receta | RecetaResumen)[];
    }),
  ]);
  recetas = lista;

  return (
    <>
      <Hero receta={destacada} />
      <Recetario
        consulta={consulta}
        ingredientes={ingredientes}
        categoriaActiva={categoria}
        categorias={categorias.map((item) => ({
          clave: item.nombre,
          etiqueta: item.etiqueta || item.nombre,
        }))}
        recetas={recetas}
        favoritas={favoritas}
        error={error}
      />
    </>
  );
}
