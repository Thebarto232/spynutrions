"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Actividad, Consulta, Objetivo, Sexo, TipoCorporal } from "@/lib/types";

const PASOS = ["Datos", "Actividad", "Tipo corporal", "Restricciones"] as const;

const AYUDA = [
  "Edad, sexo, peso y estatura.",
  "Cómo te mueves y qué quieres lograr.",
  "Es una guía para repartir proteína, carbohidratos y grasa. No clasifica tu dieta.",
  "Lo que no debe entrar en la semana.",
] as const;

const control =
  "h-12! w-full rounded-2xl! border-input bg-background px-4! text-base! shadow-none md:text-base! [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const sexos: { value: Sexo; label: string }[] = [
  { value: "mujer", label: "Mujer" },
  { value: "hombre", label: "Hombre" },
];

const actividades: { value: Actividad; label: string }[] = [
  { value: "sedentario", label: "Sedentario" },
  { value: "ligero", label: "Ligero" },
  { value: "moderado", label: "Moderado" },
  { value: "intenso", label: "Intenso" },
];

const objetivos: { value: Objetivo; label: string }[] = [
  { value: "bajar_grasa", label: "Bajar grasa" },
  { value: "mantener", label: "Mantener" },
  { value: "ganar_masa", label: "Ganar masa muscular" },
];

const tipos: { value: TipoCorporal; label: string; detalle: string }[] = [
  { value: "ectomorfo", label: "Ectomorfo", detalle: "Contextura delgada" },
  { value: "mesomorfo", label: "Mesomorfo", detalle: "Contextura atlética" },
  { value: "endomorfo", label: "Endomorfo", detalle: "Tendencia a acumular grasa" },
];

export function ConsultaForm({
  consulta,
  ocupado,
  error,
  onChange,
  onSubmit,
}: {
  consulta: Consulta;
  ocupado: boolean;
  error: string | null;
  onChange: (consulta: Consulta) => void;
  onSubmit: () => void;
}) {
  const [paso, setPaso] = useState(0);
  const [avisoPaso, setAvisoPaso] = useState<string | null>(null);

  function set<K extends keyof Consulta>(clave: K, valor: Consulta[K]) {
    onChange({ ...consulta, [clave]: valor });
  }

  function avanzar() {
    if (paso === 0 && !datosCompletos(consulta)) {
      setAvisoPaso("Revisa la edad, el peso y la estatura antes de continuar.");
      return;
    }
    setAvisoPaso(null);
    setPaso((actual) => Math.min(actual + 1, PASOS.length - 1));
  }

  function enviar() {
    if (paso < PASOS.length - 1) {
      avanzar();
      return;
    }
    onSubmit();
  }

  return (
    <form action={enviar} className="mx-auto flex w-full max-w-3xl flex-col print:hidden">
      <Card className="w-full gap-0 rounded-3xl border border-border bg-card py-0 shadow-none ring-0">
        <CardHeader className="gap-5 px-6 pt-7 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <CardTitle className="font-serif text-3xl font-semibold tracking-tight">Tu ficha</CardTitle>
            <p className="pb-1 text-sm text-muted-foreground">
              {paso + 1} / {PASOS.length}
            </p>
          </div>
          <nav aria-label="Pasos de la ficha">
            <ol className="flex flex-wrap gap-2">
              {PASOS.map((nombre, indice) => {
                const activo = indice === paso;
                return (
                  <li key={nombre}>
                    <Button
                      type="button"
                      size="sm"
                      variant={activo ? "default" : indice < paso ? "secondary" : "ghost"}
                      aria-current={activo ? "step" : undefined}
                      disabled={indice > paso || ocupado}
                      onClick={() => {
                        if (indice >= paso) return;
                        setAvisoPaso(null);
                        setPaso(indice);
                      }}
                      className="rounded-full"
                    >
                      {nombre}
                    </Button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </CardHeader>
        <CardContent className="px-6 py-6 sm:px-8">
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted-foreground">{AYUDA[paso]}</p>
          {paso === 0 ? (
            <FieldSet>
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <CampoNumero
                  id="edad"
                  etiqueta="Edad"
                  valor={consulta.edad}
                  min={14}
                  max={100}
                  onChange={(valor) => set("edad", valor)}
                />
                <CampoSelect id="sexo" etiqueta="Sexo" valor={consulta.sexo} opciones={sexos} onChange={(valor) => set("sexo", valor)} />
                <CampoNumero
                  id="peso"
                  etiqueta="Peso (kg)"
                  valor={consulta.peso_kg}
                  min={26}
                  max={299}
                  decimal
                  onChange={(valor) => set("peso_kg", valor)}
                />
                <CampoNumero
                  id="estatura"
                  etiqueta="Estatura (cm)"
                  valor={consulta.estatura_cm}
                  min={121}
                  max={229}
                  onChange={(valor) => set("estatura_cm", valor)}
                />
              </div>
            </FieldSet>
          ) : null}

          {paso === 1 ? (
            <div className="grid gap-5">
              <CampoSelect
                id="actividad"
                etiqueta="Nivel de actividad"
                valor={consulta.actividad}
                opciones={actividades}
                onChange={(valor) => set("actividad", valor)}
              />
              <CampoSelect
                id="objetivo"
                etiqueta="Objetivo"
                valor={consulta.objetivo}
                opciones={objetivos}
                onChange={(valor) => set("objetivo", valor)}
              />
            </div>
          ) : null}

          {paso === 2 ? (
            <FieldSet>
              <RadioGroup
                value={consulta.tipo_corporal}
                onValueChange={(valor) => set("tipo_corporal", valor as TipoCorporal)}
                className="grid gap-3 sm:grid-cols-3"
              >
                {tipos.map((tipo) => (
                  <Label
                    key={tipo.value}
                    className="flex h-full cursor-pointer items-start gap-3 rounded-2xl border bg-background p-4 has-data-checked:border-primary has-data-checked:bg-primary/5"
                  >
                    <RadioGroupItem value={tipo.value} className="mt-0.5" />
                    <span>
                      <span className="block font-medium">{tipo.label}</span>
                      <span className="mt-1 block text-sm font-normal text-muted-foreground">{tipo.detalle}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
            </FieldSet>
          ) : null}

          {paso === 3 ? (
            <FieldSet className="gap-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-background p-4 has-data-checked:border-primary has-data-checked:bg-primary/5">
                  <Checkbox
                    checked={consulta.vegetariano}
                    onCheckedChange={(marcado) => set("vegetariano", marcado === true)}
                  />
                  Vegetariano
                </Label>
                <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border bg-background p-4 has-data-checked:border-primary has-data-checked:bg-primary/5">
                  <Checkbox
                    checked={consulta.sin_gluten}
                    onCheckedChange={(marcado) => set("sin_gluten", marcado === true)}
                  />
                  Sin gluten
                </Label>
              </div>
              <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="alergias">Alergias</FieldLabel>
                  <Input
                    id="alergias"
                    className={control}
                    value={consulta.alergias}
                    placeholder="nuez, lactosa"
                    onChange={(event) => set("alergias", event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="disgustos">Ingredientes que no te gustan</FieldLabel>
                  <Input
                    id="disgustos"
                    className={control}
                    value={consulta.disgustos}
                    placeholder="cilantro, champiñón"
                    onChange={(event) => set("disgustos", event.target.value)}
                  />
                </Field>
              </div>
            </FieldSet>
          ) : null}

          {avisoPaso || error ? (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Revisa la ficha</AlertTitle>
              <AlertDescription>{avisoPaso || error}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="justify-between gap-3 rounded-b-3xl! border-border bg-transparent! px-6 py-5 sm:px-8">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-5"
            disabled={paso === 0 || ocupado}
            onClick={() => {
              setAvisoPaso(null);
              setPaso((actual) => Math.max(actual - 1, 0));
            }}
          >
            Anterior
          </Button>
          {paso < PASOS.length - 1 ? (
            <Button type="submit" className="h-11 rounded-full px-6" disabled={ocupado}>
              Siguiente
            </Button>
          ) : (
            <Button type="submit" className="h-11 rounded-full px-6" disabled={ocupado}>
              {ocupado ? "Preparando la semana…" : "Preparar mi semana"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </form>
  );
}

function CampoNumero({
  id,
  etiqueta,
  valor,
  min,
  max,
  decimal = false,
  onChange,
}: {
  id: string;
  etiqueta: string;
  valor: number;
  min: number;
  max: number;
  decimal?: boolean;
  onChange: (valor: number) => void;
}) {
  const enfocado = useRef(false);
  const [texto, setTexto] = useState(() => (Number.isFinite(valor) ? String(valor) : ""));
  const [tocado, setTocado] = useState(false);

  useEffect(() => {
    if (enfocado.current) return;
    setTexto(Number.isFinite(valor) ? String(valor) : "");
  }, [valor]);

  const numero = Number(texto.replace(",", "."));
  const invalido = tocado && (texto.trim() === "" || !Number.isFinite(numero) || numero < min || numero > max);

  return (
    <Field
      data-invalid={invalido || undefined}
      onBlur={(event) => {
        const destino = event.relatedTarget;
        if (destino instanceof Node && event.currentTarget.contains(destino)) return;
        enfocado.current = false;
        setTocado(true);
        publicar(texto, onChange);
      }}
    >
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <Input
        id={id}
        className={control}
        inputMode={decimal ? "decimal" : "numeric"}
        autoComplete="off"
        required
        aria-invalid={invalido || undefined}
        value={texto}
        onFocus={() => {
          enfocado.current = true;
        }}
        onChange={(event) => {
          const siguiente = event.target.value;
          if (!acepta(siguiente, decimal)) return;
          setTexto(siguiente);
          if (siguiente.trim() === "") setTocado(true);
          publicar(siguiente, onChange);
        }}
      />
      {invalido ? <FieldError>{`Usa un valor entre ${min} y ${max}.`}</FieldError> : null}
    </Field>
  );
}

function acepta(valor: string, decimal: boolean) {
  if (valor === "") return true;
  return decimal ? /^\d*([.,]\d*)?$/.test(valor) : /^\d+$/.test(valor);
}

function publicar(texto: string, onChange: (valor: number) => void) {
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "" || limpio === ".") {
    onChange(Number.NaN);
    return;
  }
  const numero = Number(limpio);
  if (Number.isFinite(numero)) onChange(numero);
}

function CampoSelect<T extends string>({
  id,
  etiqueta,
  valor,
  opciones,
  onChange,
}: {
  id: string;
  etiqueta: string;
  valor: T;
  opciones: { value: T; label: string }[];
  onChange: (valor: T) => void;
}) {
  return (
    <Field>
      <FieldLabel htmlFor={id}>{etiqueta}</FieldLabel>
      <Select
        items={opciones}
        value={valor}
        onValueChange={(siguiente) => {
          if (siguiente) onChange(siguiente);
        }}
      >
        <SelectTrigger id={id} className={control}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value}>
              {opcion.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function datosCompletos(consulta: Consulta) {
  return (
    consulta.edad >= 14 &&
    consulta.edad <= 100 &&
    consulta.peso_kg > 25 &&
    consulta.estatura_cm > 120 &&
    !Number.isNaN(consulta.edad) &&
    !Number.isNaN(consulta.peso_kg) &&
    !Number.isNaN(consulta.estatura_cm)
  );
}
