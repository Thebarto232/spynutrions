import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { ChatNutricion } from "@/components/chat-nutricion";
import { ProveedorMotion } from "@/components/nutricion/proveedor-motion";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { variablesMotion } from "@/lib/motion";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sazón — Recetas para cocinar en casa",
  description: "Busca recetas por nombre o ingrediente, sigue los pasos y guarda las que quieres repetir.",
};

export const viewport: Viewport = {
  themeColor: "#f8f3ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${inter.variable}`} style={variablesMotion}>
      <body className="antialiased">
        <ProveedorMotion>
          <TooltipProvider>
            {children}
            <ChatNutricion />
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </ProveedorMotion>
      </body>
    </html>
  );
}
