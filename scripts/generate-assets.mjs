import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PLUGIN_DIR = path.join(root, "com.blackraken.muxlyve.streamdeck.sdPlugin");
const IMG_PLUGIN = path.join(PLUGIN_DIR, "imgs", "plugin");

const PLATFORMS = ["twitch", "youtube", "kick", "tiktok"];
const EXTRA_ACTIONS = {
  buffer: ["on", "off", "unavailable", "offline"],
  clip: ["idle", "unavailable", "offline", "saved"],
};
const VARIANTS = ["on", "off", "idle", "connecting", "error", "offline", "disabled"];

const PLATFORM_COLORS = {
  twitch: { bg: "#9147ff", glyph: "#ffffff" },
  youtube: { bg: "#ff0000", glyph: "#ffffff" },
  kick: { bg: "#53fc18", glyph: "#0a0a0a" },
  tiktok: { bg: "#010101", glyph: "#ffffff" },
};

const STATE_BORDERS = {
  on: "#2ea043",
  connecting: "#f0a23a",
  error: "#f85149",
  off: null,
  idle: null,
  offline: "#f85149",
  disabled: null,
};

const STATE_DIM = {
  on: false,
  idle: false,
  connecting: false,
  error: false,
  off: true,
  offline: true,
  disabled: true,
};

function platformGlyphSvg(platform, color, size) {
  const s = size * 0.35;
  const cx = size / 2;
  const cy = size / 2;
  switch (platform) {
    case "twitch":
      return `<path d="M${cx - s} ${cy - s * 0.8} L${cx - s} ${cy + s} L${cx - s * 0.2} ${cy + s} L${cx - s * 0.2} ${cy + s * 0.6} L${cx + s * 0.2} ${cy + s * 0.6} L${cx + s * 0.2} ${cy + s} L${cx + s} ${cy + s} L${cx + s} ${cy - s * 0.3} L${cx + s * 0.7} ${cy - s * 0.8} Z M${cx - s * 0.55} ${cy - s * 0.25} L${cx - s * 0.55} ${cy + s * 0.35} L${cx - s * 0.25} ${cy + s * 0.35} L${cx - s * 0.25} ${cy - s * 0.25} Z M${cx + s * 0.15} ${cy - s * 0.25} L${cx + s * 0.15} ${cy + s * 0.35} L${cx + s * 0.45} ${cy + s * 0.35} L${cx + s * 0.45} ${cy - s * 0.25} Z" fill="${color}"/>`;
    case "youtube":
      return `<rect x="${cx - s * 0.8}" y="${cy - s * 0.55}" width="${s * 1.6}" height="${s * 1.1}" rx="${s * 0.3}" fill="${color}"/><path d="M${cx - s * 0.3} ${cy - s * 0.3} L${cx - s * 0.3} ${cy + s * 0.3} L${cx + s * 0.4} ${cy} Z" fill="${PLATFORM_COLORS.youtube.bg}"/>`;
    case "kick":
      return `<path d="M${cx - s * 0.45} ${cy - s * 0.6} Q${cx + s * 0.1} ${cy - s * 0.8} ${cx + s * 0.4} ${cy - s * 0.15} Q${cx + s * 0.55} ${cy - s * 0.6} ${cx + s * 0.9} ${cy - s * 0.15} L${cx + s * 0.5} ${cy + s * 0.05} L${cx + s * 0.5} ${cy + s * 0.55} L${cx + s * 0.05} ${cy + s * 0.55} L${cx + s * 0.05} ${cy + s * 0.15} Q${cx - s * 0.15} ${cy + s * 0.2} ${cx - s * 0.45} ${cy} Z" fill="${color}"/>`;
    case "tiktok":
      return `<path d="M${cx + s * 0.15} ${cy - s * 0.7} L${cx - s * 0.35} ${cy - s * 0.7} Q${cx - s * 0.5} ${cy - s * 0.6} ${cx - s * 0.5} ${cy - s * 0.4} L${cx - s * 0.5} ${cy + s * 0.3} Q${cx - s * 0.5} ${cy + s * 0.5} ${cx - s * 0.35} ${cy + s * 0.6} L${cx + s * 0.1} ${cy + s * 0.6} Q${cx + s * 0.3} ${cy + s * 0.6} ${cx + s * 0.3} ${cy + s * 0.4} L${cx + s * 0.3} ${cy - s * 0.1} Q${cx + s * 0.4} ${cy - s * 0.05} ${cx + s * 0.55} ${cy - s * 0.05} L${cx + s * 0.55} ${cy - s * 0.5} Q${cx + s * 0.35} ${cy - s * 0.5} ${cx + s * 0.3} ${cy - s * 0.6} Z M${cx + s * 0.3} ${cy - s * 0.1} V${cy - s * 0.6} H${cx + s * 0.55}" stroke="${color}" stroke-width="${s * 0.1}" fill="none"/>`;
    default:
      return `<circle cx="${cx}" cy="${cy}" r="${s}" fill="${color}"/>`;
  }
}

function buttonSvg(platform, variant, size) {
  const p = PLATFORM_COLORS[platform];
  const dimmed = STATE_DIM[variant] ?? false;
  const border = STATE_BORDERS[variant] ?? null;
  const pad = 4;
  const inner = size - pad * 2;
  const bg = dimmed ? "#161b22" : p.bg;
  const gColor = dimmed ? "#8b949e" : p.glyph;
  const glyphOpacity = dimmed ? 0.55 : 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${size * 0.08}" fill="${bg}"/>
    ${border ? `<rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${size * 0.08}" fill="none" stroke="${border}" stroke-width="${size * 0.04}"/>` : ""}
    <g opacity="${glyphOpacity}">${platformGlyphSvg(platform, gColor, size)}</g>
  </svg>`;
}

function pluginIconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#0d1117"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.28}" fill="#7c5cff"/>
    <path d="M${size * 0.35} ${size * 0.35} L${size * 0.55} ${size * 0.5} L${size * 0.35} ${size * 0.65} Z M${size * 0.55} ${size * 0.35} L${size * 0.75} ${size * 0.5} L${size * 0.55} ${size * 0.65} Z" fill="#ffffff"/>
  </svg>`;
}

function categoryIconSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#0d1117"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.25}" fill="#7c5cff"/>
  </svg>`;
}

async function writePng(dir, name, svg, size) {
  const out = path.join(dir, `${name}.png`);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
}

function extraActionSvg(action, variant, size) {
  const pad = 4;
  const inner = size - pad * 2;
  const dimmed = variant === "off" || variant === "unavailable" || variant === "offline";
  const bg = dimmed ? "#161b22" : "#7c5cff";
  const iconColor = dimmed ? "#8b949e" : "#ffffff";
  const border = variant === "offline" ? "#f85149" : null;
  const opacity = dimmed ? 0.55 : 1;

  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.3;

  let glyph = "";
  if (action === "buffer") {
    glyph = `<path d="M${cx - s * 0.6} ${cy - s} L${cx + s * 0.6} ${cy - s} L${cx + s * 0.6} ${cy + s} L${cx - s * 0.6} ${cy + s} Z M${cx - s * 0.3} ${cy - s * 0.5} L${cx - s * 0.3} ${cy + s * 0.5} L${cx + s * 0.3} ${cy + s * 0.5} L${cx + s * 0.3} ${cy - s * 0.5} Z" fill="${iconColor}" opacity="0.4"/>`;
    if (variant === "on") {
      glyph += `<circle cx="${cx}" cy="${cy}" r="${s * 0.3}" fill="${iconColor}"/>`;
    }
  } else if (action === "clip") {
    glyph = `<path d="M${cx - s * 0.7} ${cy + s * 0.4} Q${cx - s * 0.7} ${cy + s * 0.7} ${cx - s * 0.4} ${cy + s * 0.7} L${cx + s * 0.4} ${cy + s * 0.7} Q${cx + s * 0.7} ${cy + s * 0.7} ${cx + s * 0.7} ${cy + s * 0.4} L${cx + s * 0.7} ${cy - s * 0.4} Q${cx + s * 0.7} ${cy - s * 0.7} ${cx + s * 0.4} ${cy - s * 0.7} L${cx - s * 0.4} ${cy - s * 0.7} Q${cx - s * 0.7} ${cy - s * 0.7} ${cx - s * 0.7} ${cy - s * 0.4} Z M${cx - s * 0.2} ${cy - s * 0.2} L${cx + s * 0.2} ${cy} L${cx - s * 0.2} ${cy + s * 0.2} Z" fill="${iconColor}"/>`;
    if (variant === "saved") {
      glyph = `<path d="M${cx - s * 0.6} ${cy} L${cx - s * 0.2} ${cy + s * 0.4} L${cx + s * 0.6} ${cy - s * 0.4}" stroke="${iconColor}" stroke-width="${s * 0.18}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${size * 0.08}" fill="${bg}"/>
    ${border ? `<rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${size * 0.08}" fill="none" stroke="${border}" stroke-width="${size * 0.04}"/>` : ""}
    <g opacity="${opacity}">${glyph}</g>
  </svg>`;
}

async function main() {
  await mkdir(IMG_PLUGIN, { recursive: true });

  // Plugin icon: 288 (standard), 144 (category), con @2x
  await writePng(IMG_PLUGIN, "icon", pluginIconSvg(288), 288);
  await writePng(IMG_PLUGIN, "icon@2x", pluginIconSvg(576), 576);
  await writePng(IMG_PLUGIN, "categoryIcon", categoryIconSvg(144), 144);
  await writePng(IMG_PLUGIN, "categoryIcon@2x", categoryIconSvg(288), 288);

  // Action icons for extra actions (buffer/clip)
  for (const [action, actionVariants] of Object.entries(EXTRA_ACTIONS)) {
    const dir = path.join(PLUGIN_DIR, "imgs", "actions", action);
    await mkdir(dir, { recursive: true });
    for (const v of actionVariants) {
      const svg = extraActionSvg(action, v, 144);
      await writePng(dir, v, svg, 72);
      await writePng(dir, `${v}@2x`, svg, 144);
    }
  }

  // Action icons: 72 + 144 (@2x) for each platform × variant
  for (const platform of PLATFORMS) {
    const dir = path.join(PLUGIN_DIR, "imgs", "actions", platform);
    await mkdir(dir, { recursive: true });
    for (const v of VARIANTS) {
      await writePng(dir, v, buttonSvg(platform, v, 144), 72);
      await writePng(dir, `${v}@2x`, buttonSvg(platform, v, 224), 144);
    }
  }

  console.log(`Generated assets for ${PLATFORMS.length} platforms × ${VARIANTS.length} variants`);
  console.log("Plugin icon: 288px + 576px @2x");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
