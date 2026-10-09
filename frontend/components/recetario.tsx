"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { guardarFavorito, obtenerReceta, quitarFavorito } from "@/lib/api-cliente";
import { RecipeCard } from "@/components/recipe-card";
import { RecipeDialog } from "@/components/recipe-dialog";
import { sorprender } from "@/app/actions";
import { esRecetaCompleta } from "@/lib/presentacion";
import type { Favorito, Receta, RecetaResumen } from "@/lib/types";

export function Recetario({
  consulta,
  ingredientes,
  categoriaActiva,
  categorias,
  recetas,
  favoritas,
  error,
}: {
  consulta: string;
  ingredientes: string;
  categoriaActiva: string;
  categorias: { clave: string; etiqueta: string }[];
  recetas: (Receta | RecetaResumen)[];
  favoritas: Favorito[];
  error: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [texto, setTexto] = useState(ingredientes || consulta);
  const [porIngrediente, setPorIngrediente] = useState(Boolean(ingredientes) && !consulta);
  const [soloFavoritas, setSoloFavoritas] = useState(false);
  const [guardadas, setGuardadas] = useState(favoritas);
  const [seleccionada, setSeleccionada] = useState<Receta | null>(null);
  const [abriendo, setAbriendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(error);
  const [elegida, setElegida] = useState<string | null>(null);
  const [buscandoTexto, setBuscandoTexto] = useState(false);

  useEffect(() => {
    setTexto(ingredientes || consulta);
    setPorIngrediente(Boolean(ingredientes) && !consulta);
    setGuardadas(favoritas);
    setAviso(error);
    setSeleccionada(null);
    setElegida(null);
    setBuscandoTexto(false);
  }, [consulta, ingredientes, categoriaActiva, favoritas, error]);

  function buscar(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    const valor = texto.trim();
    if (valor) params.set(porIngrediente ? "i" : "q", valor);
    setSoloFavoritas(false);
    setElegida(null);
    setBuscandoTexto(true);
    startTransition(() => router.push(`/?${params.toString()}#recetas`));
  }

  const base = soloFavoritas ? guardadas.map((favorito) => favorito.receta) : recetas;
  const filtro = texto.trim().toLowerCase();
  const visibles =
    soloFavoritas && filtro
      ? base.filter(
          (receta) =>
            receta.nombre.toLowerCase().includes(filtro) ||
            (receta.categoria ?? "").toLowerCase().includes(filtro),
        )
      : base;

  async function abrir(receta: Receta | RecetaResumen) {
    if (esRecetaCompleta(receta)) {
      setSeleccionada(receta);
      return;
    }
    setAbriendo(true);
    setAviso(null);
    try {
      setSeleccionada(await obtenerReceta(receta.id));
    } catch (caught) {
      setAviso(caught instanceof Error ? caught.message : "No se pudo abrir la receta.");
    } finally {
      setAbriendo(false);
    }
  }

  async function alternar(receta: Receta | RecetaResumen) {
    const actual = guardadas.find((favorito) => favorito.receta.id === receta.id);
    setAviso(null);
    try {
      if (actual) {
        await quitarFavorito(actual.id);
        setGuardadas((prev) => prev.filter((favorito) => favorito.id !== actual.id));
      } else {
        const creada = await guardarFavorito(receta.id);
        setGuardadas((prev) => [...prev.filter((favorito) => favorito.receta.id !== receta.id), creada]);
      }
    } catch (caught) {
      setAviso(caught instanceof Error ? caught.message : "No se pudo actualizar la favorita.");
    }
  }

  const favoritoAbierto = seleccionada
    ? guardadas.find((favorito) => favorito.receta.id === seleccionada.id)?.id ?? null
    : null;
  const claveActiva = elegida ?? categoriaActiva;
  const categoriaVisible = categorias.find((item) => item.clave === claveActiva);
  const titulo = consulta
    ? consulta
    : ingredientes
      ? ingredientes
      : (categoriaVisible?.etiqueta ?? "Recetas");
  const categoriaSeleccionada = (clave: string) =>
    !consulta && !ingredientes && !soloFavoritas && claveActiva === clave;

  return (
    <section id="recetas" className="mx-auto max-w-7xl scroll-mt-8 px-6 py-16 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <h2 className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">{titulo}</h2>
        <p className="pb-2 text-sm text-muted-foreground" aria-live="polite">
          {pending ? "Buscando…" : `${visibles.length} ${visibles.length === 1 ? "receta" : "recetas"}`}
        </p>
      </div>

      <form onSubmit={buscar} className="mt-8 flex flex-wrap items-center gap-3">
        <label className="relative min-w-72 flex-1">
          <span className="sr-only">{porIngrediente ? "Buscar por ingredientes" : "Buscar recetas"}</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder={porIngrediente ? "pollo, tomate" : "Busca un plato…"}
            className="h-12 w-full rounded-full border bg-card pl-11 pr-32 text-sm outline-none focus:ring-2 focus:ring-ring [&::-webkit-search-cancel-button]:hidden"
          />
          <button
            type="submit"
            className="absolute right-1 top-1 h-10 rounded-full bg-ink px-5 text-sm font-semibold text-ink-foreground"
          >
            {buscandoTexto && pending ? "Buscando…" : "Buscar"}
          </button>
        </label>
        <button
          type="submit"
          form="azar"
          className="h-12 shrink-0 rounded-full border px-5 text-sm font-medium hover:bg-card"
        >
          Una al azar
        </button>
        <button
          type="button"
          onClick={() => setPorIngrediente((value) => !value)}
          aria-pressed={porIngrediente}
          className={`h-12 shrink-0 rounded-full border px-5 text-sm font-medium ${
            porIngrediente ? "border-ink bg-ink text-ink-foreground" : "hover:bg-card"
          }`}
        >
          Por ingrediente
        </button>
        <button
          type="button"
          onClick={() => setSoloFavoritas((value) => !value)}
          aria-pressed={soloFavoritas}
          className={`flex h-12 shrink-0 items-center gap-2 rounded-full border px-5 text-sm font-medium ${
            soloFavoritas ? "border-ink bg-ink text-ink-foreground" : "hover:bg-card"
          }`}
        >
          <Heart className={`size-4 ${soloFavoritas ? "fill-current" : ""}`} aria-hidden="true" />
          Favoritas
          {guardadas.length > 0 ? <span className="tabular-nums">{guardadas.length}</span> : null}
        </button>
      </form>
      <form id="azar" action={sorprender} className="hidden" />

      <div className="mt-5 border-b border-border pb-4">
        <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-x-1 gap-y-1">
          {categorias.map((categoria) => {
            const activa = categoriaSeleccionada(categoria.clave);
            return (
              <button
                key={categoria.clave}
                type="button"
                onClick={() => {
                  setSoloFavoritas(false);
                  setPorIngrediente(false);
                  setTexto("");
                  setBuscandoTexto(false);
                  setElegida(categoria.clave);
                  startTransition(() => router.push(`/?c=${encodeURIComponent(categoria.clave)}#recetas`));
                }}
                aria-pressed={activa}
                className={`rounded-full px-3.5 py-1.5 text-sm outline-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  activa
                    ? "bg-ink font-semibold text-ink-foreground"
                    : "text-foreground/80 hover:bg-secondary"
                }`}
              >
                {categoria.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      {aviso ? <p className="mt-6 text-sm text-muted-foreground">{aviso}</p> : null}
      {abriendo ? <p className="mt-6 text-sm text-muted-foreground">Abriendo la receta…</p> : null}

      {pending ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8" aria-busy="true" aria-live="polite">
          <p className="sr-only">Buscando recetas…</p>
          {Array.from({ length: 6 }, (_, indice) => (
            <Skeleton key={indice} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : visibles.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {visibles.map((receta) => (
            <RecipeCard
              key={receta.id}
              receta={receta}
              esFavorita={guardadas.some((favorito) => favorito.receta.id === receta.id)}
              onToggleFavorita={() => alternar(receta)}
              onOpen={() => abrir(receta)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed p-12 text-center text-muted-foreground">
          <p>
            {soloFavoritas
              ? "Aún no tienes favoritas. Toca el corazón de una receta para guardarla."
              : consulta || ingredientes
                ? "No hay platos con esa búsqueda."
                : "Esta categoría no devolvió platos."}
          </p>
        </div>
      )}

      <RecipeDialog
        receta={seleccionada}
        favoritoId={favoritoAbierto}
        onClose={() => setSeleccionada(null)}
        onFavoritoChange={(id) => {
          if (!seleccionada) return;
          const receta = seleccionada;
          setGuardadas((prev) => {
            if (id === null) return prev.filter((favorito) => favorito.receta.id !== receta.id);
            if (prev.some((favorito) => favorito.receta.id === receta.id)) {
              return prev.map((favorito) => (favorito.receta.id === receta.id ? { ...favorito, id } : favorito));
            }
            return [...prev, { id, receta }];
          });
        }}
      />
    </section>
  );
}
