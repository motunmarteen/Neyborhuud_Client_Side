# Local Dev & URLs — Quick Reference

This monorepo holds **two separate Next.js apps** plus a separate backend repo.

| App | Folder | What it is | Production URL |
|-----|--------|------------|----------------|
| **App / PWA** | `pwa/` | The product: feed, chat, profile, marketplace | https://app.neyborhuud.com |
| **Landing** | `landing/` | Marketing site + sign-up funnel | https://neyborhuud.com |
| **API (separate repo)** | `NeyborHuud-ServerSide` | Express + MongoDB backend | https://api.neyborhuud.com |

---

## Running locally

Run these from the **monorepo root** (this folder):

```bash
# The App / PWA  -> http://localhost:3000
pnpm dev:pwa

# The Landing page -> also defaults to :3000, so give it another port if the app is running:
pnpm --filter neyborhuud-landing dev -- -p 3001    # -> http://localhost:3001
```

The **backend API must also be running** for the app to work. In the `NeyborHuud-ServerSide` repo:

```bash
npm run dev      # -> http://localhost:5000
```

The PWA's `pwa/.env.local` already points at `http://localhost:5000/api/v1`, so they connect automatically.

---

## Which URL do I use?

| I want to test… | URL |
|---|---|
| App locally | http://localhost:3000 |
| App profile page locally | http://localhost:3000/profile/<username> |
| Landing locally | http://localhost:3001 |
| App in production | https://app.neyborhuud.com |
| Landing in production | https://neyborhuud.com |

---

## ⚠️ The rules that prevent the "500" confusion

1. **Local = `localhost` WITH a port** → `http://localhost:3000`
2. **Production = the real domain, NO port** → `https://app.neyborhuud.com`
3. **NEVER combine them.** `app.neyborhuud.com:3000` is invalid — it mixes the production
   domain with a local port and will fail (`ERR_CONNECTION_TIMED_OUT` / a "500"-looking page).
   The domain and a port number should never appear together.

Notes:
- Subdomain routing (`app.` vs landing) is done in `pwa/src/middleware.ts` by hostname.
  On `localhost` there is no `app.` prefix, so locally just hit paths directly
  (`localhost:3000/feed`, `localhost:3000/profile/motun`) — no subdomain needed.
- `pnpm dev:pwa` auto-picks a free port in 3000–3010 if 3000 is busy; watch the
  terminal for the actual port it prints.
- Prod build/deploy is handled by Vercel on push to `main`. The PWA uses
  `output: "standalone"` with `outputFileTracingRoot` at the **monorepo root**
  (required for pnpm workspaces — pinning it to `pwa/` causes production-only 500s
  on dynamic pages).
