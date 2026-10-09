"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { curva, duracion } from "@/lib/motion";

export function NumeroAnimado({ valor, decimales = 0 }: { valor: number; decimales?: number }) {
  const reducido = useReducedMotion();
  const [texto, setTexto] = useState(() => formatear(valor, decimales));

  useEffect(() => {
    if (reducido !== false) {
      setTexto(formatear(valor, decimales));
      return;
    }
    const controles = animate(0, valor, {
      duration: duracion.larga,
      ease: curva,
      onUpdate: (actual) => setTexto(formatear(actual, decimales)),
    });
    return () => controles.stop();
  }, [valor, decimales, reducido]);

  return <span className="tabular-nums">{texto}</span>;
}

function formatear(valor: number, decimales: number) {
  return decimales > 0 ? valor.toFixed(decimales) : String(Math.round(valor));
}
