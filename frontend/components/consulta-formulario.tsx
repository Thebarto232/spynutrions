import type { Actividad, Consulta, Objetivo, Sexo, TipoCorporal } from "@/lib/types";

const actividades: { id: Actividad; etiqueta: string }[] = [
  { id: "sedentario", etiqueta: "Sedentario" },
  { id: "ligero", etiqueta: "Ligero" },
  { id: "moderado", etiqueta: "Moderado" },
  { id: "intenso", etiqueta: "Intenso" },
];

const objetivos: { id: Objetivo; etiqueta: string }[] = [
  { id: "bajar_grasa", etiqueta: "Bajar grasa" },
  { id: "mantener", etiqueta: "Mantener" },
  { id: "ganar_masa", etiqueta: "Ganar masa muscular" },
];

const tipos: { id: TipoCorporal; etiqueta: string; detalle: string }[] = [
  { id: "ectomorfo", etiqueta: "Ectomorfo", detalle: "Contextura delgada" },
  { id: "mesomorfo", etiqueta: "Mesomorfo", detalle: "Contextura atlética" },
  { id: "endomorfo", etiqueta: "Endomorfo", detalle: "Tendencia a acumular grasa" },
];

const campo = "h-12 w-full rounded-2xl border bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring";

export function ConsultaFormulario({
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
  function set<K extends keyof Consulta>(clave: K, valor: Consulta[K]) {
    onChange({ ...consulta, [clave]: valor });
  }

  return (
    <form
      className="print:hidden"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 font-serif text-2xl font-semibold">Tu ficha</legend>
        <label className="block text-sm">
          Edad
          <input
            className={`${campo} mt-2`}
            type="number"
            min={14}
            max={100}
            required
            value={consulta.edad}
            onChange={(event) => set("edad", Number(event.target.value))}
          />
        </label>
        <label className="block text-sm">
          Sexo
          <select
            className={`${campo} mt-2`}
            value={consulta.sexo}
            onChange={(event) => set("sexo", event.target.value as Sexo)}
          >
            <option value="mujer">Mujer</option>
            <option value="hombre">Hombre</option>
          </select>
        </label>
        <label className="block text-sm">
          Peso (kg)
          <input
            className={`${campo} mt-2`}
            type="number"
            min={26}
            max={299}
            step="0.1"
            required
            value={consulta.peso_kg}
            onChange={(event) => set("peso_kg", Number(event.target.value))}
          />
        </label>
        <label className="block text-sm">
          Estatura (cm)
          <input
            className={`${campo} mt-2`}
            type="number"
            min={121}
            max={229}
            required
            value={consulta.estatura_cm}
            onChange={(event) => set("estatura_cm", Number(event.target.value))}
          />
        </label>
        <label className="block text-sm">
          Nivel de actividad
          <select
            className={`${campo} mt-2`}
            value={consulta.actividad}
            onChange={(event) => set("actividad", event.target.value as Actividad)}
          >
            {actividades.map((item) => (
              <option key={item.id} value={item.id}>
                {item.etiqueta}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Objetivo
          <select
            className={`${campo} mt-2`}
            value={consulta.objetivo}
            onChange={(event) => set("objetivo", event.target.value as Objetivo)}
          >
            {objetivos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.etiqueta}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-serif text-2xl font-semibold">Tipo corporal percibido</legend>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Es una guía para repartir proteína, carbohidratos y grasa. No es una clasificación científica de tu dieta.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {tipos.map((tipo) => {
            const activo = consulta.tipo_corporal === tipo.id;
            return (
              <label
                key={tipo.id}
                className={`cursor-pointer rounded-2xl border px-4 py-4 ${activo ? "border-primary bg-card" : "bg-card/60"}`}
              >
                <input
                  className="sr-only"
                  type="radio"
                  name="tipo"
                  checked={activo}
                  onChange={() => set("tipo_corporal", tipo.id)}
                />
                <span className="block font-semibold">{tipo.etiqueta}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{tipo.detalle}</span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-8">
        <legend className="font-serif text-2xl font-semibold">Restricciones</legend>
        <div className="mt-4 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={consulta.vegetariano}
              onChange={(event) => set("vegetariano", event.target.checked)}
            />
            Vegetariano
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={consulta.sin_gluten}
              onChange={(event) => set("sin_gluten", event.target.checked)}
            />
            Sin gluten
          </label>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Alergias
            <input
              className={`${campo} mt-2`}
              value={consulta.alergias}
              placeholder="nuez, lactosa"
              onChange={(event) => set("alergias", event.target.value)}
            />
          </label>
          <label className="block text-sm">
            Ingredientes que no te gustan
            <input
              className={`${campo} mt-2`}
              value={consulta.disgustos}
              placeholder="cilantro, champiñón"
              onChange={(event) => set("disgustos", event.target.value)}
            />
          </label>
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={ocupado}
        className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-ink-foreground transition-colors hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
      >
        {ocupado ? "Preparando la semana…" : "Preparar mi semana"}
      </button>
    </form>
  );
}
