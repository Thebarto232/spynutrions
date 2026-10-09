import { agruparCompras, guardarPlanLocal, leerPlanLocal } from "@/lib/plan-local";
import type { Comida, Consulta, DiaSemana, Momento, PlanSemanal, Receta, RecetaResumen } from "@/lib/types";

const NOTA = "Estimación aproximada. TheMealDB no publica calorías.";

const CATEGORIAS: Record<string, string> = {
  breakfast: "Breakfast",
  desayuno: "Breakfast",
  chicken: "Chicken",
  pollo: "Chicken",
  beef: "Beef",
  res: "Beef",
  carne: "Beef",
  seafood: "Seafood",
  pescado: "Seafood",
  marisco: "Seafood",
  vegetarian: "Vegetarian",
  vegetariana: "Vegetarian",
  vegan: "Vegan",
  vegano: "Vegan",
  pasta: "Pasta",
  lamb: "Lamb",
  cordero: "Lamb",
  pork: "Pork",
  cerdo: "Pork",
};

const KCAL: Record<string, number> = {
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
const GLUTEN = ["flour", "wheat", "pasta", "bread", "noodle", "barley", "soy sauce", "harina", "trigo", "pan", "cebada", "fideo"];

export type Accion =
  | { nombre: "reemplazar_receta"; args: { dia: DiaSemana; comida: Momento; motivo: string; categoria?: string; ingrediente_principal?: string; id?: string } }
  | { nombre: "generar_lista_compras"; args: Record<string, never> }
  | { nombre: "guardar_dato_usuario"; args: { hecho: string } }
  | { nombre: "guardar_favorito"; args: { id: string } };

export async function ejecutarAccion(accion: Accion, memoria: string[]): Promise<{ texto: string; memoria: string[] }> {
  if (accion.nombre === "guardar_favorito") {
    try {
      await guardarEnFavoritos(accion.args.id);
      return { texto: "La guardé en favoritos.", memoria };
    } catch (error) {
      return { texto: error instanceof Error ? error.message : "No pude guardarla en favoritos.", memoria };
    }
  }

  if (accion.nombre === "guardar_dato_usuario") {
    const hecho = accion.args.hecho.trim();
    if (!hecho || memoria.includes(hecho)) return { texto: `Ya tengo en cuenta: ${hecho || "ese dato"}.`, memoria };
    return { texto: `Lo recordaré: ${hecho}.`, memoria: [...memoria, hecho] };
  }

  const guardado = leerPlanLocal();
  if (!guardado) return { texto: "Todavía no hay un plan en este navegador. Prepara la semana primero.", memoria };

  if (accion.nombre === "generar_lista_compras") {
    const compras = agruparCompras(guardado.plan.dias);
    if (compras.length === 0) return { texto: "El plan no tiene ingredientes para comprar.", memoria };
    const lineas = compras.map((item) => `• ${item.nombre}${item.cantidades.length ? ` — ${item.cantidades.join(" / ")}` : ""}`);
    return { texto: `Lista de compras:\n${lineas.join("\n")}`, memoria };
  }

  const cambio = await reemplazar(guardado.consulta, guardado.plan, accion.args, memoria);
  return { texto: cambio, memoria };
}

async function reemplazar(
  consulta: Consulta,
  plan: PlanSemanal,
  args: { dia: DiaSemana; comida: Momento; categoria?: string; ingrediente_principal?: string; id?: string },
  memoria: string[],
) {
  const usados = new Set(plan.dias.flatMap((dia) => dia.comidas.map((comida) => comida.receta.id)));
  if (args.id) {
    const receta = await detalle(args.id);
    if (!receta) return "No encontré esa receta en el recetario.";
    if (usados.has(receta.id)) return `${receta.nombre} ya está en la semana. Pídeme otra.`;
    if (!admite(receta, consulta, memoria)) return `${receta.nombre} no encaja con lo que quieres evitar.`;
    return colocar(consulta, plan, args.dia, args.comida, receta);
  }
  const resumenes = await candidatos(args.categoria, args.ingrediente_principal, args.comida);
  for (const resumen of resumenes) {
    if (!resumen.id || usados.has(resumen.id)) continue;
    const receta = await detalle(resumen.id);
    if (!receta || usados.has(receta.id) || !admite(receta, consulta, memoria)) continue;
    return colocar(consulta, plan, args.dia, args.comida, receta);
  }
  return "No encontré otra receta que cumpla el perfil y no esté ya en la semana.";
}

function colocar(consulta: Consulta, plan: PlanSemanal, diaSemana: DiaSemana, momento: Momento, receta: Receta) {
  const comida: Comida = {
    momento,
    receta,
    calorias_estimadas: KCAL[receta.categoria || ""] ?? 500,
    nota_calorias: NOTA,
  };
  const dias = plan.dias.map((dia) => {
    if (dia.dia !== diaSemana) return dia;
    const sinEsa = dia.comidas.filter((item) => item.momento !== momento);
    return { ...dia, comidas: [...sinEsa, comida] };
  });
  guardarPlanLocal(consulta, { ...plan, dias, compras: agruparCompras(dias) });
  window.dispatchEvent(
    new CustomEvent("sazon-plan-cambio", {
      detail: { dia: diaSemana, momento, recetaId: receta.id },
    }),
  );
  return `Cambié la ${momento} del ${diaSemana} por ${receta.nombre}.`;
}

async function candidatos(categoria: string | undefined, ingrediente: string | undefined, comida: Momento) {
  const clave = (categoria || (comida === "desayuno" ? "Breakfast" : "Chicken")).trim();
  const nombre = CATEGORIAS[clave.toLowerCase()] || clave;
  const porCategoria = await resumenes(`/api/recetas/categoria?c=${encodeURIComponent(nombre)}`);
  if (!ingrediente?.trim()) return mezclar(porCategoria);
  const porIngrediente = await resumenes(`/api/recetas/ingredientes?i=${encodeURIComponent(ingrediente.trim())}`);
  const ids = new Set(porIngrediente.map((item) => item.id));
  const cruce = porCategoria.filter((item) => ids.has(item.id));
  return mezclar(cruce.length > 0 ? cruce : porIngrediente);
}

async function resumenes(ruta: string) {
  const response = await fetch(ruta);
  if (!response.ok) throw new Error("No pude consultar el recetario.");
  const data = (await response.json()) as RecetaResumen[];
  return Array.isArray(data) ? data : [];
}

async function detalle(id: string): Promise<Receta | null> {
  const response = await fetch(`/api/recetas/${encodeURIComponent(id)}`);
  if (!response.ok) return null;
  return (await response.json()) as Receta;
}

async function guardarEnFavoritos(id: string) {
  const response = await fetch("/api/favoritos", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (response.ok) return;
  let message = "No pude guardarla en favoritos.";
  try {
    const body = (await response.json()) as { detail?: { message?: string } };
    if (typeof body.detail?.message === "string") message = body.detail.message;
  } catch {
    message = response.statusText || message;
  }
  throw new Error(message);
}

function admite(receta: Receta, consulta: Consulta, memoria: string[]) {
  const texto = `${receta.nombre} ${receta.ingredientes.map((item) => item.nombre).join(" ")}`.toLowerCase();
  if (consulta.vegetariano && CARNES.some((palabra) => texto.includes(palabra))) return false;
  if (consulta.sin_gluten && GLUTEN.some((palabra) => texto.includes(palabra))) return false;
  const evitados = memoria
    .filter((item) => item.toLowerCase().startsWith("no incluir:"))
    .map((item) => item.slice(item.indexOf(":") + 1));
  const prohibidos = `${consulta.alergias},${consulta.disgustos},${evitados.join(",")}`
    .split(/[,;\n]/)
    .map((item) => item.trim().toLowerCase())
    .filter((item) => item.length >= 2);
  return !prohibidos.some((item) => texto.includes(item));
}

function mezclar<T>(lista: T[]) {
  const copia = [...lista];
  for (let indice = copia.length - 1; indice > 0; indice -= 1) {
    const otro = Math.floor(Math.random() * (indice + 1));
    [copia[indice], copia[otro]] = [copia[otro], copia[indice]];
  }
  return copia.slice(0, 12);
}
