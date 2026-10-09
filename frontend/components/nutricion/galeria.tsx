"use client";

import { useState } from "react";
import { AvisoMedico } from "@/components/nutricion/aviso-medico";
import { ChatBubble } from "@/components/nutricion/chat-bubble";
import { ConsultaForm } from "@/components/nutricion/consulta-form";
import { DiaCard } from "@/components/nutricion/dia-card";
import { MuestraMovimiento } from "@/components/nutricion/muestra-movimiento";
import { FuentesList, fuentesDelPlan } from "@/components/nutricion/fuentes-list";
import { ListaCompras } from "@/components/nutricion/lista-compras";
import { RecetaDialog } from "@/components/nutricion/receta-dialog";
import { ResumenDiagnostico } from "@/components/nutricion/resumen-diagnostico";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { CONSULTA_INICIAL } from "@/lib/plan-local";
import type { Consulta, DiaPlan, PlanSemanal, Receta } from "@/lib/types";

const receta: Receta = {
  id: "52772",
  nombre: "Teriyaki Chicken Casserole",
  imagen: null,
  categoria: "Chicken",
  ingredientes: [
    { nombre: "soy sauce", cantidad: "3/4 cup" },
    { nombre: "chicken", cantidad: "1" },
  ],
  pasos: ["Mezcla la salsa.", "Hornea hasta que el pollo esté cocido."],
  tiempo: null,
};

const dia: DiaPlan = {
  dia: "lunes",
  comidas: [
    {
      momento: "desayuno",
      receta,
      calorias_estimadas: 420,
      nota_calorias: "Estimación aproximada. TheMealDB no publica calorías.",
    },
  ],
};

const plan: PlanSemanal = {
  diagnostico: {
    imc: 23.9,
    clasificacion_imc: "Peso normal",
    tmb: 1400,
    gasto: 2100,
    calorias_objetivo: 2000,
    macros: {
      proteina_g: 120,
      carbohidratos_g: 220,
      grasa_g: 60,
      proteina_pct: 24,
      carbohidratos_pct: 44,
      grasa_pct: 32,
    },
    nota_tipo_corporal: "El reparto usa el tipo corporal solo como guía.",
    recomendaciones: ["Reparte la proteína en las tres comidas."],
    aviso: "Cifras orientativas, no un diagnóstico clínico.",
  },
  dias: [dia],
  compras: [{ nombre: "soy sauce", cantidades: ["3/4 cup"] }],
  avisos: [],
};

const preguntas = [
  {
    name: "objetivo",
    required: true,
    prompt: "¿Qué quieres con la semana?",
    description: "Esto no guarda nada. Es el bloque de preguntas por pasos.",
    choices: [
      { value: "mantener", label: "Mantener", description: "Mismo peso, comidas estables." },
      { value: "bajar_grasa", label: "Bajar grasa" },
    ],
  },
] as const;

export function GaleriaComponentes() {
  const [consulta, setConsulta] = useState<Consulta>(CONSULTA_INICIAL);
  const [abierta, setAbierta] = useState<Receta | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-12 px-6 py-16">
      <header>
        <h1 className="font-serif text-4xl font-semibold">Componentes</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Esta página solo existe en desarrollo. Los datos de abajo son de muestra y no llaman al plan ni al chat. Las piezas salen de shadcn/ui, del bloque dashboard y de shadcn Charts. El cuestionario de abajo es el bloque de pasos del registro, para flujos de opciones. La hoja del PDF se arma al imprimir el plan y no se muestra aquí.
        </p>
      </header>

      <MuestraMovimiento />
      <AvisoMedico />
      <ConsultaForm
        consulta={consulta}
        ocupado={false}
        error={aviso}
        onChange={setConsulta}
        onSubmit={() => setAviso("En la galería el envío no crea un plan. Pruébalo en /plan.")}
      />
      <ResumenDiagnostico diagnostico={plan.diagnostico} />
      <DiaCard dia={dia} etiqueta="Lunes" onVer={setAbierta} onRegenerar={() => undefined} />
      <ListaCompras compras={plan.compras} />
      <FuentesList fuentes={fuentesDelPlan(plan)} />
      <section className="max-w-md space-y-3">
        <h2 className="font-serif text-2xl font-semibold">Chat</h2>
        <ChatBubble mensaje={{ role: "assistant", content: "El plan cabe en el gasto estimado.", verificacion: "ok" }} />
        <ChatBubble
          mensaje={{
            role: "assistant",
            content: "No pude contrastar esta respuesta.",
            verificacion: "no_disponible",
          }}
        />
      </section>
      <section className="max-w-xl">
        <h2 className="font-serif text-2xl font-semibold">Preguntas por pasos</h2>
        <Questionnaire
          className="mt-4"
          items={preguntas}
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <QuestionnaireProgress />
          {preguntas.map((pregunta) => (
            <QuestionnaireItem key={pregunta.name} name={pregunta.name} required={pregunta.required}>
              <QuestionnaireTitle>{pregunta.prompt}</QuestionnaireTitle>
              <QuestionnaireDescription>{pregunta.description}</QuestionnaireDescription>
              <QuestionnaireChoices>
                {pregunta.choices.map((opcion) => (
                  <QuestionnaireChoice key={opcion.value} value={opcion.value}>
                    <span>{opcion.label}</span>
                    {"description" in opcion ? (
                      <QuestionnaireChoiceDescription>{opcion.description}</QuestionnaireChoiceDescription>
                    ) : null}
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>
            </QuestionnaireItem>
          ))}
          <QuestionnaireActions>
            <QuestionnairePrevious>Anterior</QuestionnairePrevious>
            <QuestionnaireNext>Siguiente</QuestionnaireNext>
            <QuestionnaireSubmit>Listo</QuestionnaireSubmit>
          </QuestionnaireActions>
        </Questionnaire>
      </section>
      <RecetaDialog receta={abierta} favoritoId={null} onClose={() => setAbierta(null)} />
    </main>
  );
}
