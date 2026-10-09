import { prepararContextoEvidencia } from "../../lib/evidencia";
import { clasificarPregunta } from "../../lib/triggers";
import { responderLocal } from "../../lib/asistente-local";
import { sistema } from "./system-prompt";

const MODELO = process.env.CHAT_MODEL || "claude-sonnet-5-5";
const MAX_MENSAJES = 20;
const MAX_TEXTO = 2000;
const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const COMIDAS = ["desayuno", "almuerzo", "cena"];

const HERRAMIENTAS = [
  {
    name: "reemplazar_receta",
    description: "Pide cambiar una comida del plan. No busques la receta tú: el sitio lo hace en TheMealDB.",
    input_schema: {
      type: "object",
      properties: {
        dia: { type: "string", enum: DIAS },
        comida: { type: "string", enum: COMIDAS },
        motivo: { type: "string" },
        categoria: { type: "string" },
        ingrediente_principal: { type: "string" },
      },
      required: ["dia", "comida", "motivo"],
    },
  },
  {
    name: "generar_lista_compras",
    description: "Pide la lista de compras del plan que ya está guardado.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "guardar_dato_usuario",
    description: "Guarda un dato breve que el asistente debe recordar, por ejemplo un disgusto o una alergia.",
    input_schema: {
      type: "object",
      properties: { hecho: { type: "string" } },
      required: ["hecho"],
    },
  },
];

export default async function handler(req, res) {
  if (!permitirOrigen(req, res)) return;
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Usa POST." });
    return;
  }

  const cuerpo = leerCuerpo(req, res);
  if (!cuerpo) return;

  const pregunta = cuerpo.messages[cuerpo.messages.length - 1].content;
  if (!claveUtil(process.env.ANTHROPIC_API_KEY)) {
    res.status(200).json(await respuestaLocal(cuerpo, pregunta));
    return;
  }

  let evidencia;
  try {
    evidencia = await prepararContextoEvidencia({
      pregunta,
      anthropicKey: process.env.ANTHROPIC_API_KEY,
      modelo: MODELO,
      ncbiKey: process.env.NCBI_API_KEY || "",
    });
  } catch {
    evidencia = { verificacion: "no_disponible", fuentes: [], bloque: "ESTADO: evidencia no disponible" };
  }

  let respuesta;
  try {
    respuesta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1200,
        system: sistema({ ...cuerpo, evidencia: evidencia.bloque }),
        messages: cuerpo.messages,
        tools: HERRAMIENTAS,
      }),
    });
  } catch {
    res.status(200).json(await alFallarModelo(cuerpo, evidencia));
    return;
  }

  if (!respuesta.ok) {
    res.status(200).json(await alFallarModelo(cuerpo, evidencia));
    return;
  }

  const data = await respuesta.json();
  const bloques = Array.isArray(data.content) ? data.content : [];
  const reply = bloques
    .filter((bloque) => bloque.type === "text" && typeof bloque.text === "string")
    .map((bloque) => bloque.text.trim())
    .filter(Boolean)
    .join("\n");
  const acciones = bloques.filter((bloque) => bloque.type === "tool_use").map(normalizarAccion).filter(Boolean);

  res.status(200).json({ reply, acciones, fuentes: evidencia.fuentes, verificacion: evidencia.verificacion });
}

function permitirOrigen(req, res) {
  const permitidos = (process.env.SITE_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
    .split(",")
    .map((origen) => origen.trim())
    .filter(Boolean);
  const origen = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const mismoSitio = typeof origen === "string" && typeof host === "string" && (origen === `https://${host}` || origen === `http://${host}`);
  if (origen && !permitidos.includes(origen) && !mismoSitio) {
    res.status(403).json({ error: "Origen no permitido." });
    return false;
  }
  res.setHeader("Access-Control-Allow-Origin", origen && permitidos.includes(origen) ? origen : permitidos[0]);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return true;
}

function leerCuerpo(req, res) {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ error: "El cuerpo debe ser un objeto con messages, perfil, plan y memoria." });
    return null;
  }
  if (JSON.stringify(body).length > 120000) {
    res.status(413).json({ error: "La consulta es demasiado grande." });
    return null;
  }
  if (!Array.isArray(body.messages)) {
    res.status(400).json({ error: "Falta messages, una lista de mensajes." });
    return null;
  }
  const messages = normalizarMensajes(body.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    res.status(400).json({ error: "El último mensaje tiene que ser del usuario." });
    return null;
  }
  const memoria = Array.isArray(body.memoria)
    ? body.memoria.filter((item) => typeof item === "string" && item.trim()).slice(0, 30).map((item) => item.trim().slice(0, 200))
    : [];
  const perfil = body.perfil && typeof body.perfil === "object" ? body.perfil : null;
  const plan = body.plan && typeof body.plan === "object" ? body.plan : null;
  return { messages, perfil, plan, memoria, sugerencia: leerSugerencia(body.sugerencia) };
}

function normalizarMensajes(messages) {
  const limpios = messages
    .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
    .slice(-MAX_MENSAJES)
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_TEXTO) }))
    .filter((item) => item.content);
  while (limpios.length > 0 && limpios[0].role !== "user") limpios.shift();
  const salida = [];
  for (const mensaje of limpios) {
    const previo = salida[salida.length - 1];
    if (previo && previo.role === mensaje.role) previo.content = `${previo.content}\n${mensaje.content}`.slice(0, MAX_TEXTO);
    else salida.push(mensaje);
  }
  return salida;
}

function leerSugerencia(valor) {
  if (!valor || typeof valor !== "object") return null;
  const dia = String(valor.dia || "").toLowerCase();
  const comida = String(valor.comida || "").toLowerCase();
  const id = String(valor.id || "").trim();
  if (!id || !DIAS.includes(dia) || !COMIDAS.includes(comida)) return null;
  return {
    id: id.slice(0, 20),
    nombre: String(valor.nombre || "Receta").slice(0, 120),
    dia,
    comida,
    categoria: valor.categoria ? String(valor.categoria).slice(0, 40) : undefined,
  };
}

function normalizarAccion(bloque) {
  const args = bloque.input && typeof bloque.input === "object" ? bloque.input : {};
  if (bloque.name === "reemplazar_receta") {
    const dia = String(args.dia || "").toLowerCase();
    const comida = String(args.comida || "").toLowerCase();
    if (!DIAS.includes(dia) || !COMIDAS.includes(comida)) return null;
    return {
      nombre: bloque.name,
      args: {
        dia,
        comida,
        motivo: String(args.motivo || "").slice(0, 200),
        categoria: args.categoria ? String(args.categoria).slice(0, 40) : undefined,
        ingrediente_principal: args.ingrediente_principal ? String(args.ingrediente_principal).slice(0, 40) : undefined,
      },
    };
  }
  if (bloque.name === "generar_lista_compras") return { nombre: bloque.name, args: {} };
  if (bloque.name === "guardar_dato_usuario") {
    const hecho = String(args.hecho || "").trim().slice(0, 200);
    if (!hecho) return null;
    return { nombre: bloque.name, args: { hecho } };
  }
  return null;
}

async function respuestaLocal(cuerpo, pregunta) {
  const local = await responderLocal(cuerpo);
  const verificacion = clasificarPregunta(pregunta).buscar ? "no_disponible" : "omitida";
  return {
    reply: local.reply,
    acciones: local.acciones,
    fuentes: [],
    verificacion: local.reply ? "omitida" : verificacion,
    sugerencia: local.sugerencia ?? null,
  };
}

async function alFallarModelo(cuerpo, evidencia) {
  if (evidencia.verificacion === "ok") {
    return {
      reply: "Encontré estudios, pero no pude redactar la respuesta a partir de los resúmenes. Las fuentes están debajo.",
      acciones: [],
      fuentes: evidencia.fuentes,
      verificacion: "ok",
      sugerencia: null,
    };
  }
  if (evidencia.verificacion === "insuficiente") {
    return {
      reply: "No encontré estudios suficientes para responder eso y no voy a inventar referencias.",
      acciones: [],
      fuentes: [],
      verificacion: "insuficiente",
      sugerencia: null,
    };
  }
  const local = await responderLocal(cuerpo);
  return {
    reply: local.reply,
    acciones: local.acciones,
    fuentes: [],
    verificacion: local.reply ? "omitida" : evidencia.verificacion,
    sugerencia: local.sugerencia ?? null,
  };
}

function claveUtil(valor) {
  if (!valor || !valor.trim()) return false;
  return !["your-key", "changeme", "placeholder", "xxx"].includes(valor.trim().toLowerCase());
}

