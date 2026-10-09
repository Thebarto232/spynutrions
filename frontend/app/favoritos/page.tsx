import { Suspense } from "react";
import { listarFavoritos } from "@/lib/api";
import { ListaFavoritas } from "@/components/lista-favoritas";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function FavoritosPage() {
  return (
    <>
      <SiteHeader tono="solid" />
      <main className="mx-auto min-h-[70vh] max-w-7xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Favoritas</p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Las que quieres repetir</h1>
        <div className="mt-10">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Revisando tus favoritas…</p>}>
            <Listado />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

async function Listado() {
  try {
    const favoritos = await listarFavoritos();
    return <ListaFavoritas favoritas={favoritos} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron leer las favoritas.";
    return <p className="text-sm text-muted-foreground">{message}</p>;
  }
}
