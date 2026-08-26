# API Registry — Auth

> Mount: `app.use("/api/v1/auth", authRoutes)` — `app.ts:314`
> Source: `NeyborHuud-ServerSide/src/modules/auth/auth.routes.ts` (28 routes) +
> `consent.routes.ts` (5 routes, mounted with no prefix via `router.use(consentRouter)` at
> `auth.routes.ts:178` — so these live at `/api/v1/auth/consents*` etc., not a separate top-level path).
>
> **Total: 33 routes.**
>
> `protectAny` = accepts either a legacy Bearer JWT or a Better Auth session (see Step 1 audit —
> both auth systems coexist; `protectAny` is the bridge). `optionalProtect` = attaches user if
> present, does not reject if absent. `authLimiter` = rate-limited (brute-force protection).

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/check-email` | rate-limited, no auth | `checkEmail` | Real-time signup availability check |
| GET | `/check-username` | rate-limited, no auth | `checkUsername` | Real-time signup availability check |
| GET | `/onboarding-status` | `protectAny` | `getOnboardingStatus` | |
| POST | `/create-account` | rate-limited, validated | `createAccount` | |
| POST | `/login` | rate-limited, validated | `login` | |
| POST | `/logout` | `protectAny` | `logout` | |
| PUT | `/location/update` | `protectAny` | `updateLocation` | |
| POST | `/location/sync` | `protectAny`, validated | `syncSmartLocation` | |
| POST | `/location/confirm-home` | `protectAny` | `confirmHomeRefinement` | |
| POST | `/location/dismiss-home-hint` | `protectAny` | `dismissHomeRefinement` | |
| GET | `/locations/kinds` | no auth | `getFrequentPlaceKinds` | Enum list (home/work/etc.) |
| GET | `/locations/places` | `protectAny` | `getMyPlaces` | |
| POST | `/locations/frequent` | `protectAny`, validated | `createFrequentPlace` | |
| DELETE | `/locations/frequent/:placeId` | `protectAny` | `deleteFrequentPlace` | |
| POST | `/confirm-community` | `protectAny`, validated | `confirmCommunity` | |
| POST | `/complete-profile` | `protectAny`, validated | `completeProfile` | |
| POST | `/forgot-password` | rate-limited, validated | `forgotPassword` | |
| POST | `/reset-password` | rate-limited, validated | `resetPassword` | |
| POST | `/change-password` | `protectAny`, validated | `changePassword` | |
| POST | `/change-identifier` | `protectAny` | `changeIdentifier` | Change email/phone |
| POST | `/resend-verification` | rate-limited, `optionalProtect`, validated | `resendVerificationEmail` | |
| POST | `/verify-email` | rate-limited, validated | `verifyEmail` | Handles both new-OTP and legacy-token flows per Step 1 audit — not independently re-verified this pass |
| GET | `/export-data` | `protectAny` | `exportUserData` | NDPR data export |
| DELETE | `/delete-account` | `protectAny` | `deleteAccount` | |
| POST | `/device/register` | `protectAny`, validated | `registerDeviceToken` | Push notification token registration |
| GET | `/device/list` | `protectAny` | `getUserDevices` | |
| POST | `/device/remove` | `protectAny`, validated | `removeDeviceToken` | |
| POST | `/social/link` | `protectAny` | `linkSocialAccount` | |
| POST | `/social/:provider` | rate-limited | `socialLogin` | Dispatches to Better Auth for the given provider (e.g. `google`) |
| PUT | `/settings/notifications` | `protectAny`, validated | `updateNotificationSettings` | |
| PUT | `/settings/privacy` | `protectAny`, validated | `updatePrivacySettings` | |
| GET | `/consents` | `protectAny` | `getUserConsents` | From `consent.routes.ts` |
| POST | `/consents` | `protectAny` | `updateConsent` | From `consent.routes.ts` |
| GET | `/consents/history` | `protectAny` | `getConsentHistory` | From `consent.routes.ts` |
| GET | `/consents/history/:consentType` | `protectAny` | `getConsentHistory` | From `consent.routes.ts` |
| GET | `/data-access-history` | `protectAny` | `getMyDataAccessHistory` | From `consent.routes.ts` — "who accessed my data" |

## Known issues found while building this registry

- **`admin/compliance.routes.ts` is dead code** — a separate, admin-only `POST /users/:userId/export`
  and audit-log viewer exists on disk but is never imported by `app.ts` or any other file. Not
  reachable at any URL. If this was meant to be a real admin feature, it needs to be wired in; if
  intentionally abandoned in favor of the user-facing `/export-data` above, it should be deleted
  rather than left as dead, confusing code for the rebuild to trip over.
- `auth.routes.ts` has messy mid-file imports (lines 134-139, device-controller imports appear
  after route definitions have already started, with a stray `// ... (existing imports)` comment) —
  cosmetic, not a functional issue, but a sign this file has been edited piecemeal over time.
