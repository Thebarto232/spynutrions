import assert from "node:assert/strict";
import test from "node:test";
import { clasificarPregunta } from "./triggers.js";
import {
  bloqueEvidencia,
  buscarEstudios,
  mapearEuropePmc,
  normalizarConsultaIngles,
  ordenarEstudios,
  parsearPubmedXml,
  prepararContextoEvidencia,
} from "./evidencia.js";

test("busca evidencia en una pregunta de proteína y no en un cambio de cena", () => {
  assert.equal(clasificarPregunta("¿por qué más proteína?").buscar, true);
  assert.equal(clasificarPregunta("is protein healthy").buscar, true);
  assert.equal(clasificarPregunta("¿es sano?").buscar, true);
  assert.equal(clasificarPregunta("cambiar la cena del lunes").buscar, false);
  assert.equal(clasificarPregunta("Genera mi lista de compras").buscar, false);
  assert.equal(clasificarPregunta("No me gusta el pescado").buscar, false);
  assert.equal(clasificarPregunta("hola").buscar, false);
  assert.equal(clasificarPregunta("vi un gusano").buscar, false);
  assert.equal(clasificarPregunta("cambia la cena porque quiero más proteína").buscar, false);
});

test("deja la consulta en inglés, corta y sin operadores", () => {
  assert.equal(normalizarConsultaIngles('Query: "Protein intake for weight loss!"'), "protein intake weight loss");
});

test("prioriza el metaanálisis y arma el bloque del modelo", () => {
  const ordenados = ordenarEstudios([
    estudio({ titulo: "Un ensayo", tipos: ["Randomized Controlled Trial"], tipo: "ensayo clínico" }),
    estudio({ titulo: "Una revisión sistemática", tipos: ["Systematic Review"], tipo: "revisión sistemática" }),
    estudio({ titulo: "Un metaanálisis", tipos: ["Meta-Analysis"], tipo: "metaanálisis" }),
  ]);
  assert.deepEqual(
    ordenados.map((item) => item.titulo),
    ["Un metaanálisis", "Una revisión sistemática", "Un ensayo"],
  );
  assert.match(bloqueEvidencia("ok", ordenados), /ESTADO: estudios recuperados/);
  assert.equal(bloqueEvidencia("no_disponible", []), "ESTADO: evidencia no disponible");
  assert.equal(bloqueEvidencia("insuficiente", []), "ESTADO: sin estudios suficientes");
});

test("lee Europe PMC y descarta preprints", () => {
  const estudios = mapearEuropePmc({
    resultList: {
      result: [
        {
          source: "MED",
          title: "<b>Protein</b> intake",
          pubYear: "2024",
          pmid: "39002131",
          abstractText: "Background &amp; aims. " + "a".repeat(800),
          journalInfo: { journal: { title: "Clinical Nutrition ESPEN" } },
          pubTypeList: { pubType: ["Meta-Analysis", "Systematic Review"] },
        },
        { source: "PPR", title: "Preprint", pmid: "1", doi: "10.1/pre" },
      ],
    },
  });
  assert.equal(estudios.length, 1);
  assert.equal(estudios[0].titulo, "Protein intake");
  assert.equal(estudios[0].tipo, "metaanálisis");
  assert.equal(estudios[0].url, "https://pubmed.ncbi.nlm.nih.gov/39002131/");
  assert.equal(estudios[0].resumen.endsWith("…"), true);
  assert.ok(estudios[0].resumen.length <= 701);
});

test("lee el XML de PubMed", () => {
  const estudios = parsearPubmedXml(`
    <PubmedArticle>
      <PMID Version="1">39002131</PMID>
      <Article><Journal><JournalIssue><PubDate><Year>2024</Year></PubDate></JournalIssue><Title>Clinical nutrition ESPEN</Title></Journal>
      <ArticleTitle>Enhanced protein intake</ArticleTitle>
      <Abstract><AbstractText Label="BACKGROUND &amp; AIMS">Muscle mass.</AbstractText></Abstract>
      <PublicationTypeList><PublicationType>Systematic Review</PublicationType><PublicationType>Meta-Analysis</PublicationType></PublicationTypeList>
      </Article>
    </PubmedArticle>
  `);
  assert.equal(estudios.length, 1);
  assert.equal(estudios[0].anio, "2024");
  assert.equal(estudios[0].revista, "Clinical nutrition ESPEN");
  assert.equal(estudios[0].tipo, "metaanálisis");
  assert.match(estudios[0].resumen, /Muscle mass/);
});

test("no llama a PubMed si Europe PMC ya devolvió 3 estudios", async () => {
  let pubmed = 0;
  const hallazgo = await buscarEstudios("protein intake weight loss", {
    fetchImpl: async (url) => {
      if (String(url).includes("eutils.ncbi")) pubmed += 1;
      return json({ resultList: { result: [registro("1"), registro("2"), registro("3")] } });
    },
  });
  assert.equal(hallazgo.verificacion, "ok");
  assert.equal(hallazgo.estudios.length, 3);
  assert.equal(pubmed, 0);
});

test("usa PubMed si Europe PMC devuelve menos de 3", async () => {
  const hallazgo = await buscarEstudios("protein intake weight loss", {
    fetchImpl: async (url) => {
      const direccion = String(url);
      if (direccion.includes("europepmc")) return json({ resultList: { result: [registro("9")] } });
      if (direccion.includes("esearch")) return json({ esearchresult: { idlist: ["39002131", "32238384", "111", "222"] } });
      return texto(`<PubmedArticle><PMID>39002131</PMID><Article><Journal><JournalIssue><PubDate><Year>2024</Year></PubDate></JournalIssue><Title>ESPEN</Title></Journal><ArticleTitle>Uno</ArticleTitle><PublicationTypeList><PublicationType>Meta-Analysis</PublicationType></PublicationTypeList></Article></PubmedArticle>
        <PubmedArticle><PMID>32238384</PMID><Article><Journal><JournalIssue><PubDate><Year>2020</Year></PubDate></JournalIssue><Title>BMJ</Title></Journal><ArticleTitle>Dos</ArticleTitle><PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList></Article></PubmedArticle>
        <PubmedArticle><PMID>111</PMID><Article><Journal><JournalIssue><PubDate><Year>2019</Year></PubDate></JournalIssue><Title>J</Title></Journal><ArticleTitle>Tres</ArticleTitle><PublicationTypeList><PublicationType>Review</PublicationType></PublicationTypeList></Article></PubmedArticle>
        <PubmedArticle><PMID>222</PMID><Article><Journal><JournalIssue><PubDate><Year>2018</Year></PubDate></JournalIssue><Title>J</Title></Journal><ArticleTitle>Cuatro</ArticleTitle><PublicationTypeList><PublicationType>Journal Article</PublicationType></PublicationTypeList></Article></PubmedArticle>`);
    },
  });
  assert.equal(hallazgo.verificacion, "ok");
  assert.equal(hallazgo.estudios[0].pmid, "39002131");
  assert.equal(hallazgo.estudios.length, 4);
});

test("si las dos APIs fallan, la evidencia no está disponible", async () => {
  const hallazgo = await buscarEstudios("protein intake weight loss", {
    fetchImpl: async () => {
      throw new Error("timeout");
    },
  });
  assert.equal(hallazgo.verificacion, "no_disponible");
  assert.deepEqual(hallazgo.estudios, []);
});

test("cero resultados reales no es un fallo de red", async () => {
  const hallazgo = await buscarEstudios("protein intake weight loss", {
    fetchImpl: async (url) => {
      if (String(url).includes("esearch")) return json({ esearchresult: { idlist: [] } });
      return json({ resultList: { result: [] } });
    },
  });
  assert.equal(hallazgo.verificacion, "insuficiente");
});

test("un cambio de cena no busca y una caída simulada no llama a la red", async () => {
  const fetchImpl = async () => {
    throw new Error("no debía llamarse");
  };
  const operativo = await prepararContextoEvidencia({ pregunta: "cambiar la cena del lunes", fetchImpl });
  assert.equal(operativo.verificacion, "omitida");
  const caida = await prepararContextoEvidencia({
    pregunta: "¿por qué más proteína?",
    simular: "caida",
    fetchImpl,
  });
  assert.equal(caida.bloque, "ESTADO: evidencia no disponible");
  assert.deepEqual(caida.fuentes, []);
});

function estudio(parcial) {
  return {
    titulo: "Estudio",
    anio: "2020",
    revista: "Revista",
    tipo: "artículo",
    tipos: ["Journal Article"],
    resumen: "Resumen",
    pmid: "1",
    url: "https://pubmed.ncbi.nlm.nih.gov/1/",
    ...parcial,
  };
}

function registro(pmid) {
  return {
    source: "MED",
    title: `Estudio ${pmid}`,
    pubYear: "2021",
    pmid,
    abstractText: "Resumen",
    journalInfo: { journal: { title: "Nutrients" } },
    pubTypeList: { pubType: "Systematic Review" },
  };
}

function json(data) {
  return { ok: true, json: async () => data, text: async () => "" };
}

function texto(cuerpo) {
  return { ok: true, json: async () => ({}), text: async () => cuerpo };
}
