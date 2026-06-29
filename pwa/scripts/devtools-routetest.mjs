/** Inject token, hard-navigate to a dynamic route, report rendered shell.
 * Tests the native RouteProcessor on the real WebView. */
import { WebSocket } from 'ws';
const ws = new WebSocket(process.argv[2]);
const target = process.argv[3] || '/profile/testuser';
let id = 0;
const send = (m, p = {}) => new Promise((r) => {
  const i = ++id; const h = (d) => { const x = JSON.parse(d.toString()); if (x.id === i) { ws.off('message', h); r(x.result); } };
  ws.on('message', h); ws.send(JSON.stringify({ id: i, method: m, params: p }));
});
ws.on('open', async () => {
  await send('Page.enable'); await send('Runtime.enable');
  // Set a fake token so we're past the auth gate, then hard-navigate.
  await send('Runtime.evaluate', { expression: `localStorage.setItem('neyborhuud_access_token','FAKE_HARNESS_TOKEN')` });
  await send('Page.navigate', { url: 'https://localhost' + target });
  await new Promise((r) => setTimeout(r, 5000));
  const res = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      url: location.pathname,
      h: (document.querySelector('h1,h2')?.innerText||'').slice(0,50),
      bodyLen: document.body.innerText.length,
      isLanding: /Safety\\. Neybor\\. Huud\\./.test(document.body.innerText),
      head: document.body.innerText.replace(/\\s+/g,' ').slice(0,160)
    })`, returnByValue: true,
  });
  console.log(res.result.value);
  ws.close(); process.exit(0);
});
ws.on('error', (e) => { console.log('err', e.message); process.exit(1); });
