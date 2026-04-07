# Password policy (frontend ↔ backend)

The file `src/lib/passwordPolicy.ts` is a **verbatim copy** of `src/utils/passwordPolicy.ts` from **[NeyborHuud-ServerSide](https://github.com/NeyborHuud/NeyborHuud-ServerSide)** (API Joi validation uses the same rules).

When the backend changes password requirements, update this file the same way so signup, reset-password, and **Settings → Change password** stay aligned.

UI using this module:

- `src/components/PasswordStrengthMeter.tsx`
- `src/app/signup/page.tsx`
- `src/app/reset-password/page.tsx`
- `src/app/settings/password/page.tsx`

Canonical **web app repository**: **[neyborhuud-PWA](https://github.com/NeyborHuud/neyborhuud-PWA)**. The API repo no longer ships an embedded Next.js `client/` folder.
