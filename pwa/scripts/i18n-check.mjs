// Lists what each language is missing compared with English (tracker L-07 / L-08).
// Usage: npm run i18n:check
import { readFileSync } from 'node:fs';

const keysOf = (lang) => {
  const src = readFileSync(new URL(`../src/locales/${lang}.ts`, import.meta.url), 'utf8');
  return new Set([...src.matchAll(/^\s*'([^']+)'\s*:/gm)].map((m) => m[1]));
};

const en = keysOf('en');
for (const lang of ['pcm', 'yo', 'ha', 'ig']) {
  const have = keysOf(lang);
  const missing = [...en].filter((k) => !have.has(k));
  const extra = [...have].filter((k) => !en.has(k));
  const pct = Math.round(((en.size - missing.length) / en.size) * 100);
  console.log(`${lang}: ${pct}% (${en.size - missing.length}/${en.size})${missing.length ? `, missing ${missing.length}` : ''}${extra.length ? `, not in English: ${extra.join(', ')}` : ''}`);
  if (process.argv.includes('--list')) for (const k of missing) console.log(`  - ${k}`);
}
