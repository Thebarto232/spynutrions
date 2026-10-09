"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, ChefHat, Heart, ListChecks, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { guardarFavorito, quitarFavorito } from "@/lib/api-cliente";
import { duracion } from "@/lib/motion";
import { resumenCorto, textoIngrediente, pasosUtiles } from "@/lib/presentacion";
import type { Receta } from "@/lib/types";

type Tab = "resumen" | "ingredientes" | "pasos";

const tabs: { id: Tab; label: string; icon: typeof Sparkles }[] = [
  { id: "resumen", label: "Resumen", icon: Sparkles },
  { id: "ingredientes", label: "Ingredientes", icon: ListChecks },
  { id: "pasos", label: "Pasos", icon: ChefHat },
];

export function ContenidoReceta({
  receta,
  favoritoId,
  onClose,
  onFavoritoChange,
}: {
  receta: Receta;
  favoritoId: number | null;
  onClose?: () => void;
  onFavoritoChange?: (id: number | null) => void;
}) {
  const [tab, setTab] = useState<Tab>("resumen");
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
  const [guardadaId, setGuardadaId] = useState<number | null>(favoritoId);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const toggle = (set: Set<number>, index: number) => {
    const next = new Set(set);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    return next;
  };

  const pasos = pasosUtiles(receta.pasos);
  const totalPasos = Math.max(pasos.length, 1);
  const progress = pasos.length === 0 ? 0 : Math.round((doneSteps.size / totalPasos) * 100);
  const currentStep = pasos.findIndex((_, index) => !doneSteps.has(index));

  async function alternarFavorita() {
    setOcupado(true);
    setAviso(null);
    try {
      if (guardadaId !== null) {
        await quitarFavorito(guardadaId);
        setGuardadaId(null);
        onFavoritoChange?.(null);
      } else {
        const creada = await guardarFavorito(receta.id);
        setGuardadaId(creada.id);
        onFavoritoChange?.(creada.id);
      }
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "No se pudo actualizar la favorita.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="grid h-full md:grid-cols-[2fr_3fr]">
      <div className="relative hidden min-h-80 md:block">
        {receta.imagen ? (
          <Image src={receta.imagen} alt={receta.nombre} fill unoptimized sizes="40vw" className="object-cover" />
        ) : (
          <div className="absolute inset-0 bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-6 bottom-6 text-ink-foreground">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Tu progreso</p>
          <Progress value={progress} className="mt-2" />
          <p className="mt-2 text-sm font-medium">
            {progress === 100
              ? "Listo para servir."
              : `${doneSteps.size} de ${pasos.length} pasos completados`}
          </p>
        </div>
      </div>

      <div className="flex min-h-0 flex-col">
        <header className="border-b px-6 pt-6 md:px-8 md:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              {receta.categoria ? (
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{receta.categoria}</p>
              ) : null}
              <h2 id="recipe-dialog-title" className="mt-1.5 font-serif text-3xl font-semibold leading-tight tracking-tight">
                {receta.nombre}
              </h2>
            </div>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="rounded-full"
                      onClick={alternarFavorita}
                      disabled={ocupado}
                      aria-pressed={guardadaId !== null}
                      aria-label={guardadaId !== null ? "Quitar de favoritas" : "Guardar en favoritas"}
                    />
                  }
                >
                  <Heart className={guardadaId !== null ? "fill-primary text-primary" : undefined} aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>{guardadaId !== null ? "Quitar de favoritas" : "Guardar en favoritas"}</TooltipContent>
              </Tooltip>
              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full bg-muted p-2 transition-colors hover:bg-secondary"
                  aria-label="Cerrar receta"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              ) : (
                <Link href="/" className="rounded-full bg-muted px-3 py-2 text-sm font-medium hover:bg-secondary">
                  Volver
                </Link>
              )}
            </div>
          </div>
          {aviso ? <p className="mt-3 text-sm text-muted-foreground">{aviso}</p> : null}

          <div role="tablist" aria-label="Secciones de la receta" className="mt-5 flex gap-1">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                id={`tab-${id}`}
                role="tab"
                type="button"
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={`relative flex items-center gap-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors ${
                  tab === id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
                <span
                  className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary transition-transform duration-300 ${
                    tab === id ? "scale-x-100" : "scale-x-0"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </header>

        <div
          id={`panel-${tab}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          key={tab}
          className="min-h-0 flex-1 animate-in fade-in slide-in-from-bottom-2 overflow-y-auto px-6 py-6 duration-300 md:px-8"
        >
          {tab === "resumen" && (
            <div className="space-y-6">
              <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted md:hidden">
                {receta.imagen ? <Image src={receta.imagen} alt="" fill unoptimized sizes="100vw" className="object-cover" /> : null}
              </div>
              <div className="rounded-2xl border-l-4 border-primary bg-muted p-5">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">En pocas palabras</p>
                <p className="mt-2 text-pretty leading-relaxed">{resumenCorto(receta)}</p>
              </div>
              <dl className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border p-4 text-center">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Ingredientes</dt>
                  <dd className="font-semibold">{receta.ingredientes.length}</dd>
                </div>
                <div className="rounded-2xl border p-4 text-center">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">Pasos</dt>
                  <dd className="font-semibold">{pasos.length}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => setTab("ingredientes")}
                className="w-full rounded-full bg-ink py-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Empezar a cocinar
              </button>
              {onClose ? (
                <Link href={`/receta/${receta.id}`} className="block text-center text-sm font-medium text-primary">
                  Abrir en su página
                </Link>
              ) : null}
            </div>
          )}

          {tab === "ingredientes" && (
            <div>
              <p className="text-sm text-muted-foreground">
                Toca cada ingrediente cuando lo tengas listo · {checkedIngredients.size}/{receta.ingredientes.length}
              </p>
              <ul className="mt-4 space-y-2">
                {receta.ingredientes.map((item, index) => {
                  const checked = checkedIngredients.has(index);
                  const texto = textoIngrediente(item);
                  return (
                    <li key={`${texto}-${index}`}>
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={checked}
                        onClick={() => setCheckedIngredients((current) => toggle(current, index))}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition-transform duration-[var(--motion-corta)] ease-[var(--motion-ease)] active:scale-[0.98] ${
                          checked ? "border-primary/40 bg-primary/5 text-muted-foreground" : "hover:border-foreground/30 hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                          aria-hidden="true"
                        >
                          <Check
                            className={`size-3.5 transition-opacity duration-[var(--motion-corta)] ease-[var(--motion-ease)] ${
                              checked ? "opacity-100" : "opacity-0"
                            }`}
                            strokeWidth={3}
                          />
                        </span>
                        <span className={checked ? "line-through" : ""}>{texto}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={() => setTab("pasos")}
                className="mt-6 w-full rounded-full bg-ink py-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                Ir a los pasos
              </button>
            </div>
          )}

          {tab === "pasos" && (
            <div>
              <div className="md:hidden">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {doneSteps.size} de {pasos.length} pasos
                </p>
              </div>
              <p className="text-sm text-muted-foreground max-md:mt-4">Marca cada paso al terminarlo para seguir tu avance.</p>
              <ol className="mt-4 space-y-3">
                {pasos.map((step, index) => {
                  const done = doneSteps.has(index);
                  const active = index === currentStep;
                  return (
                    <li key={`${index}-${step}`}>
                      <button
                        type="button"
                        aria-pressed={done}
                        onClick={() => setDoneSteps((current) => toggle(current, index))}
                        className={`flex w-full gap-4 rounded-2xl border p-4 text-left transition-all ${
                          active ? "border-primary bg-primary/5 shadow-sm" : done ? "opacity-60" : "hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-full font-serif text-sm font-semibold transition-colors ${
                            done ? "bg-primary text-primary-foreground" : active ? "bg-ink text-ink-foreground" : "bg-muted"
                          }`}
                          aria-hidden="true"
                        >
                          {done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                        </span>
                        <span className="pt-1 text-sm leading-relaxed">
                          {active ? (
                            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-widest text-primary">
                              Paso actual
                            </span>
                          ) : null}
                          <span className={done ? "line-through" : ""}>{step}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {progress === 100 && pasos.length > 0 ? (
                <p className="mt-6 animate-in zoom-in-95 rounded-2xl bg-accent/20 p-4 text-center font-serif text-lg font-semibold duration-300">
                  Buen provecho. Tu plato está listo.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RecipeDialog({
  receta,
  favoritoId,
  onClose,
  onFavoritoChange,
}: {
  receta: Receta | null;
  favoritoId: number | null;
  onClose: () => void;
  onFavoritoChange?: (id: number | null) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (receta && !dialog.open) {
      dialog.showModal();
      return;
    }
    if (!receta && dialog.open) {
      const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducido) {
        dialog.close();
        return;
      }
      dialog.dataset.closing = "true";
      const timer = window.setTimeout(() => {
        delete dialog.dataset.closing;
        if (dialog.open) dialog.close();
      }, duracion.media * 1000);
      return () => window.clearTimeout(timer);
    }
  }, [receta]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      aria-labelledby="recipe-dialog-title"
      className="receta-dialog m-auto h-[min(44rem,92vh)] w-[min(64rem,calc(100%-1.5rem))] overflow-hidden rounded-3xl bg-card p-0 text-card-foreground shadow-2xl"
    >
      {receta ? (
        <ContenidoReceta
          key={receta.id}
          receta={receta}
          favoritoId={favoritoId}
          onClose={onClose}
          onFavoritoChange={onFavoritoChange}
        />
      ) : null}
    </dialog>
  );
}
