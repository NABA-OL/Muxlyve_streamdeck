import { mkdirSync, copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pluginDir = join(root, 'com.blackraken.muxlyve.streamdeck.sdPlugin');
const distDir = join(root, 'dist');
const binDir = join(pluginDir, 'bin');

function copyIfMissing(source, target) {
  if (!existsSync(target)) {
    copyFileSync(source, target);
  }
}

mkdirSync(binDir, { recursive: true });
mkdirSync(join(pluginDir, 'imgs', 'plugin'), { recursive: true });
mkdirSync(join(pluginDir, 'imgs', 'actions', 'twitch'), { recursive: true });
mkdirSync(join(pluginDir, 'imgs', 'actions', 'youtube'), { recursive: true });
mkdirSync(join(pluginDir, 'imgs', 'actions', 'kick'), { recursive: true });
mkdirSync(join(pluginDir, 'imgs', 'actions', 'tiktok'), { recursive: true });

const pluginBundle = join(distDir, 'plugin.js');
if (existsSync(pluginBundle)) {
  copyFileSync(pluginBundle, join(binDir, 'plugin.js'));
}

const placeholder = join(root, 'icon-muxlyve.png');
if (existsSync(placeholder)) {
  copyIfMissing(placeholder, join(pluginDir, 'imgs', 'plugin', 'icon.png'));
  copyIfMissing(placeholder, join(pluginDir, 'imgs', 'plugin', 'categoryIcon.png'));
}

for (const platform of ['twitch', 'youtube', 'kick', 'tiktok']) {
  const targets = [
    join(pluginDir, 'imgs', 'actions', platform, 'on.png'),
    join(pluginDir, 'imgs', 'actions', platform, 'off.png'),
    join(pluginDir, 'imgs', 'actions', platform, 'idle.png'),
    join(pluginDir, 'imgs', 'actions', platform, 'connecting.png'),
    join(pluginDir, 'imgs', 'actions', platform, 'error.png'),
    join(pluginDir, 'imgs', 'actions', platform, 'offline.png'),
    join(pluginDir, 'imgs', 'actions', platform, 'disabled.png'),
  ];

  for (const target of targets) {
    if (existsSync(placeholder)) {
      copyIfMissing(placeholder, target);
    } else {
      if (!existsSync(target)) {
        writeFileSync(target, '');
      }
    }
  }
}
