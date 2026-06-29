#!/usr/bin/env node
/** Repair classes broken by overly aggressive gray-* → brand replacements. */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', 'src');

const FIXES = [
    [/border-black\/\[0\.08\][0-9]+/g, 'border-black/[0.08]'],
    [/bg-brand-surface[0-9]+/g, 'bg-brand-surface'],
    [/text-\[var\(--neu-text-muted\)\][0-9]+/g, 'text-[var(--neu-text-muted)]'],
    [/text-\[var\(--neu-text-secondary\)\][0-9]+/g, 'text-[var(--neu-text-secondary)]'],
    [/hover:bg-brand-surface[0-9]+/g, 'hover:bg-brand-surface'],
    [/dark:bg-brand-surface[0-9]+/g, 'dark:bg-brand-black'],
    [/dark:hover:bg-brand-black/g, 'dark:hover:bg-brand-black/80'],
    [/bg-\[#1a1a2e\]/gi, 'bg-brand-black'],
    [/bg-\[#0f0f1e\]/gi, 'bg-brand-black'],
    [/hover:bg-red-50/g, 'hover:bg-brand-red/10'],
    [/hover:text-red-600/g, 'hover:text-brand-red'],
    [/dark:hover:bg-red-950\/20/g, 'dark:hover:bg-brand-red/20'],
    [/border-t-amber-400/g, 'border-t-primary'],
    [/hover:border-amber-300/g, 'hover:border-primary'],
    [/hover:bg-amber-50/g, 'hover:bg-primary/10'],
    [/focus:border-purple-500/g, 'focus:border-brand-blue'],
    [/placeholder-gray-500/g, 'placeholder:text-[var(--neu-text-muted)]'],
    [/from-green-400/g, 'from-primary'],
    [/to-blue-500/g, 'to-brand-blue'],
    [/ring-green-500/g, 'ring-primary'],
    [/accent-green-500/g, 'accent-primary'],
    [/accent-blue-500/g, 'accent-brand-blue'],
];

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (/\.(tsx?|css)$/.test(e.name) && e.name !== 'globals.css') out.push(p);
    }
    return out;
}

let n = 0;
for (const file of walk(ROOT)) {
    let c = fs.readFileSync(file, 'utf8');
    const orig = c;
    for (const [re, rep] of FIXES) c = c.replace(re, rep);
    if (c !== orig) {
        fs.writeFileSync(file, c);
        n++;
    }
}
console.log(`Repaired ${n} files.`);
