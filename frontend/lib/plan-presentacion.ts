import { etiquetaDia, MOMENTOS } from "@/components/nutricion/etiquetas";
import type { Actividad, Consulta, Momento, Objetivo, PlanSemanal, Sexo, TipoCorporal } from "@/lib/types";

const sexos: Record<Sexo, string> = { mujer: "Mujer", hombre: "Hombre" };
const actividades: Record<Actividad, string> = {
  sedentario: "Sedentario",
  ligero: "Ligero",
  moderado: "Moderado",
  intenso: "Intenso",
};
const objetivos: Record<Objetivo, string> = {
  bajar_grasa: "Bajar grasa",
  mantener: "Mantener",
  ganar_masa: "Ganar masa muscular",
};
const tipos: Record<TipoCorporal, string> = {
  ectomorfo: "Ectomorfo",
  mesomorfo: "Mesomorfo",
  endomorfo: "Endomorfo",
};

const ordenComida: Momento[] = ["desayuno", "almuerzo", "cena"];
const entero = new Intl.NumberFormat("es");
const flexible = new Intl.NumberFormat("es", { maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export type PlanPresentado = ReturnType<typeof presentarPlan>;

export function presentarPlan(plan: PlanSemanal, consulta: Consulta, fecha = new Date()) {
  const { diagnostico } = plan;
  const iso = [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");

  return {
    archivo: `plan-semanal-sazon-${iso}.pdf`,
    fechaIso: iso,
    fechaTexto: fecha.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }),
    ficha: [
      { etiqueta: "Edad", valor: `${entero.format(consulta.edad)} años` },
      { etiqueta: "Sexo", valor: sexos[consulta.sexo] },
      { etiqueta: "Peso", valor: `${flexible.format(consulta.peso_kg)} kg` },
      { etiqueta: "Estatura", valor: `${entero.format(consulta.estatura_cm)} cm` },
      { etiqueta: "Actividad", valor: actividades[consulta.actividad] },
      { etiqueta: "Objetivo", valor: objetivos[consulta.objetivo] },
      { etiqueta: "Contextura", valor: tipos[consulta.tipo_corporal] },
    ],
    restricciones: [
      consulta.vegetariano ? "Vegetariano" : null,
      consulta.sin_gluten ? "Sin gluten" : null,
      consulta.alergias.trim() ? `Alergias: ${consulta.alergias.trim()}` : null,
      consulta.disgustos.trim() ? `Evitar: ${consulta.disgustos.trim()}` : null,
    ].filter((item): item is string => Boolean(item)),
    calorias: entero.format(diagnostico.calorias_objetivo),
    imc: decimal.format(diagnostico.imc),
    clasificacion: diagnostico.clasificacion_imc,
    gasto: `${entero.format(diagnostico.gasto)} kcal`,
    tmb: `${entero.format(diagnostico.tmb)} kcal`,
    macros: [
      { nombre: "Proteína", gramos: entero.format(diagnostico.macros.proteina_g), pct: diagnostico.macros.proteina_pct },
      { nombre: "Carbohidratos", gramos: entero.format(diagnostico.macros.carbohidratos_g), pct: diagnostico.macros.carbohidratos_pct },
      { nombre: "Grasa", gramos: entero.format(diagnostico.macros.grasa_g), pct: diagnostico.macros.grasa_pct },
    ],
    nota: diagnostico.nota_tipo_corporal,
    recomendaciones: diagnostico.recomendaciones,
    aviso: diagnostico.aviso,
    avisos: plan.avisos,
    dias: plan.dias.map((dia) => {
      const comidas = [...dia.comidas]
        .sort((a, b) => ordenComida.indexOf(a.momento) - ordenComida.indexOf(b.momento))
        .map((comida) => ({
          momento: MOMENTOS[comida.momento],
          nombre: comida.receta.nombre,
          kcal: entero.format(comida.calorias_estimadas),
        }));
      const total = dia.comidas.reduce((suma, comida) => suma + comida.calorias_estimadas, 0);
      return { id: dia.dia, etiqueta: etiquetaDia(dia.dia), total: entero.format(total), comidas };
    }),
    compras: plan.compras.map((item) => ({
      nombre: item.nombre,
      detalle: item.cantidades.join(" / "),
    })),
  };
}
