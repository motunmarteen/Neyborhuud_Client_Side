/**
 * Live positive-path auth QA (requires valid test account in env).
 *
 * Usage:
 *   QA_TEST_EMAIL=user@example.com QA_TEST_PASSWORD='YourPass123!' node scripts/qa-auth-live.mjs
 *
 * Optional:
 *   QA_APP_URL=http://localhost:3000
 *   QA_API_URL=http://localhost:5000/api/v1
 */
import { spawnSync } from 'node:child_process';

const API = process.env.QA_API_URL || 'http://localhost:5000/api/v1';
const email = process.env.QA_TEST_EMAIL?.trim();
const password = process.env.QA_TEST_PASSWORD;

function request(method, path, body, token) {
  const url = `${API}${path}`;
  const args = ['-sS', '-m', '30', '-w', '\n%{http_code}', '-X', method, url];
  if (token) args.push('-H', `Authorization: Bearer ${token}`);
  if (body) args.push('-H', 'Content-Type: application/json', '-d', JSON.stringify(body));
  const res = spawnSync('curl', args, { encoding: 'utf8' });
  if (res.error) return { ok: false, error: res.error.message };
  const lines = (res.stdout || '').trim().split('\n');
  const code = Number(lines.pop());
  const text = lines.join('\n');
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* ignore */
  }
  return { ok: !Number.isNaN(code), code, text, json };
}

function extractToken(data) {
  if (!data || typeof data !== 'object') return null;
  const d = data.data ?? data;
  return (
    d.token ??
    d.access_token ??
    d.accessToken ??
    d.session?.access_token ??
    d.session?.accessToken ??
    null
  );
}

let failed = 0;
const pass = (label) => console.log(`PASS ${label}`);
const fail = (label, detail = '') => {
  console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  failed++;
};
const skip = (label, reason) => console.log(`SKIP ${label} — ${reason}`);

console.log('=== Live auth positive-path QA ===');
console.log(`API: ${API}\n`);

if (!email || !password) {
  skip('login success flow', 'set QA_TEST_EMAIL and QA_TEST_PASSWORD');
  skip('session /profile/me', 'requires login');
  skip('gate flags in session payload', 'requires login');
  console.log('\nProvide credentials to run the positive-path checks.');
  process.exit(0);
}

console.log(`Testing account: ${email.replace(/(.{2}).+(@.*)/, '$1***$2')}\n`);

const login = request('POST', '/auth/login', { identifier: email, password });
if (!login.ok || login.code !== 200 || !login.json?.success) {
  fail('POST /auth/login', `HTTP ${login.code} ${login.json?.message || login.text.slice(0, 120)}`);
} else {
  pass(`POST /auth/login -> ${login.code}`);
}

const token = extractToken(login.json);
if (!token) {
  fail('extract access token from login response');
} else {
  pass('access token present in login response');
}

if (token) {
  const profile = request('GET', '/profile/me', null, token);
  if (!profile.ok || profile.code !== 200 || !profile.json?.success) {
    fail('GET /profile/me with token', `HTTP ${profile.code}`);
  } else {
    pass(`GET /profile/me with token -> ${profile.code}`);
    const user = profile.json?.data?.user ?? profile.json?.data;
    const gates = profile.json?.data ?? {};
    if (user?.email || user?.username) {
      pass(`profile user loaded (${user.username || user.email})`);
    } else {
      fail('profile user payload missing username/email');
    }
    if (typeof gates.needsCommunitySelection === 'boolean') {
      pass(`needsCommunitySelection=${gates.needsCommunitySelection}`);
    } else {
      skip('needsCommunitySelection flag', 'not in profile payload');
    }
    if (typeof gates.needsGpsLocationVerification === 'boolean') {
      pass(`needsGpsLocationVerification=${gates.needsGpsLocationVerification}`);
    } else {
      skip('needsGpsLocationVerification flag', 'not in profile payload');
    }
  }

  const reuse = request('GET', '/profile/me', null, token);
  if (reuse.ok && reuse.code === 200) {
    pass('token reuse (session persistence simulation)');
  } else {
    fail('token reuse', `HTTP ${reuse.code}`);
  }

  const badToken = request('GET', '/profile/me', null, 'invalid.token.value');
  if (badToken.code === 401) {
    pass('invalid token rejected -> 401');
  } else {
    fail('invalid token rejection', `expected 401, got ${badToken.code}`);
  }
}

console.log('\n=== Device-only checks (manual) ===');
const manual = [
  'iPhone Safari + Android Chrome full signup → feed',
  'OTP entry with mobile keyboard',
  'Slow 3G network throttling',
  'Mid-flow refresh at each gate',
  'GPS permission + location verify step',
  'Admin logout → /login?next=/admin → return to /admin',
];
for (const item of manual) console.log(`  • ${item}`);

console.log('\n=== Summary ===');
if (failed === 0) {
  console.log('Live API positive-path checks passed.');
  process.exit(0);
}
console.log(`${failed} live check(s) failed.`);
process.exit(1);
