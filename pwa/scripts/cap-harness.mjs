/**
 * Capacitor routing harness (no device needed).
 *
 * Serves ./out exactly like Capacitor's Android WebView:
 *   - exact file if it exists
 *   - else, for an extensionless path, fall back to ROOT index.html (html5mode),
 *     which is precisely what WebViewLocalServer.java does.
 * Then drives headless Chromium to:
 *   - load https://127.0.0.1:PORT/ (the landing shell, like app cold start)
 *   - simulate native: set window.Capacitor + an auth token in localStorage
 *   - navigate to a target route (default /feed then /profile/<user>)
 *   - report final URL, rendered <h1>, body length, console errors, 404s
 *
 * Usage: node scripts/cap-harness.mjs [/target/path]
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out');
const PORT = 8911;
const target = process.argv[2] || '/profile/testuser';

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.txt': 'text/plain', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp4': 'video/mp4',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(outDir, urlPath);
  const serve = (fp) => {
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(fp));
  };
  if (existsSync(filePath) && statSync(filePath).isFile()) return serve(filePath);
  // Capacitor html5mode: extensionless + not found -> ROOT index.html
  const last = urlPath.split('/').filter(Boolean).pop() || '';
  if (!last.includes('.')) {
    const idx = path.join(outDir, 'index.html');
    if (existsSync(idx)) return serve(idx);
  }
  res.writeHead(404); res.end('404');
});

await new Promise((r) => server.listen(PORT, r));
const base = `http://127.0.0.1:${PORT}`;
console.log(`harness serving ./out at ${base} (Capacitor-style html5mode)`);

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const consoleErrors = [];
const net404 = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleErrors.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
page.on('response', (r) => { if (r.status() >= 400) net404.push(`${r.status()} ${r.url().replace(base, '')}`); });
page.on('pageerror', (e) => consoleErrors.push(`[pageerror] ${String(e).slice(0, 200)}`));

// 1. Simulate native env + auth token BEFORE any app code runs.
await ctx.addInitScript(() => {
  // Minimal Capacitor shim so isNativePlatform() === true in our code.
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: {} };
  localStorage.setItem('neyborhuud_access_token', 'HARNESS_FAKE_TOKEN');
});

// 2. Cold start at root (landing shell), like the app launch.
await page.goto(`${base}/`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
const afterBoot = await page.evaluate(() => ({ url: location.pathname, h: (document.querySelector('h1,h2')?.innerText || '').slice(0, 60) }));
console.log('after boot at "/":', JSON.stringify(afterBoot));

// 3. Navigate to the target the way a link would (pushState + popstate),
//    then also try a full load of the target URL.
console.log(`\n--- client-nav to ${target} ---`);
await page.evaluate((t) => { history.pushState({}, '', t); dispatchEvent(new PopStateEvent('popstate')); }, target);
await page.waitForTimeout(2500);
let snap = await page.evaluate(() => ({
  url: location.pathname,
  h: (document.querySelector('h1,h2')?.innerText || '').slice(0, 60),
  bodyLen: document.body.innerText.length,
  head: document.body.innerText.replace(/\s+/g, ' ').slice(0, 160),
}));
console.log('client-nav result:', JSON.stringify(snap));

console.log(`\n--- hard load ${target} (cold deep-link) ---`);
await page.goto(`${base}${target}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
snap = await page.evaluate(() => ({
  url: location.pathname,
  h: (document.querySelector('h1,h2')?.innerText || '').slice(0, 60),
  bodyLen: document.body.innerText.length,
  head: document.body.innerText.replace(/\s+/g, ' ').slice(0, 160),
}));
console.log('hard-load result:', JSON.stringify(snap));

console.log('\n=== 4xx responses ===');
console.log(net404.length ? [...new Set(net404)].join('\n') : '(none)');
console.log('\n=== console errors ===');
console.log(consoleErrors.length ? [...new Set(consoleErrors)].slice(0, 12).join('\n') : '(none)');

await browser.close();
server.close();
process.exit(0);
