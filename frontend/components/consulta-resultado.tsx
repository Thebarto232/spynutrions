"use client";

import { useState } from "react";
import { Download, Printer } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiaCard } from "@/components/nutricion/dia-card";
import { DIAS, etiquetaDia } from "@/components/nutricion/etiquetas";
import { FuentesList, fuentesDelPlan } from "@/components/nutricion/fuentes-list";
import { ListaCompras } from "@/components/nutricion/lista-compras";
import { PlanImpreso } from "@/components/nutricion/plan-impreso";
import { ResumenDiagnostico } from "@/components/nutricion/resumen-diagnostico";
import { fotosEnDataUrl } from "@/lib/plan-fotos";
import { presentarPlan } from "@/lib/plan-presentacion";
import { transicion, varianteEntrada } from "@/lib/motion";
import type { Consulta, DiaSemana, PlanSemanal, Receta } from "@/lib/types";

export function ConsultaResultado({
  plan,
  consulta,
  diaActivo,
  regenerando,
  onDia,
  onVer,
  onRegenerar,
  onImprimir,
}: {
  plan: PlanSemanal;
  consulta: Consulta;
  diaActivo: DiaSemana;
  regenerando: boolean;
  onDia: (dia: DiaSemana) => void;
  onVer: (receta: Receta) => void;
  onRegenerar: () => void;
  onImprimir: () => void;
}) {
  const activo = plan.dias.find((dia) => dia.dia === diaActivo) ?? plan.dias[0];
  const [descargando, setDescargando] = useState(false);

  async function descargar() {
    setDescargando(true);
    try {
      const [{ pdf }, { PlanDocumento }, fotos] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/nutricion/plan-documento"),
        fotosEnDataUrl(plan.dias.flatMap((dia) => dia.comidas.map((comida) => comida.receta.imagen ?? ""))),
      ]);
      const blob = await pdf(<PlanDocumento plan={plan} consulta={consulta} fotos={fotos} />).toBlob();
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = url;
      enlace.download = presentarPlan(plan, consulta).archivo;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo descargar el plan.");
    } finally {
      setDescargando(false);
    }
  }

  return (
    <>
    <section className="mt-16 space-y-10 print:hidden" aria-live="polite">
      <ResumenDiagnostico diagnostico={plan.diagnostico} />
      <FuentesList fuentes={fuentesDelPlan(plan)} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-serif text-3xl font-semibold">La semana</h2>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button type="button" className="print:hidden" disabled={descargando} onClick={descargar}>
            <Download aria-hidden="true" />
            {descargando ? "Preparando el PDF…" : "Descargar plan"}
          </Button>
          <Button type="button" variant="outline" className="print:hidden" onClick={onImprimir}>
            <Printer aria-hidden="true" />
            Imprimir
          </Button>
        </div>
      </div>

      <div className="print:hidden">
        <Tabs
          value={diaActivo}
          onValueChange={(valor) => {
            if (valor) onDia(valor as DiaSemana);
          }}
        >
          <TabsList className="h-auto max-w-full flex-wrap justify-start">
            {DIAS.map((dia) => (
              <TabsTrigger key={dia.id} value={dia.id}>
                {dia.etiqueta}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative mt-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {activo ? (
              <motion.div
                key={activo.dia}
                initial={varianteEntrada.initial}
                animate={varianteEntrada.animate}
                exit={{ opacity: 0 }}
                className="w-full"
                transition={transicion()}
              >
                <DiaCard
                  dia={activo}
                  etiqueta={etiquetaDia(activo.dia)}
                  regenerando={regenerando}
                  onRegenerar={onRegenerar}
                  onVer={onVer}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <ListaCompras compras={plan.compras} />
    </section>
    <PlanImpreso plan={plan} consulta={consulta} />
    </>
  );
}
