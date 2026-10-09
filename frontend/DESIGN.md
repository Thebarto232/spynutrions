# Movimiento

El sitio se mueve poco y solo para mostrar que algo cambió: el día, una comida, un mensaje, un número. La información sigue escrita. Si el sistema pide menos movimiento, las transformaciones no corren y el contenido aparece en su sitio.

## Tokens

Todo sale de `lib/motion.ts`.

| Token | Valor | Uso |
| --- | --- | --- |
| corta | 150 ms | botones, casillas, burbujas |
| media | 220 ms | cambio de día, tarjetas, diálogo |
| larga | 300 ms | números y barras del diagnóstico |
| curva | cubic-bezier(0.22, 1, 0.36, 1) | todas |
| desplazamiento | 8 px (`--motion-shift`) | fade con un leve desliz |
| resalte | 900 ms en pantalla | el anillo entra y sale con opacidad, en la duración media |

Esas cifras se copian a `--motion-corta`, `--motion-media`, `--motion-larga`, `--motion-ease` y `--motion-shift` en el `<html>`. Tailwind las usa como `duration-[var(--motion-media)]` y `ease-[var(--motion-ease)]`.

## Qué se anima

Solo `transform` y `opacity`.

- El día del plan entra con fade y 8 px. El día que sale solo baja la opacidad, para no empujar el alto.
- Las comidas del día entran escalonadas (40 ms entre una y otra, tope de cinco esperas) y suben 2 px al pasar el cursor.
- Recetas, plan y fuentes muestran un esqueleto y un texto (“Buscando recetas…”) mientras llegan.
- Cada burbuja del chat entra en 150 ms. “Escribiendo…” queda escrito; los puntos solo acompañan. El scroll al final es suave.
- Al cambiar una comida, la tarjeta dice “Receta actualizada” y el anillo aparece con opacidad. Sonner confirma con la misma frase. La lista de compras hace lo mismo con “Lista actualizada”.
- El diálogo de receta abre y cierra en 220 ms, con fade y 8 px. No hace zoom, para no perder el centrado.
- IMC, calorías y metabolismo cuentan hasta su cifra. Las barras de porcentaje crecen desde la izquierda con `scaleX` y `--motion-larga`; el porcentaje queda escrito (`24%`) para el lector de pantalla. El gráfico de gramos no se anima aparte.
- Botones y casillas se encogen un poco al presionar. La palomita de la casilla aparece con opacidad.

## Menos movimiento

`MotionConfig` usa `reducedMotion="user"`. Con `prefers-reduced-motion: reduce`, Motion no anima transformaciones y las variables CSS pasan a 1 ms. Los esqueletos dejan de parpadear. El texto de carga, el aviso y “Receta actualizada” siguen visibles.

## Dónde verlo

En desarrollo, `/componentes` tiene la sección Movimiento: cambiar lunes/martes, ver la carga de recetas y fuentes, resaltar una comida, el aviso, el diálogo y la casilla. El diagnóstico, con sus números y barras, está más abajo en la misma página.
