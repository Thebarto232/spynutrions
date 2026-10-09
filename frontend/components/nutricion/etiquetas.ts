import type { DiaSemana, Momento } from "@/lib/types";

export const DIAS: { id: DiaSemana; etiqueta: string }[] = [
  { id: "lunes", etiqueta: "Lunes" },
  { id: "martes", etiqueta: "Martes" },
  { id: "miercoles", etiqueta: "Miércoles" },
  { id: "jueves", etiqueta: "Jueves" },
  { id: "viernes", etiqueta: "Viernes" },
  { id: "sabado", etiqueta: "Sábado" },
  { id: "domingo", etiqueta: "Domingo" },
];

export const MOMENTOS: Record<Momento, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  cena: "Cena",
};

export function etiquetaDia(dia: DiaSemana) {
  return DIAS.find((item) => item.id === dia)?.etiqueta ?? dia;
}
