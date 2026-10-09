"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChatWidget } from "@/components/nutricion/chat-widget";
import { responderLocal } from "@/lib/asistente-local";
import { ejecutarAccion, type Accion } from "@/lib/chat-acciones";
import { guardarChat, leerChat, type FuenteChat, type MensajeChat, type SugerenciaChat, type VerificacionChat } from "@/lib/chat-memoria";
import { leerPlanLocal } from "@/lib/plan-local";

export function ChatNutricion() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [memoria, setMemoria] = useState<string[]>([]);
  const [sugerencia, setSugerencia] = useState<SugerenciaChat | null>(null);
  const [verMemoria, setVerMemoria] = useState(false);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const guardado = leerChat();
    setMensajes(guardado.mensajes);
    setMemoria(guardado.memoria);
    setSugerencia(guardado.sugerencia);
  }, []);

  function persistir(siguientes: MensajeChat[], hechos: string[], propuesta: SugerenciaChat | null = sugerencia) {
    setMensajes(siguientes);
    setMemoria(hechos);
    setSugerencia(propuesta);
    guardarChat({ mensajes: siguientes, memoria: hechos, sugerencia: propuesta });
  }

  async function enviar(contenido: string) {
    const limpio = contenido.trim();
    if (!limpio || escribiendo) return;
    const previos = [...mensajes, { role: "user" as const, content: limpio }];
    persistir(previos, memoria);
    setTexto("");
    setError(null);
    setEscribiendo(true);
    try {
      const guardado = leerPlanLocal();
      const cuerpo = {
        messages: previos.slice(-20),
        perfil: guardado?.consulta ?? null,
        plan: guardado?.plan ?? null,
        memoria,
        sugerencia,
      };
      const data = await pedirRespuesta(cuerpo);
      const fuentes = Array.isArray(data.fuentes) ? data.fuentes.slice(0, 5) : [];
      const hayCita = Boolean(data.reply) || fuentes.length > 0 || data.verificacion === "no_disponible";
      let siguientes = hayCita
        ? [...previos, { role: "assistant" as const, content: data.reply || "", fuentes, verificacion: data.verificacion }]
        : previos;
      let hechos = memoria;
      for (const accion of data.acciones ?? []) {
        const resultado = await ejecutarAccion(accion, hechos);
        hechos = resultado.memoria;
        avisarAccion(accion, resultado.texto);
        siguientes = [...siguientes, { role: "assistant", content: resultado.texto }];
      }
      if (siguientes === previos) {
        siguientes = [...previos, { role: "assistant", content: "No tengo una respuesta para eso." }];
      }
      const propuesta = "sugerencia" in data ? (data.sugerencia ?? null) : sugerencia;
      persistir(siguientes, hechos, propuesta);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo enviar el mensaje.");
    } finally {
      setEscribiendo(false);
    }
  }

  function limpiarChat() {
    persistir([], memoria, null);
    setError(null);
  }

  function borrarMemoria() {
    persistir(mensajes, []);
    setVerMemoria(false);
  }

  return (
    <ChatWidget
      abierto={abierto}
      onAbierto={setAbierto}
      mensajes={mensajes}
      memoria={memoria}
      verMemoria={verMemoria}
      texto={texto}
      escribiendo={escribiendo}
      error={error}
      onTexto={setTexto}
      onEnviar={(contenido) => void enviar(contenido)}
      onToggleMemoria={() => setVerMemoria((valor) => !valor)}
      onLimpiar={limpiarChat}
      onBorrarMemoria={borrarMemoria}
    />
  );
}

function avisarAccion(accion: Accion, texto: string) {
  if (accion.nombre === "reemplazar_receta" && texto.startsWith("Cambié")) {
    toast.success("Comida actualizada", { description: texto });
  }
  if (accion.nombre === "generar_lista_compras" && texto.startsWith("Lista de compras")) {
    toast.success("Lista actualizada", { description: "La encuentras debajo de la semana." });
    window.dispatchEvent(new CustomEvent("sazon-lista-lista"));
  }
}

type RespuestaChat = {
  reply?: string;
  acciones?: Accion[];
  fuentes?: FuenteChat[];
  verificacion?: VerificacionChat;
  sugerencia?: SugerenciaChat | null;
  error?: string;
};

async function pedirRespuesta(cuerpo: {
  messages: MensajeChat[];
  perfil: unknown;
  plan: unknown;
  memoria: string[];
  sugerencia: SugerenciaChat | null;
}): Promise<RespuestaChat> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    const data = (await response.json()) as RespuestaChat;
    if (!response.ok) throw new Error(data.error || "No se pudo enviar el mensaje.");
    return data;
  } catch {
    return responderLocal(cuerpo);
  }
}
