"use client";

import { useEffect, useState } from "react";
import { ConsultaResultado } from "@/components/consulta-resultado";
import { AvisoMedico } from "@/components/nutricion/aviso-medico";
import { ConsultaForm } from "@/components/nutricion/consulta-form";
import { RecetaDialog } from "@/components/nutricion/receta-dialog";
import { PlanEsqueleto } from "@/components/nutricion/resumen-diagnostico";
import { crearPlan, regenerarDia } from "@/lib/api-cliente";
import { agruparCompras, CONSULTA_INICIAL, guardarPlanLocal, leerPlanLocal } from "@/lib/plan-local";
import type { Consulta, DiaSemana, PlanSemanal, Receta } from "@/lib/types";

export function ConsultaPlan() {
  const [consulta, setConsulta] = useState<Consulta>(CONSULTA_INICIAL);
  const [plan, setPlan] = useState<PlanSemanal | null>(null);
  const [diaActivo, setDiaActivo] = useState<DiaSemana>("lunes");
  const [abierta, setAbierta] = useState<Receta | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [regenerando, setRegenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function cargar() {
      const guardado = leerPlanLocal();
      if (!guardado) return;
      setConsulta(guardado.consulta);
      setPlan(guardado.plan);
    }
    cargar();
    window.addEventListener("sazon-plan-cambio", cargar);
    return () => window.removeEventListener("sazon-plan-cambio", cargar);
  }, []);

  async function preparar() {
    if (
      consulta.edad < 14 ||
      consulta.edad > 100 ||
      consulta.peso_kg <= 25 ||
      consulta.estatura_cm <= 120 ||
      Number.isNaN(consulta.edad) ||
      Number.isNaN(consulta.peso_kg) ||
      Number.isNaN(consulta.estatura_cm)
    ) {
      setError("Revisa la edad, el peso y la estatura antes de continuar.");
      return;
    }
    setOcupado(true);
    setError(null);
    try {
      const creado = await crearPlan(consulta);
      const conCompras = { ...creado, compras: agruparCompras(creado.dias) };
      setPlan(conCompras);
      setDiaActivo("lunes");
      guardarPlanLocal(consulta, conCompras);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo armar el plan.");
    } finally {
      setOcupado(false);
    }
  }

  async function regenerar() {
    if (!plan) return;
    setRegenerando(true);
    setError(null);
    const excluir = plan.dias
      .filter((dia) => dia.dia !== diaActivo)
      .flatMap((dia) => dia.comidas.map((comida) => comida.receta.id));
    try {
      const nuevo = await regenerarDia(consulta, diaActivo, excluir);
      const dias = plan.dias.map((dia) => (dia.dia === diaActivo ? nuevo : dia));
      const siguiente = { ...plan, dias, compras: agruparCompras(dias), avisos: plan.avisos };
      setPlan(siguiente);
      guardarPlanLocal(consulta, siguiente);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo cambiar ese día.");
    } finally {
      setRegenerando(false);
    }
  }

  return (
    <>
      <AvisoMedico className="mx-auto w-full max-w-3xl print:hidden" />
      <div className="mt-10 print:mt-0">
        <ConsultaForm consulta={consulta} ocupado={ocupado} error={error} onChange={setConsulta} onSubmit={preparar} />
      </div>
      {plan ? (
        <ConsultaResultado
          plan={plan}
          consulta={consulta}
          diaActivo={diaActivo}
          regenerando={regenerando}
          onDia={setDiaActivo}
          onVer={setAbierta}
          onRegenerar={regenerar}
          onImprimir={() => window.print()}
        />
      ) : ocupado ? (
        <PlanEsqueleto />
      ) : null}
      <RecetaDialog receta={abierta} favoritoId={null} onClose={() => setAbierta(null)} />
    </>
  );
}
