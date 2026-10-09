import type { CSSProperties } from "react";

/** Única fuente de duraciones y curvas. 150–300 ms. El CSS lee las variables de `variablesMotion`. */
export const duracion = {
  corta: 0.15,
  media: 0.22,
  larga: 0.3,
} as const;

export const curva = [0.22, 1, 0.36, 1] as const;

export const desplazamiento = 8;

export const stagger = 0.04;

/** Cuánto permanece el resalte. La entrada y la salida usan `duracion.media`. */
export const resalteMs = 900;

export function transicion(clave: keyof typeof duracion = "media", espera = 0) {
  return {
    type: "tween" as const,
    duration: duracion[clave],
    ease: curva,
    delay: espera,
  };
}

export const variablesMotion = {
  "--motion-corta": `${duracion.corta * 1000}ms`,
  "--motion-media": `${duracion.media * 1000}ms`,
  "--motion-larga": `${duracion.larga * 1000}ms`,
  "--motion-ease": `cubic-bezier(${curva.join(", ")})`,
  "--motion-shift": `${desplazamiento}px`,
} as CSSProperties;

export const varianteEntrada = {
  initial: { opacity: 0, y: desplazamiento },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -desplazamiento },
};

export const variantesLista = {
  oculto: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: stagger },
  },
};

export const variantesItem = {
  oculto: { opacity: 0, y: desplazamiento },
  visible: { opacity: 1, y: 0, transition: transicion("media") },
};

export const elevacion = { y: -2, transition: transicion("corta") };
