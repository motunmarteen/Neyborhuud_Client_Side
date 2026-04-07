# Password policy (frontend ↔ backend)

The file `src/lib/passwordPolicy.ts` is a **verbatim copy** of `src/utils/passwordPolicy.ts` from **[NeyborHuud-ServerSide](https://github.com/NeyborHuud/NeyborHuud-ServerSide)** (API Joi validation uses the same rules).

When the backend changes password requirements, update this file the same way so signup, reset-password, and **Settings → Change password** stay aligned.

UI using this module:

- `src/components/PasswordStrengthMeter.tsx`
- `src/app/signup/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/settings/password/page.tsx`

Canonical **web app repository**: **[neyborhuud-PWA](https://github.com/NeyborHuud/neyborhuud-PWA)**. The API repo no longer ships an embedded Next.js `client/` folder.

## Auth surface parity (high level)

These PWA flows match **`src/modules/auth/auth.routes.ts`** on the server:

| Backend route | PWA |
|---------------|-----|
| `GET /auth/check-email` | `useEmailValidation` → `fetchAPI` |
| `GET /auth/check-username` | `useUsernameValidation` → `fetchAPI` |
| `POST /auth/create-account` | `/signup` |
| `POST /auth/login` | `/login` |
| `POST /auth/forgot-password` | `/forgot-password` |
| `POST /auth/reset-password` | `/reset-password?token=` |
| `POST /auth/change-password` | `/settings/password` |
| `POST /auth/confirm-community` | `/pick-community` |
| `GET /auth/export-data` | Settings → **Download my data** |
| `DELETE /auth/delete-account` | Settings → **Delete account** |

Set `RESET_PASSWORD_REDIRECT_URL` on the API to your PWA origin, e.g. `https://your-pwa.vercel.app/reset-password`.
