# Backend Integration Status — Auth & Email Sync

**Last Updated:** January 28, 2026  
**Backend Reference:** `neyborhuud-ServerSide` → `docs/FRONTEND_AUTH_SYNC_SUMMARY.md`

---

## Status: ⚠️ Action Required - Code-Based Verification

### Critical Issue Identified

**Problem:** Verification emails are not being received by users. Accounts are created but users cannot verify their email because:
- No email arrives in inbox
- No email in spam folder
- User stuck with `emailVerified: false`
- Email shows "already registered" on signup (correct, but unverifiable)

### Solution Implemented (Frontend)

Frontend has been updated to use **6-digit code verification (OTP style)** instead of link-based verification:
- After signup → Show "Enter 6-digit code" screen
- User enters code → `POST /auth/verify-email` with `{ email, code }`
- Resend code → `POST /auth/resend-verification` with `{ email }`

**See:** `BACKEND_CODE_VERIFICATION_PROMPT.md` for detailed backend implementation requirements.

---

## Backend Endpoints

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

### Verify Email (UPDATED - Code-Based)

- **Backend MUST support BOTH:**
  1. `{ email, code }` - NEW code-based verification (6-digit OTP)
  2. `{ token }` - Legacy link-based verification (backward compatible)
  
- **Frontend sends:**
  - From signup flow: `{ email, code }` (user enters 6-digit code)
  - From email link: `{ token }` (if user clicks link in email)
  
- **Backend returns:** `data.user` with `verificationStatus: "verified"`; optional +10 HuudCoins.

**See:** `BACKEND_CODE_VERIFICATION_PROMPT.md` for full implementation details.

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

After backend implements code-based verification:

- [ ] **Signup:** Email/username show "checking" → "available" or "taken"
- [ ] **Signup → Verify:** Create account → "Enter 6-digit code" screen appears
- [ ] **Email received:** User receives email with 6-digit code (not a link)
- [ ] **Code verification:** Enter correct code → success + bonus coins
- [ ] **Invalid code:** Enter wrong code → "Invalid code" error
- [ ] **Resend code:** Cooldown 60s; new code email received
- [ ] **Forgot password:** Submit email → email with code/link received
- [ ] **Settings:** Notifications & privacy toggles save
- [ ] **Errors:** Expired codes, too many attempts, etc. show clear messages

---

## References

- **Frontend implementation details:** `FRONTEND_EMAIL_IMPLEMENTATION.md`
- **Backend spec (request/response, curl):** `neyborhuud-ServerSide` → `docs/FRONTEND_AUTH_SYNC_SUMMARY.md`
- **Original backend sync prompt:** `BACKEND_SYNC_PROMPT.md`
- **Code-based verification spec:** `BACKEND_CODE_VERIFICATION_PROMPT.md` ⬅️ **NEW**

---

## Mismatches or Issues

| Date | Issue | Resolution |
|------|-------|------------|
| 2026-01-28 | Verification emails not being received by users | Frontend updated to code-based (OTP) verification; backend needs to implement sending 6-digit codes. See `BACKEND_CODE_VERIFICATION_PROMPT.md` |
| 2026-01-28 | Users stuck with `emailVerified: false` but "already registered" | Related to above - once code verification works, users can verify existing unverified accounts |
