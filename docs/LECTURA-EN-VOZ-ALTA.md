# Lectura en voz alta (estudio a 19-10-2026)

El modo lectura tiene un reproductor que lee el texto con las voces del propio dispositivo (botón **Escuchar** de la
barra inferior, código en `js/speech.js`). Este documento recoge las tres vías que se estudiaron, por qué se eligió esa
y el estudio de la alternativa con audios pregrabados, que **no se va a hacer** por ahora; queda aquí por si se retoma.

## 1. Las tres vías

| | A. Voces del dispositivo (**implementada**) | B. Audios pregrabados | C. Voz neuronal en el navegador (Piper) |
|---|---|---|---|
| Cómo | El navegador lee con las voces del sistema (Web Speech API) | Se generan los audios una vez con un servicio de voz y se alojan fuera | Un modelo de voz se descarga y se ejecuta en el navegador |
| Coste | 0 € | 0–345 $ por voz (ver §3) | 0 € |
| Almacenamiento | Ninguno | 0,8–1,2 GB por voz, fuera de GitHub Pages | 27–73 MB por lector y voz (caché del navegador) |
| Calidad | Variable según el dispositivo | La mejor y la misma para todos | Correcta, algo robótica |
| Pantalla bloqueada | En el móvil se para | Sigue sonando, con controles en la pantalla de bloqueo | Se para |

### Por qué no C (Piper)

Medido en un PC de 8 núcleos con `@diffusionstudio/vits-web` 1.0.3 (onnxruntime-web 1.18):

- Peso de cada voz en español: carlfm x_low 27 MB; davefx medium 60 MB; claude (es_MX) high 60 MB; sharvard medium 73 MB.
- Velocidad: 30 s de audio tardan unos 25 s en generarse con un hilo (lo que da GitHub Pages tal cual) y unos 15 s con
  varios hilos (exige COOP/COEP, que Pages no permite; habría que usar un service worker que las simule). La voz ligera
  apenas es más rápida. El primer audio tarda 13–27 s en sonar.
- La síntesis bloquea la página (habría que llevarla a un Worker). En un móvil de gama media iría a tiempo real o peor.
- Fuera del navegador, el mismo modelo es 6–7 veces más rápido: sirve para **pregenerar** audios (vía B a coste cero),
  no para generarlos en el momento.

### Lo que hace A (implementado)

- Lee el texto sin marcas de cada bloque (`b.p`, el mismo que usan los subrayados), sin separadores, tablas ni notas al
  pie; si se empieza arriba del todo, primero el título y la autoría.
- Trocea por frases (máx. 260 caracteres): resalta la frase y la palabra que suenan (CSS Custom Highlight API), sigue
  la lectura desplazando el texto y evita que Chrome corte las locuciones largas.
- Barra: cerrar, párrafo anterior/siguiente, play/pausa (retoma en la última palabra), velocidad por pasos y ventana de
  voz, velocidad y tono. Tocar un párrafo con el reproductor abierto lo lee desde ahí.
- Preferencias en `localStorage` «mx.voz» (`voice`, `rate`, `pitch`): se exportan con el resto de datos del lector.
- Límites conocidos: las voces dependen del navegador (las mejores: «Natural» de Edge, Google en Chrome y Android,
  «mejoradas» en iPhone y Mac); con las voces básicas de Windows el ajuste de velocidad apenas se nota; en el móvil la
  lectura se para al bloquear la pantalla.

## 2. Cuánto texto se leería

Contado con las mismas reglas que el reproductor sobre los 75 textos (artículos y presentaciones):

| | Caracteres | Audio aprox. |
|---|---|---|
| Lo que lee el reproductor (título, autoría y cuerpo) | **3,44 millones** (537.000 palabras) | **53–60 h** |
| Con las notas al pie | 4,0 millones | ~65 h |

El texto más largo es `t5-a5` (289.000 caracteres, unas 4,8 h); la media, unos 46.000 por texto (unos 45 min).

## 3. Coste de generar los audios (vía B, una voz, 3,44 M caracteres)

Precios publicados en octubre de 2026; varios vienen de comparadores, no de la página oficial: confirmar antes de pagar.

| Servicio | Precio | Total | Cuota gratuita |
|---|---|---|---|
| Piper en local (modelos de `rhasspy/piper-voices`) | gratis | 0 €, unas 8 h de CPU | — |
| Google WaveNet / Standard | 4 $/M | ~14 $ | 4 M/mes (cabría gratis en un mes) |
| Google Neural2 | 16 $/M | ~55 $ | 1 M/mes |
| Google Chirp 3 HD | ~30 $/M | ~100 $ | sin confirmar |
| Azure (voces neurales) | ~15–16 $/M | ~55 $ | 0,5 M/mes |
| OpenAI tts-1 / tts-1-hd | 15 / 30 $/M | 52 / 103 $ | — |
| ElevenLabs Flash / Multilingual v2 | 0,05 / 0,10 $ por 1.000 | 170 / 345 $ | — |

Cada voz adicional repite el coste. Al corregir un texto solo se regenera ese texto.

## 4. Dónde alojar los audios

Habla en mono comprimida: unas 57 h ocupan **0,8 GB en Opus o AAC a 32 kbps** o **1,2 GB en MP3 a 48 kbps**, por voz.

| Opción | Valoración |
|---|---|
| Este repositorio (GitHub Pages) | No: Pages admite 1 GB por sitio y 100 MB por archivo (`t5-a5` pasaría de eso), y cada regeneración engorda el historial de git. |
| Otro repositorio solo para audios | No: mismo límite de 1 GB. |
| Adjuntos de Releases de GitHub | Posible pero forzado: no es su uso previsto y complica la escucha sin conexión (sin CORS). |
| **Cloudflare R2** | **Recomendado**: 10 GB gratis y descargas sin coste; luego 0,015 $/GB al mes. Necesita cuenta de Cloudflare y configurar CORS. |
| Internet Archive | Gratis e ilimitado, pero público, más lento y con los derechos que exija su plataforma. |

## 5. Diseño previsto (si se retoma)

1. **Generar frase a frase**, con la misma división que `chunk()` de `js/speech.js`, y apuntar cuándo empieza cada
   frase: el resaltado de frase funciona así con cualquier servicio (Google y Azure dan además el tiempo de cada palabra).
2. **Audio en R2** (un archivo por texto, o por secciones en los muy largos). **Marcas de tiempo en el repositorio**
   (`data/audio/<id>.json`: bloque, carácter inicial y final, segundo de inicio; unos pocos KB por texto) con un
   resumen del texto para saber cuándo hay que regenerar.
3. **En el reproductor, una opción «Voz grabada»** cuando el texto tenga audio: `<audio>` con `playbackRate` y Media
   Session API, que sigue sonando con la pantalla bloqueada y se controla desde ella. Descarga opcional por texto para
   escucharlo sin conexión (service worker).
4. Añadir el dominio de R2 a `media-src` y `connect-src` de la política de seguridad de `index.html`.
5. Antes de publicar audios, confirmar que los derechos de los textos lo permiten.

Siguiente paso, si se retoma: una prueba con un texto corto y dos o tres voces (Google, Azure, Piper) para elegir voz.

## Fuentes

- [Google Cloud TTS pricing](https://cloud.google.com/text-to-speech/pricing/) ·
  [CostBench: Google Cloud TTS](https://costbench.com/software/ai-voice-tools/google-cloud-text-to-speech/)
- [Azure Speech pricing](https://azure.microsoft.com/pricing/details/cognitive-services/speech-services) ·
  [Azure China pricing](https://www.azure.cn/en-us/pricing/details/cognitive-services/)
- [Puter: ElevenLabs API pricing](https://developer.puter.com/tutorials/elevenlabs-api-pricing/) ·
  [ModelsLab: ElevenLabs pricing](https://modelslab.com/elevenlabs-api-pricing)
- [OpenAI gpt-4o-mini-tts](https://developers.openai.com/api/docs/models/gpt-4o-mini-tts) ·
  [Calculadora de costes TTS](https://inventivehq.com/tools/developer/tts-stt-api-cost-calculator)
- [Filebase: Cloudflare R2 pricing 2026](https://filebase.com/blog/cloudflare-r2-pricing-costs-savings-and-alternatives-in-2026/)
- [Piper voices (Hugging Face)](https://huggingface.co/rhasspy/piper-voices) ·
  [vits-web](https://www.npmjs.com/package/@diffusionstudio/vits-web)
