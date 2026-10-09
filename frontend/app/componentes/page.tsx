import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GaleriaComponentes } from "@/components/nutricion/galeria";

export const metadata: Metadata = {
  title: "Componentes — Sazón",
  robots: { index: false, follow: false },
};

export default function PaginaComponentes() {
  if (process.env.NODE_ENV === "production") notFound();
  return <GaleriaComponentes />;
}
