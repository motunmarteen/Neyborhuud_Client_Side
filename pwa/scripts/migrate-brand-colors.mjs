#!/usr/bin/env node
/**
 * One-shot migration: Tailwind palette + forbidden hex → brand tokens (DESIGN.md §4).
 * Skips node_modules, .next*, globals.css (tokens defined there), and onboarding page.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.next', '.next-3000', '.next-3001', '.next-3002', '.next-3003', '.git']);
const SKIP_FILES = new Set(['globals.css', 'brand-styles.ts', 'migrate-brand-colors.mjs']);

const REPLACEMENTS = [
    [/text-red-500/g, 'text-brand-red'],
    [/bg-red-500/g, 'bg-brand-red'],
    [/border-red-500/g, 'border-brand-red'],
    [/ring-red-500/g, 'ring-brand-red'],
    [/accent-red-500/g, 'accent-brand-red'],
    [/text-red-400/g, 'text-brand-red'],
    [/bg-red-400/g, 'bg-brand-red'],
    [/border-red-400/g, 'border-brand-red'],
    [/text-red-300/g, 'text-brand-red'],
    [/bg-red-300/g, 'bg-brand-red'],
    [/text-red-200/g, 'text-brand-red'],
    [/from-red-500/g, 'from-brand-red'],
    [/to-red-700/g, 'to-brand-red'],
    [/to-red-500/g, 'to-brand-red'],

    [/text-green-500/g, 'text-primary'],
    [/bg-green-500/g, 'bg-primary'],
    [/border-green-500/g, 'border-primary'],
    [/text-green-400/g, 'text-primary'],
    [/bg-green-400/g, 'bg-primary'],
    [/text-green-300/g, 'text-primary'],
    [/bg-green-300/g, 'bg-primary'],
    [/text-green-200/g, 'text-primary'],
    [/text-green-600/g, 'text-brand-green-dark'],
    [/bg-green-600/g, 'bg-brand-green-dark'],

    [/text-blue-500/g, 'text-brand-blue'],
    [/bg-blue-500/g, 'bg-brand-blue'],
    [/border-blue-500/g, 'border-brand-blue'],
    [/text-blue-400/g, 'text-brand-blue'],
    [/bg-blue-400/g, 'bg-brand-blue'],
    [/text-blue-200/g, 'text-brand-blue'],
    [/text-blue-300/g, 'text-brand-blue'],
    [/from-blue-500/g, 'from-brand-blue'],
    [/to-blue-700/g, 'to-brand-blue'],

    [/text-emerald-400/g, 'text-primary'],
    [/bg-emerald-400/g, 'bg-primary'],
    [/text-emerald-300/g, 'text-primary'],
    [/text-emerald-500/g, 'text-primary'],
    [/bg-emerald-500/g, 'bg-primary'],
    [/dark:text-emerald-400/g, 'dark:text-primary'],
    [/dark:bg-emerald-500/g, 'dark:bg-primary'],

    [/text-amber-400/g, 'text-primary'],
    [/bg-amber-400/g, 'bg-primary'],
    [/text-amber-500/g, 'text-primary'],
    [/bg-amber-500/g, 'bg-primary'],
    [/text-yellow-500/g, 'text-primary'],
    [/bg-yellow-500/g, 'bg-primary'],
    [/bg-yellow-600/g, 'bg-brand-green-dark'],
    [/text-yellow-300/g, 'text-primary'],
    [/bg-yellow-300/g, 'bg-primary'],

    [/text-orange-400/g, 'text-brand-red'],
    [/bg-orange-400/g, 'bg-brand-red'],
    [/text-orange-500/g, 'text-brand-red'],
    [/bg-orange-500/g, 'bg-brand-red'],
    [/border-orange-500/g, 'border-brand-red'],
    [/ring-orange-500/g, 'ring-brand-red'],
    [/from-orange-500/g, 'from-brand-red'],

    [/text-purple-400/g, 'text-brand-blue'],
    [/bg-purple-400/g, 'bg-brand-blue'],
    [/text-purple-500/g, 'text-brand-blue'],
    [/bg-purple-500/g, 'bg-brand-blue'],
    [/text-violet-400/g, 'text-brand-blue'],
    [/bg-violet-400/g, 'bg-brand-blue'],

    [/text-pink-300/g, 'text-brand-blue'],
    [/bg-pink-500/g, 'bg-brand-blue'],
    [/text-pink-500/g, 'text-brand-blue'],

    [/text-teal-300/g, 'text-brand-green-dark'],
    [/bg-teal-500/g, 'bg-brand-green-dark'],
    [/text-teal-500/g, 'text-brand-green-dark'],

    [/text-gray-300/g, 'text-[var(--neu-text-muted)]'],
    [/text-gray-400/g, 'text-[var(--neu-text-muted)]'],
    [/text-gray-500/g, 'text-[var(--neu-text-muted)]'],
    [/text-gray-600/g, 'text-[var(--neu-text-secondary)]'],
    [/text-slate-400/g, 'text-[var(--neu-text-muted)]'],
    [/text-slate-500/g, 'text-[var(--neu-text-muted)]'],

    [/text-\[#1A1A2E\]/g, 'text-brand-black'],
    [/text-\[#64748B\]/g, 'text-[var(--neu-text-muted)]'],
    [/text-\[#475569\]/g, 'text-[var(--neu-text-secondary)]'],
    [/text-\[#6B7280\]/g, 'text-[var(--neu-text-muted)]'],
    [/text-\[#334155\]/g, 'text-[var(--neu-text-secondary)]'],
    [/text-\[#991B1B\]/g, 'text-brand-red'],
    [/text-\[#94A3B8\]/g, 'text-[var(--neu-text-muted)]'],
    [/bg-\[#F8FAFC\]/g, 'bg-brand-surface'],
    [/background:\s*'#030a0b'/g, "background: 'var(--brand-black)'"],
    [/border-emerald-400/g, 'border-primary'],
    [/border-amber-400/g, 'border-primary'],
    [/border-green-400/g, 'border-brand-green-dark'],
    [/border-blue-400/g, 'border-brand-blue'],
    [/border-purple-400/g, 'border-brand-blue'],
    [/border-teal-400/g, 'border-brand-green-dark'],
    [/border-pink-400/g, 'border-brand-blue'],
    [/text-purple-200/g, 'text-white/90'],
    [/text-emerald-200/g, 'text-white/90'],
    [/text-amber-200/g, 'text-white/90'],
    [/text-teal-200/g, 'text-white/90'],
    [/text-pink-200/g, 'text-white/90'],
    [/dark:shadow-\[0_0_20px_rgba\(16,185,129,0\.12\)\]/g, 'dark:shadow-[0_0_20px_rgba(0,212,49,0.12)]'],
    [/dark:bg-emerald-500\/15/g, 'dark:bg-primary/15'],
    [/text-orange-200/g, 'text-brand-red'],
    [/border-orange-400/g, 'border-brand-red'],
    [/border-emerald-300/g, 'border-primary/30'],
    [/border-teal-300/g, 'border-brand-green-dark/30'],
    [/text-indigo-/g, 'text-brand-blue'],
    [/bg-indigo-/g, 'bg-brand-blue'],
    [/text-cyan-/g, 'text-brand-blue'],
    [/bg-cyan-/g, 'bg-brand-blue'],
    [/text-lime-/g, 'text-primary'],
    [/bg-lime-/g, 'bg-primary'],
    [/text-rose-/g, 'text-brand-red'],
    [/bg-rose-/g, 'bg-brand-red'],
    [/text-violet-/g, 'text-brand-blue'],
    [/bg-violet-/g, 'bg-brand-blue'],
    [/text-fuchsia-/g, 'text-brand-blue'],
    [/bg-fuchsia-/g, 'bg-brand-blue'],
    [/text-yellow-/g, 'text-primary'],
    [/bg-yellow-/g, 'bg-primary'],
    [/text-orange-/g, 'text-brand-red'],
    [/bg-orange-/g, 'bg-brand-red'],
    [/bg-gray-800/g, 'bg-brand-black'],
    [/bg-gray-900/g, 'bg-brand-black'],
    [/bg-gray-700/g, 'bg-brand-black'],
    [/text-gray-/g, 'text-[var(--neu-text-muted)]'],
    [/bg-gray-/g, 'bg-brand-surface'],
    [/border-gray-/g, 'border-black/[0.08]'],
    [/#22c55e/gi, '#006F35'],
    [/#ef4444/gi, '#FF0000'],
    [/#f59e0b/gi, '#00D431'],
    [/#3b82f6/gi, '#0000FF'],
    [/#8b5cf6/gi, '#0000FF'],
    [/#6b7280/gi, 'var(--neu-text-muted)'],
    [/#008751/gi, '#006F35'],
    [/#6B9FED/gi, '#0000FF'],
    [/rgba\(16,185,129/g, 'rgba(0,212,49'],
    [/rgba\(0,135,81/g, 'rgba(0,111,53'],
];

function walk(dir, files = []) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (SKIP_DIRS.has(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full, files);
        else if (/\.(tsx?|jsx?|css)$/.test(entry.name) && !SKIP_FILES.has(entry.name)) files.push(full);
    }
    return files;
}

let changed = 0;
for (const file of walk(path.join(ROOT, 'src'))) {
    if (file.endsWith('page.tsx') && file.includes(`${path.sep}app${path.sep}`) && file.endsWith(`${path.sep}page.tsx`) && path.basename(path.dirname(file)) === '' || file.endsWith(`${path.sep}src${path.sep}app${path.sep}page.tsx`)) {
        // skip root onboarding
        if (file.replace(/\\/g, '/').endsWith('src/app/page.tsx')) continue;
    }
    let content = fs.readFileSync(file, 'utf8');
    const original = content;
    for (const [re, rep] of REPLACEMENTS) content = content.replace(re, rep);
    if (content !== original) {
        fs.writeFileSync(file, content);
        changed++;
        console.log('updated:', path.relative(ROOT, file));
    }
}
console.log(`\nDone — ${changed} files updated.`);
