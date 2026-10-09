# API Registry — Trust (TrustOS / Vouch System)

> Mount: `app.use("/api/v1/trust", trustRoutes)` — `app.ts:346`
> Source: `NeyborHuud-ServerSide/src/modules/trust/trust.routes.ts`
>
> **Total: 5 routes.** All `protect` (Bearer-only — see `_auth-middleware-split.md`).
>
> **This is the single richest business-logic file found in the entire registry so far** — unlike
> nearly every other module, the route handlers are defined inline in the routes file itself (not
> delegated to a separate controller file), containing real hyperlocal trust-economy logic worth
> documenting in detail since it's central to the platform's core "NeyburH Score" concept.

## Core mechanics (read directly from source, not inferred)

- **Vouching is hyperlocal**: enforced via Haversine distance — a voucher must be within
  **500 metres** (`VOUCH_RADIUS_METERS`) of the person they're vouching for, using
  `currentLocation` (preferred) or `primaryLocation` as a fallback for both users. If either user
  has no location set, vouching is blocked with a specific 403 message telling them to enable
  location.
- **Only Tree-tier+ users (300+ normalized trust score) can vouch.** Tier thresholds, mirrored from
  a frontend `trust-economy.ts` file per an explicit source comment: seedling 0–99, sapling
  100–299, tree 300–599, baobab 600+.
- **Score normalization quirk, verified in source** (`normalizeScore`, lines 47–50): raw DB trust
  scores ≤100 are multiplied by ×10 to reach the displayed 0–1000 scale; raw scores already >100 are
  clamped to 1000 instead. The comment explicitly says this mirrors frontend logic — **worth
  verifying the actual frontend `trust-economy.ts` implements the exact same branching**, since any
  drift between the two would show users a different tier than what the backend enforces for
  `canVouch`.
- **Self-vouching blocked**, **duplicate vouching blocked** (409 if already vouched).
- Vouching writes trust events on **both sides** (`vouch_received` for the target, `vouch_given` for
  the voucher) via `TrustOSService.logEvent`, and asynchronously triggers
  `evaluateUserVerification(userId)` — **a real, non-stub connection between vouching and
  verification tier**, worth cross-referencing against `identity.md`'s fake-KYC finding: this
  suggests community vouching may be a legitimate, working alternative path toward "verified"
  status even while the formal KYC flow is stubbed.
- Revoking a vouch symmetrically logs `vouch_revoked`/`vouch_lost` events on both sides.

## Routes

| Method | Path | Handler | Notes |
|---|---|---|---|
| GET | `/vouch-status/:userId` | inline handler | Returns `hasVouched`, `canVouch`, `vouchCount`, `vouchesNeeded` (3 minus current count), `distanceMeters`, `withinRange`, `locationRequired` |
| GET | `/vouch-metrics/:userId` | inline handler | Lightweight received/given counts, for profile surfaces per comment |
| POST | `/vouch/:userId` | inline handler | Full validation chain described above |
| DELETE | `/vouch/:userId` | inline handler | Revoke |
| GET | `/vouches/:userId` | inline handler | List of voucher profiles (username, avatar) who vouched for this user |

## Known issues found while building this registry

- **`evaluateUserVerification` link to KYC/identity is the most important cross-module connection
  found so far** — directly relevant to how the rebuild should present "Verified" status: it may
  legitimately come from either the stubbed KYC flow (`identity.md`) or organic community vouching
  (this file), not just one or the other. Worth reading `verificationTier.service.ts` in a later,
  deeper pass if the design work needs to explain "how do I get verified" accurately to users.
- **Checked the frontend mirror directly** (`pwa/src/lib/trust-economy.ts:124-137`,
  `normalizeTrustScore`): the core ×10/clamp formula is byte-for-byte identical to the backend's
  `normalizeScore` — not drifted, source comment's claim holds up.
  **However**, `buildTrustEconomyModel` (same file, lines 152-166) layers a second, more elaborate
  **synthetic score** on top (weighted sum of identity/consistency/contribution/reliability/
  community sub-scores) and takes `Math.max(normalized.score1000, syntheticScore)` as the score
  actually **displayed** to the user — meaning the tier/score shown in the UI can be *higher* than
  what the backend's `canVouch` check (which uses the raw `normalizeScore` only, no synthetic boost)
  actually enforces. **Concrete failure scenario**: a user could see "Tree tier, 320" in their UI
  (boosted by streaks/badges/achievements) while the backend still evaluates their raw trust score
  as under 300 and rejects their vouch attempt with a confusing 403. Worth a product decision on
  whether the backend's `canVouch` should also account for the synthetic boost, or whether the
  frontend display should stop synthetically inflating the score — not fixed here per the audit-only
  discipline, but this is a concrete, traceable UX bug candidate for the rebuild to resolve either
  by having the frontend call `/trust/vouch-status/:userId`'s `canVouch` field as the single source
  of truth (recommended) rather than recomputing eligibility client-side from the synthetic score.
