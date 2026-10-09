"use client";

import { motion, useReducedMotion } from "motion/react";
import { curva, duracion } from "@/lib/motion";

export function Escribiendo() {
  const reducido = useReducedMotion();
  return (
    <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
      Escribiendo…
      {reducido ? null : (
        <span className="inline-flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((indice) => (
            <motion.span
              key={indice}
              className="size-1.5 rounded-full bg-current"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: duracion.larga, repeat: Infinity, delay: indice * 0.08, ease: curva }}
            />
          ))}
        </span>
      )}
    </p>
  );
}
