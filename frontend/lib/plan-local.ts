import type { Compra, Consulta, DiaPlan, PlanSemanal } from "@/lib/types";

const CLAVE = "sazon.plan";

export const CONSULTA_INICIAL: Consulta = {
  edad: 30,
  sexo: "mujer",
  peso_kg: 65,
  estatura_cm: 165,
  actividad: "moderado",
  objetivo: "mantener",
  tipo_corporal: "mesomorfo",
  vegetariano: false,
  sin_gluten: false,
  alergias: "",
  disgustos: "",
};

export function guardarPlanLocal(consulta: Consulta, plan: PlanSemanal) {
  localStorage.setItem(CLAVE, JSON.stringify({ consulta, plan }));
}

export function leerPlanLocal(): { consulta: Consulta; plan: PlanSemanal } | null {
  try {
    const crudo = localStorage.getItem(CLAVE);
    if (!crudo) return null;
    const data = JSON.parse(crudo) as { consulta?: Consulta; plan?: PlanSemanal };
    if (!data.consulta || !data.plan?.dias) return null;
    return { consulta: data.consulta, plan: data.plan };
  } catch {
    return null;
  }
}

export function agruparCompras(dias: DiaPlan[]): Compra[] {
  const grupos = new Map<string, Compra>();
  for (const dia of dias) {
    for (const comida of dia.comidas) {
      for (const item of comida.receta.ingredientes) {
        const clave = item.nombre.trim().toLocaleLowerCase("es");
        if (!clave) continue;
        const actual = grupos.get(clave) ?? { nombre: item.nombre.trim(), cantidades: [] };
        const cantidad = item.cantidad.trim();
        if (cantidad && !actual.cantidades.includes(cantidad)) actual.cantidades.push(cantidad);
        grupos.set(clave, actual);
      }
    }
  }
  return [...grupos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
