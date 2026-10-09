# API Registry — Marketplace

> Mount: `app.use("/api/v1/marketplace", marketplaceRoutes)` — `app.ts:336`
> Source: `NeyborHuud-ServerSide/src/modules/marketplace/marketplace.routes.ts`
>
> **Total: 30 routes.**
>
> **⚠️ Auth difference from most other modules**: this file uses `protect`, not `protectAny`.
> Verified directly in `auth.middleware.ts:451-467` — `protect` **only** accepts a Bearer token; it
> rejects immediately (401) if there's no `Authorization: Bearer` header, with no fallback to a
> Better Auth cookie session. Most other modules (`auth`, `safety`, `content`) use `protectAny`,
> which accepts either. **A frontend client authenticated only via a Better Auth session cookie
> (no stored Bearer token) will get 401s on every protected marketplace route.** This needs a
> product/engineering decision before the rebuild: standardize all modules on `protectAny`, or
> confirm the frontend always has a Bearer token available and this is intentional.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/` | rate-limited, `protect`, `requireVerified` | `createProduct` | Only verified users may post listings (anti-scam, per comment). Validation happens in controller, after file upload |
| GET | `/`, `/items` | public | `listProducts` | Alias pair |
| GET | `/seller/:sellerId/status` | public | `getSellerStatus` | Seller tier + vouch badge |
| PUT | `/payout-details` | `protect` | `savePayoutDetails` | Seller's bank/account |
| GET | `/payout-details` | `protect` | `getMyPayoutDetails` | |
| GET | `/orders/:orderId/payout-details` | `protect` | `getOrderPayoutDetails` | Buyer reads seller's account for an active deal |
| GET | `/my-listings`, `/mine` | `protect` | `listMyProducts` | Alias pair |
| GET | `/my-deals` | `protect` | `getMyDeals` | Unified P2P deal list — buyer or seller, replaces older separate My Orders/My Sales/My Offers screens per source comment |
| POST | `/:id/like` | `protect` | `toggleProductLike` | |
| POST | `/:id/comments` | `protect`, validated | `addProductComment` | |
| GET | `/:id/comments` | public | `getProductComments` | |
| GET | `/:id` | public | `getProduct` | |
| PATCH | `/:id` | `protect`, validated | `updateProduct` | |
| DELETE | `/:id` | `protect` | `deleteProduct` | Archives, per comment — not a hard delete |
| POST | `/orders` | `protect`, validated | `createOrder` | "Request to Buy" |
| GET | `/orders/:orderId` | `protect` | `getOrder` | |
| PATCH | `/orders/:orderId/status` | `protect`, validated | `updateOrderStatus` | **Cancel/reject a pre-payment order ONLY** — per source comment, referring to the controller for the exact state-machine boundary |
| POST | `/orders/:orderId/confirm-payment` | `protect`, validated | `confirmPayment` | Buyer: "Paid" |
| POST | `/orders/:orderId/confirm-receipt` | `protect` | `confirmReceipt` | Seller: "Payment received" |
| POST | `/orders/:orderId/mark-shipped` | `protect`, validated | `markShipped` | Seller: "Mark as Sent" |
| POST | `/orders/:orderId/confirm-delivery` | `protect`, validated | `confirmDelivery` | Buyer: "Confirm Delivery" — completes the deal |
| POST | `/products/:productId/offers`, `/items/:productId/offer` | `protect`, validated | `makeOffer` | Alias pair. Buyer makes an offer |
| GET | `/products/:productId/offers` | `protect` | `getProductOffers` | Seller: all offers on a product |
| GET | `/offers/:offerId` | `protect` | `getOffer` | |
| PATCH | `/offers/:offerId/respond` | `protect`, validated | `respondToOffer` | Seller: accept/reject/counter |
| PATCH | `/offers/:offerId/withdraw` | `protect` | `withdrawOffer` | Buyer withdraws own offer |
| PATCH | `/offers/:offerId/close` | `protect` | `closeOffer` | Either party closes a rejected negotiation |
| PATCH | `/offers/:offerId/accept` | `protect`, validated | `respondToOffer` | Shorthand — injects `action: "accept"` into the body before calling the same handler as `/respond` |
| PATCH | `/offers/:offerId/reject` | `protect`, validated | `respondToOffer` | Shorthand — injects `action: "reject"` |
| POST | `/products/:productId/boost` | `protect` | `boostProduct` | HuudCoin-paid listing boost |

## Deal flow (from route ordering + names, not independently traced through the controller this pass)

```
createOrder ("Request to Buy")
  → confirm-payment (buyer)
  → confirm-receipt (seller)
  → mark-shipped (seller)
  → confirm-delivery (buyer) — completes the deal
```

Parallel negotiation path: `makeOffer` → `respond`/`accept`/`reject`/`withdraw`/`close`.

## Known issues found while building this registry

- **The `protect` vs `protectAny` auth inconsistency (see header) is the single most important
  finding in this file** — it's a real, source-verified functional difference, not a naming
  quirk. Should be resolved (or at minimum explicitly documented as intentional) before the
  rebuild's "Frontend Contract" stage, since it affects how the frontend must authenticate marketplace
  requests specifically.
- `updateOrderStatus`'s exact allowed transitions are gated in the controller, not visible from the
  route file alone — flagged for whoever does the detailed request/response contract pass (a later
  step), not fully traced here.
