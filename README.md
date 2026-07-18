# Muxlyve Stream Deck plugin

Este proyecto implementa una base del plugin de Stream Deck para Muxlyve siguiendo el plan documentado en STREAMDECK_PLUGIN.md.

## Qué incluye

- Manifest del plugin con 4 acciones preconfiguradas para Twitch, YouTube, Kick y TikTok.
- Acción de Stream Deck que escucha key down, togglea el destino en la API local de Muxlyve y repinta el botón según el estado.
- Property inspector para elegir la plataforma y el puerto del panel.
- Script de build para dejar el plugin listo bajo la carpeta .sdPlugin.

## Requisitos

- Node.js 20+
- npm
- Stream Deck app 7.1+

## Desarrollo

```bash
npm install
npm run build
```

## Validación

```bash
npm run validate
```
