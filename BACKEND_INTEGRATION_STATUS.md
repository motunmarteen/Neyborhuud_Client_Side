# Backend Integration Status — Auth & Email Sync

**Last Updated:** January 2026  
**Backend Reference:** `neyborhuud-ServerSide` → `docs/FRONTEND_AUTH_SYNC_SUMMARY.md`

---

## Status: ✅ Backend Ready for Integration

The backend team has implemented all auth/email endpoints per the sync spec. Frontend and backend are aligned.

---

## Backend Endpoints (Confirmed)

| Endpoint | Method | Frontend Usage | Status |
|----------|--------|----------------|--------|
| `/api/v1/auth/check-email?email=...` | GET | `useEmailValidation` (debounced) | ✅ Matches |
| `/api/v1/auth/check-username?username=...` | GET | `useUsernameValidation` (debounced) | ✅ Matches |
| `/api/v1/auth/create-account` | POST | Signup page | ✅ Matches |
| `/api/v1/auth/resend-verification` | POST | Signup verify screen, Settings | ✅ Matches |
| `/api/v1/auth/verify-email` | POST | `/verify-email` page | ✅ Matches |
| `/api/v1/auth/forgot-password` | POST | `/forgot-password` page | ✅ Matches |
| `/api/v1/auth/reset-password` | POST | `/reset-password` page | ✅ Matches |
| `/api/v1/auth/settings/notifications` | PUT | Settings → Notifications tab | ✅ Matches |
| `/api/v1/auth/settings/privacy` | PUT | Settings → Privacy tab | ✅ Matches |

---

## Request/Response Alignment

### Check Email & Username

- **Backend:** `{ data: { available: true | false } }`
- **Frontend:** Uses `response.data?.available ?? response.available`; assumes `available: true` if check fails (graceful degradation).

### Create Account

- **Backend:** Returns `user`, `token`, `community`, `user.verificationStatus`, message *"Account created successfully. Please verify your email."*
- **Frontend:** Stores `token`, `user`; uses `community` for logging; shows "Check Your Email" screen.

### Resend Verification

- **Backend:** Body `{}` (when logged in) or `{ email }`. Response *"Verification email sent successfully"*.
- **Frontend:**
  - **Signup "Check Your Email" screen:** Sends `{ email: formData.email }` (user may have token but we explicitly send email).
  - **Settings:** Sends `POST` with no body; `Authorization: Bearer` from `localStorage`.

### Verify Email

- **Backend:** `POST` with `{ token }`. Returns `data.user` with `verificationStatus: "verified"`; optional +10 HuudCoins.
- **Frontend:** Sends `{ token }` from `?token=...`; shows success and bonus coins UI.

### Forgot Password

- **Backend:** `POST` with `{ email }`. Generic success message (no email enumeration).
- **Frontend:** Sends `{ email }`; always shows "Check your inbox"–style success.

### Reset Password

- **Backend:** `POST` with `{ token, newPassword }`. Success + expired/invalid error messages per spec.
- **Frontend:** Sends `token` (from `?token=...`) and `newPassword`; handles success and expired/invalid states.

### Settings (Notifications & Privacy)

- **Backend:** `PUT` with `Authorization: Bearer`. Body: `email`, `push`, `sms`, `chat`, `mentions`, `likes`, `comments` (notifications); `profileVisibility`, `showLocation`, `showPhone`, `showEmail` (privacy).
- **Frontend:** Sends same shapes via `fetchAPI` (adds Bearer from `localStorage`).

---

## CORS

- **Backend:** Production and preview origins allowed (incl. `https://neyborhuud-pwa-kohl.vercel.app` and `*.vercel.app`).
- **Frontend:** No CORS-related changes required.

---

## Deploy Note (from Backend)

> These changes are in the repo and built/linted. **Production will serve them after redeploy from `main`.** Until then:
> - New routes may **404**
> - `forgot-password` on prod may still expect `identifier` instead of `email`
>
> Frontend **graceful degradation** (e.g. assume available if `check-email` / `check-username` fail) remains correct.

**Action:** Once backend has redeployed, run through the flows below to confirm.

---

## Quick QA Checklist

After backend production deploy:

- [ ] **Signup:** Email/username show "checking" → "available" or "taken"; create account → "Check Your Email" screen.
- [ ] **Resend verification:** Cooldown 60s; success message; email received.
- [ ] **Verify email:** Open link → `/verify-email?token=...` → success + bonus coins.
- [ ] **Forgot password:** Submit email → "Check your inbox"; link → reset password form → success → login.
- [ ] **Settings:** Notifications & privacy toggles save; resend verification works when logged in.
- [ ] **Errors:** Invalid/expired tokens, duplicate email, etc. show clear messages.

---

## References

- **Frontend implementation details:** `FRONTEND_EMAIL_IMPLEMENTATION.md`
- **Backend spec (request/response, curl):** `neyborhuud-ServerSide` → `docs/FRONTEND_AUTH_SYNC_SUMMARY.md`
- **Original backend sync prompt:** `BACKEND_SYNC_PROMPT.md`

---

## Mismatches or Issues

If you find any mismatch with the backend (status codes, body shapes, error format, or behavior), document it here and notify the backend team.

| Date | Issue | Resolution |
|------|-------|------------|
| — | — | — |
