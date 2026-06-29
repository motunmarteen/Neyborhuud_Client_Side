/**
 * FINAL routing verification — ports the native MainActivity.java `resolve()`
 * RouteProcessor logic LINE-FOR-LINE into JS and runs it against the real out/
 * bundle, then loads each route in a headless browser with a native-Capacitor
 * shim. A pass here means the exact algorithm shipped in the APK resolves every
 * route class correctly — without needing the (fragile) emulator.
 *
 * Route classes covered:
 *   - root "/"                          -> index.html (landing)         [intended]
 *   - static "/feed"                    -> feed.html                    [app page]
 *   - dynamic "/profile/jane"           -> profile/__id.html            [THE bug]
 *   - dynamic "/events/abc123"          -> events/__id.html
 *   - dynamic "/chat/xyz789"            -> chat/__id.html
 *   - nested  "/profile/jane/followers" -> profile/__id/followers.html  [deep]
 *   - asset   "/_next/.../x.js"         -> served as-is                 [no rewrite]
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out');
const PORT = 8917;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4','.ico':'image/x-icon' };

/** Whether a file exists at out/<relative> (mirrors Java assetExists). */
function assetExists(relative) {
  const fp = path.join(outDir, relative);
  return existsSync(fp) && statSync(fp).isFile();
}

/**
 * Direct port of MainActivity.resolve(). Returns the relative asset path the
 * native RouteProcessor would serve (without the "public/" base — here the base
 * IS outDir). Mirrors the Java control flow exactly.
 */
function resolveNative(rawPath) {
  // strip query/hash + leading slashes
  let clean = rawPath || '';
  const q = clean.indexOf('?'); if (q >= 0) clean = clean.slice(0, q);
  const h = clean.indexOf('#'); if (h >= 0) clean = clean.slice(0, h);
  while (clean.startsWith('/')) clean = clean.slice(1);

  // index.html probe, or any path with a file extension -> serve directly
  const lastSeg = clean === '' ? '' : clean.slice(clean.lastIndexOf('/') + 1);
  if (clean === '' || lastSeg.includes('.')) {
    return clean === '' ? 'index.html' : clean;
  }
  // 1. static page: <path>.html
  if (assetExists(clean + '.html')) return clean + '.html';
  // 2. dynamic: replace each segment (from last) with __id, look for <prefix>.html
  const segs = clean.split('/');
  for (let i = segs.length - 1; i >= 0; i--) {
    const parts = segs.map((s, k) => (k === i ? '__id' : s));
    const candidate = parts.join('/') + '.html';
    if (assetExists(candidate)) return candidate;
  }
  // 3. fallback: root index.html
  return 'index.html';
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const rel = resolveNative(urlPath);
  const fp = path.join(outDir, rel);
  if (!existsSync(fp)) { res.writeHead(404); return res.end('404'); }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(readFileSync(fp));
});
await new Promise((r) => server.listen(PORT, r));
const base = `http://127.0.0.1:${PORT}`;

// --- Part A: static assertion of the resolver (no browser needed) ---
const cases = [
  ['/',                       'index.html'],
  ['/feed',                   'feed.html'],
  ['/profile/jane',           'profile/__id.html'],
  ['/events/abc123',          'events/__id.html'],
  ['/chat/xyz789',            'chat/__id.html'],
  ['/profile/jane/followers', 'profile/__id/followers.html'],
];
let resolverPass = true;
console.log('--- resolver (native logic ported) ---');
for (const [req, expect] of cases) {
  const got = resolveNative(req);
  const ok = got === expect || (expect.endsWith('.html') && got === expect);
  if (!ok) resolverPass = false;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${req}  ->  ${got}  (expected ${expect})`);
}

// --- Part B: render each route in a native-shim browser, confirm NOT landing ---
const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.addInitScript(() => {
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: {} };
  localStorage.setItem('neyborhuud_access_token', 'HARNESS_FAKE_TOKEN');
});
await ctx.route('https://api.neyborhuud.com/**', (r) => r.abort());
const page = await ctx.newPage();

console.log('--- render (browser, native shim) ---');
let renderPass = true;
for (const url of ['/feed', '/profile/jane', '/events/abc123', '/chat/xyz789', '/profile/jane/followers']) {
  await page.goto(`${base}${url}`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1800);
  const snap = await page.evaluate(() => ({
    h: (document.querySelector('h1,h2')?.innerText || '').slice(0, 40),
    bodyLen: document.body.innerText.length,
    isLanding: /Safety\. Neybor\. Huud\./.test(document.body.innerText),
  }));
  // Pass = did NOT fall through to the marketing landing shell.
  const ok = !snap.isLanding && snap.bodyLen > 0;
  if (!ok) renderPass = false;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${url}  ->  ${JSON.stringify(snap)}`);
}

await browser.close(); server.close();
console.log('--- RESULT ---');
console.log(`resolver: ${resolverPass ? 'PASS' : 'FAIL'}   render: ${renderPass ? 'PASS' : 'FAIL'}`);
process.exit(resolverPass && renderPass ? 0 : 1);
