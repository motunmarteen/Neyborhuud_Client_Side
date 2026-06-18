/** Connect, navigate to target, then report final URL + visible heading text. */
import { WebSocket } from 'ws';
const wsUrl = process.argv[2];
const target = process.argv[3] || '/profile/motun';
const ws = new WebSocket(wsUrl);
let id = 0;
const send = (method, params = {}) => new Promise((res) => {
  const myId = ++id;
  const onMsg = (d) => { const m = JSON.parse(d.toString()); if (m.id === myId) { ws.off('message', onMsg); res(m.result); } };
  ws.on('message', onMsg);
  ws.send(JSON.stringify({ id: myId, method, params }));
});
ws.on('open', async () => {
  await send('Runtime.enable');
  await send('Runtime.evaluate', { expression: `history.pushState({},'',${JSON.stringify(target)}); dispatchEvent(new PopStateEvent('popstate'));` });
  await new Promise((r) => setTimeout(r, 4000));
  const r = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      url: location.pathname,
      title: document.title,
      h1: (document.querySelector('h1,h2')?.innerText||'').slice(0,80),
      bodyLen: document.body.innerText.length,
      bodyHead: document.body.innerText.replace(/\\s+/g,' ').slice(0,200)
    })`,
    returnByValue: true,
  });
  console.log(r.result.value);
  ws.close(); process.exit(0);
});
ws.on('error', (e) => { console.log('ws error', e.message); process.exit(1); });
