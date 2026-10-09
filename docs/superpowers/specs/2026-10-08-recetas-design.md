# Sitio de recetas — diseño

Fecha: 2026-10-08

## Resultado

Un sitio en español donde una persona busca recetas por nombre o por ingredientes, abre el paso a paso y guarda favoritas. Las recetas salen de una API externa. Nosotros no las inventamos.

El éxito de la fase 1 es una API documentada en `/docs`, con tests que no llaman a internet, y favoritos persistidos en PostgreSQL. El éxito de la fase 2 es un Next.js que ya consume esa API y deja huecos claros para pegar la interfaz hecha en v0. La fase 3 empieza solo cuando lleguen esos componentes.

## Lo que quedó fijo

- Backend Python + FastAPI en `/backend`. Carpetas `routers/`, `services/`, `schemas/`, `models/`, `core/`.
- Frontend Next.js + Tailwind + shadcn/ui en `/frontend`. App Router.
- PostgreSQL solo para favoritos.
- Proveedor inicial: TheMealDB (`https://www.themealdb.com/api.php`). La clave pública de desarrollo es `1` y va en `.env`, no en el código.
- Capa `services/providers/` con un protocolo. Cambiar a Spoonacular no toca los routers.
- Caché en memoria del proceso, TTL por variable de entorno. Sin Redis.
- CORS solo para `http://localhost:3000`.
- Documentación automática en `/docs`.
- Tests pytest por endpoint, con la API externa simulada.
- Nada de paquetes globales. Dependencias dentro de `backend/` y `frontend/`.
- No se borra ni se reutiliza `icomers` ni `bd_icmers`.

## Supuestos

- No hay cuentas de usuario. Hay una sola lista de favoritos en esta base.
- La interfaz está en español. El texto de la receta se muestra como lo devuelve TheMealDB (inglés). No traducimos.
- TheMealDB no trae tiempo de cocción. `tiempo` es `null`.
- `GET /api/recetas/ingredientes` acepta varios ingredientes separados por coma. TheMealDB filtra de uno en uno; el backend intersecta los ids.
- Buscar por nombre devuelve la receta completa. Buscar por ingredientes devuelve un resumen (`id`, `nombre`, `imagen`, `categoria`). El detalle siempre es `GET /api/recetas/{id}`.
- Guardar una favorita guarda una copia normalizada. La lista de favoritos no depende de que TheMealDB responda en ese momento.
- Repetir el mismo id externo responde 409, no duplica la fila.
- La base nueva se llama `recetas`.

## Contrato

Receta completa:

- `id`, `nombre`, `imagen`, `categoria`
- `ingredientes`: `{ nombre, cantidad }[]`
- `pasos`: `string[]`
- `tiempo`: `string | null`

Resumen: `id`, `nombre`, `imagen`, `categoria`.

Categoría: `nombre`, `imagen`, `descripcion`.

Favorito: `id` (entero nuestro) y `receta` (completa).

Error: HTTP de FastAPI con `detail = { "code", "message" }`. Mensajes en español.

| Situación | HTTP | code |
|---|---|---|
| `q` o `i` vacío | 422 | `consulta_invalida` |
| Receta inexistente | 404 | `receta_no_encontrada` |
| Favorito inexistente | 404 | `favorito_no_encontrado` |
| Favorito repetido | 409 | `favorito_ya_existe` |
| TheMealDB caído, timeout o respuesta ilegible | 502 | `proveedor_no_disponible` |

Endpoints, en este orden de registro para que `buscar`, `ingredientes` y `aleatoria` no los capture `{id}`:

- `GET /api/recetas/buscar?q=`
- `GET /api/recetas/ingredientes?i=`
- `GET /api/recetas/aleatoria`
- `GET /api/recetas/{id}`
- `GET /api/categorias`
- `POST /api/favoritos` con cuerpo `{ "id": "<id externo>" }`
- `GET /api/favoritos`
- `DELETE /api/favoritos/{id}` donde `{id}` es el entero de la fila

## Datos

Tabla `favorito`:

- `id bigint generated always as identity` primary key
- `proveedor text not null default 'themealdb'`
- `id_externo text not null` con check de texto no vacío
- `receta jsonb not null` — la receta ya normalizada
- `creado_en timestamptz not null default now()`
- único `(proveedor, id_externo)`

Sin columnas duplicadas de nombre o imagen: viven dentro de `receta`. La lista ordena por `creado_en desc`.

## Fuera de esta entrega

- Login, varios usuarios, traducir recetas, Spoonacular implementado, Redis, y la interfaz visual definitiva. Spoonacular solo queda preparado como otro proveedor. La UI de v0 se conecta en la fase 3.
