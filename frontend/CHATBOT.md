# Chat nutricionista

Una función en `pages/api/chat.js` llama a Anthropic. No guarda nada. El historial, el perfil, el plan, la memoria y las fuentes citadas quedan en `localStorage`.

## Evidencia

Si la pregunta habla de nutrientes, salud, proteína, calorías, estudios o del porqué del plan, el servidor busca antes de responder. No busca si el mensaje pide cambiar una comida, la lista de compras o recordar un dato. Esas frases están en `lib/triggers.js`.

La búsqueda convierte la pregunta a unas palabras en inglés, consulta Europe PMC y, si falla o devuelve menos de 3 estudios, PubMed. Al modelo le llegan título, año, revista, tipo, resumen y PMID. La respuesta solo puede apoyarse en esos resúmenes y en `knowledge/guias.md`. Las secciones marcadas `PENDIENTE DE VERIFICAR CONTRA EL DOCUMENTO ORIGINAL` no son una recomendación: se editan cuando haya una cita confirmada del documento oficial.

`/api/chat` devuelve `fuentes` y la interfaz las muestra como enlaces bajo la respuesta. Si Europe PMC y PubMed no responden, el estado es `evidencia no disponible` y aparece: "No pude verificar fuentes en este momento".

Para simular esa caída, en `frontend/.env.local`:

```
EVIDENCIA_SIMULAR=caida
```

Reinicia el servidor, prueba una pregunta científica y borra la variable.

`NCBI_API_KEY` es opcional. Sin ella PubMed sigue funcionando, con menos peticiones por segundo.

En `frontend/.env.local` (no se sube):

```
ANTHROPIC_API_KEY=your-key
CHAT_MODEL=claude-sonnet-5-5
SITE_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
NCBI_API_KEY=your-key
```

Desde `frontend`:

```
npx vercel dev
```

También vale `npm run dev` si Next carga `pages/api`. Abre `/plan`, pulsa Consulta y prueba:

1. ¿Por qué este plan?
2. Cambia la cena del lunes
3. Quiero más proteína
4. Genera mi lista de compras
5. No me gusta el pescado
