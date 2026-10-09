export type FuenteChat = {
  titulo: string;
  anio: string;
  revista: string;
  tipo: string;
  pmid: string;
  url: string;
};

export type VerificacionChat = "omitida" | "ok" | "insuficiente" | "no_disponible";

export type MensajeChat = {
  role: "user" | "assistant";
  content: string;
  fuentes?: FuenteChat[];
  verificacion?: VerificacionChat;
};

export type SugerenciaChat = {
  id: string;
  nombre: string;
  dia: "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";
  comida: "desayuno" | "almuerzo" | "cena";
  categoria?: string;
};

export type EstadoChat = {
  mensajes: MensajeChat[];
  memoria: string[];
  sugerencia: SugerenciaChat | null;
};

const CLAVE = "sazon.chat";

export function leerChat(): EstadoChat {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return { mensajes: [], memoria: [], sugerencia: null };
    const data = JSON.parse(crudo) as Partial<EstadoChat>;
    return {
      mensajes: Array.isArray(data.mensajes)
        ? data.mensajes.map(limpiarMensaje).filter((item): item is MensajeChat => item !== null).slice(-20)
        : [],
      memoria: Array.isArray(data.memoria)
        ? data.memoria.filter((item) => typeof item === "string" && item.trim()).slice(0, 30)
        : [],
      sugerencia: leerSugerencia(data.sugerencia),
    };
  } catch {
    return { mensajes: [], memoria: [], sugerencia: null };
  }
}

export function guardarChat(estado: EstadoChat) {
  localStorage.setItem(
    CLAVE,
    JSON.stringify({
      mensajes: estado.mensajes.slice(-20),
      memoria: estado.memoria.slice(0, 30),
      sugerencia: estado.sugerencia,
    }),
  );
}

const VERIFICACIONES: VerificacionChat[] = ["omitida", "ok", "insuficiente", "no_disponible"];

function limpiarMensaje(item: unknown): MensajeChat | null {
  if (!item || typeof item !== "object") return null;
  const mensaje = item as MensajeChat;
  if ((mensaje.role !== "user" && mensaje.role !== "assistant") || typeof mensaje.content !== "string") return null;
  const fuentes = Array.isArray(mensaje.fuentes) ? mensaje.fuentes.filter(esFuente).slice(0, 5) : undefined;
  const verificacion = VERIFICACIONES.includes(mensaje.verificacion as VerificacionChat) ? mensaje.verificacion : undefined;
  return { role: mensaje.role, content: mensaje.content, fuentes, verificacion };
}

function leerSugerencia(item: unknown): SugerenciaChat | null {
  if (!item || typeof item !== "object") return null;
  const sugerencia = item as SugerenciaChat;
  const dias = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
  const comidas = ["desayuno", "almuerzo", "cena"];
  if (typeof sugerencia.id !== "string" || !sugerencia.id.trim()) return null;
  if (!dias.includes(sugerencia.dia) || !comidas.includes(sugerencia.comida)) return null;
  if (typeof sugerencia.nombre !== "string" || !sugerencia.nombre.trim()) return null;
  return {
    id: sugerencia.id.slice(0, 20),
    nombre: sugerencia.nombre.slice(0, 120),
    dia: sugerencia.dia,
    comida: sugerencia.comida,
    categoria: typeof sugerencia.categoria === "string" ? sugerencia.categoria.slice(0, 40) : undefined,
  };
}

function esFuente(item: unknown): item is FuenteChat {
  if (!item || typeof item !== "object") return false;
  const fuente = item as FuenteChat;
  return (
    typeof fuente.titulo === "string" &&
    typeof fuente.anio === "string" &&
    typeof fuente.revista === "string" &&
    typeof fuente.tipo === "string" &&
    typeof fuente.pmid === "string" &&
    typeof fuente.url === "string"
  );
}
