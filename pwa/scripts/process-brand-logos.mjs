/**
 * Convert brand JPEGs (black matte) → trimmed transparent PNGs.
 * Run from repo root: node scripts/process-brand-logos.mjs
 */
import sharp from 'sharp';
import { mkdir, rename, unlink } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const brandDir = path.join(__dirname, '../public/brand');
const BLACK_THRESHOLD = 28;

async function processLogo(fileName) {
    const input = path.join(brandDir, fileName);
    const tmp = path.join(brandDir, `${fileName}.tmp.png`);
    const output = path.join(brandDir, fileName);

    const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r <= BLACK_THRESHOLD && g <= BLACK_THRESHOLD && b <= BLACK_THRESHOLD) {
            data[i + 3] = 0;
        }
    }

    const meta = await sharp(data, {
        raw: { width: info.width, height: info.height, channels: 4 },
    })
        .trim({ threshold: 10 })
        .png()
        .toFile(tmp);

    await unlink(output).catch(() => {});
    await rename(tmp, output);
    console.log(`${fileName}: ${meta.width}x${meta.height}`);
}

await mkdir(brandDir, { recursive: true });
await processLogo('neyborhuud-mark-light.png');
await processLogo('neyborhuud-wordmark-light.png');
console.log('Done.');
