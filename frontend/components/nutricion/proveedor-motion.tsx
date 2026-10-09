"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import { transicion } from "@/lib/motion";

export function ProveedorMotion({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={transicion()}>
      {children}
    </MotionConfig>
  );
}
