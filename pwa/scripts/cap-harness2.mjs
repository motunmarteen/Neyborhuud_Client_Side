/** Load specific shell files directly to isolate whether the SHELL renders the
 * right route, vs. the html5mode fallback serving the landing page. */
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'out');
const PORT = 8912;
const MIME = { '.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.mp4':'video/mp4','.ico':'image/x-icon' };

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const filePath = path.join(outDir, urlPath);
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    return res.end(readFileSync(filePath));
  }
  const last = urlPath.split('/').filter(Boolean).pop() || '';
  if (!last.includes('.')) { const idx = path.join(outDir,'index.html'); if (existsSync(idx)) { res.writeHead(200,{'Content-Type':'text/html'}); return res.end(readFileSync(idx)); } }
  res.writeHead(404); res.end('404');
});
await new Promise((r) => server.listen(PORT, r));
const base = `http://127.0.0.1:${PORT}`;

const browser = await chromium.launch();
const ctx = await browser.newContext();
await ctx.addInitScript(() => {
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'android', Plugins: {} };
  localStorage.setItem('neyborhuud_access_token', 'HARNESS_FAKE_TOKEN');
});
// Block external API so we just see the shell render, not data
await ctx.route('https://api.neyborhuud.com/**', (r) => r.abort());

const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0,160)));

// Load the GENERATED profile shell directly (the .html the export made)
for (const url of ['/profile/__id.html', '/profile/__id']) {
  await page.goto(`${base}${url}`, { waitUntil: 'domcontentloaded' }).catch(()=>{});
  await page.waitForTimeout(2500);
  const snap = await page.evaluate(() => ({
    url: location.pathname,
    h: (document.querySelector('h1,h2')?.innerText||'').slice(0,50),
    bodyLen: document.body.innerText.length,
    head: document.body.innerText.replace(/\s+/g,' ').slice(0,140),
    // what route did Next think it rendered? look for profile-specific markers
    hasProfileMarkers: /follow|posts|joined|@/i.test(document.body.innerText),
  }));
  console.log(url, '->', JSON.stringify(snap));
}
console.log('errors:', errs.length ? [...new Set(errs)].slice(0,5).join(' | ') : '(none)');
await browser.close(); server.close(); process.exit(0);
