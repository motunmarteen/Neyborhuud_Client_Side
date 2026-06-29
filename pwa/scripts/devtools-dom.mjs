/** Read the current WebView DOM (no navigation). Reports url, heading, whether
 * it's the landing shell, and whether a login form is present. */
import { WebSocket } from 'ws';
const ws = new WebSocket(process.argv[2]);
let id = 0;
const send = (m, p = {}) => new Promise((r) => {
  const i = ++id;
  const h = (d) => { const x = JSON.parse(d.toString()); if (x.id === i) { ws.off('message', h); r(x.result); } };
  ws.on('message', h); ws.send(JSON.stringify({ id: i, method: m, params: p }));
});
ws.on('open', async () => {
  await send('Runtime.enable');
  const r = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      url: location.pathname,
      h: (document.querySelector('h1,h2')?.innerText || '').slice(0, 40),
      isLanding: /Safety\\. Neybor\\. Huud\\./.test(document.body.innerText),
      hasLoginForm: !!document.querySelector('input[type=password]'),
      bodyLen: document.body.innerText.length
    })`, returnByValue: true,
  });
  console.log(r.result.value);
  ws.close(); process.exit(0);
});
ws.on('error', (e) => { console.log('err', e.message); process.exit(1); });
setTimeout(() => process.exit(0), 8000);
