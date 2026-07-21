---
name: Muxlyve Stream Deck Plugin
description: Plugin oficial de Muxlyve para Elgato Stream Deck — control de destinos de restreaming desde botones físicos
colors:
  brand-bg: "#0d1117"
  brand-surface: "#161b22"
  brand-border: "#2a3140"
  brand-text: "#e6edf3"
  brand-muted: "#8b949e"
  brand-accent: "#7c5cff"
  brand-accent-blue: "#4da3ff"
  status-live: "#2ea043"
  status-connecting: "#f0a23a"
  status-error: "#f85149"
  platform-twitch: "#9147ff"
  platform-youtube: "#ff0000"
  platform-kick: "#53fc18"
  platform-tiktok: "#010101"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
spacing:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
components:
  input-select:
    backgroundColor: "{brand-surface}"
    textColor: "{brand-text}"
    rounded: "{rounded.md}"
  input-field:
    backgroundColor: "{brand-surface}"
    textColor: "{brand-text}"
    rounded: "{rounded.md}"
  label-hint:
    textColor: "{brand-muted}"
---

# Design System: Muxlyve Stream Deck Plugin

## 1. Overview

**Creative North Star: "The Streamer's Edge"**

Muxlyve Stream Deck plugin es la herramienta del streamer que va en serio. Oscura, directa, sin concesiones. Cada botón comunica estado en un vistazo — el streamer no lee, reconoce. La interfaz es honrada: plana, sin sombras falsas, sin decoración que no aporte información de estado.

El sistema visual se despliega en tres superficies: los **iconos de botón** (72×72 PNG que Stream Deck renderiza en las teclas físicas), el **property inspector** (panel HTML angosto dentro de la app de Stream Deck), y los **assets de Marketplace** (icono del plugin, screenshots). Las tres obedecen al mismo lenguaje: oscuridad de fondo, acento morado Muxlyve como firma, colores de plataforma como señal inmediata.

Esto no es un tema de Bootstrap ni un template de landing page. Es un panel de control físico para creadores que transmiten en vivo.

**Key Characteristics:**

- **Plano y honesto.** Sin sombras, sin glassmorphism, sin gradientes decorativos. La profundidad la da el color y el brillo.
- **Estado sobre estilo.** Cada variante visual comunica estado (live/connecting/error/offline). La estética sirve a la función.
- **Oscuro por diseño.** Fondo #0d1117, superficies #161b22. El streamer opera en entornos con poca luz; la interfaz no compite.
- **Firma morada.** El acento #7c5cff es la señal Muxlyve. Aparece en el property inspector, en el ícono del plugin, y como hilo conductor entre los 4 botones de plataforma.

## 2. Colors

La paleta se divide en tres capas: **entorno** (fondos, textos, bordes), **plataforma** (los 4 colores de servicio que el streamer reconoce al instante), y **estado** (señales sobre el estado de cada destino).

### Plataforma (fijos de marca, innegociables)

- **Twitch Purple** (#9147ff): Fondo del botón Twitch. Nominal.
- **YouTube Red** (#ff0000): Fondo del botón YouTube. Nominal.
- **Kick Green** (#53fc18): Fondo del botón Kick. Glifo en #0a0a0a para contraste.
- **TikTok Black** (#010101): Fondo del botón TikTok. Glifo blanco.

### Entorno

- **Brand Background** (#0d1117): Fondo general del property inspector y asset principal del plugin.
- **Brand Surface** (#161b22): Fondo de inputs, selects, y contenedores secundarios. Capa por encima del background.
- **Brand Border** (#2a3140): Bordes de inputs, separadores. Única línea de demarcación.
- **Brand Text** (#e6edf3): Color nominal del texto legible.
- **Brand Muted** (#8b949e): Texto secundario, hints, labels de ayuda.
- **Brand Accent** (#7c5cff): Morado Muxlyve. Firma visual. Usado en el ícono del plugin, category icon, y acentos del property inspector (título "Muxlyve" en el panel).
- **Brand Accent Blue** (#4da3ff): Acento secundario. No usado actualmente — reservado para expansión futura.

### Estado

- **Status Live** (#2ea043): Borde/glow verde del botón cuando el destino está activo y transmitiendo.
- **Status Connecting** (#f0a23a): Borde ámbar mientras el destino establece conexión o reconecta.
- **Status Error** (#f85149): Borde rojo cuando el destino falló. También usado para el estado "offline" (sin conexión con Muxlyve).

### Nombramiento

Los colores de plataforma usan el nombre de la plataforma como identificador ("Twitch Purple", "YouTube Red"). Los colores de entorno y estado usan etiquetas funcionales ("Brand Background", "Status Live"). Esto evita ambigüedad cuando un agente necesita referirse a un color por nombre.

## 3. Typography

**Property Inspector:** `system-ui, -apple-system, sans-serif`
**Button Titles:** Definido por Stream Deck (cada botón muestra texto de una línea en fuente del sistema SD, no controlable por el plugin).

**Character:** La tipografía es utilitaria, no decorativa. El property inspector usa la fuente del sistema en peso normal. No hay jerarquía tipográfica compleja — el panel tiene 3-4 campos y un título. Los botones muestran 1-2 palabras (el nombre de la plataforma).

### Hierarchy

- **Título de botón** (: Stream Deck renderiza en su propia fuente del sistema, tamaño fijo. El plugin no controla la tipografía de las teclas.
- **Título de sección** (13px, weight 600, color #7c5cff): El "Muxlyve" al inicio del property inspector.
- **Label de campo** (12px, weight 400, color #8b949e): Etiquetas de inputs.
- **Body / Input text** (12-13px, weight 400, color #e6edf3): Valores de inputs y selects.
- **Hint text** (11px, weight 400, color #8b949e): Texto de ayuda debajo de campos.

No hay display, headline, ni jerarquías grandes — el plugin no tiene landing page ni marketing copy.

## 4. Elevation

**Flat. El sistema no usa sombras.**

Stream Deck renderiza PNG planos sobre teclas físicas (sin posibilidad de sombra real). El property inspector es un panel HTML angosto sin profundidad. La jerarquía visual se logra con tres tonos de fondo (brand-bg → brand-surface → brand-border), no con sombras.

**The Flat-By-Default Rule.** Las superficies son planas en reposo. No hay sombras de hover, no hay elevación. Un borde de 1px (#2a3140) separa los campos del fondo. Esa es la única demarcación.

## 5. Components

El plugin tiene un solo componente interactivo (el property inspector) y un sistema de 28 assets visuales (7 estados × 4 plataformas). No hay cards, navigation, dialogs, ni otros componentes HTML.

### Property Inspector Panel

El property inspector es un panel angosto (~300px) embebido en la app de Stream Deck. Contiene un select y dos inputs de texto.

- **Forma:** inputs con bordes redondeados (6px border-radius), sin sombra.
- **Select (Plataforma):** Fondo brand-surface (#161b22), borde brand-border (#2a3140), texto brand-text (#e6edf3). Altura ~32px.
- **Input (Host/Puerto):** Mismo estilo que select. Placeholder en brand-muted (#8b949e). Type number para puerto con min 1 / max 65535.
- **Labels:** Texto brand-muted (#8b949e), 12px, block layout, margen superior 8px.
- **Hints:** Texto brand-muted (#8b949e), 11px, margin-top 6px, debajo del input.
- **Feedback:** Los inputs no tienen estado hover propio (el panel SD no soporta :hover de forma confiable). El enfoque es el borde por defecto.
- **Título:** "Muxlyve" en brand-accent (#7c5cff), 13px semibold, margen superior 0.

### Button States (Iconos)

Cada plataforma genera 7 PNGs de 72×72 (más @2x 144×144) que Stream Deck renderiza en la tecla física.

| Variant | Visual |
|---|---|
| `on` | Glifo plataforma a color sobre fondo de plataforma. Borde verde (#2ea043). |
| `off` | Glifo en escala de grises (#8b949e) sobre fondo brand-surface (#161b22). Sin borde. |
| `idle` | Glifo a color sobre fondo de plataforma, sin borde (habilitado pero no en vivo). |
| `connecting` | Glifo a color + borde ámbar (#f0a23a). |
| `error` | Glifo a color + borde rojo (#f85149). |
| `offline` | Glifo gris sobre brand-surface + indicador de desconexión. |
| `disabled` | Glifo gris tenue sobre brand-surface, opacidad reducida (destino no configurado en Muxlyve). |

Cada PNG se genera desde SVG vectorial con sharp en build. Los glifos de plataforma deben coincidir visualmente con los de la app Muxlyve (`PLATFORM_ICON_GLYPHS` en `src/panel.js`).

### Marketplace Assets

- **Plugin Icon (288×288):** Isotipo Muxlyve (lobo/señal) sobre fondo brand-bg (#0d1117) con acento morado.
- **Category Icon (144×144):** Versión simplificada del isotipo para la lista de categorías en el Stream Deck app.
- **Screenshots (1920×960):** Capturas del property inspector y botones en acción sobre fondo brand-bg.

## 6. Do's and Don'ts

### Do:

- **Do** usar brand-bg (#0d1117) como fondo base del property inspector y los assets de Marketplace.
- **Do** usar brand-accent (#7c5cff) exclusivamente para elementos Muxlyve — títulos, isotipo, firma visual. No diluirlo en fondos de botón.
- **Do** mantener los colores de plataforma exactos: Twitch Purple #9147ff, YouTube Red #ff0000, Kick Green #53fc18, TikTok Black #010101.
- **Do** usar los 7 estados visuales para cubrir toda la grilla de condición (on/off/idle/connecting/error/offline/disabled).
- **Do** comunicar estado con al menos dos señales simultáneas (color + borde, brillo + posición) para accesibilidad.
- **Do** generar los PNG a 72×72 y 144×144 (@2x) para cubrir dispositivos SD de distintas densidades.

### Don't:

- **Don't** usar sombras, glassmorphism, blur, gradientes decorativos, ni glow excesivo. Este es un sistema plano. (PRODUCT.md: "sin glassmorphism, gradientes decorativos, fondos con blur, glow excesivo".)
- **Don't** aplicar bordes redondeados >12px en ningún elemento. Los botones de Stream Deck son cuadrados (sin border-radius visual); el property inspector usa 6px.
- **Don't** modificar los colores de plataforma para "armonizar" con la paleta Muxlyve. Su reconocibilidad es más importante que la cohesión de paleta.
- **Don't** usar el acento morado como fondo de botón. El morado es firma Muxlyve, no fondo de plataforma.
- **Don't** crear 4 clases de acción separadas. Una sola clase con `defaultPlatform` por UUID. (No duplicar lógica.)
- **Don't** renderizar texto largo en los botones. El título es el nombre de la plataforma (1 palabra) más un indicador opcional de una línea ("offline", "armed", "?").
- **Don't** usar gradientes de texto ni texturas de fondo.
- **Don't** depender solo del color para comunicar estado. Incluir borde, brillo, o glifo como señal secundaria para usuarios con daltonismo.
