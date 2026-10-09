# API Registry — Payments (HuudCoin)

> Mount: `app.use("/api/v1/payments", paymentRoutes)` — `app.ts:338`
> Source: `NeyborHuud-ServerSide/src/modules/payments/payment.routes.ts`
>
> **Total: 9 routes.** All `protect` (Bearer-only — see `_auth-middleware-split.md`).
>
> **Important scope clarification, straight from the file's own header comment**: *"HuudCoin
> Payment Routes... All routes are authenticated. No webhook — no external payment gateway."*
> Confirms HuudCoin is a fully internal points/credit economy, not real-money processing — no
> Stripe/Paystack/Flutterwave integration exists. Relevant for the rebuild: no PCI-style payment UI
> patterns (card entry, 3DS redirects) are needed here, only balance/transaction UI.

| Method | Path | Handler | Notes |
|---|---|---|---|
| POST | `/initiate` | `PaymentController.initiate` | Initiate a HuudCoin spend (e.g. paying for a boost) |
| POST | `/tip/:recipientId` | `PaymentController.tip` | **Possible duplicate — see finding below** |
| GET | `/history` | `PaymentController.history` | |
| GET | `/stats` | `PaymentController.stats` | |
| GET | `/balance` | `PaymentController.balance` | |
| GET | `/verify/:reference` | `PaymentController.verify` | Source comment: used by the frontend's success page, `reference` format is `hc_xxx_...` |
| GET | `/:id` | `PaymentController.getById` | |
| GET | `/:id/receipt` | `PaymentController.receipt` | Source comment: "wallet confirmation screen" |
| POST | `/:id/refund` | `PaymentController.refund` | |

## Known issues found while building this registry

- **Confirmed real, parallel duplication — not just a route-file coincidence**: grepped the
  frontend directly. `pwa/src/services/payments.service.ts:42-44`'s `tipUser()` calls
  `POST /payments/tip/:recipientId` (this file); `pwa/src/services/gamification.service.ts:129-131`
  *also* has a `tipUser()` calling `POST /gamification/users/:userId/tip`
  (`gamification.md`) — with a comment "purely P2P, no platform cut," suggesting the two may have
  been built at different times with slightly different intents (fee vs. no-fee?) rather than one
  being simple dead leftover code. Both have real callers (`usePayments.ts`, `useGamification.ts`,
  and `profile/[username]/PageClient.tsx`). **This needs a product decision, not just a frontend
  cleanup** — before the rebuild picks one, confirm with whoever owns the HuudCoin economy whether
  these two paths behave identically server-side or whether one takes a cut and the other doesn't.
- The `/verify/:reference` comment explicitly naming its frontend caller ("used by the success
  page") is a useful breadcrumb for the later page-mapping step — confirms a dedicated payment
  success page exists or is expected to exist.
