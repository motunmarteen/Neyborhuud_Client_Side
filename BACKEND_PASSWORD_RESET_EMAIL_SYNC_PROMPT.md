# Password reset & email — PWA ↔ backend alignment

**Audiences:** Frontend (Next.js PWA), Backend, DevOps  
**Purpose:** Single reference for the password-reset flow after the backend handoff and frontend updates.

---

## Status (backend handoff applied)

The backend reports the following as **implemented**:

- **Better Auth** `POST /api/auth/request-password-reset` is invoked correctly from `/api/v1/auth/forgot-password` (previously unreliable).
- **Transactional email** for reset uses the same Nodemailer stack as verification: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `EMAIL_FROM`.
- **Token lifetime:** 15 minutes (`resetPasswordTokenExpiresIn: 900`), aligned with PWA copy.
- **Anti-enumeration:** `POST /auth/forgot-password` still returns **HTTP 2xx** with a generic success message whether or not the account exists.
- **Request body:** Accepts **`email` and/or `identifier`** (Joi: at least one). Handler prefers `email`, else `identifier`, normalized lowercase. PWA sends **both** with the same value — supported.
- **Rate limits (forgot-password only):** `authLimiter` with `skipSuccessfulRequests: true` was removed (it never limited this route). New rules:
  - **3 / hour** per normalized email/identifier (after validation).
  - **30 / hour** per IP.
  - **429** → `{ "success": false, "message": "<clear message>" }` — **PWA surfaces this** (toast + error step).
- **Reset-password errors:** **400** with  
  `{ "success": false, "message": "This password reset link has expired or is invalid." }`  
  Message includes **“expired”** and **“invalid”** for substring-based UI (`/reset-password`).
- **Password rules:** Backend Joi matches PWA: min 8, max 128, upper, lower, digit, special from `[!@#$%^&*]`; **400** + readable message on failure.
- **Logs:** Structured events e.g. `forgot_password_request` (requestId, userFound, emailDomain — no tokens); `password_reset_email_sent` (messageId) or `password_reset_email_failed` (provider error, redacted).

---

## How the reset **email link** works (QA / frontend)

The email does **not** open the PWA in one hop with the raw token in every setup.

1. User receives a link to the **API** (Better Auth), roughly:  
   `{BETTER_AUTH_URL}/api/auth/reset-password/{token}?callbackURL=<encoded PWA reset URL>`
2. Browser hits the **backend** first; Better Auth validates the token and **redirects** to the PWA.
3. User lands on **`/reset-password?token=...`** as today.

**Backend / DevOps must set:**

| Variable | Purpose |
|----------|---------|
| `BETTER_AUTH_URL` | Public API origin (e.g. `http://localhost:5000`, prod `https://neyborhuud-serverside.onrender.com`) |
| `RESET_PASSWORD_REDIRECT_URL` | Full PWA reset page URL (e.g. `http://localhost:3000/reset-password` or prod `https://<pwa-host>/reset-password`). **Not** `.../api/v1/reset-password`. |
| Mail | `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `EMAIL_FROM` |
| **trustedOrigins** (Better Auth) | Must include the **PWA origin** used in `callbackURL` / redirect, or the redirect step can fail. |

---

## What the PWA does (frontend)

| Item | Behavior |
|------|----------|
| Forgot / resend | `POST /api/v1/auth/forgot-password` with `{ email, identifier }` (same normalized string). |
| Success (2xx) | Navigate to “Check your inbox” (anti-enumeration: no hint if user exists). |
| **429** | Show API **`message`** (toast + error screen with “Try again”). **Does not** show fake “email sent”. |
| Other **4xx** | Show API **`message`** (validation, etc.). |
| **5xx / network** | Generic “Unable to process request…”. |
| Reset | `POST /api/v1/auth/reset-password` with `{ token, newPassword }`; `token` from `?token=` after redirect. |
| Reset **400** | `fetchAPI` / `extractErrorMessage` reads flat or nested `message`; UI treats “expired” / “invalid” as expired-link state. |

**Production:** `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_API_BASE_URL` must point at the **same** deployed API that has SMTP and the env vars above (e.g. Render).

**Files:** `src/app/forgot-password/page.tsx`, `src/app/reset-password/page.tsx`, `src/services/auth.service.ts` (`requestPasswordReset`).

---

## API base path

- PWA base: `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_API_BASE_URL`, or default `https://neyborhuud-serverside.onrender.com/api/v1`.
- Paths below are under **`/api/v1`**.

---

## API contract (summary)

### `POST /auth/forgot-password` (public)

**Body (current PWA):**

```json
{
  "email": "user@example.com",
  "identifier": "user@example.com"
}
```

**Success (anti-enumeration):**

```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent.",
  "data": null
}
```

**429:** `{ "success": false, "message": "..." }` — rate limit; PWA displays `message`.

### `POST /auth/reset-password` (public)

**Body:**

```json
{
  "token": "<from query string after redirect>",
  "newPassword": "<plaintext over HTTPS>"
}
```

**Success:** `2xx` with usual `{ success: true, message, data }` pattern.

**400:** Invalid/expired token → message above; password validation → Joi message.

---

## Quick verification (curl)

```bash
curl -sS -X POST "http://localhost:5000/api/v1/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","identifier":"user@example.com"}'
```

Then check inbox/spam and server logs for `password_reset_email_sent` vs `password_reset_email_failed`.

```bash
curl -sS -X POST "http://localhost:5000/api/v1/auth/reset-password" \
  -H "Content-Type: application/json" \
  -d '{"token":"PASTE_TOKEN","newPassword":"Str0ng!Pass"}'
```

---

## Acceptance criteria (sign-off)

1. Existing user: forgot-password → email received; link → API hop → PWA `/reset-password?token=...` → new password → login works.  
2. Non-existing email: **2xx** + generic message; no email.  
3. Rate limit: **429** + message shown in PWA; no fake success.  
4. Invalid/expired token: **400** + message containing “expired” / “invalid”; PWA shows request-new-link state.  
5. Backend env: `BETTER_AUTH_URL`, `RESET_PASSWORD_REDIRECT_URL`, mail vars, **trustedOrigins** include PWA.

---

## Mail infrastructure checklist (DevOps)

- [ ] SMTP / provider credentials on the **same** host the PWA calls  
- [ ] Verified sender / DKIM / SPF where applicable  
- [ ] `RESET_PASSWORD_REDIRECT_URL` matches real PWA URL per environment  
- [ ] Better Auth **trustedOrigins** includes PWA origin  

---

*Last updated to reflect backend handoff + PWA handling for HTTP 429 and non-2xx forgot-password responses.*
