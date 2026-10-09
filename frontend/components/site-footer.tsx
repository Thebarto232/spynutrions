import Link from "next/link";
import { ChefHat } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 py-10 text-sm text-ink-foreground/70 sm:flex-row sm:items-center">
        <Link href="/" className="flex items-center gap-2 text-ink-foreground">
          <ChefHat className="size-5 text-primary" aria-hidden="true" />
          <span className="font-serif text-xl font-semibold">Sazón</span>
        </Link>
        <p>
          Recetas e imágenes de{" "}
          <a href="https://www.themealdb.com/" className="underline underline-offset-4">
            TheMealDB
          </a>
          .
        </p>
        <Link href="/plan" className="font-medium text-ink-foreground">
          Plan semanal
        </Link>
      </div>
    </footer>
  );
}
