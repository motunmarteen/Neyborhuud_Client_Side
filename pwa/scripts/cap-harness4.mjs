/**
 * Test: when Capacitor serves ROOT index.html (landing shell) for /profile/jane,
 * can the client SPA router navigate INTO the (app) group and render profile?
 * Tries several strategies and reports which renders the Profile page.
 */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out');
const PORT = 8914;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4','.ico':'image/x-icon' };

// Serve EXACTLY like Capacitor: exact file, else root index.html for extensionless.
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const fp = path.join(outDir, urlPath);
  if (existsSync(fp) && statSync(fp).isFile()) {
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' }); return res.end(readFileSync(fp));
  }
  const last = urlPath.split('/').filter(Boolean).pop() || '';
  if (!last.includes('.')) { res.writeHead(200, {'Content-Type':'text/html'}); return res.end(readFileSync(path.join(outDir,'index.html'))); }
  res.writeHead(404); res.end('404');
});
await new Promise((r) => server.listen(PORT, r));
const base = `http://127.0.0.1:${PORT}`;

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.addInitScript(() => {
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: {} };
  localStorage.setItem('neyborhuud_access_token', 'FAKE');
});
await ctx.route('https://api.neyborhuud.com/**', (r) => r.abort());

async function tryStrategy(label, fn) {
  const page = await ctx.newPage();
  await page.goto(`${base}/profile/jane`, { waitUntil: 'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(1500);
  await fn(page).catch((e)=>{});
  await page.waitForTimeout(3500);
  const snap = await page.evaluate(() => ({
    h: (document.querySelector('h1,h2')?.innerText||'').slice(0,30),
    isLanding: /Safety\. Neybor\. Huud\./.test(document.body.innerText),
    bodyLen: document.body.innerText.length,
  }));
  console.log(label, '->', JSON.stringify(snap));
  await page.close();
}

// Strategy A: nothing (baseline — what happens now)
await tryStrategy('A baseline', async () => {});
// Strategy B: history.replaceState + dispatch popstate
await tryStrategy('B popstate', async (p) => p.evaluate(() => { history.replaceState({},'','/profile/jane'); dispatchEvent(new PopStateEvent('popstate')); }));
// Strategy C: reassign location.href to same path (forces Capacitor to serve again)
await tryStrategy('C location.replace', async (p) => p.evaluate(() => location.replace('/profile/jane')));

await browser.close(); server.close(); process.exit(0);
