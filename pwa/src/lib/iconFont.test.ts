import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const lines = (f: string) => new Set(readFileSync(path.join(root, 'tools/icon-font', f), 'utf8').split(/\s+/).filter(Boolean));

describe('icon font', () => {
  it('holds every icon the app names (else run tools/icon-font/subset.py)', () => {
    const kept = lines('icons.txt');
    const all = lines('all-icons.txt');
    const missing = new Set<string>();
    for (const f of readdirSync(path.join(root, 'src'), { recursive: true, encoding: 'utf8' })) {
      if (!/\.(tsx?|css|json)$/.test(f)) continue;
      const text = readFileSync(path.join(root, 'src', f), 'utf8');
      for (const w of text.match(/[a-z0-9_]+/g) ?? []) if (all.has(w) && !kept.has(w)) missing.add(w);
    }
    expect([...missing]).toEqual([]);
  });
});
