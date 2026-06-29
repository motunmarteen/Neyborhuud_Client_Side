/**
 * Generate favicon + PWA icons from the official pin mark.
 * Run: node scripts/generate-app-icons.mjs
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const markPath = path.join(root, 'public/brand/neyborhuud-mark-light.png');
const BLACK_THRESHOLD = 28;

async function loadTransparentMark() {
    const { data, info } = await sharp(markPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
            data[i + 3] = 0;
        }
    }

    return sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
    })
        .trim({ threshold: 10 })
        .png()
        .toBuffer();
}

async function renderSquareIcon(markBuffer, size, paddingRatio = 0.14) {
    const inner = Math.round(size * (1 - paddingRatio * 2));
    const resized = await sharp(markBuffer).resize({ height: inner, fit: 'inside' }).png().toBuffer();
    const { width = inner, height = inner } = await sharp(resized).metadata();
    const left = Math.round((size - width) / 2);
    const top = Math.round((size - height) / 2);

    return sharp({
        create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
        .composite([{ input: resized, left, top }])
        .png()
        .toBuffer();
}

async function writeIcon(filePath, buffer) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await sharp(buffer).toFile(filePath);
    console.log('wrote', path.relative(root, filePath));
}

const mark = await loadTransparentMark();

const outputs = [
    ['public/icon.png', 512],
    ['public/icon-192.png', 192],
    ['public/icon-512.png', 512],
    ['public/apple-touch-icon.png', 180],
    ['src/app/icon.png', 512],
    ['src/app/apple-icon.png', 180],
];

for (const [rel, size] of outputs) {
    const buf = await renderSquareIcon(mark, size);
    await writeIcon(path.join(root, rel), buf);
}

/** Multi-size favicon.ico (16 + 32) */
const favicon16 = await renderSquareIcon(mark, 16, 0.1);
const favicon32 = await renderSquareIcon(mark, 32, 0.12);
await writeIcon(path.join(root, 'src/app/favicon.ico'), favicon32);
await writeFile(path.join(root, 'public/favicon-32.png'), favicon32);
await writeFile(path.join(root, 'public/favicon-16.png'), favicon16);

console.log('App icons generated from neyborhuud-mark-light.png');
