# Plan — Plugin de Stream Deck para Muxlyve

> Documento autocontenido para arrancar el proyecto del plugin en un repo/chat nuevo.
> Contiene TODO lo necesario: contrato de la API local de Muxlyve, marca/íconos, arquitectura
> del plugin, estados visuales de los botones y proceso de publicación en el Marketplace de
> Elgato. No hace falta tener abierto el repo de Muxlyve para ejecutarlo (aunque los assets
> de marca sí se copian de ahí — rutas exactas abajo).

## Qué es

Plugin oficial de **Muxlyve** para Elgato Stream Deck. Permite prender/apagar cada destino
de retransmisión (Twitch, YouTube, Kick, TikTok) con un botón físico, sin tocar la app.
El plugin habla con la app de escritorio Muxlyve por HTTP local — la app DEBE estar
corriendo para que los botones funcionen.

## Contexto: qué es Muxlyve (para quien llegue en frío)

App de escritorio (Electron, Windows/macOS) de restreaming RTMP: recibe la señal de OBS
como ingest local y la reenvía simultáneamente a Twitch, Kick, YouTube y TikTok Live.
Cada plataforma es un "destino" con un toggle ON/OFF; encender/apagar un destino arranca/
para el relay FFmpeg en caliente, en plena transmisión. El plugin replica exactamente ese
toggle en el Stream Deck.

Desarrollador: **BlacKraken Solutions** — https://blackraken.vercel.app
Software propietario. © Muxlyve.

---

## 1. Contrato de la API local (ya existe, no hay que construir nada en Muxlyve)

El panel de Muxlyve corre un servidor HTTP **solo en localhost**, puerto **19080** por
defecto (configurable vía `PANEL_PORT` en el `.env` de Muxlyve — el plugin debe permitir
cambiar el puerto en sus ajustes por si el usuario lo movió).

Base URL: `http://127.0.0.1:19080`

### GET /api/state — leer estado actual

Respuesta (campos relevantes para el plugin):

```json
{
  "live": true,
  "uptime": 1234,
  "destinations": [
    {
      "name": "Twitch",
      "url": "rtmp://...",
      "enabled": true,
      "playable": true,
      "relaying": true,
      "status": "live",
      "attempts": 0
    }
  ]
}
```

- `live`: si OBS está publicando al ingest (hay emisión activa).
- `destinations[].name`: los 4 fijos usan exactamente `"Twitch"`, `"YouTube"`, `"Kick"`,
  `"TikTok"` (así se crean desde el panel; matchear case-insensitive por robustez).
  Puede haber destinos personalizados extra — ignorarlos o soportarlos como acción genérica.
- `enabled`: el toggle que el plugin invierte.
- `status`: `"live"` | `"connecting"` | `"reconnecting"` | `"failed"` | `"idle"` — usar
  para pintar el estado real del botón, no solo `enabled`.

### POST /api/destinations — toggle ON/OFF

Upsert por nombre. Para togglear: leer el destino de `/api/state`, reenviar con `enabled`
invertido:

```json
{ "name": "Twitch", "url": "<la url que ya tenía>", "enabled": false }
```

Content-Type: `application/json`. Respuesta: el estado completo nuevo (mismo shape que
`/api/state`) — usar la respuesta para repintar el botón sin otro GET.

**Importante:** si el destino no existe todavía (usuario nunca lo configuró), el POST lo
crearía con URL vacía → el botón debe detectar ese caso (destino ausente en `/api/state`)
y mostrar estado "no configurado" (ícono gris + alerta), NO crear el destino.

### POST /api/retry?name=Twitch — reintento manual

Para un destino en `status: "failed"`. Opcional para v1: un long-press o segunda acción
"Reintentar".

### Polling

No hay WebSocket/SSE para estado de destinos — el plugin debe sondear `GET /api/state`
(cada 2–3 s está bien, es localhost; la propia UI de Muxlyve sondea cada 2 s). Si el fetch
falla (app cerrada), pintar todos los botones en estado "sin conexión".

---

## 2. Stack del plugin

- **SDK oficial de Elgato**: `@elgato/streamdeck` (npm) + su CLI (`@elgato/cli`).
  Scaffold: `npm create stream-deck@latest` (o `streamdeck create`). Node.js ≥ 24,
  Stream Deck app ≥ 7.1. TypeScript por defecto — mantenerlo.
- Estructura generada: `*.sdPlugin/` (manifest.json, imgs, bin compilado, ui para
  property inspectors), `src/` (acciones), rollup para bundle.
- Identificador del plugin (reverse-DNS, consistente con la app):
  **`com.blackraken.muxlyve.streamdeck`** (la app Electron usa `com.blackraken.muxlyve` como appId).

## 3. Acciones (botones)

Una sola clase de acción **"Toggle destino"** con la plataforma como setting (no 4 clases
duplicadas), más 4 entradas preconfiguradas en el manifest para que el usuario arrastre
directamente "Twitch", "YouTube", "Kick" o "TikTok" desde la lista:

| Acción (UUID) | Setting `platform` | Título por defecto |
|---|---|---|
| `com.blackraken.muxlyve.streamdeck.toggle` | `twitch` \| `youtube` \| `kick` \| `tiktok` | nombre de la plataforma |

Property inspector (panel de ajustes del botón en la app de Stream Deck):
- Selector de plataforma (dropdown con las 4).
- Campo "Puerto del panel" (default `19080`).

### Comportamiento del botón

- **Key down** → toggle (POST). Mientras responde, opcional `showOk()`/`showAlert()` del SDK.
- **Polling** cada 2–3 s → repintar según estado.
- App cerrada / fetch falla → `showAlert()` + ícono "desconectado".
- Destino no configurado en Muxlyve → ícono apagado + al presionar `showAlert()`.

## 4. Estados visuales de los botones (lo que pidió el usuario)

Cada plataforma tiene DOS variantes de ícono — encendido y apagado — y el plugin cambia
entre ellas según `enabled`/`status` real:

| Estado | Visual |
|---|---|
| `enabled: true` + `status: "live"` | Ícono de la plataforma a todo color sobre su color de marca + borde/glow verde `#2ea043` |
| `enabled: true` + `status: "connecting"/"reconnecting"` | Ícono a color + borde ámbar `#f0a23a` |
| `enabled: true` + `status: "failed"` | Ícono a color + borde rojo `#f85149` |
| `enabled: true` sin emisión (`live: false`) | Ícono a color, sin borde (armado, esperando señal) |
| `enabled: false` | Ícono en **escala de grises / apagado** sobre fondo `#161b22` |
| Sin conexión con Muxlyve | Ícono gris + badge de desconexión |

Los íconos de estado se generan como PNG (los Stream Deck renderizan bitmap): tamaño
**72×72 @1x y 144×144 @2x** por imagen de tecla, más el ícono de la acción para la lista
(20×20 / 40×40) y el ícono del plugin para la tienda (256×256 / 512×512).

### Colores de marca de cada plataforma (mismos que usa la app)

| Plataforma | Fondo | Glifo |
|---|---|---|
| Twitch | `#9147ff` | blanco |
| YouTube | `#ff0000` | blanco |
| Kick | `#53fc18` | negro `#0a0a0a` |
| TikTok | `#010101` | blanco |

Los paths SVG exactos de los 4 glifos están en el repo de Muxlyve,
`src/panel.js`, constante `PLATFORM_ICON_GLYPHS` (buscarla por nombre) — copiarlos tal
cual para que los botones se vean idénticos al panel. Formato: rect redondeado (rx=6 en
viewBox 24) con el color de fondo + el path del glifo encima.

## 5. Marca Muxlyve (fidelidad con la app)

Referencia completa: `docs/BRANDING.md` en el repo de Muxlyve. Lo esencial:

- **Nombre**: `Muxlyve` (Muxly + Live). En texto con acento: la sílaba final "ve" va en
  morado `#7c5cff`.
- **Desarrollador**: `BlacKraken Solutions` — URL `https://blackraken.vercel.app`.
- **Paleta**: fondo `#0d1117`, superficie `#161b22`, borde `#2a3140`, texto `#e6edf3`,
  texto apagado `#8b949e`, **acento morado `#7c5cff`**, acento 2 azul `#4da3ff`,
  verde en-vivo `#2ea043`, ámbar `#f0a23a`, rojo `#f85149`.
- **Assets a copiar del repo de Muxlyve** (`src/public/`):
  - `icon-muxlyve.svg` — isotipo (cabeza de lobo/señal). Base para el ícono del plugin
    en Marketplace (rasterizar a 256/512 px sobre fondo `#0d1117`).
  - `logo-muxlyve.svg` — logo horizontal para banners/screenshots de la ficha.
- **Manifest**: `Name: "Muxlyve"`, `Author: "BlacKraken Solutions"`,
  `URL: "https://blackraken.vercel.app"`, descripción corta tipo:
  _"Controla tus retransmisiones de Muxlyve desde el Stream Deck: enciende o apaga
  Twitch, YouTube, Kick y TikTok con un botón."_
- Category en manifest: `"Muxlyve"` (agrupa las acciones bajo ese nombre en la lista).

## 6. Publicación

Dos vías, no excluyentes (empezar por la primera):

1. **Distribución directa (sin revisión, gratis, inmediata)**: `streamdeck pack` genera
   un `.streamDeckPlugin`; doble clic lo instala. Publicarlo como descarga en
   muxlyve.com / GitHub Releases. Sirve para probar con usuarios reales ya.
2. **Elgato Marketplace (oficial, gratis publicar)**: cuenta de Maker en
   https://marketplace.elgato.com → Maker Console → submit. Requisitos:
   - Pasar `streamdeck validate` (manifest, estructura, tamaños de íconos).
   - Cumplir las guías de estilo de Elgato (docs.elgato.com/guidelines/stream-deck/plugins).
   - Ícono de app atractivo + screenshots para la ficha.
   - Revisión manual de Elgato (días/semanas). Pueden pedir cambios.
   - Sin costo de publicación conocido; el plugin se lista gratis.

## 7. Estructura sugerida del repo nuevo

```
muxlyve-streamdeck/
├── com.blackraken.muxlyve.streamdeck.sdPlugin/
│   ├── manifest.json
│   ├── bin/            (compilado)
│   ├── imgs/
│   │   ├── plugin/     (ícono Marketplace 256/512)
│   │   └── actions/
│   │       ├── twitch/    (on.png, on@2x.png, off.png, off@2x.png, …estados)
│   │       ├── youtube/
│   │       ├── kick/
│   │       └── tiktok/
│   └── ui/             (property inspector HTML)
├── src/
│   ├── plugin.ts       (entry: registra la acción, arranca polling)
│   ├── actions/toggle-destination.ts
│   └── muxlyve-client.ts  (GET /api/state, POST /api/destinations, puerto configurable)
├── scripts/make-icons.mjs  (genera los PNG de estados desde los SVG de marca)
├── package.json
└── README.md
```

## 8. Roadmap del plugin (v1 → después)

- **v1**: 4 botones toggle con estados visuales + puerto configurable. Nada más.
- v1.1: acción "Reintentar" para destinos `failed` (usa `/api/retry`).
- v2 (ideas, solo si se piden): botón de "título del stream" (POST /api/... del panel),
  contador de espectadores en la tecla (GET /api/viewers ya existe en Muxlyve),
  toggle de modo lento/solo-emotes (POST /api/chat-mode ya existe).

## 9. Verificación

- `streamdeck validate` limpio.
- Con Muxlyve corriendo: presionar cada botón → el toggle del panel de Muxlyve cambia en
  vivo (y viceversa: cambiarlo en el panel repinta el botón en ≤3 s).
- Con Muxlyve cerrado: botones muestran desconexión, presionar muestra alerta, nada crashea.
- Con un destino sin configurar: botón apagado + alerta al presionar, NO crea el destino.
