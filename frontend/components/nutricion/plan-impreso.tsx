import { Badge } from "@/components/ui/badge";
import { pasosUtiles, textoIngrediente } from "@/lib/presentacion";
import { Card, CardContent } from "@/components/ui/card";
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
const pieza = "border border-border bg-card shadow-none ring-0";

export function PlanImpreso({ plan, consulta }: { plan: PlanSemanal; consulta: Consulta }) {
  const { diagnostico } = plan;
  const ficha = [
    ["Edad", `${entero.format(consulta.edad)} años`],
    ["Sexo", sexos[consulta.sexo]],
    ["Peso", `${flexible.format(consulta.peso_kg)} kg`],
    ["Estatura", `${entero.format(consulta.estatura_cm)} cm`],
    ["Actividad", actividades[consulta.actividad]],
    ["Objetivo", objetivos[consulta.objetivo]],
    ["Contextura", tipos[consulta.tipo_corporal]],
  ] as const;
  const restricciones = [
    consulta.vegetariano ? "Vegetariano" : null,
    consulta.sin_gluten ? "Sin gluten" : null,
    consulta.alergias.trim() ? `Alergias: ${consulta.alergias.trim()}` : null,
    consulta.disgustos.trim() ? `Evitar: ${consulta.disgustos.trim()}` : null,
  ].filter((item): item is string => Boolean(item));
  const macros = [
    ["Proteína", diagnostico.macros.proteina_g, diagnostico.macros.proteina_pct],
    ["Carbohidratos", diagnostico.macros.carbohidratos_g, diagnostico.macros.carbohidratos_pct],
    ["Grasa", diagnostico.macros.grasa_g, diagnostico.macros.grasa_pct],
  ] as const;

  return (
    <article className="plan-impreso hidden print:block text-foreground">
      <header className="rounded-2xl bg-ink px-6 py-6 text-ink-foreground">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-sm text-ink-foreground/80">Sazón</p>
            <h1 className="mt-1 font-[family-name:var(--font-fraunces)] text-4xl font-semibold tracking-tight">
              Plan de la semana
            </h1>
          </div>
          <time dateTime={new Date().toISOString().slice(0, 10)} suppressHydrationWarning className="shrink-0 text-sm text-ink-foreground/80">
            {new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
          </time>
        </div>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-2 min-[720px]:grid-cols-4">
        {ficha.map(([etiqueta, valor]) => (
          <Card key={etiqueta} size="sm" className={pieza}>
            <CardContent>
              <dt className="text-muted-foreground">{etiqueta}</dt>
              <dd className="mt-1 font-medium">{valor}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
      {restricciones.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {restricciones.map((item) => (
            <li key={item}>
              <Badge variant="secondary">{item}</Badge>
            </li>
          ))}
        </ul>
      ) : null}

      <Card className={`mt-4 break-inside-avoid ${pieza}`}>
        <CardContent className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-end">
          <div>
            <p className="font-[family-name:var(--font-fraunces)] text-5xl font-semibold tabular-nums leading-none">
              {entero.format(diagnostico.calorias_objetivo)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">kcal al día</p>
          </div>
            <dl className="grid grid-cols-1 gap-3 min-[520px]:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">IMC</dt>
              <dd className="mt-0.5 font-medium">{decimal.format(diagnostico.imc)}</dd>
              <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">{diagnostico.clasificacion_imc}</dd>
            </div>
            <Dato etiqueta="Gasto" valor={`${entero.format(diagnostico.gasto)} kcal`} />
            <Dato etiqueta="Basal" valor={`${entero.format(diagnostico.tmb)} kcal`} />
          </dl>
        </CardContent>
        <CardContent className="grid grid-cols-1 gap-4 border-t border-border pt-4 min-[520px]:grid-cols-3">
          {macros.map(([nombre, gramos, pct]) => (
            <div key={nombre}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span>{nombre}</span>
                <span className="tabular-nums text-muted-foreground">{entero.format(gramos)} g</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
              </div>
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">{pct}%</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {diagnostico.nota_tipo_corporal || diagnostico.recomendaciones.length > 0 ? (
        <Card className={`mt-3 break-inside-avoid ${pieza}`}>
          <CardContent className="border-l-4 border-primary text-sm leading-relaxed">
            {diagnostico.nota_tipo_corporal ? <p>{diagnostico.nota_tipo_corporal}</p> : null}
            {diagnostico.recomendaciones.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {diagnostico.recomendaciones.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <section className="mt-6 space-y-3">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">La semana</h2>
        {plan.dias.map((dia) => {
          const comidas = [...dia.comidas].sort(
            (a, b) => ordenComida.indexOf(a.momento) - ordenComida.indexOf(b.momento),
          );
          return (
            <Card key={dia.dia} className={pieza}>
              <CardContent>
                <h3 className="font-[family-name:var(--font-fraunces)] text-2xl">{etiquetaDia(dia.dia)}</h3>
                {comidas.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">Este día quedó sin platos.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {comidas.map((comida) => (
                      <li key={`${dia.dia}-${comida.momento}`} className="flex gap-4 rounded-xl border border-border bg-card p-3">
                        <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {comida.receta.imagen ? (
                            <img src={comida.receta.imagen} alt="" className="size-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-muted-foreground">{MOMENTOS[comida.momento]}</p>
                          <p className="mt-1 font-[family-name:var(--font-fraunces)] text-xl font-semibold leading-tight">
                            {comida.receta.nombre}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {comida.receta.categoria ? <Badge variant="secondary">{comida.receta.categoria}</Badge> : null}
                            <Badge variant="outline">≈ {entero.format(comida.calorias_estimadas)} kcal</Badge>
                          </div>
                          {comida.nota_calorias ? (
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{comida.nota_calorias}</p>
                          ) : null}
                          {comida.receta.ingredientes.length > 0 ? (
                            <div className="mt-3 border-t border-border pt-2">
                              <p className="text-xs text-muted-foreground">Ingredientes</p>
                              <ul className="mt-1 space-y-0.5 text-sm">
                                {comida.receta.ingredientes.map((item, indice) => (
                                  <li key={`${indice}-${textoIngrediente(item)}`}>{textoIngrediente(item)}</li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                          {pasosUtiles(comida.receta.pasos).length > 0 ? (
                            <div className="mt-3 border-t border-border pt-2">
                              <p className="text-xs text-muted-foreground">Pasos</p>
                              <ol className="mt-1 list-decimal space-y-1 pl-4 text-sm">
                                {pasosUtiles(comida.receta.pasos).map((paso) => (
                                  <li key={paso}>{paso}</li>
                                ))}
                              </ol>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="hoja-compras">
        <h2 className="font-[family-name:var(--font-fraunces)] text-2xl font-semibold">Lista de compras</h2>
        <p className="mt-1 text-sm text-muted-foreground">Ingredientes de los siete días. La casilla es para marcar en papel.</p>
        {plan.compras.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">El plan no tiene ingredientes para comprar.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-2 min-[720px]:grid-cols-2">
            {plan.compras.map((item) => (
              <li key={item.nombre} className={`flex break-inside-avoid items-start gap-3 rounded-xl px-3 py-2 ${pieza}`}>
                <span aria-hidden="true" className="mt-0.5 inline-block size-4 shrink-0 rounded-[4px] border-2 border-primary" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.nombre}</span>
                  {item.cantidades.length > 0 ? (
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{item.cantidades.join(" / ")}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="mt-6 rounded-xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <p>{diagnostico.aviso}</p>
        <p className="mt-1">Recetas e imágenes de TheMealDB. Las calorías son una estimación y no sustituyen a un nutricionista o médico.</p>
        {plan.avisos.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {plan.avisos.map((aviso) => (
              <li key={aviso}>{aviso}</li>
            ))}
          </ul>
        ) : null}
      </footer>
    </article>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 font-medium">{valor}</dd>
    </div>
  );
}
