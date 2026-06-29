/**
 * Prove the CORRECT fallback rule: for an unmatched extensionless path, serve
 * the matching dynamic route shell (<route>/__id.html) instead of root
 * index.html. If /profile/<x> then renders the Profile page, this is the rule
 * to implement natively (MainActivity PathHandler).
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out');
const PORT = 8913;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4','.ico':'image/x-icon' };

function resolveShell(urlPath) {
  // 1. exact file
  const exact = path.join(outDir, urlPath);
  if (existsSync(exact) && statSync(exact).isFile()) return exact;
  const segs = urlPath.split('/').filter(Boolean);
  const last = segs[segs.length - 1] || '';
  if (last.includes('.')) return null; // asset miss
  // 2. static route page: <path>.html
  const asHtml = path.join(outDir, ...segs) + '.html';
  if (existsSync(asHtml)) return asHtml;
  // 3. dynamic route: replace the LAST segment with __id and look for __id.html,
  //    walking up so /profile/jane/followers -> profile/__id/followers.html etc.
  for (let i = segs.length - 1; i >= 0; i--) {
    const candSegs = segs.slice(0, i).concat('__id', segs.slice(i + 1));
    const cand = path.join(outDir, ...candSegs) + '.html';
    if (existsSync(cand)) return cand;
    const candFile = path.join(outDir, ...segs.slice(0, i), '__id.html');
    if (existsSync(candFile) && i === segs.length - 1) return candFile;
  }
  // 4. last resort: root index
  const idx = path.join(outDir, 'index.html');
  return existsSync(idx) ? idx : null;
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const fp = resolveShell(urlPath);
  if (!fp) { res.writeHead(404); return res.end('404'); }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(fp));
});
await new Promise((r) => server.listen(PORT, r));
const base = `http://127.0.0.1:${PORT}`;

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.addInitScript(() => {
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: {} };
  localStorage.setItem('neyborhuud_access_token', 'HARNESS_FAKE_TOKEN');
});
await ctx.route('https://api.neyborhuud.com/**', (r) => r.abort());
const page = await ctx.newPage();

for (const url of ['/profile/jane', '/events/abc123', '/chat/xyz789']) {
  await page.goto(`${base}${url}`, { waitUntil: 'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(2000);
  const snap = await page.evaluate(() => ({
    h: (document.querySelector('h1,h2')?.innerText||'').slice(0,40),
    bodyLen: document.body.innerText.length,
    isLanding: /Safety\. Neybor\. Huud\./.test(document.body.innerText),
  }));
  console.log(url, '->', JSON.stringify(snap));
}
await browser.close(); server.close(); process.exit(0);
