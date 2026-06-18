/**
 * One-off DevTools probe: connect to the running WebView over the forwarded
 * debug socket, enable Network+Console+Page, navigate the SPA to a target route,
 * and report any 404s / console errors. Pure diagnostic — deleted after use.
 *
 * Usage: node scripts/devtools-probe.mjs <wsUrl> <targetPath>
 */
import { WebSocket } from 'ws';

const wsUrl = process.argv[2];
const target = process.argv[3] || '/profile/motun';

const ws = new WebSocket(wsUrl);
let id = 0;
const send = (method, params = {}) => ws.send(JSON.stringify({ id: ++id, method, params }));

const failures = [];
const consoleErrors = [];

ws.on('open', () => {
  send('Network.enable');
  send('Runtime.enable');
  send('Log.enable');
  send('Page.enable');
  // Give listeners a moment, then trigger a client-side navigation via history API
  // (mirrors what next/link does) and also try a direct location change.
  setTimeout(() => {
    send('Runtime.evaluate', {
      expression: `(() => {
        try {
          // Prefer the Next router if exposed; otherwise use history + popstate.
          window.history.pushState({}, '', ${JSON.stringify(target)});
          window.dispatchEvent(new PopStateEvent('popstate'));
          return 'nav-dispatched to ' + location.pathname;
        } catch (e) { return 'nav-error: ' + e.message; }
      })()`,
      returnByValue: true,
    });
  }, 800);
  // Collect for 6s then dump.
  setTimeout(() => {
    console.log('=== NETWORK FAILURES (404/aborted) ===');
    failures.forEach((f) => console.log(' ', f));
    if (!failures.length) console.log('  (none)');
    console.log('=== CONSOLE ERRORS ===');
    consoleErrors.forEach((c) => console.log(' ', c));
    if (!consoleErrors.length) console.log('  (none)');
    ws.close();
    process.exit(0);
  }, 6800);
});

ws.on('message', (data) => {
  let msg;
  try { msg = JSON.parse(data.toString()); } catch { return; }
  const m = msg.method;
  if (m === 'Network.responseReceived') {
    const r = msg.params.response;
    if (r.status >= 400) failures.push(`${r.status} ${r.url}`);
  } else if (m === 'Network.loadingFailed') {
    failures.push(`FAILED ${msg.params.errorText} ${msg.params.requestId}`);
  } else if (m === 'Runtime.consoleAPICalled') {
    if (['error', 'warning'].includes(msg.params.type)) {
      const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
      consoleErrors.push(`[${msg.params.type}] ${text.slice(0, 200)}`);
    }
  } else if (m === 'Runtime.exceptionThrown') {
    consoleErrors.push(`[exception] ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description?.slice(0,160) ?? ''}`);
  } else if (m === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    consoleErrors.push(`[log] ${msg.params.entry.text.slice(0,200)}`);
  } else if (msg.id && msg.result?.result?.value) {
    console.log('eval:', msg.result.result.value);
  }
});

ws.on('error', (e) => { console.log('ws error:', e.message); process.exit(1); });
