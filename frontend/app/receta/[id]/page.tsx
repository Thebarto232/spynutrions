import { Suspense } from "react";
import { listarFavoritos, obtenerReceta } from "@/lib/api";
import { ContenidoReceta } from "@/components/recipe-dialog";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function RecetaPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <>
      <SiteHeader tono="solid" />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-8">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Abriendo la receta…</p>}>
          <Detalle params={params} />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Detalle({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let receta;
  try {
    receta = await obtenerReceta(id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No encontramos esa receta.";
    return <p className="text-sm text-muted-foreground">{message}</p>;
  }

  let favoritoId: number | null = null;
  try {
    const favoritos = await listarFavoritos();
    favoritoId = favoritos.find((favorito) => favorito.receta.id === receta.id)?.id ?? null;
  } catch {
    favoritoId = null;
  }

  return (
    <article className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      {/* v0: detalle */}
      <ContenidoReceta receta={receta} favoritoId={favoritoId} />
    </article>
  );
}
