# Formato del texto estructurado de Marx XXI

Un archivo JSON por artículo (`t1-a7.json`…) y por presentación (`tomo-1-presentacion.json`…), más `_indice.json` con el resumen.

## Estructura de cada archivo

- `id`, `vol`, `number`, `title`, `author`: tomados de `content.json` (grafía correcta). `title_pdf` / `author_pdf` son lo que imprime el PDF (solo referencia).
- `pdf_pages` [primera, última] y `printed_pages` [primera, última]: páginas del PDF y numeración impresa en el libro.
- `title_notes`: números de nota cuya llamada está en el título.
- `blocks`: lista ordenada de bloques `{t, text, pg, ...}`:
  - `t: "h"` título/subtítulo interno, con `level` 2 (sección), 3 (subsección) o 4 (apartado menor, en cursiva).
  - `t: "p"` párrafo. `cont: true` si continúa un párrafo interrumpido por una cita o lista.
  - `t: "q"` cita en bloque (a veces con `cite`: autor/fuente en la línea siguiente).
  - `t: "ep"` epígrafe de apertura (con `cite` si lo tiene).
  - `t: "li"` elemento de lista, con `marker` ("1.", "a)", "•").
  - `pg`: página impresa en la que empieza el bloque.
- `notes`: `{"12": {"text": "...", "pg": 87}}`. Notas al pie / finales separadas del texto; un `\n` separa párrafos dentro de una nota.
- `unanchored_notes`: notas cuyo número no aparece impreso en el texto (ver INFORME.md).

## Marcas dentro de `text`

- `[^12]` llamada a la nota 12 (al pulsarla, la app abre la nota completa).
- `[[p87]]` aquí empieza la página impresa 87 del libro (si la palabra se partía con guion, la marca va tras la palabra completa).
- `*cursiva*`, `**negrita**`; un asterisco literal se escribe `\*`.
- Los guiones de fin de línea están resueltos (se unen salvo que la forma con guion exista en el corpus).

## Resumen

| id | título | bloques | notas | caracteres entrada / salida |
|---|---|---|---|---|
| t1-a1 | La crisis del capital | 16 | 23 | 24.915 / 24.915 |
| t1-a10 | Un breve análisis del movimiento comunista en el paradigma d | 31 | 13 | 38.925 / 38.925 |
| t1-a11 | El Dinero. el Estado y la Comunidad Ilusoria | 13 | 2 | 12.126 / 12.126 |
| t1-a12 | La crítica a la democracia en Alain Badiou | 42 | 38 | 28.163 / 28.163 |
| t1-a13 | Ciudadanía bajo el capitalismo dependiente; para una crítica | 39 | 28 | 23.030 / 23.030 |
| t1-a14 | Sobre el eros enajenado: relaciones interpersonales y tardoc | 39 | 21 | 15.441 / 15.450 |
| t1-a15 | El fantasma de Marx recorre el siglo XXI: lucha de clases y  | 28 | 16 | 24.410 / 24.401 |
| t1-a2 | Marx sin atributos. Sobre la ideología burguesa | 47 | 36 | 31.821 / 31.821 |
| t1-a3 | Historia y sistema en Marx. ¿Hacia una teoría crítica del ca | 30 | 32 | 27.332 / 27.332 |
| t1-a4 | Hegel y Marx sobre la libertad: de la doctrina de la esencia | 17 | 32 | 18.441 / 18.441 |
| t1-a5 | Extraña igualdad. Marx. Hegel y la lógica de la alienación | 25 | 10 | 22.713 / 22.713 |
| t1-a6 | Hacia el rechazo de un activismo irreflexivo. Apuntes margin | 15 | 20 | 13.010 / 13.010 |
| t1-a7 | Una defensa crítica del legado del leninismo | 30 | 6 | 25.687 / 25.682 |
| t1-a8 | Frente al feminismo y otros movimientos de época | 29 | 2 | 26.227 / 26.227 |
| t1-a9 | Sobre (y contra) el romanticismo económico | 27 | 29 | 23.081 / 23.081 |
| t2-a1 | De continuidades y rupturas: un recorrido por el pensamiento | 44 | 60 | 54.467 / 54.458 |
| t2-a10 | En caso de incendio. ¿green new deal? | 49 | 9 | 26.400 / 26.400 |
| t2-a11 | El reformismo | 8 | 0 | 6.211 / 6.211 |
| t2-a12 | Por qué el reformismo fracasará siempre | 9 | 0 | 7.289 / 7.289 |
| t2-a13 | La sopa | 10 | 1 | 7.175 / 7.175 |
| t2-a2 | La forma populista de la socialdemocracia | 38 | 45 | 40.384 / 40.384 |
| t2-a3 | Karl Marx y la lectura republicana de «El Capital» | 46 | 31 | 50.453 / 50.453 |
| t2-a4 | Precios. competencia y lucha de clases | 35 | 14 | 39.330 / 39.330 |
| t2-a5 | Relaciones de género y estrategia socialista | 39 | 27 | 36.298 / 36.289 |
| t2-a6 | Subjetividad dañada y normalidad psicológica | 38 | 9 | 27.770 / 27.769 |
| t2-a7 | Brecha territorial y el espectro de la despoblación | 39 | 19 | 36.504 / 36.504 |
| t2-a8 | El nacionalismo con el que rompimos. el socialismo que defen | 93 | 10 | 54.234 / 54.234 |
| t2-a9 | Más allá de la socialdemocracia: lo que el capital es. y en  | 35 | 15 | 26.718 / 26.718 |
| t3-a1 | Notas para la actualización del modelo táctico de lucha cult | 99 | 63 | 76.402 / 76.402 |
| t3-a2 | Economía política del declive: acumulación y lucha de clases | 124 | 23 | 62.195 / 62.197 |
| t3-a3 | ¿Qué es la conciencia socialista? | 40 | 29 | 48.336 / 48.335 |
| t3-a4 | ¿Por qué reconstruir el frente socialista de mujeres? | 32 | 12 | 18.971 / 18.971 |
| t3-a5 | Organizar el socialismo en todos los territorios | 39 | 8 | 24.999 / 24.999 |
| t3-a6 | Crisis ecológica como crisis orgánica: notas para la constru | 52 | 46 | 53.874 / 53.873 |
| t3-a7 | Acerca del esquematismo: un aporte al debate con nuestros cr | 60 | 23 | 42.829 / 42.828 |
| t3-a8 | ¿Qué (des)hacer? Sobre la necesidad del Partido | 321 | 210 | 233.180 / 232.958 |
| t4-a1 | Sobre el derecho a la revolución | 80 | 87 | 77.748 / 77.748 |
| t4-a2 | Apuntes sobre el socialismo y la guerra. De la guerra imperi | 94 | 29 | 51.273 / 51.273 |
| t4-a3 | La batalla por la democracia: la toma del poder y los derech | 87 | 83 | 69.535 / 69.535 |
| t4-a4 | Sobre el giro autoritario del Estado. Un repaso histórico de | 81 | 21 | 37.392 / 37.392 |
| t4-a5 | Sobre el 15M. Podemos y sus raíces. Algunas lecciones estrat | 45 | 14 | 28.855 / 28.855 |
| t4-a6 | Giro autoritario y poder oligárquico en Europa. Un análisis  | 107 | 53 | 99.494 / 99.494 |
| t4-a7 | ¡Viva la Comuna! Sobre Marxismo y Estado | 207 | 252 | 220.598 / 220.597 |
| t5-a1 | Imperialismo: teoría. coyuntura e internacionalismo | 204 | 89 | 123.291 / 123.291 |
| t5-a2 | Estados Unidos como potencia imperial: acumulación. hegemoní | 116 | 41 | 75.685 / 75.685 |
| t5-a3 | El tablero mundial. Palestina y la lucha antimperialista | 97 | 49 | 69.141 / 69.141 |
| t5-a4 | Romper el hielo: las trayectorias de la revolución mundial ( | 133 | 121 | 123.014 / 123.014 |
| t5-a5 | Proletarios del mundo. uníos. Un recorrido por la historia d | 333 | 171 | 260.786 / 260.776 |
| tomo-1-presentacion | Presentación | 5 | 4 | 6.582 / 6.582 |
| tomo-2-presentacion | Presentación | 7 | 1 | 6.926 / 6.926 |
| tomo-5-presentacion | Nota introductoria | 1 | 0 | 695 / 695 |
