/**
 * Automated auth funnel smoke checks (local dev + API).
 * Real-device keyboard/GPS/network behavior still requires manual QA.
 */
import { spawnSync } from 'node:child_process';

const APP = process.env.QA_APP_URL || 'http://localhost:3000';
const API = process.env.QA_API_URL || 'http://localhost:5000/api/v1';

const routes = [
  '/',
  '/login',
  '/login?next=%2Fadmin',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/pick-community',
  '/verify-location',
  '/complete-profile',
  '/setup-complete',
  '/feed',
  '/admin',
  '/info/community-rules',
  '/info/terms-of-service',
  '/info/privacy-policy',
];

function curl(method, url, body) {
  const args = ['-sS', '-m', '25', '-w', '\n%{http_code}', '-X', method, url];
  if (body) {
    args.push('-H', 'Content-Type: application/json', '-d', JSON.stringify(body));
  }
  const res = spawnSync('curl', args, { encoding: 'utf8' });
  if (res.error) return { ok: false, error: res.error.message };
  const lines = (res.stdout || '').trim().split('\n');
  const code = Number(lines.pop());
  const text = lines.join('\n');
  return { ok: !Number.isNaN(code), code, text };
}

function get(url) {
  const res = spawnSync('curl', ['-sS', '-m', '25', '-o', '/dev/null', '-w', '%{http_code}', url], {
    encoding: 'utf8',
  });
  const code = Number((res.stdout || '').trim());
  return Number.isNaN(code) ? 0 : code;
}

let failed = 0;

console.log('=== Auth funnel route smoke ===');
console.log(`App: ${APP}`);

for (const route of routes) {
  const code = get(`${APP}${route}`);
  const pass = code >= 200 && code < 400;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${route} -> ${code}`);
  if (!pass) failed++;
}

const nf = get(`${APP}/this-route-does-not-exist-qa-${Date.now()}`);
const nfPass = nf === 404;
console.log(`${nfPass ? 'PASS' : 'FAIL'} unknown route -> ${nf} (expect 404)`);
if (!nfPass) failed++;

console.log('\n=== API auth endpoints ===');
console.log(`API: ${API}`);

const apiRoot = API.replace(/\/api\/v1\/?$/, '');
const healthUrl = `${API}/health`;
const healthCode = get(healthUrl);
console.log(`${healthCode === 200 ? 'PASS' : 'WARN'} GET ${healthUrl} -> ${healthCode}`);

const badLogin = curl('POST', `${API}/auth/login`, {
  identifier: 'qa-invalid@neyborhuud.test',
  password: 'WrongPassword123!',
});
const badLoginPass =
  badLogin.ok && badLogin.code === 401 && badLogin.text.includes('"success":false');
console.log(
  `${badLoginPass ? 'PASS' : 'FAIL'} POST /auth/login invalid creds -> ${badLogin.code}`,
);
if (!badLoginPass) failed++;

const noToken = curl('GET', `${API}/profile/me`);
const noTokenPass = noToken.ok && (noToken.code === 401 || noToken.text.includes('success":false'));
console.log(`${noTokenPass ? 'PASS' : 'FAIL'} GET /profile/me no token -> ${noToken.code}`);
if (!noTokenPass) failed++;

console.log('\n=== Summary ===');
if (failed === 0) {
  console.log('All automated checks passed.');
  process.exit(0);
}
console.log(`${failed} check(s) failed.`);
process.exit(1);
