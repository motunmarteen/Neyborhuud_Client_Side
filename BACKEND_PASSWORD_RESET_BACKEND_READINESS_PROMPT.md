# Backend readiness check: password reset & email (for PWA)

**Use this document** by sending it to your backend / DevOps owners. Ask them to **answer each section** (yes/no + notes) and, where noted, **paste redacted evidence** (log lines, response snippets). Goal: confirm the API and mail stack will work with the NeyborHuud PWA before you rely on the flow in production.

---

## 1. Deployment & routing

1. **Which commit / tag / branch** is deployed to **production** (e.g. Render) for the auth API?  
2. Does that deploy include the handoff changes: **Better Auth** `request-password-reset` wired from **`POST /api/v1/auth/forgot-password`**, **`sendResetPassword`**, and **`resetPasswordTokenExpiresIn: 900` (15 minutes)**?  
3. Confirm **`POST /api/v1/auth/forgot-password`** and **`POST /api/v1/auth/reset-password`** are **not** returning **404** on production (quick `curl` or Postman).

**Please reply:**  
- [ ] Yes — version: _______________  
- [ ] No / unsure — explain: _______________

---

## 2. Environment variables (required for email + redirect)

Please confirm **each** is set on the **same** runtime the PWA calls (e.g. Render service for `neyborhuud-serverside`), with **no typos** and **no quotes** that break URLs:

| Variable | Purpose | Set? (Y/N) | Notes (redact secrets) |
|----------|---------|------------|-------------------------|
| `MAIL_HOST` | SMTP host | | |
| `MAIL_PORT` | SMTP port | | |
| `MAIL_USER` | SMTP user | | |
| `MAIL_PASS` | SMTP password | | |
| `EMAIL_FROM` | From address (verified sender) | | |
| `BETTER_AUTH_URL` | **Public** base URL of **this API** (e.g. `https://neyborhuud-serverside.onrender.com`) | | |
| `RESET_PASSWORD_REDIRECT_URL` | **Full** PWA URL to reset page (e.g. `https://<your-pwa>/reset-password`) — **must not** be `.../api/v1/reset-password` | | |

**Questions:**  
4. Has **at least one** test email been sent from **this** environment (forgot-password or verification) and **received** in inbox (not only “no error in code”)?  
5. Is **`RESET_PASSWORD_REDIRECT_URL`** exactly the URL users use in the browser for the PWA (scheme + host + path `/reset-password`, no trailing slash issues)?

**Please reply:**  
- [ ] All required vars confirmed on production  
- [ ] Blockers: _______________

---

## 3. Better Auth: trusted origins & callback

6. Does **Better Auth `trustedOrigins`** (or equivalent) include **every** PWA origin we use (local `http://localhost:3000`, production `https://<pwa-host>`, preview URLs if any)?  
7. The **reset link in email** should hit the **API** first, then redirect to the PWA with **`?token=`**. Can you confirm the **email template / link format** matches:  
   `{BETTER_AUTH_URL}/api/auth/reset-password/{token}?callbackURL=<encoded RESET_PASSWORD_REDIRECT_URL>`  
   (or your exact equivalent)?

**Please reply:**  
- [ ] trustedOrigins includes: _______________  
- [ ] Link format confirmed — short example (redact token): _______________

---

## 4. API contract (must match PWA)

The PWA sends:

**Forgot password** — `POST /api/v1/auth/forgot-password`  
```json
{ "email": "user@example.com", "identifier": "user@example.com" }
```  
( same normalized string in both fields )

**Reset password** — `POST /api/v1/auth/reset-password`  
```json
{ "token": "<from query string>", "newPassword": "..." }
```

8. Confirm the handler accepts **both** `email` and `identifier` (at least one required server-side; prefer `email` if present).  
9. Confirm **success** for forgot-password returns **HTTP 2xx** with a **generic** message (anti-enumeration), e.g.  
   `{ "success": true, "message": "If an account exists...", "data": null }`  
10. Confirm **429** returns `{ "success": false, "message": "<readable rate limit text>" }` when limits hit (**3/h per email**, **30/h per IP** as per your spec).  
11. Confirm **reset-password** on invalid/expired token returns **400** with  
    `"message": "This password reset link has expired or is invalid."`  
    (so substring **“expired”** / **“invalid”** works for the PWA).  
12. Confirm **password rules** on reset match: min 8, max 128, upper, lower, digit, special from `[!@#$%^&*]` — **400** + readable message on failure.

**Please reply:**  
- [ ] All of 8–12 confirmed  
- [ ] Deviations: _______________

---

## 5. Observability (to debug “no email”)

13. On **forgot-password**, do logs include structured events such as **`forgot_password_request`** (with `userFound`, **no tokens**)?  
14. On send success/failure, do logs include **`password_reset_email_sent`** (e.g. provider `messageId`) or **`password_reset_email_failed`** (provider error, tokens redacted)?

**Please reply:**  
- [ ] Yes — we can grep these in production logs  
- [ ] No — what we log instead: _______________

---

## 6. End-to-end test (please run and report)

Ask them to run on **staging or production** (with a **real** test user):

| Step | Expected |
|------|----------|
| A | `POST /api/v1/auth/forgot-password` with a user that **exists** → **2xx** |
| B | Logs show **`password_reset_email_sent`** (or explicit failure with reason) |
| C | Email arrives; link opens; user lands on **PWA** `/reset-password?token=...` |
| D | `POST /api/v1/auth/reset-password` with that token + valid password → **2xx** |
| E | Login with **same identifier/email** + **new** password succeeds |

**Please reply:**  
- [ ] A–E passed on _______________ (environment)  
- [ ] Failed at step _______________ — error / log snippet (redacted): _______________

---

## 7. CORS & PWA origin

15. Does the API allow **browser** requests from the **PWA origin** (`Origin` header) for **`POST /api/v1/auth/forgot-password`** and **`POST /api/v1/auth/reset-password`** (CORS preflight if applicable)?

**Please reply:**  
- [ ] Yes — allowed origins include: _______________  
- [ ] Unsure / issue: _______________

---

## 8. What we need back (summary)

Please send a **short written sign-off** with:

1. **Production API base URL** the PWA should use (must match `NEXT_PUBLIC_API_URL`).  
2. **Confirmation** that SMTP + Better Auth redirect env vars are set on **that** host.  
3. **Result** of the A–E test (pass/fail + which step if fail).  
4. **Any** intentional differences from sections 2–4 above.

---

*Prepared for NeyborHuud PWA ↔ backend alignment. Attach `BACKEND_PASSWORD_RESET_EMAIL_SYNC_PROMPT.md` from the PWA repo if they need the full technical summary.*
