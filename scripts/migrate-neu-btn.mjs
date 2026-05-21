#!/usr/bin/env node
/** Migrate neu-btn → mod-chip / btn-ghost (DESIGN.md §8). Skips onboarding page.tsx. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', 'src');
const SKIP = new Set(['page.tsx']); // onboarding at app/page.tsx only when path ends with app/page.tsx

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (/\.tsx?$/.test(e.name)) out.push(p);
    }
    return out;
}

let n = 0;
for (const file of walk(ROOT)) {
    if (file.replace(/\\/g, '/').endsWith('src/app/page.tsx')) continue;
    if (file.includes(`${path.sep}globals.css`)) continue;

    let c = fs.readFileSync(file, 'utf8');
    const orig = c;

    c = c.replace(/\bneu-btn-active\b/g, 'mod-chip mod-chip-active');
    c = c.replace(/\bmod-btn-active\b/g, 'mod-chip mod-chip-active');
    c = c.replace(/\bmod-btn\b/g, 'mod-chip');
    // Icon-sized neu buttons → ghost
    c = c.replace(/className="([^"]*\b)neu-btn(\b[^"]*)"/g, (m, a, b) => {
        if (/w-[48]|h-[48]|w-8|h-8|p-2|min-w-\[44/.test(m)) {
            return `className="${a}btn-ghost${b}"`;
        }
        return `className="${a}mod-chip${b}"`;
    });
    c = c.replace(/\bneu-btn\b/g, 'mod-chip');

    if (c !== orig) {
        fs.writeFileSync(file, c);
        n++;
        console.log('updated', path.relative(path.join(ROOT, '..'), file));
    }
}
console.log(`Done — ${n} files.`);
