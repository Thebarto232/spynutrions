# Diseño de Sazón

La interfaz usa los tokens de `frontend/app/globals.css` y los componentes de `frontend/components/ui`. No se añaden colores sueltos: el acento es `--primary`, el fondo es `--background` y el texto es `--foreground`. La tipografía de títulos sigue la clase `font-serif` que ya usa el sitio (Fraunces). Los iconos salen de `lucide-react`.

## Dónde vive cada pieza

| Pieza | Uso |
| --- | --- |
| `components/ui` | Primitivos instalados con el CLI de shadcn (estilo `base-nova`). |
| `components/nutricion` | Ficha, diagnóstico, día, receta, chat, fuentes, compras y aviso. |
| `app/dashboard` | Bloque oficial `dashboard-01`. Su encabezado está en `components/dashboard-header.tsx` para no reemplazar el encabezado de Sazón. |
| `app/componentes` | Galería de los componentes de nutrición. En producción responde 404. |

## Componentes de nutrición

- `ConsultaForm` recoge la misma `Consulta` que ya guardaba el plan, en cuatro pasos. El `<form>` es el contenedor: `mx-auto flex w-full max-w-3xl flex-col`, con campos de altura 12 y botones en píldora. El envío usa la prop `action` de React. El pie del card no usa la banda gris del primitivo. Los pasos son `Button` de shadcn: el bloque `questionnaire` no cubre edad, peso y estatura, y queda en la galería.
- `ResumenDiagnostico` muestra el diagnóstico con `Badge` para la clasificación del IMC y `Progress` para las calorías respecto al gasto. `MacroChart` usa el gráfico de shadcn y `Progress` para los porcentajes.
- `DiaCard` y `RecetaCard` muestran un día y una comida. Los días se cambian con `Tabs` en la semana. `RecetaCard` es un `Card` con `Badge`. `RecetaDialog` abre el contenido de receta que ya existía; el corazón usa `Tooltip`.
- `ChatWidget` y `ChatBubble` pintan el chat. El transcript va en un `Card` con `ScrollArea` e `Input`. El envío, la memoria y las acciones siguen en `components/chat-nutricion.tsx`.
- `FuentesList` lista TheMealDB y las notas del plan, y también las citas del chat. El título de cada fuente es un `Badge`. Los enlaces del chat solo se abren si el host es PubMed, Europe PMC o doi.org.
- `ListaCompras` muestra `plan.compras` con un `Checkbox` local por ítem. Marcar un ítem no cambia el plan.
- `PlanImpreso` es la hoja de «Imprimir». En pantalla no se ve. La portada usa `Card` y `Badge`. «Descargar plan» guarda un PDF con `@react-pdf/renderer` (`PlanDocumento`), en A4, con el mismo contenido: ficha, calorías, siete días y compras en otra página. Cada comida del PDF y de la hoja impresa repite la tarjeta de la semana: foto, momento, nombre, categoría, calorías y la nota. Debajo van los ingredientes y los pasos, para cocinar sin volver a abrir el sitio. La foto queda dentro del archivo. Cada comida es un bloque que cabe en la hoja: si no entra, pasa completa a la página siguiente, con margen interior para que el borde no la corte. El fondo del PDF es el crema de la página. El archivo se llama `plan-semanal-sazon-fecha.pdf`.
- `AvisoMedico` repite el aviso de que la herramienta no sustituye a un profesional.

El formulario por pasos de la ficha usa `Field`, `Input`, `Select`, `RadioGroup` y `Checkbox`. Edad, peso y estatura guardan el texto que la persona escribe y solo lo convierten a número si es un número real: borrar el campo lo deja vacío, no lo fuerza a 0. El bloque `questionnaire` queda en la galería para flujos de opciones. El registro `base-nova` no publica un archivo `form.tsx`; el primitivo de formulario de este estilo es `Field`.

## Fuentes de esta fase

No se añadieron librerías de UI nuevas. 21st.dev y Magic UI no entran: shadcn ya cubre estas piezas. Los íconos siguen en `lucide-react`.

| Pieza | Fuente |
| --- | --- |
| `ConsultaForm` | shadcn/ui: `Field` (formulario de `base-nova`), `Input`, `Select`, `RadioGroup`, `Checkbox`, `Button` para los pasos, `Card`, `Alert` |
| Pasos de la ficha | shadcn/ui `Button`. El bloque de pasos del registro es `Questionnaire` y no admite los campos numéricos obligatorios |
| Semana | shadcn Blocks `dashboard-01` en `/dashboard`. Los días del plan usan shadcn/ui `Tabs` |
| `ResumenDiagnostico` | shadcn/ui `Card`, `Badge`, `Progress`, `Alert`, `Skeleton` |
| `MacroChart` | shadcn Charts (`Chart`) y shadcn/ui `Progress` |
| `DiaCard` | shadcn/ui `Card`, `Tooltip`, `Button` |
| `RecetaCard` | shadcn/ui `Card`, `Badge`, `Button` |
| `RecetaDialog` | shadcn/ui `Dialog`, `Tooltip`, `Button`, `Progress` |
| `ChatWidget` | shadcn/ui `Sheet`, `Card`, `ScrollArea`, `Input`, `Button`, `Alert` |
| `FuentesList` | shadcn/ui `Card`, `Badge`, `Alert` |
| `ListaCompras` | shadcn/ui `Card`, `Checkbox`, `ScrollArea`, `Label` |

## Cómo verlo

Desde `frontend`:

```bash
npm run dev
```

- `/plan` — ficha, semana, compras y fuentes, con el plan real.
- `/componentes` — galería con datos de muestra. Solo en `next dev`.
- `/dashboard` — bloque `dashboard-01`, con datos de ejemplo del registro.
- El botón Consulta, en cualquier página, abre el chat.
- En el inicio, cada categoría del recetario se marca al pulsarla. El título y el esqueleto de carga cambian en ese momento; las tarjetas llegan cuando responde la API. El foco usa el anillo del tema, no el recuadro azul del navegador.

El gráfico de macros usa `--primary`, `--accent` y `--foreground`. Las variables `--chart-1` a `--chart-5` del tema siguen en gris y no se usan en este gráfico porque no se distinguen sobre el fondo.
