"use client";

import { motion } from "motion/react";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { FuentesList, fuentesDelMensaje } from "@/components/nutricion/fuentes-list";
import { transicion, varianteEntrada } from "@/lib/motion";
import type { MensajeChat } from "@/lib/chat-memoria";

export function ChatBubble({ mensaje }: { mensaje: MensajeChat }) {
  const usuario = mensaje.role === "user";
  const nota = mensaje.verificacion === "no_disponible" ? "No pude verificar fuentes en este momento" : null;
  return (
    <motion.div initial={varianteEntrada.initial} animate={varianteEntrada.animate} transition={transicion("corta")}>
    <Bubble align={usuario ? "end" : "start"} variant={usuario ? "default" : "muted"}>
      <BubbleContent className="whitespace-pre-wrap">
        {mensaje.content}
        {usuario ? null : <FuentesList fuentes={fuentesDelMensaje(mensaje)} compacta nota={nota} />}
      </BubbleContent>
    </Bubble>
    </motion.div>
  );
}
