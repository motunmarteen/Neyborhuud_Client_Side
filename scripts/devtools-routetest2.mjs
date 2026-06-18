/** Set token, then trigger a real in-WebView load of a relative dynamic path
 * (location.href = '/profile/x') so the request goes THROUGH Capacitor's local
 * server and exercises the native RouteProcessor. Report rendered shell. */
import { WebSocket } from 'ws';
const ws = new WebSocket(process.argv[2]);
const target = process.argv[3] || '/profile/testuser';
let id = 0;
const send = (m, p = {}) => new Promise((r) => {
  const i = ++id; const h = (d) => { const x = JSON.parse(d.toString()); if (x.id === i) { ws.off('message', h); r(x.result); } };
  ws.on('message', h); ws.send(JSON.stringify({ id: i, method: m, params: p }));
});
ws.on('open', async () => {
  await send('Runtime.enable');
  await send('Runtime.evaluate', { expression: `localStorage.setItem('neyborhuud_access_token','FAKE_HARNESS_TOKEN')` });
  // Relative navigation -> stays within capacitor https://localhost origin -> RouteProcessor runs.
  await send('Runtime.evaluate', { expression: `window.location.href = ${JSON.stringify(target)}` });
  await new Promise((r) => setTimeout(r, 6000));
  const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      url: location.pathname,
      h: (document.querySelector('h1,h2')?.innerText||'').slice(0,50),
      bodyLen: document.body.innerText.length,
      isLanding: /Safety\\. Neybor\\. Huud\\./.test(document.body.innerText),
      head: document.body.innerText.replace(/\\s+/g,' ').slice(0,170)
    })`, returnByValue: true,
  });
  console.log(res?.result?.value ?? 'no result (page navigated away)');
  ws.close(); process.exit(0);
});
ws.on('error', (e) => { console.log('err', e.message); process.exit(1); });
setTimeout(() => { console.log('timeout'); process.exit(0); }, 12000);
