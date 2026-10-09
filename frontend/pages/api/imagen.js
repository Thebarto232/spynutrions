const PREFIJO = "https://www.themealdb.com/images/";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).end();
    return;
  }

  const cruda = Array.isArray(req.query.u) ? req.query.u[0] : req.query.u;
  let destino;
  try {
    destino = new URL(String(cruda || ""));
  } catch {
    res.status(400).end();
    return;
  }

  if (destino.protocol !== "https:" || !destino.href.startsWith(PREFIJO)) {
    res.status(400).end();
    return;
  }

  let respuesta = await fetch(destino.href).catch(() => null);
  if (!respuesta?.ok) respuesta = await fetch(destino.href).catch(() => null);
  const tipo = respuesta?.headers.get("content-type") || "";
  if (!respuesta?.ok || !tipo.startsWith("image/")) {
    res.status(502).end();
    return;
  }

  const bytes = Buffer.from(await respuesta.arrayBuffer());
  res.setHeader("Content-Type", tipo);
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(bytes);
}
