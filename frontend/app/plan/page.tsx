import type { Metadata } from "next";
import { ConsultaPlan } from "@/components/consulta-plan";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Plan semanal — Sazón",
  description: "Una guía de comidas de la semana a partir de tus datos y recetas de TheMealDB.",
};

export default function PlanPage() {
  return (
    <>
      <div className="print:hidden">
        <SiteHeader tono="solid" />
      </div>
      <main className="mx-auto min-h-[70vh] max-w-7xl px-6 pt-16 pb-28 print:max-w-none print:px-0 print:pt-0 print:pb-0">
        <header className="mx-auto w-full max-w-3xl print:hidden">
          <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl">Consulta nutricional</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Cuéntanos cómo comes y armamos siete días de desayuno, almuerzo y cena con recetas reales.
            Las calorías son una estimación.
          </p>
        </header>
        <div className="mt-10 print:mt-0">
          <ConsultaPlan />
        </div>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </>
  );
}
