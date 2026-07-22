import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const pluginDir = join(root, "com.blackraken.muxlyve.streamdeck.sdPlugin");
const distDir = join(root, "dist");
const binDir = join(pluginDir, "bin");

mkdirSync(binDir, { recursive: true });

// Copy compiled bundle
const pluginBundle = join(distDir, "plugin.js");
if (existsSync(pluginBundle)) {
  copyFileSync(pluginBundle, join(binDir, "plugin.js"));
}

// Copy mockups as Marketplace assets
const mockupDir = join(root, "mockups");
const mediaDir = join(pluginDir, "media");
mkdirSync(mediaDir, { recursive: true });

const mockupFiles = [
  ["Frame 7.png", "thumbnail.png"],
  ["Frame 3 (1).png", "screenshot-1.png"],
  ["Frame 4.png", "screenshot-2.png"],
  ["Frame 5.png", "screenshot-3.png"],
  ["Frame 6.png", "screenshot-4.png"],
];
for (const [src, dst] of mockupFiles) {
  const source = join(mockupDir, src);
  if (existsSync(source)) {
    copyFileSync(source, join(mediaDir, dst));
  }
}
