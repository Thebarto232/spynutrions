import Link from "next/link";
import { ChefHat, Search } from "lucide-react";

const links = [
  { href: "/#recetas", label: "Recetas" },
  { href: "/#portada", label: "En portada" },
  { href: "/favoritos", label: "Favoritas" },
];

export function SiteHeader({ tono = "overlay" }: { tono?: "overlay" | "solid" }) {
  return (
    <header className={tono === "overlay" ? "absolute inset-x-0 top-0 z-30" : "sticky top-0 z-30 bg-ink"}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-6 text-ink-foreground">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ChefHat className="size-5" aria-hidden="true" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-tight">Sazón</span>
        </Link>
        <nav aria-label="Principal" className="hidden md:block">
          <ul className="flex items-center gap-8 text-sm font-medium">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="opacity-80 transition-opacity hover:opacity-100">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/favoritos" className="rounded-full px-3 py-2 text-sm font-medium opacity-80 hover:opacity-100">
            Favoritas
          </Link>
          <Link
            href="/#recetas"
            className="flex items-center gap-2 rounded-full border border-ink-foreground/30 px-4 py-2 text-sm font-medium backdrop-blur transition-colors hover:bg-ink-foreground hover:text-ink"
          >
            <Search className="size-4" aria-hidden="true" />
            <span>Buscar</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
