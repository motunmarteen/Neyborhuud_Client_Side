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
      hasToken: !!localStorage.getItem('neyborhuud_access_token'),
      tokenLen: (localStorage.getItem('neyborhuud_access_token')||'').length,
      url: location.pathname
    })`,
    returnByValue: true,
  });
  console.log(r.result.value);
  ws.close(); process.exit(0);
});
ws.on('error', (e) => { console.log('err', e.message); process.exit(1); });
