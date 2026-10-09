// Lista editable. Las frases se comparan sin mayúsculas ni tildes, como palabras completas.
export const disparadores = {
  operativos: {
    cambiar_comida: [
      "cambia ",
      "cambiar",
      "reemplaza",
      "reemplazar",
      "sustituye",
      "sustituir",
      "change the",
      "change my",
      "swap the",
      "replace the",
    ],
    lista_compras: ["lista de compras", "lista de la compra", "shopping list", "genera mi lista", "generate a shopping"],
    recordar: [
      "recuerda",
      "recuerdas",
      "remember",
      "no me gusta",
      "no me gustan",
      "i don't like",
      "i do not like",
      "soy alergico",
      "soy alergica",
      "tengo alergia",
      "i am allergic",
      "i'm allergic",
    ],
  },
  evidencia: {
    nutrientes: ["nutriente", "nutrientes", "nutrient", "nutrients", "vitamina", "vitamin", "mineral", "minerales"],
    proteina: ["proteina", "proteinas", "protein", "proteins"],
    calorias: ["caloria", "calorias", "calories", "calorie", "kcal"],
    salud: ["salud", "sano", "sana", "saludable", "healthy", "health"],
    estudios: [
      "evidencia",
      "estudio",
      "estudios",
      "study",
      "studies",
      "meta-analisis",
      "metaanalisis",
      "meta-analysis",
      "meta analysis",
      "revision sistematica",
      "systematic review",
    ],
    porque: ["por que", "why"],
    macros: ["macro", "macros", "carbohidrato", "carbohidratos", "carbohydrate", "grasa", "grasas", "fibra", "fiber", "azucar", "sugar", "dieta", "diet"],
  },
};

export function clasificarPregunta(texto) {
  const plano = normalizar(texto);
  if (alguna(plano, disparadores.operativos)) return { buscar: false, motivo: "operativo" };
  if (alguna(plano, disparadores.evidencia)) return { buscar: true, motivo: "evidencia" };
  return { buscar: false, motivo: "general" };
}

function alguna(plano, grupos) {
  return Object.values(grupos).some((frases) => frases.some((frase) => contieneFrase(plano, frase)));
}

function contieneFrase(plano, frase) {
  const f = normalizar(frase).trim();
  if (!f) return false;
  const re = new RegExp(`(?:^|[\\s\\p{P}])${escaparRegex(f)}(?:$|[\\s\\p{P}])`, "u");
  return re.test(plano);
}

function normalizar(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function escaparRegex(frase) {
  return frase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
