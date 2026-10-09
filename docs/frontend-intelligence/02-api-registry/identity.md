# API Registry — Identity / KYC

> Mount: `app.use("/api/v1/identity", identityRoutes)` — `app.ts:317`
> Source: `NeyborHuud-ServerSide/src/modules/identity/identity.routes.ts`
>
> **Total: 7 routes.** All `protect` (Bearer-only — see `_auth-middleware-split.md`) except the
> recovery-request route, which is deliberately public.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/kyc` | `protect` | `submitKYC` | **⚠️ See finding below — this is a fake stub, not real verification** |
| GET | `/status` | `protect` | `getVerificationStatus` | |
| PATCH | `/profile` | `protect` | `updateProfile` | |
| POST | `/data-access` | `protect` | `requestDataAccess` | |
| POST | `/onboarding/survey` | `protect` | `submitWelcomeSurvey` | Labeled "Growth & Onboarding (Phase 10)" in source |
| GET | `/wrapped` | `protect` | `getNeighborWrapped` | "Neighbor Wrapped" — presumably a Spotify-Wrapped-style yearly summary; not traced further this pass |
| POST | `/recovery/request` | **public, no auth** | `requestCommunityRecovery` | Account-recovery request — explicitly public by comment |
| POST | `/recovery/approve` | `protect` | `approveRecovery` | Community-vote quorum recovery — see finding below, "Admins/Elders" in the source comment is not a platform-role gate |

## Known issues found while building this registry

- **`submitKYC` is confirmed fake, directly from source** (`identity.controller.ts:57-66`):
  the comment literally reads `"Verification Logic (Stubbed for now) / In real world: Call
  SmileID / YouVerify / Dojah / Prembly"` — naming the real Nigerian identity-verification
  providers this was meant to integrate with but never did. Verification "succeeds" via a
  **hardcoded test value**: `if (nin && nin.startsWith("111"))` auto-verifies. Any "Verified" or
  trust-tier badge shown anywhere in the frontend that depends on this is currently backed by
  fake data. This matches (and now independently confirms) the Step 1 audit's flag on this exact
  point. **This is the single highest-priority backend gap found in the API registry so far** —
  not a frontend design problem, but the rebuild's design work should not build UI that implies
  real KYC is happening (e.g. a "Verified ID" trust badge) without either (a) real provider
  integration landing first, or (b) the UI copy being honest about what "verified" currently means.
- Real `nin`/`bvn` (Nigerian National Identity Number / Bank Verification Number) values are
  accepted and stored in the database via this stub with no actual verification call ever made
  against them — worth flagging to whoever owns data-handling/compliance for this project, separate
  from the frontend rebuild itself.
- **Correction made during this pass**: initially flagged `/recovery/approve` as having an
  access-control mismatch (comment says "Admins/Elders," route only checks `protect`). Reading the
  controller (`approveRecovery`, `identity.controller.ts:340-394`) clarified this is actually a
  **social-recovery quorum system** — any authenticated user can cast an approve/reject vote on a
  specific recovery request (one vote per approver, enforced via a `RecoveryApproval` uniqueness
  check), and the request auto-approves once **2 votes** are reached. "Admins/Elders" in the
  comment likely describes the intended real-world approvers (people the requesting user
  designates as trusted), not a platform RBAC role — so the lack of a `requireAdmin` gate is
  probably correct by design, not a bug. **Not fully resolved**: it's still unclear from the route
  file alone whether anything restricts *who* can call this endpoint for a given `requestId` (i.e.
  can any random authenticated user vote on anyone's recovery request, or is there an invite/
  eligibility check inside the controller not yet traced). Worth a closer look in a later step,
  not urgent.
- **Second stub found in the same handler**: even when 2 approvals are reached, the controller's
  comment reads `"Generate Temp Reset Token (Stub) / In real implementation, this would trigger an
  email with a special link"` — meaning a fully-approved recovery request currently does not
  actually let the user back into their account. This is a second, separate incomplete feature in
  the identity module (in addition to fake KYC above), worth surfacing to product/backend
  ownership regardless of the frontend rebuild.
- Real `nin`/`bvn` (Nigerian National Identity Number / Bank Verification Number) values are
  accepted and stored in the database via the KYC stub with no actual verification call ever made
  against them — worth flagging to whoever owns data-handling/compliance for this project, separate
  from the frontend rebuild itself.
