export async function fotosEnDataUrl(urls: string[]) {
  const unicas = [...new Set(urls.filter((url) => url.startsWith("https://www.themealdb.com/images/")))];
  const pares = await Promise.all(
    unicas.map(async (url) => {
      try {
        const respuesta = await fetch(`/api/imagen?u=${encodeURIComponent(url)}`);
        if (!respuesta.ok) return null;
        const blob = await respuesta.blob();
        const data = await new Promise<string>((resolve, reject) => {
          const lector = new FileReader();
          lector.onload = () => resolve(String(lector.result));
          lector.onerror = () => reject(lector.error);
          lector.readAsDataURL(blob);
        });
        return [url, data] as const;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(pares.filter((par): par is readonly [string, string] => par !== null));
}
