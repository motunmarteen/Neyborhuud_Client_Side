#!/usr/bin/env node
/** Replace hand-rolled auth CTAs with btn-glass-primary / btn-secondary */
import fs from 'node:fs';
import path from 'node:path';

const files = [
    'src/app/forgot-password/page.tsx',
    'src/app/verify-email/page.tsx',
    'src/app/reset-password/page.tsx',
];

const PRIMARY_RE = /className=\{`flex h-\[(50|52)px\][^`]*(?:bg-primary|bg-brand-blue)[^`]*`\}/g;
const PRIMARY_SIMPLE = /className="flex h-\[(50|52)px\][^"]*(?:bg-primary|bg-brand-blue)[^"]*"/g;

for (const rel of files) {
    const file = path.join(process.cwd(), rel);
    let c = fs.readFileSync(file, 'utf8');
    const orig = c;
    c = c.replace(
        /className=\{`flex h-\[(50|52)px\] items-center justify-center[^`]*\$\{[^`]*(?:bg-primary|bg-brand-blue)[^`]*`\}/g,
        'className="btn-glass-primary h-[52px] w-full gap-2"'
    );
    c = c.replace(
        /className="flex h-\[(50|52)px\] items-center justify-center gap-2 rounded-2xl bg-(?:primary|brand-blue)[^"]*"/g,
        'className="btn-glass-primary h-[52px] w-full gap-2"'
    );
    c = c.replace(
        /className=\{`flex h-\[50px\] items-center justify-center[^`]*\$\{[^`]*border border-charcoal[^`]*`\}/g,
        'className="btn-secondary h-[50px] w-full gap-2"'
    );
    if (c !== orig) {
        fs.writeFileSync(file, c);
        console.log('updated', rel);
    }
}
