const DIAS = ["lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo"];
const ETIQUETA_DIA = {
  lunes: "lunes",
  martes: "martes",
  miercoles: "miércoles",
  jueves: "jueves",
  viernes: "viernes",
  sabado: "sábado",
  domingo: "domingo",
};
const ETIQUETA_COMIDA = { desayuno: "desayuno", almuerzo: "almuerzo", cena: "cena" };
const ORDEN_COMIDA = ["desayuno", "almuerzo", "cena"];
const KCAL = {
  Breakfast: 420,
  Desayuno: 420,
  Chicken: 480,
  Pollo: 480,
  Seafood: 430,
  Mariscos: 430,
  Vegetarian: 450,
  Vegetariana: 450,
  Vegan: 430,
  Vegano: 430,
  Beef: 640,
  "Carne de res": 640,
  Pasta: 700,
  Lamb: 660,
  Cordero: 660,
  Pork: 600,
  Cerdo: 600,
};
const CARNES = ["chicken", "beef", "pork", "lamb", "bacon", "fish", "salmon", "prawn", "shrimp", "tuna", "meat", "pollo", "cerdo", "cordero", "tocino", "pescado", "camaron", "gamba", "atun", "carne", "ternera"];
const GLUTEN = ["flour", "wheat", "pasta", "bread", "noodle", "barley", "harina", "trigo", "pan", "cebada", "fideo"];

export async function responderLocal({ messages, perfil, plan, memoria, sugerencia }) {
  const texto = messages[messages.length - 1]?.content?.trim() || "";
  const normal = sinTilde(texto);
  const recuerdos = Array.isArray(memoria) ? memoria : [];
  const propuesta = sugerenciaValida(sugerencia);

  if (/embaraz|lactancia|diabetes|cancer|enfermedad|medicament|menor de edad|nino|nina/.test(normal)) {
    return salida(
      "Eso lo tiene que ver un médico o un nutricionista. Puedo ayudarte con el menú de la semana, no con un tratamiento.",
      [],
      propuesta,
    );
  }

  const hecho = extraerDato(texto);
  if (hecho) {
    return salida("", [{ nombre: "guardar_dato_usuario", args: { hecho } }], propuesta);
  }

  if (/lista de compras|lista de la compra|genera mi lista/.test(normal)) {
    return salida("", [{ nombre: "generar_lista_compras", args: {} }], propuesta);
  }

  if (/favorit/.test(normal)) {
    return guardarFavorito(normal, plan, propuesta);
  }

  if (propuesta && /^(si|ok|dale|agregala|anadela|ponla|dejala)\b/.test(normal) && normal.length < 40) {
    return salida(
      `Agrego ${propuesta.nombre} a la ${ETIQUETA_COMIDA[propuesta.comida]} del ${ETIQUETA_DIA[propuesta.dia]}.`,
      [accionReemplazo(propuesta.dia, propuesta.comida, texto, propuesta.categoria, propuesta.id)],
      null,
    );
  }

  if (/^(hola|buenas|buenos dias|hey|ayuda|que puedes hacer|quien eres)\b/.test(normal) && !/que como|que hay|muestr|recomiend|recomend/.test(normal)) {
    const hoy = textoDia(plan, diaHoy(), true);
    return salida(
      `Hola. Leo tu plan, te muestro una comida, te recomiendo otra receta del recetario y la agrego. También armo la lista de compras y recuerdo lo que no quieres comer.${hoy ? `\n\n${hoy}` : ""}`,
      [],
      propuesta,
    );
  }

  if (/muestr|ver la receta|ver receta|ingredientes|como se prepara|los pasos/.test(normal)) {
    return mostrar(normal, plan, propuesta);
  }

  if (/que como|que hay|que tengo|mi semana|el menu|menu de|mis comidas/.test(normal)) {
    return leer(normal, plan, propuesta);
  }

  if (/por que|explica el plan|este plan|\bimc\b|mis calorias|mis macros/.test(normal) && !/mas proteina|recomend|cambi|agrega/.test(normal)) {
    return salida(explicar(perfil, plan), [], propuesta);
  }

  if (/cambi|reemplaz|agrega|anade|ponme|otra (cena|comida|receta)|recomiend|recomend|sugier|suger|mas proteina/.test(normal)) {
    return recomendar(normal, texto, perfil, plan, recuerdos);
  }

  if (plan?.dias?.length) {
    return salida(
      `Puedo leer un día, mostrarte la receta, recomendarte otra y agregarla, o armar la lista de compras.\n\n${textoDia(plan, diaHoy())}`,
      [],
      propuesta,
    );
  }

  return salida(
    "Todavía no hay un plan en este navegador. Completa la ficha y prepara la semana. Cuando exista, te digo qué comes, te muestro la receta y puedo cambiar una comida.",
    [],
    propuesta,
  );
}

function salida(reply, acciones, sugerencia) {
  return { reply, acciones, sugerencia };
}

function mostrar(normal, plan, sugerencia) {
  if (!plan?.dias?.length) {
    return salida("Todavía no hay un plan. Prepara la semana y te muestro cada comida.", [], sugerencia);
  }
  const dia = diaDe(normal);
  const comida = detectarComida(normal);
  if (dia && comida) {
    const encontrada = comidaDe(plan, dia, comida);
    if (!encontrada) return salida(`El ${ETIQUETA_DIA[dia]} no tiene ${ETIQUETA_COMIDA[comida]}.`, [], sugerencia);
    return salida(fichaComida(dia, encontrada), [], sugerenciaDeComida(dia, encontrada));
  }
  if (dia) return salida(textoDia(plan, dia), [], sugerencia);
  return salida(textoSemana(plan), [], sugerencia);
}

function leer(normal, plan, sugerencia) {
  if (!plan?.dias?.length) {
    return salida("Todavía no hay comidas guardadas. Prepara la semana en la ficha y te las leo.", [], sugerencia);
  }
  const dia = diaDe(normal);
  return salida(dia ? textoDia(plan, dia) : textoSemana(plan), [], sugerencia);
}

async function recomendar(normal, texto, perfil, plan, memoria) {
  const dia = diaDe(normal) || diaHoy();
  const comida = detectarComida(normal) || "cena";
  const categoria = categoriaDe(normal, comida, perfil);
  try {
    const receta = await elegirReceta(categoria, perfil, memoria, idsUsados(plan));
    if (!receta) {
      return salida("No encontré otra receta que cumpla el perfil y no esté ya en la semana.", [], null);
    }
    const ficha = fichaReceta(receta, `Para la ${ETIQUETA_COMIDA[comida]} del ${ETIQUETA_DIA[dia]} te recomiendo:`);
    const propuesta = {
      id: receta.id,
      nombre: receta.nombre,
      dia,
      comida,
      categoria: receta.categoria || categoria,
    };
    if (!plan?.dias?.length) {
      return salida(`${ficha}\n\nCuando prepares la semana, dime «agrégala» y la dejo en ese día.`, [], propuesta);
    }
    return salida(
      `${ficha}\n\nLa agrego a la ${ETIQUETA_COMIDA[comida]} del ${ETIQUETA_DIA[dia]}.`,
      [accionReemplazo(dia, comida, texto, categoria, receta.id)],
      null,
    );
  } catch {
    return salida("No pude consultar el recetario ahora. Puedo seguir leyendo el plan que ya tienes guardado.", [], null);
  }
}

function guardarFavorito(normal, plan, sugerencia) {
  const dia = diaDe(normal) || sugerencia?.dia;
  const comida = detectarComida(normal) || sugerencia?.comida;
  const delPlan = dia && comida ? comidaDe(plan, dia, comida) : null;
  const id = delPlan?.receta?.id || (!diaDe(normal) ? sugerencia?.id : null);
  const nombre = delPlan?.receta?.nombre || sugerencia?.nombre;
  if (!id || !nombre) {
    return salida("Dime cuál guardar, por ejemplo «agrega a favoritos la cena del lunes».", [], sugerencia);
  }
  return salida(`Guardo ${nombre} en favoritos.`, [{ nombre: "guardar_favorito", args: { id: String(id) } }], sugerencia);
}

function accionReemplazo(dia, comida, texto, categoria, id) {
  return {
    nombre: "reemplazar_receta",
    args: {
      dia,
      comida,
      motivo: String(texto || "").slice(0, 200),
      categoria,
      id: String(id),
    },
  };
}

function explicar(perfil, plan) {
  const nota = plan?.diagnostico;
  if (!nota) return "Todavía no hay un plan guardado. Prepara la semana en la ficha y te explico las cifras.";
  const tipo = perfil?.tipo_corporal ? " El reparto de macros usa tu tipo corporal solo como guía." : "";
  const recomendacion = Array.isArray(nota.recomendaciones) && nota.recomendaciones[0] ? `${nota.recomendaciones[0]} ` : "";
  return `Tu IMC es ${nota.imc} (${nota.clasificacion_imc}). La meta del día son unas ${nota.calorias_objetivo} kcal: ${nota.macros?.proteina_g ?? "—"} g de proteína, ${nota.macros?.carbohidratos_g ?? "—"} g de carbohidratos y ${nota.macros?.grasa_g ?? "—"} g de grasa. ${recomendacion}Las calorías de cada receta son estimaciones. TheMealDB no publica calorías.${tipo}`;
}

function textoSemana(plan) {
  const lineas = DIAS.map((dia) => textoDia(plan, dia, true)).filter(Boolean);
  return lineas.length ? `Tu semana:\n\n${lineas.join("\n\n")}` : "El plan no tiene comidas todavía.";
}

function textoDia(plan, dia, breve = false) {
  const encontrado = plan?.dias?.find((item) => item.dia === dia);
  if (!encontrado) return breve ? "" : `No tengo comidas para el ${ETIQUETA_DIA[dia]}.`;
  const comidas = ordenarComidas(encontrado.comidas);
  if (comidas.length === 0) return `${capital(ETIQUETA_DIA[dia])}: todavía sin comidas.`;
  const lineas = comidas.map((comida) => {
    const kcal = comida.calorias_estimadas ? ` (~${comida.calorias_estimadas} kcal)` : "";
    return `• ${capital(ETIQUETA_COMIDA[comida.momento] || comida.momento)}: ${comida.receta?.nombre || "sin receta"}${kcal}`;
  });
  return `${capital(ETIQUETA_DIA[dia])}\n${lineas.join("\n")}`;
}

function fichaComida(dia, comida) {
  const receta = comida.receta || {};
  const kcal = comida.calorias_estimadas ? `\nEstimación: ${comida.calorias_estimadas} kcal. ${comida.nota_calorias || "TheMealDB no publica calorías."}` : "";
  return `${capital(ETIQUETA_COMIDA[comida.momento] || comida.momento)} del ${ETIQUETA_DIA[dia]}: ${receta.nombre || "sin receta"}.${kcal}\n\n${listaIngredientes(receta)}\n\n${listaPasos(receta)}`;
}

function fichaReceta(receta, titulo) {
  const kcal = KCAL[receta.categoria] || 500;
  return `${titulo} ${receta.nombre}.\nEstimación: ${kcal} kcal. TheMealDB no publica calorías.\n\n${listaIngredientes(receta)}\n\n${listaPasos(receta)}`;
}

function listaIngredientes(receta) {
  const items = Array.isArray(receta.ingredientes) ? receta.ingredientes.slice(0, 6) : [];
  if (items.length === 0) return "Ingredientes: no vienen en la ficha.";
  return `Ingredientes:\n${items.map((item) => `• ${[item.cantidad, item.nombre].filter(Boolean).join(" ")}`).join("\n")}`;
}

function listaPasos(receta) {
  const pasos = Array.isArray(receta.pasos) ? receta.pasos.filter(Boolean).slice(0, 3) : [];
  if (pasos.length === 0) return "Preparación: abre la receta en el plan para ver los pasos.";
  return `Preparación:\n${pasos.map((paso, indice) => `${indice + 1}. ${paso}`).join("\n")}`;
}

async function elegirReceta(categoria, perfil, memoria, usados) {
  let cat = categoria;
  if (perfil?.vegetariano && !["Vegetarian", "Vegan", "Breakfast"].includes(cat)) cat = "Vegetarian";
  const lista = await fetchJson(`/api/recetas/categoria?c=${encodeURIComponent(cat)}`);
  const comidas = Array.isArray(lista) ? lista : [];
  if (comidas.length === 0) return null;
  const inicio = usados.size % comidas.length;
  const orden = [...comidas.slice(inicio), ...comidas.slice(0, inicio)];
  for (const item of orden.slice(0, 8)) {
    const id = String(item.id || "");
    if (!id || usados.has(id)) continue;
    const receta = await fetchJson(`/api/recetas/${encodeURIComponent(id)}`);
    if (receta?.id && admite(receta, perfil, memoria)) return receta;
  }
  return null;
}

async function fetchJson(ruta) {
  const response = await fetch(`${apiBase()}${ruta}`);
  if (!response.ok) throw new Error("recetas");
  return response.json();
}

function apiBase() {
  if (typeof window !== "undefined") return "";
  return String(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
}

function admite(receta, perfil, memoria) {
  const texto = sinTilde(`${receta.nombre || ""} ${(receta.ingredientes || []).map((item) => item.nombre).join(" ")}`);
  if (perfil?.vegetariano && CARNES.some((palabra) => texto.includes(palabra))) return false;
  if (perfil?.sin_gluten && GLUTEN.some((palabra) => texto.includes(palabra))) return false;
  const prohibidos = [
    ...String(perfil?.alergias || "").split(/[,;\n]/),
    ...String(perfil?.disgustos || "").split(/[,;\n]/),
    ...(memoria || []).filter((item) => sinTilde(item).startsWith("no incluir:")).map((item) => item.split(":").slice(1).join(":")),
  ]
    .map((item) => sinTilde(item).trim())
    .filter((item) => item.length >= 2);
  return !prohibidos.some((item) => texto.includes(item));
}

function idsUsados(plan) {
  const ids = new Set();
  for (const dia of plan?.dias || []) {
    for (const comida of dia.comidas || []) {
      if (comida?.receta?.id) ids.add(String(comida.receta.id));
    }
  }
  return ids;
}

function comidaDe(plan, dia, momento) {
  const encontrado = plan?.dias?.find((item) => item.dia === dia);
  return encontrado?.comidas?.find((item) => item.momento === momento) || null;
}

function sugerenciaDeComida(dia, comida) {
  if (!comida?.receta?.id) return null;
  return {
    id: String(comida.receta.id),
    nombre: comida.receta.nombre || "Receta",
    dia,
    comida: comida.momento,
    categoria: comida.receta.categoria || undefined,
  };
}

function sugerenciaValida(valor) {
  if (!valor || typeof valor !== "object") return null;
  const dia = String(valor.dia || "");
  const comida = String(valor.comida || "");
  const id = String(valor.id || "").trim();
  if (!id || !DIAS.includes(dia) || !ORDEN_COMIDA.includes(comida)) return null;
  return {
    id: id.slice(0, 20),
    nombre: String(valor.nombre || "Receta").slice(0, 120),
    dia,
    comida,
    categoria: valor.categoria ? String(valor.categoria).slice(0, 40) : undefined,
  };
}

function ordenarComidas(comidas) {
  return [...(comidas || [])].sort((a, b) => ORDEN_COMIDA.indexOf(a.momento) - ORDEN_COMIDA.indexOf(b.momento));
}

function categoriaDe(normal, comida, perfil) {
  if (perfil?.vegetariano) return comida === "desayuno" ? "Breakfast" : "Vegetarian";
  if (/pescad|marisc|atun|salmon/.test(normal)) return "Seafood";
  if (/\bres\b|carne de res|\bbeef\b/.test(normal)) return "Beef";
  if (/pasta|fideo/.test(normal)) return "Pasta";
  if (/cerdo|pork/.test(normal)) return "Pork";
  if (/corder|lamb/.test(normal)) return "Lamb";
  if (/vegano/.test(normal)) return "Vegan";
  if (/verdura|ensalada|vegetarian/.test(normal)) return "Vegetarian";
  if (/pollo|chicken|mas proteina|proteina/.test(normal)) return "Chicken";
  if (comida === "desayuno" || /desayuno/.test(normal)) return "Breakfast";
  if (perfil?.objetivo === "ganar_masa") return "Beef";
  return "Chicken";
}

function extraerDato(texto) {
  const recuerda = texto.match(/recuerda que\s+(.+)/i);
  if (recuerda) {
    const hecho = limpiaFrase(recuerda[1]);
    if (hecho.length >= 2) return hecho.slice(0, 200);
  }
  const patrones = [/no me gusta(?:n| el| la| los| las)?\s+(.+)/i, /no quiero(?: el| la| los| las)?\s+(.+)/i, /al[eé]rgic[oa]s?\s+(?:a |al )?(.+)/i];
  for (const patron of patrones) {
    const encontrado = texto.match(patron);
    if (!encontrado) continue;
    const hecho = limpiaFrase(encontrado[1]);
    if (hecho.length >= 2) return `no incluir: ${hecho}`.slice(0, 200);
  }
  return null;
}

function limpiaFrase(texto) {
  return texto.replace(/[.?!].*$/, "").trim();
}

function diaDe(texto) {
  const escrito = DIAS.find((dia) => texto.includes(dia));
  if (escrito) return escrito;
  if (texto.includes("pasado manana")) return DIAS[(indiceHoy() + 2) % 7];
  if (/\bmanana\b/.test(texto)) return DIAS[(indiceHoy() + 1) % 7];
  if (/\bhoy\b/.test(texto)) return diaHoy();
  return null;
}

function diaHoy() {
  return DIAS[indiceHoy()];
}

function indiceHoy() {
  const mapa = [6, 0, 1, 2, 3, 4, 5];
  return mapa[new Date().getDay()];
}

function detectarComida(texto) {
  if (texto.includes("desayuno")) return "desayuno";
  if (texto.includes("almuerzo") || texto.includes("comida del") || texto.includes("la comida")) return "almuerzo";
  if (texto.includes("cena")) return "cena";
  return null;
}

function sinTilde(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function capital(texto) {
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : "";
}
