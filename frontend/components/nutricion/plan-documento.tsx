import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { presentarPlan } from "@/lib/plan-presentacion";
import type { Consulta, PlanSemanal } from "@/lib/types";

Font.registerHyphenationCallback((palabra) => [palabra]);

const tinta = "#2C2824";
const claro = "#F6F1E8";
const papel = "#FDFCFA";
const acento = "#C4623A";
const suave = "#EFE6D8";
const linea = "#DDD4C8";
const apagado = "#6F675E";
const pista = "#E8E0D4";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: tinta,
    backgroundColor: claro,
  },
  portada: { backgroundColor: tinta, color: claro, borderRadius: 10, padding: 16 },
  marca: { fontSize: 10, color: claro },
  tituloFila: { marginTop: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  titulo: { fontFamily: "Times-Roman", fontSize: 22, color: claro },
  fecha: { fontSize: 9, color: claro },
  ficha: { marginTop: 10, flexDirection: "row", flexWrap: "wrap" },
  pieza: {
    width: "31%",
    marginRight: "2%",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: linea,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: papel,
  },
  etiqueta: { fontSize: 8, color: apagado, marginBottom: 2 },
  valor: { fontSize: 10 },
  pastillas: { flexDirection: "row", flexWrap: "wrap", marginTop: 4 },
  pastilla: { backgroundColor: suave, borderRadius: 8, paddingVertical: 3, paddingHorizontal: 8, fontSize: 8, marginRight: 4, marginBottom: 4 },
  cifra: { marginTop: 8, borderWidth: 1, borderColor: linea, borderRadius: 10, padding: 12, backgroundColor: papel },
  cifraFila: { flexDirection: "row", alignItems: "flex-end" },
  numero: { fontFamily: "Times-Roman", fontSize: 28 },
  kcal: { fontSize: 9, color: apagado, marginTop: 2 },
  stats: { flex: 1, flexDirection: "row", marginLeft: 14 },
  stat: { flex: 1, paddingRight: 8 },
  clasificacion: { fontSize: 8, color: apagado, marginTop: 2 },
  macros: { flexDirection: "row", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: linea },
  macro: { flex: 1, marginRight: 8 },
  macroFila: { flexDirection: "row", justifyContent: "space-between" },
  barra: { width: "100%", height: 6, borderRadius: 4, backgroundColor: pista, marginTop: 4 },
  relleno: { height: 6, borderRadius: 4, backgroundColor: acento },
  nota: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: linea,
    borderLeftWidth: 4,
    borderLeftColor: acento,
    borderRadius: 8,
    padding: 10,
  },
  parrafo: { fontSize: 9, lineHeight: 1.4 },
  item: { fontSize: 9, lineHeight: 1.4, marginTop: 3 },
  seccion: { fontFamily: "Times-Roman", fontSize: 16, marginTop: 14, marginBottom: 8 },
  ayuda: { fontSize: 9, color: apagado, marginBottom: 8 },
  diaNombre: { fontFamily: "Times-Roman", fontSize: 16, marginTop: 6, marginBottom: 8 },
  comidaGrupo: { marginBottom: 8 },
  comida: {
    borderWidth: 1,
    borderColor: linea,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
    backgroundColor: papel,
  },
  comidaFila: { flexDirection: "row", alignItems: "center" },
  foto: { width: 64, height: 64, borderRadius: 8, backgroundColor: pista, marginRight: 10 },
  cuerpo: { flex: 1 },
  momento: { fontSize: 8, color: apagado },
  plato: { fontFamily: "Times-Roman", fontSize: 14, marginTop: 2 },
  meta: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 6 },
  categoria: {
    fontSize: 8,
    backgroundColor: suave,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 7,
    marginRight: 6,
  },
  kcalComida: {
    fontSize: 8,
    borderWidth: 1,
    borderColor: linea,
    borderRadius: 8,
    paddingVertical: 2,
    paddingHorizontal: 7,
    backgroundColor: "#FFFFFF",
  },
  notaComida: { fontSize: 8, color: apagado, marginTop: 6, lineHeight: 1.35 },
  subtitulo: { fontSize: 8, color: apagado, marginBottom: 3 },
  lineaTexto: { fontSize: 9, lineHeight: 1.35, marginBottom: 2 },
  vacio: { fontSize: 9, color: apagado, padding: 10 },
  compras: { flexDirection: "row", flexWrap: "wrap" },
  compra: {
    width: "48%",
    marginRight: "2%",
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: linea,
    borderRadius: 8,
    padding: 7,
  },
  casilla: { width: 10, height: 10, borderWidth: 1.5, borderColor: acento, borderRadius: 2, marginRight: 6, marginTop: 1 },
  compraTexto: { flex: 1 },
  compraNombre: { fontSize: 9 },
  compraDetalle: { fontSize: 8, color: apagado, marginTop: 2 },
  pie: { marginTop: 12, backgroundColor: pista, borderRadius: 8, padding: 8 },
  pieTexto: { fontSize: 8, color: apagado, lineHeight: 1.4 },
});

export function PlanDocumento({
  plan,
  consulta,
  fotos = {},
}: {
  plan: PlanSemanal;
  consulta: Consulta;
  fotos?: Record<string, string>;
}) {
  const hoja = presentarPlan(plan, consulta);

  return (
    <Document title="Plan de la semana — Sazón" author="Sazón">
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.portada}>
          <Text style={styles.marca}>Sazón</Text>
          <View style={styles.tituloFila}>
            <Text style={styles.titulo}>Plan de la semana</Text>
            <Text style={styles.fecha}>{hoja.fechaTexto}</Text>
          </View>
        </View>

        <View style={styles.ficha}>
          {hoja.ficha.map((dato) => (
            <View key={dato.etiqueta} style={styles.pieza}>
              <Text style={styles.etiqueta}>{dato.etiqueta}</Text>
              <Text style={styles.valor}>{dato.valor}</Text>
            </View>
          ))}
        </View>
        {hoja.restricciones.length > 0 ? (
          <View style={styles.pastillas}>
            {hoja.restricciones.map((item) => (
              <Text key={item} style={styles.pastilla}>
                {item}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.cifra} wrap={false}>
          <View style={styles.cifraFila}>
            <View>
              <Text style={styles.numero}>{hoja.calorias}</Text>
              <Text style={styles.kcal}>kcal al día</Text>
            </View>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.etiqueta}>IMC</Text>
                <Text style={styles.valor}>{hoja.imc}</Text>
                <Text style={styles.clasificacion}>{hoja.clasificacion}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.etiqueta}>Gasto</Text>
                <Text style={styles.valor}>{hoja.gasto}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.etiqueta}>Basal</Text>
                <Text style={styles.valor}>{hoja.tmb}</Text>
              </View>
            </View>
          </View>
          <View style={styles.macros}>
            {hoja.macros.map((macro) => (
              <View key={macro.nombre} style={styles.macro}>
                <View style={styles.macroFila}>
                  <Text style={styles.valor}>{macro.nombre}</Text>
                  <Text style={styles.etiqueta}>{macro.gramos} g</Text>
                </View>
                <View style={styles.barra}>
                  <View style={[styles.relleno, { width: `${Math.max(0, Math.min(100, macro.pct))}%` }]} />
                </View>
                <Text style={styles.etiqueta}>{macro.pct}%</Text>
              </View>
            ))}
          </View>
        </View>

        {hoja.nota || hoja.recomendaciones.length > 0 ? (
          <View style={styles.nota} wrap={false}>
            {hoja.nota ? <Text style={styles.parrafo}>{hoja.nota}</Text> : null}
            {hoja.recomendaciones.map((item) => (
              <Text key={item} style={styles.item}>
                • {item}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.seccion} minPresenceAhead={72}>
          La semana
        </Text>
        {hoja.dias.map((dia) => (
          <View key={dia.id}>
            <Text style={styles.diaNombre} minPresenceAhead={88}>
              {dia.etiqueta}
            </Text>
            {dia.comidas.length === 0 ? (
              <Text style={styles.vacio}>Este día quedó sin platos.</Text>
            ) : (
              dia.comidas.map((comida) => {
                const foto = comida.imagen ? fotos[comida.imagen] : "";
                return (
                  <View key={`${dia.id}-${comida.momento}`} style={styles.comidaGrupo}>
                    <View style={styles.comida} wrap={false}>
                      <View style={styles.comidaFila}>
                        {foto ? <Image src={foto} style={styles.foto} /> : <View style={styles.foto} />}
                        <View style={styles.cuerpo}>
                          <Text style={styles.momento}>{comida.momento}</Text>
                          <Text style={styles.plato}>{comida.nombre}</Text>
                          <View style={styles.meta}>
                            {comida.categoria ? <Text style={styles.categoria}>{comida.categoria}</Text> : null}
                            <Text style={styles.kcalComida}>≈ {comida.kcal} kcal</Text>
                          </View>
                          {comida.nota ? <Text style={styles.notaComida}>{comida.nota}</Text> : null}
                        </View>
                      </View>
                    </View>
                    {comida.ingredientes.length > 0 ? (
                      <View style={styles.comida} wrap={false}>
                        <Text style={styles.subtitulo}>Ingredientes</Text>
                        {comida.ingredientes.map((item, indice) => (
                          <Text key={`${indice}-${item}`} style={styles.lineaTexto}>
                            • {item}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                    {comida.pasos.length > 0 ? (
                      <View style={styles.comida}>
                        <View wrap={false}>
                          <Text style={styles.subtitulo}>Pasos</Text>
                          <Text style={styles.lineaTexto}>1. {comida.pasos[0]}</Text>
                        </View>
                        {comida.pasos.slice(1).map((paso, indice) => (
                          <Text key={`${indice + 1}-${paso.slice(0, 24)}`} style={styles.lineaTexto} wrap={false}>
                            {indice + 2}. {paso}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        ))}

        <View break>
          <Text style={styles.seccion}>Lista de compras</Text>
          <Text style={styles.ayuda}>Ingredientes de los siete días. La casilla es para marcar en papel.</Text>
          {hoja.compras.length === 0 ? (
            <Text style={styles.vacio}>El plan no tiene ingredientes para comprar.</Text>
          ) : (
            <View style={styles.compras}>
              {hoja.compras.map((item, indice) => (
                <View key={item.nombre} style={[styles.compra, indice % 2 === 1 ? { marginRight: 0 } : {}]} wrap={false}>
                  <View style={styles.casilla} />
                  <View style={styles.compraTexto}>
                    <Text style={styles.compraNombre}>{item.nombre}</Text>
                    {item.detalle ? <Text style={styles.compraDetalle}>{item.detalle}</Text> : null}
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={styles.pie}>
            <Text style={styles.pieTexto}>{hoja.aviso}</Text>
            <Text style={styles.pieTexto}>
              Recetas e imágenes de TheMealDB. Las calorías son una estimación y no sustituyen a un nutricionista o médico.
            </Text>
            {hoja.avisos.map((aviso) => (
              <Text key={aviso} style={styles.pieTexto}>
                • {aviso}
              </Text>
            ))}
          </View>
        </View>
      </Page>
    </Document>
  );
}
