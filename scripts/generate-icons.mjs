// Regenerates public/icons/*.png from public/icons/icon-source.svg.
// Run with: node scripts/generate-icons.mjs
// Swap in a real logo by replacing icon-source.svg (keep it square, 512x512)
// and re-running this — no other files need to change.
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.resolve(__dirname, '..', 'public', 'icons', 'icon-source.svg');
const outDir = path.resolve(__dirname, '..', 'public', 'icons');
const svg = readFileSync(svgPath);

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'favicon-32.png', size: 32 },
];

for (const t of targets) {
  await sharp(svg, { density: 384 })
    .resize(t.size, t.size)
    .png()
    .toFile(path.join(outDir, t.file));
  console.log('wrote', t.file);
}
