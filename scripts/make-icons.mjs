import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const IMG = path.join(ROOT, "com.naba.muxlyve.streamdeck.sdPlugin", "imgs");

const PLATFORMS = {
  twitch: { bg: "#9147ff", glyph: "#ffffff", name: "Twitch" },
  youtube: { bg: "#ff0000", glyph: "#ffffff", name: "YouTube" },
  kick: { bg: "#53fc18", glyph: "#0a0a0a", name: "Kick" },
  tiktok: { bg: "#010101", glyph: "#ffffff", name: "TikTok" },
};

// Simple, well-formed brand glyphs (recreated; not the exact Muxlyve panel paths).
function glyph(platform, color) {
  const c = 72;
  switch (platform) {
    case "twitch":
      return `<path d="M52 50 L52 94 L64 94 L70 88 L70 50 Z M82 50 L82 80 L88 74 L88 50 Z M58 58 L58 80 L64 80 L64 58 Z M76 58 L76 68 L82 68 L82 58 Z" fill="${color}"/>`;
    case "youtube":
      return `<rect x="46" y="52" width="52" height="36" rx="10" fill="${color}"/><path d="M66 62 L80 70 L66 78 Z" fill="${PLATFORMS.youtube.bg}"/>`;
    case "kick":
      return `<path d="M58 50 Q72 44 78 60 Q86 44 92 60 L84 66 L84 78 L72 78 L72 70 Q64 76 58 70 Z" fill="${color}"/>`;
    case "tiktok":
      return `<path d="M76 48 L66 48 Q62 48 62 52 L62 88 Q62 92 66 92 L82 92 Q86 92 86 88 L86 64 Q82 70 76 70 L76 60 Q84 60 84 52 Z" fill="${color}"/>`;
    default:
      return `<circle cx="${c}" cy="${c}" r="22" fill="${color}"/>`;
  }
}

function keySvg(platform, variant) {
  const p = PLATFORMS[platform];
  let bg = p.bg;
  let glyphColor = p.glyph;
  let border = "";
  let opacity = 1;

  if (variant === "off" || variant === "unconfigured" || variant === "disconnected") {
    bg = "#161b22";
    glyphColor = "#8b949e";
    opacity = 0.6;
  }
  if (variant === "disconnected") {
    border = "#f85149";
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
  <rect width="144" height="144" rx="14" fill="${bg}" opacity="${opacity}"/>
  ${border ? `<rect x="4" y="4" width="136" height="136" rx="12" fill="none" stroke="${border}" stroke-width="6"/>` : ""}
  <g opacity="${opacity}">${glyph(platform, glyphColor)}</g>
</svg>`;
}

async function writePng(relPath, svg, w) {
  const out = path.join(IMG, relPath);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).resize(w, w).png().toFile(out);
}

async function main() {
  const variants = ["on", "off", "unconfigured", "disconnected"];
  for (const platform of Object.keys(PLATFORMS)) {
    for (const v of variants) {
      const svg = keySvg(platform, v);
      await writePng(path.join("actions", platform, `${v}.png`), svg, 72);
      await writePng(path.join("actions", platform, `${v}@2x.png`), svg, 144);
    }
  }

  const pluginSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <rect width="512" height="512" rx="96" fill="#0d1117"/>
    <circle cx="256" cy="256" r="150" fill="#7c5cff"/>
    <path d="M196 180 L276 256 L196 332 Z" fill="#ffffff"/>
  </svg>`;
  await writePng(path.join("plugin", "icon-256.png"), pluginSvg, 256);
  await writePng(path.join("plugin", "icon-512.png"), pluginSvg, 512);
  await writePng(path.join("plugin", "icon-256@2x.png"), pluginSvg, 512);

  console.log("Icons generated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
