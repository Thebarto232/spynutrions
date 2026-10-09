import { clasificarPregunta } from "./triggers.js";

export const TIMEOUT_MS = 6000;
const EUROPE = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
const ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
const EFETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi";
const ANTHROPIC = "https://api.anthropic.com/v1/messages";
const PARADAS = new Set(["a", "an", "the", "of", "for", "to", "in", "on", "and", "or", "not", "with", "is", "are", "what", "how", "why", "does", "do"]);

export async function prepararContextoEvidencia(opciones) {
  if (!clasificarPregunta(opciones.pregunta).buscar) {
    return { verificacion: "omitida", fuentes: [], bloque: "ESTADO: no se requirió evidencia" };
  }
  if (opciones.simular === "caida" || process.env.EVIDENCIA_SIMULAR === "caida") {
    return noDisponible();
  }
  try {
    const consulta = await traducirConsulta(opciones.pregunta, opciones);
    if (!consulta) return noDisponible();
    const hallazgo = await buscarEstudios(consulta, opciones);
    return {
      verificacion: hallazgo.verificacion,
      fuentes: hallazgo.estudios.map(fuentePublica),
      bloque: bloqueEvidencia(hallazgo.verificacion, hallazgo.estudios),
    };
  } catch {
    return noDisponible();
  }
}

export function bloqueEvidencia(verificacion, estudios) {
  if (verificacion === "no_disponible") return "ESTADO: evidencia no disponible";
  if (!estudios || estudios.length === 0) return "ESTADO: sin estudios suficientes";
  const lista = estudios
    .map((estudio, indice) =>
      [
        `${indice + 1}. ${estudio.titulo}`,
        `Año: ${estudio.anio || "sin año"}. Revista: ${estudio.revista || "sin revista"}. Tipo: ${estudio.tipo}.`,
        `PMID: ${estudio.pmid || "sin PMID"}. Enlace: ${estudio.url}`,
        `Resumen: ${estudio.resumen || "sin resumen"}`,
      ].join("\n"),
    )
    .join("\n\n");
  return `ESTADO: estudios recuperados\nDi "según el resumen del estudio" y no afirmes más de lo que dice el resumen.\n\n${lista}`;
}

export function normalizarConsultaIngles(texto) {
  const linea = String(texto || "")
    .split("\n")
    .map((parte) => parte.trim())
    .find(Boolean) || "";
  const sinPrefijo = linea.replace(/^(consulta|query)\s*:\s*/i, "");
  const palabras = sinPrefijo
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .toLowerCase()
    .split(/\s+/)
    .filter((palabra) => palabra.length > 1 && !PARADAS.has(palabra))
    .slice(0, 8);
  return palabras.join(" ");
}

export async function buscarEstudios(consulta, opciones = {}) {
  const palabras = consulta.split(/\s+/).filter(Boolean);
  if (palabras.length < 2) return { verificacion: "no_disponible", estudios: [] };
  const fetchImpl = opciones.fetchImpl || fetch;
  const timeoutMs = opciones.timeoutMs ?? TIMEOUT_MS;
  let estudios = [];
  let falloEurope = false;
  try {
    estudios = await buscarEuropePmc(palabras, fetchImpl, timeoutMs);
  } catch {
    falloEurope = true;
    estudios = [];
  }
  if (estudios.length >= 3) return { verificacion: "ok", estudios: estudios.slice(0, 5) };

  let pubmed = [];
  let falloPubmed = false;
  try {
    pubmed = await buscarPubmed(palabras, fetchImpl, timeoutMs, opciones.ncbiKey || "");
  } catch {
    falloPubmed = true;
  }
  const elegidos = pubmed.length > estudios.length ? pubmed : estudios;
  if (elegidos.length > 0) return { verificacion: "ok", estudios: elegidos.slice(0, 5) };
  if (falloEurope && falloPubmed) return { verificacion: "no_disponible", estudios: [] };
  if (estudios.length === 0 && falloPubmed) return { verificacion: "no_disponible", estudios: [] };
  return { verificacion: "insuficiente", estudios: [] };
}

export function mapearEuropePmc(data) {
  const lista = comoLista(data?.resultList?.result);
  return lista
    .filter((item) => item && item.source !== "PPR")
    .map(mapearRegistroEurope)
    .filter(Boolean);
}

export function parsearPubmedXml(xml) {
  return String(xml || "")
    .split("<PubmedArticle>")
    .slice(1)
    .map((trozo) => trozo.split("</PubmedArticle>")[0])
    .map(mapearArticuloPubmed)
    .filter(Boolean);
}

export function ordenarEstudios(estudios) {
  return estudios
    .map((estudio, indice) => ({ estudio, indice }))
    .sort((a, b) => prioridad(a.estudio) - prioridad(b.estudio) || a.indice - b.indice)
    .map((item) => item.estudio);
}

async function traducirConsulta(pregunta, opciones) {
  const fetchImpl = opciones.fetchImpl || fetch;
  const respuesta = await fetchImpl(ANTHROPIC, {
    method: "POST",
    signal: AbortSignal.timeout(opciones.timeoutMs ?? TIMEOUT_MS),
    headers: {
      "content-type": "application/json",
      "x-api-key": opciones.anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: opciones.modelo,
      max_tokens: 40,
      system:
        "Convierte la pregunta a una consulta de 3 a 8 palabras en inglés para PubMed. Devuelve solo esas palabras, sin comillas ni operadores.",
      messages: [{ role: "user", content: String(pregunta || "").slice(0, 500) }],
    }),
  });
  if (!respuesta.ok) throw new Error("traduccion");
  const data = await respuesta.json();
  const bloques = Array.isArray(data.content) ? data.content : [];
  const texto = bloques
    .filter((bloque) => bloque.type === "text" && typeof bloque.text === "string")
    .map((bloque) => bloque.text)
    .join(" ");
  return normalizarConsultaIngles(texto);
}

async function buscarEuropePmc(palabras, fetchImpl, timeoutMs) {
  const precisos = await intentar(() => pedirEurope(palabras, true, fetchImpl, timeoutMs));
  const listaPrecisa = precisos.valor || [];
  if (precisos.ok && listaPrecisa.length >= 3) return ordenarEstudios(listaPrecisa).slice(0, 5);
  const amplios = await intentar(() => pedirEurope(palabras, false, fetchImpl, timeoutMs));
  if (!precisos.ok && !amplios.ok) throw new Error("europepmc");
  return ordenarEstudios(unirEstudios([listaPrecisa, amplios.valor || []])).slice(0, 5);
}

async function pedirEurope(palabras, soloRevisiones, fetchImpl, timeoutMs) {
  const params = new URLSearchParams({
    query: consultaEurope(palabras, soloRevisiones),
    format: "json",
    pageSize: soloRevisiones ? "8" : "15",
    resultType: "core",
  });
  const data = await pedirJson(`${EUROPE}?${params}`, fetchImpl, timeoutMs);
  return mapearEuropePmc(data);
}

function consultaEurope(palabras, soloRevisiones) {
  const nucleo = `(${palabras.join(" AND ")}) NOT SRC:PPR`;
  if (!soloRevisiones) return nucleo;
  return `${nucleo} AND (PUB_TYPE:"meta-analysis" OR PUB_TYPE:"systematic review")`;
}

async function buscarPubmed(palabras, fetchImpl, timeoutMs, ncbiKey) {
  const filtrados = await intentar(() => esearch(palabras, true, fetchImpl, timeoutMs, ncbiKey));
  let ids = filtrados.valor || [];
  let amplios = { ok: true, valor: [] };
  if (ids.length < 3) {
    amplios = await intentar(() => esearch(palabras, false, fetchImpl, timeoutMs, ncbiKey));
    if (amplios.valor) ids = unirIds(ids, amplios.valor);
  }
  if (ids.length === 0) {
    if (!filtrados.ok && !amplios.ok) throw new Error("pubmed");
    if (filtrados.ok && !amplios.ok) throw new Error("pubmed");
    return [];
  }
  const xml = await pedirTexto(urlEfetch(ids.slice(0, 8), ncbiKey), fetchImpl, timeoutMs);
  return ordenarEstudios(parsearPubmedXml(xml)).slice(0, 5);
}

async function intentar(tarea) {
  try {
    return { ok: true, valor: await tarea() };
  } catch {
    return { ok: false, valor: null };
  }
}

async function esearch(palabras, soloRevisiones, fetchImpl, timeoutMs, ncbiKey) {
  const params = paramsNcbi(
    {
      db: "pubmed",
      retmode: "json",
      retmax: "8",
      sort: "relevance",
      term: terminoPubmed(palabras, soloRevisiones),
    },
    ncbiKey,
  );
  const data = await pedirJson(`${ESEARCH}?${params}`, fetchImpl, timeoutMs);
  const lista = data?.esearchresult?.idlist;
  if (!Array.isArray(lista)) return [];
  return lista.map((id) => String(id).replace(/\D/g, "")).filter(Boolean);
}

function terminoPubmed(palabras, soloRevisiones) {
  const nucleo = `${palabras.join(" AND ")} NOT preprint[Filter]`;
  if (!soloRevisiones) return nucleo;
  return `${nucleo} AND (systematic review[pt] OR meta-analysis[pt])`;
}

function urlEfetch(ids, ncbiKey) {
  const params = paramsNcbi({ db: "pubmed", retmode: "xml" }, ncbiKey);
  return `${EFETCH}?${params}&id=${ids.join(",")}`;
}

function paramsNcbi(campos, ncbiKey) {
  const params = new URLSearchParams({ ...campos, tool: "sazon" });
  if (/^[A-Za-z0-9]{8,64}$/.test(ncbiKey || "")) params.set("api_key", ncbiKey);
  return params;
}

function mapearRegistroEurope(registro) {
  const tipos = tiposEurope(registro.pubTypeList);
  if (tipos.some((tipo) => /preprint/i.test(tipo))) return null;
  const titulo = textoPlano(registro.title);
  if (!titulo) return null;
  const pmid = String(registro.pmid || "").replace(/\D/g, "");
  const revista = textoPlano(registro.journalInfo?.journal?.title || registro.journalTitle || "");
  const anio = String(registro.pubYear || registro.journalInfo?.yearOfPublication || "").replace(/\D/g, "").slice(0, 4);
  const url = enlaceEstudio({ pmid, pmcid: registro.pmcid, doi: registro.doi });
  if (!url) return null;
  return {
    titulo,
    anio,
    revista,
    tipo: etiquetaTipo(tipos),
    tipos,
    resumen: recortar(textoPlano(registro.abstractText)),
    pmid,
    url,
  };
}

function tiposEurope(pubTypeList) {
  const valor = pubTypeList?.pubType ?? pubTypeList;
  const lista = Array.isArray(valor) ? valor : valor ? [valor] : [];
  return lista.flatMap((item) => String(item).split(";")).map((item) => item.trim()).filter(Boolean);
}

function mapearArticuloPubmed(articulo) {
  const pmid = (interior(articulo, "PMID").match(/\d+/) || [""])[0];
  const titulo = textoPlano(interior(articulo, "ArticleTitle"));
  if (!titulo) return null;
  const revista = textoPlano(interior(interior(articulo, "Journal"), "Title"));
  const pubDate = interior(interior(articulo, "JournalIssue"), "PubDate");
  const anio = ((pubDate.match(/<Year>(\d{4})<\/Year>/) || pubDate.match(/<MedlineDate>(\d{4})/) || [])[1]) || "";
  const tipos = todos(interior(articulo, "PublicationTypeList"), "PublicationType").map(textoPlano).filter(Boolean);
  if (tipos.some((tipo) => /preprint/i.test(tipo))) return null;
  const resumen = recortar(todos(interior(articulo, "Abstract"), "AbstractText").map(textoPlano).filter(Boolean).join(" "));
  const doi = (articulo.match(/<ELocationID[^>]*EIdType="doi"[^>]*>([^<]+)<\/ELocationID>/) || [])[1] || "";
  const url = enlaceEstudio({ pmid, doi: textoPlano(doi) });
  if (!url) return null;
  return { titulo, anio, revista, tipo: etiquetaTipo(tipos), tipos, resumen, pmid, url };
}

function enlaceEstudio({ pmid, pmcid, doi }) {
  if (pmid) return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
  if (pmcid && /^PMC\d+$/i.test(String(pmcid))) return `https://europepmc.org/article/${pmcid}`;
  if (doi && /^10\.\S+$/.test(doi)) return `https://doi.org/${doi}`;
  return "";
}

export function etiquetaTipo(tipos) {
  const texto = tipos.join(" ").toLowerCase();
  if (texto.includes("meta-analysis") || texto.includes("meta analysis")) return "metaanálisis";
  if (texto.includes("systematic review")) return "revisión sistemática";
  if (texto.includes("review")) return "revisión";
  if (texto.includes("randomized controlled trial")) return "ensayo clínico";
  return tipos[0] || "artículo";
}

function prioridad(estudio) {
  const texto = (estudio.tipos || [estudio.tipo || ""]).join(" ").toLowerCase();
  if (texto.includes("meta-analysis") || texto.includes("meta analysis")) return 0;
  if (texto.includes("systematic review")) return 1;
  if (/\breview\b/.test(texto)) return 2;
  return 3;
}

function fuentePublica(estudio) {
  return {
    titulo: estudio.titulo.slice(0, 300),
    anio: estudio.anio || "",
    revista: (estudio.revista || "").slice(0, 200),
    tipo: estudio.tipo || "artículo",
    pmid: estudio.pmid || "",
    url: estudio.url,
  };
}

function unirEstudios(listas) {
  const vistos = new Map();
  for (const estudio of listas.flat()) {
    const clave = estudio.pmid || estudio.titulo;
    if (!vistos.has(clave)) vistos.set(clave, estudio);
  }
  return [...vistos.values()];
}

function unirIds(primero, segundo) {
  return [...new Set([...primero, ...segundo])];
}

function comoLista(result) {
  if (Array.isArray(result)) return result;
  if (result && typeof result === "object") return [result];
  return [];
}

function noDisponible() {
  return { verificacion: "no_disponible", fuentes: [], bloque: "ESTADO: evidencia no disponible" };
}

export function textoPlano(valor) {
  return String(valor || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function recortar(texto, limite = 700) {
  if (texto.length <= limite) return texto;
  return `${texto.slice(0, limite).trim()}…`;
}

function interior(xml, etiqueta) {
  const coincidencia = String(xml || "").match(new RegExp(`<${etiqueta}(?:\\s[^>]*)?>([\\s\\S]*?)</${etiqueta}>`, "i"));
  return coincidencia ? coincidencia[1] : "";
}

function todos(xml, etiqueta) {
  return [...String(xml || "").matchAll(new RegExp(`<${etiqueta}(?:\\s[^>]*)?>([\\s\\S]*?)</${etiqueta}>`, "gi"))].map(
    (coincidencia) => coincidencia[1],
  );
}

async function pedirJson(url, fetchImpl, timeoutMs) {
  const respuesta = await pedir(url, fetchImpl, timeoutMs, { accept: "application/json" });
  return respuesta.json();
}

async function pedirTexto(url, fetchImpl, timeoutMs) {
  const respuesta = await pedir(url, fetchImpl, timeoutMs);
  return respuesta.text();
}

async function pedir(url, fetchImpl, timeoutMs, headers) {
  const respuesta = await fetchImpl(url, { signal: AbortSignal.timeout(timeoutMs), headers });
  if (!respuesta.ok) throw new Error("http");
  return respuesta;
}
