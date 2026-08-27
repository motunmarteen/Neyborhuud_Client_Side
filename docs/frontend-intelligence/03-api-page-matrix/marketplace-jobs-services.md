# API → Feature → Page Matrix — Marketplace / Jobs / Services

> Verified directly against source in `pwa/src/app/(app)/{marketplace,jobs,services,work,premium}/**`,
> `pwa/src/settings/payout/`, `pwa/src/services/*.service.ts`, `pwa/src/hooks/*.ts`, and
> `pwa/src/components/{marketplace,jobs,services,work,chat,gamification}/*.tsx`, cross-referenced
> against `docs/frontend-intelligence/02-api-registry/{marketplace,jobs,services,payments,media,ratings}.md`.
>
> **Page inventory correction**: `marketplace/[id]/page.tsx` (via `marketplace/[id]/PageClient.tsx`) is
> **not** a product detail page — it's a client-side redirect to `/marketplace?product={id}` (comment:
> "Redirect legacy /marketplace/:id to the browse view"). There is no standalone marketplace product
> detail page; product detail is shown inline via `ProductCard` on the `/marketplace` grid. The orphaned
> `components/marketplace/ProductDetails.tsx` (exported from `components/marketplace/index.ts`) has no
> page caller found anywhere in the app — likely dead/leftover from before this redirect was introduced.
>
> `services/[id]/page.tsx` and `jobs/[id]/page.tsx`, by contrast, ARE real detail pages (render
> `PageClient.tsx` directly, no redirect).
>
> `premium/page.tsx` is **also a legacy redirect** (to `/huud-economy/wallet?tab=tier`, outside this
> cluster) — not a real payments page. `premium/success/page.tsx` **is** real and is the actual "success
> page" referenced by `payments.md`'s `/verify/:reference` comment.

## Page: /marketplace
**File(s):** `pwa/src/app/(app)/marketplace/page.tsx`
**Purpose:** Browse/filter marketplace listings by category; deep-link scroll-to-product via `?product=` query param (this is where product "detail" is effectively viewed, inline in the grid).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /marketplace, /marketplace/items | GET | marketplaceService.getItems() → useMarketplaceProducts() | marketplace.md: GET `/`, `/items` | Category filter passed as query param |
| /marketplace/my-deals | GET | marketplaceService.getMyDeals() → useMyDeals() | marketplace.md: GET `/my-deals` | Used only to badge each `ProductCard` with the viewer's live deal status — not a full "My Deals" render here |
| (socket) product:updated / product:commented | WS | useMarketplaceSocket() | n/a (not in registry — socket, not REST) | Real-time like/comment count sync into React Query cache |
| /marketplace/{productId}/like | POST | marketplaceService.toggleLike() → useProductLike() (inside ProductCard) | marketplace.md: POST `/:id/like` | Optimistic; queues via useMarketplaceOfflineQueue when offline |
| /marketplace/items/{itemId}/save | POST | marketplaceService.saveItem() → useSaveProduct() (inside ProductCard) | **Unmatched** — see note | |
| /marketplace/items/{itemId}/save | DELETE | marketplaceService.unsaveItem() → useSaveProduct() | **Unmatched** — see note | |
| /marketplace/{productId}/comments | GET/POST | marketplaceService.getComments()/addComment() → useProductComments()/useProductCommentMutations() (inside MarketplaceCommentsSheet, opened from ProductCard) | marketplace.md: GET/POST `/:id/comments` | |
| /marketplace/orders | POST | marketplaceService.createOrder() → useCreateOrder() (inside BuyerIntentActions, via ProductCard) | marketplace.md: POST `/orders` | "Buy now" — idempotency key generated client-side |
| /marketplace/items/{itemId}/offer | POST | marketplaceService.makeOffer() → useMakeOffer() (inside BuyerIntentActions) | marketplace.md: POST `/items/:productId/offer` (alias of `/products/:productId/offers`) | Match confirmed — see Unmatched notes below for a related mix-up to watch for |
| /chat/conversations/marketplace/{productId} | POST | chatService.startMarketplaceConversation() (inside BuyerIntentActions "Chat with seller") | Not in marketplace.md/jobs.md/services.md/payments.md/media.md/ratings.md — belongs to chat.md (out of this cluster's registry scope) | Falls back to plain DM (`getOrCreateDirectConversation`) on 404 |

**Components used:** `ProductCard`, `BuyerIntentActions` (+ its internal `MakeOfferDialog`), `MarketplaceCommentsSheet`, `MarketplaceShareSheet`, `AppBrowseLayout`, `LocalHuudHubHeader`, `BrowseEmptyState`.
**Observed states:** loading (skeleton grid), error (retry button), empty (category-aware empty copy + CTA), populated grid with infinite "Load more" pagination, per-card deal-status badge (from `DEAL_STATUS_META`) when viewer has a live deal on that product.
**Unmatched calls (if any):**
- `POST/DELETE /marketplace/items/{itemId}/save` (`saveItem`/`unsaveItem`) — **not found in `marketplace.md`'s 30-route table.** The registry lists no `/items/:id/save` route at all. `marketplaceService.getSavedItems()` also calls `GET /marketplace/saved`, also absent from the registry. These three legacy-shaped calls (`saveItem`, `unsaveItem`, `getSavedItems`) look like leftovers from an older "saved items" feature that predates the registry's 30 verified routes — flagging as likely dead/broken from the frontend's perspective (would 404 against real backend) rather than assuming a match.
- Two nearly-identical "offers" paths exist in `marketplace.service.ts` and are easy to conflate: `makeOffer()` (buyer, POST `/marketplace/items/{itemId}/offer` — matches registry alias) vs. `getProductOffers()` (seller view, GET `/marketplace/products/{productId}/offers` — matches registry's `GET /products/:productId/offers`, see My Listings page below). Both match; flagging only because the naming makes them look like the same endpoint at a glance.
- `contactSeller`, `shareItem`, `reportItem`, `getCategories` in `marketplace.service.ts` all call `/marketplace/items/{id}/contact`, `/marketplace/items/{id}/share`, `/marketplace/items/{id}/report`, `/marketplace/categories` respectively — **none of these paths appear in `marketplace.md`'s 30-route table.** `shareItem`/`reportItem` are not observed being called from any page/component read in this pass (MarketplaceShareSheet was not fully traced for its exact call — flagged for follow-up, not confirmed dead).

## Page: /marketplace/create
**File(s):** `pwa/src/app/(app)/marketplace/create/page.tsx`, `pwa/src/components/marketplace/ProductForm.tsx`
**Purpose:** Create a new marketplace listing (multipart upload of images + fields).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /marketplace | POST | marketplaceService.createProduct() → useProductMutations().createProduct (inside ProductForm) | marketplace.md: POST `/` | Multipart when images are `File[]`, else JSON. Registry notes this route requires `requireVerified` — unverified users would 403/401 here, not surfaced as a distinct UI state in the code read |

**Components used:** `ProductForm`, `GlassFormPage`, `LocalHuudSubpageShell`, `PostCreationSuccessSheet`, `SellerBadge` (rendered inside ProductForm, not independently traced).
**Observed states:** success sheet (`PostCreationSuccessSheet`) shown post-creation before redirecting to `/marketplace?product={id}`; form-level validation errors (title/description/price length rules) are client-side only, not traced to server error shapes.

## Page: /marketplace/[id]/edit
**File(s):** `pwa/src/app/(app)/marketplace/[id]/edit/page.tsx` → `pwa/src/app/(app)/marketplace/[id]/edit/PageClient.tsx`, `pwa/src/components/marketplace/ProductForm.tsx`
**Purpose:** Edit an existing listing.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /marketplace/{productId} | GET | marketplaceService.getProduct() → useProduct() | marketplace.md: GET `/:id` | |
| /marketplace/{productId} | PATCH | marketplaceService.updateProduct() → useProductMutations().updateProduct (inside ProductForm) | marketplace.md: PATCH `/:id` | |

**Components used:** `ProductForm`, `GlassFormPage`.
**Observed states:** loading skeleton, error ("Failed to load listing details" + Go back), populated form.

## Page: /marketplace/my-deals
**File(s):** `pwa/src/app/(app)/marketplace/my-deals/page.tsx`
**Purpose:** Unified P2P deal list (buyer + seller), filterable, each row opens the deal's chat thread — this page itself does not action any deal, just lists and routes to chat.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /marketplace/my-deals?role= | GET | marketplaceService.getMyDeals() → useMyDeals() | marketplace.md: GET `/my-deals` | filter chips: All / Buying / Selling |

**Components used:** inline `DealCard` (local to this file, not a shared component), `LocalHuudSubpageShell`.
**Observed states:** loading skeleton, empty ("No deals yet" + Browse Marketplace CTA), populated list. Deal lifecycle badges rendered via `DEAL_STATUS_META` (`lib/dealStatus.ts`, not independently read this pass) for statuses: `offer_pending`, `offer_countered`, `committed`, `payment_sent`, `completed`, `expired` (per `marketplace.service.ts`'s `DealStatus` type).
**Cross-reference note:** Tapping a deal routes to `/chat/{conversationId}` — the actual order-chain/offer-response actions (`confirmPayment`, `confirmReceipt`, `markShipped`, `confirmDelivery`, `acceptOffer`, `rejectOffer`, `respondToOffer`/counter, `withdrawOffer`) are driven from `components/chat/DealStatusCard.tsx` and `components/chat/OfferCard.tsx`, which render inside the chat page — **outside this cluster's page list** (chat isn't one of the assigned pages). Documented here because they're real, source-verified callers of marketplace.md's deal-chain and offer routes, and a later step will need this cross-reference:
  - `DealStatusCard.tsx`: `marketplaceService.getOrderPayoutDetails()` (GET `/orders/:orderId/payout-details` — match), `confirmPayment()` (POST `/orders/:orderId/confirm-payment` — match), `confirmReceipt()` (POST `/orders/:orderId/confirm-receipt` — match), `markShipped()` (POST `/orders/:orderId/mark-shipped` — match), `confirmDelivery()` (POST `/orders/:orderId/confirm-delivery` — match) — all match marketplace.md.
  - `OfferCard.tsx`: `acceptOffer()` (PATCH `/offers/:offerId/accept` — match), `rejectOffer()` (PATCH `/offers/:offerId/reject` — match), `respondToOffer(..., "counter", ...)` (PATCH `/offers/:offerId/respond` — match), `withdrawOffer()` (PATCH `/offers/:offerId/withdraw` — match) — all match marketplace.md.
  - `useCancelOrder()` (PATCH `/orders/:orderId/status` — marketplace.md's pre-payment cancel/reject) exists in `useMarketplace.ts` but **no page or component call site was found** for it in this pass — possibly dead, or wired into a component not read (e.g. `components/chat/` files beyond the two above weren't exhaustively scanned). Flagged, not confirmed dead.

## Page: /marketplace/my-listings
**File(s):** `pwa/src/app/(app)/marketplace/my-listings/page.tsx`, `pwa/src/components/marketplace/BoostModal.tsx`
**Purpose:** View/manage own listings; edit, boost, and see pending-offer counts per listing.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /marketplace/my-listings | GET | marketplaceService.getMyListings() → useMyListings() | marketplace.md: GET `/my-listings`, `/mine` (alias pair) | |
| /marketplace/my-deals?role=selling | GET | marketplaceService.getMyDeals("selling") → useMyDeals("selling") | marketplace.md: GET `/my-deals` | Per-card deal badge, same pattern as `/marketplace` |
| /marketplace/products/{productId}/offers?status=pending | GET | marketplaceService.getProductOffers() → useProductOffers() (inside `PendingOffersBadge`, one call per listing card) | marketplace.md: GET `/products/:productId/offers` | Read-only badge; tapping routes to the offer's conversation or to `/marketplace/my-deals` |
| /marketplace/products/{productId}/boost | POST | marketplaceService.boostProduct() → useBoostProduct() (inside `BoostModal`) | marketplace.md: POST `/products/:productId/boost` | HuudCoin-paid; 3/7/14/30-day options with distinct coin costs (300/500/900/1500) |

**Components used:** `ProductCard`, local `ListingWithOffers`/`PendingOffersBadge` wrappers, `BoostModal` (marketplace-specific, distinct from `components/gamification/BoostModal.tsx` used by jobs/services — see Cross-cluster notes), `useWallet()` (gamification, for coin-balance check before boosting — not a marketplace.md/payments.md route).
**Observed states:** loading skeleton, error + retry, empty ("No listings yet" + CTA), populated grid with per-card Edit/Boost actions and active-boost expiry text.

## Page: /jobs
**File(s):** `pwa/src/app/(app)/jobs/page.tsx` → `pwa/src/components/work/JobsBrowse.tsx`
**Purpose:** Browse/filter job postings; inline apply via modal; save/unsave.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /jobs | GET | jobsService.getJobs() → useJobs() | jobs.md: GET `/` | filters: type, workMode, category |
| /jobs/{jobId}/save | POST | jobsService.saveJob() → useSaveJob() | jobs.md: POST `/:id/save` | |
| /jobs/{jobId}/save | DELETE | jobsService.unsaveJob() → useSaveJob() | jobs.md: DELETE `/:id/save` | Toggle logic based on `saved` flag passed by caller |
| /jobs/{jobId}/apply | POST (multipart if resume) | jobsService.applyForJob() → useApplyForJob() (inside `ApplyModal`) | jobs.md: POST `/:id/apply` | Multer engages only when resume file present, matches registry's noted "optional multer by content-type" convention |

**Components used:** `JobCard`, `JobFilters`, `ApplyModal`, `AppBrowseLayout`, `LocalHuudHubHeader`, `BrowseEmptyState`.
**Observed states:** loading skeleton, error + retry, empty (filter-aware copy + "Post a job" CTA), populated grid with infinite scroll (`useInView` sentinel).

## Page: /jobs/[id]
**File(s):** `pwa/src/app/(app)/jobs/[id]/page.tsx` → `pwa/src/app/(app)/jobs/[id]/PageClient.tsx`
**Purpose:** Job detail; apply (non-owner), close/boost (owner).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /jobs/{jobId} | GET | jobsService.getJob() → useJob() | jobs.md: GET `/:id` | |
| /jobs/{jobId}/save | POST/DELETE | jobsService.saveJob()/unsaveJob() → useSaveJob() | jobs.md: POST/DELETE `/:id/save` | |
| /jobs/{jobId}/close | POST | jobsService.closeJob() → useCloseJob() | **Unmatched — real bug, confirmed** | See note below |
| /jobs/{jobId}/boost | POST | jobsService.boostJob() → useBoostJob() (inside `components/gamification/BoostModal.tsx`) | jobs.md: POST `/:id/boost` | 3/7-day options, 200/400 coins |
| /jobs/{jobId}/apply | POST | jobsService.applyForJob() → useApplyForJob() (inside `ApplyModal`) | jobs.md: POST `/:id/apply` | |

**Components used:** `ApplyModal`, `components/gamification/BoostModal.tsx` (note: NOT `components/marketplace/BoostModal.tsx` — two visually/functionally distinct BoostModal components exist in the codebase; jobs and services both use the gamification one, marketplace uses its own).
**Observed states:** loading skeleton, error ("Job not found" + Go back), populated detail with owner-only actions (Close Job, Boost) vs. non-owner Apply button (disabled + "Applied" once `job.hasApplied`).
**Unmatched calls (if any):**
- **Confirmed real, source-cross-verified bug**: `jobs/[id]/PageClient.tsx` renders a live "Close Job" button (owner-only, when `job.status === "active"`) wired to `useCloseJob()` → `jobsService.closeJob(jobId)` → `POST /jobs/{jobId}/close`. `jobs.md` explicitly documents that `closeJob` is a **dead controller import never wired to any route** in `job.routes.ts` — there is no `/jobs/:id/close` route on the backend. This means the "Close Job" button in the current frontend, if pointed at the real backend, would 404/500. This is a genuine frontend/backend mismatch, not a registry gap — flagging prominently per the task's known-issues framing.

## Page: /jobs/create
**File(s):** `pwa/src/app/(app)/jobs/create/page.tsx`, `pwa/src/components/jobs/CreateJobForm.tsx`
**Purpose:** Post a new job listing.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /jobs | POST | jobsService.createJob() → useCreateJob() (inside CreateJobForm) | jobs.md: POST `/` | Requires auth + `requireVerified` per registry; redirects unauthenticated users to `/login` client-side before rendering the form |

**Components used:** `CreateJobForm`, `PremiumTextArea`, `PostCreationSuccessSheet`.
**Observed states:** auth-gate redirect (returns null while checking/redirecting), form.

## Page: /jobs/my-applications
**File(s):** `pwa/src/app/(app)/jobs/my-applications/page.tsx`
**Purpose:** List the current user's job applications; withdraw pending ones; deep-link to application's chat thread.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /jobs/my/applications | GET | jobsService.getMyApplications() → useMyApplications() | jobs.md: GET `/my/applications` | Infinite scroll via `useInView` |
| /jobs/applications/{applicationId} | DELETE | jobsService.withdrawApplication() → useWithdrawApplication() | jobs.md: DELETE `/applications/:applicationId` | Only shown for `status === "pending"` |

**Components used:** none shared — inline card markup in the page file.
**Observed states:** loading skeleton, empty ("No applications yet" + Browse Jobs CTA), populated list with per-status badges (pending/reviewing/accepted/rejected/withdrawn — note "withdrawn" has no server-side counterpart route beyond the withdraw DELETE call; status value presumably set server-side).

## Page: /jobs/saved
**File(s):** `pwa/src/app/(app)/jobs/saved/page.tsx`
**Purpose:** List saved jobs; unsave inline via `JobCard`.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /jobs/my/saved | GET | jobsService.getSavedJobs() → useSavedJobs() | jobs.md: GET `/my/saved` | |
| /jobs/{jobId}/save | POST | jobsService.saveJob() → useSaveJob() (passed into `JobCard`) | jobs.md: POST `/:id/save` | Odd: page only ever calls the save path (`saved: true` hardcoded in the mutate call), even though this is the "unsave" affordance — worth checking `JobCard`'s internal toggle logic in a later pass, not fully traced here |

**Components used:** `JobCard`.
**Observed states:** loading skeleton, empty ("No saved jobs yet" + Browse Jobs CTA), populated list with infinite scroll.

## Page: /services
**File(s):** `pwa/src/app/(app)/services/page.tsx` → `pwa/src/components/work/ServicesBrowse.tsx`
**Purpose:** Browse/filter local service providers by category + min rating; favorite inline.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /services | GET | servicesService.getServices() → useServices() | services.md: GET `/` | filters: category (lower-cased client-side), minRating |
| /services/{serviceId}/favorite | POST | servicesService.favoriteService() → useFavoriteService() | services.md: POST `/:id/favorite` | |
| /services/{serviceId}/favorite | DELETE | servicesService.unfavoriteService() → useFavoriteService() | services.md: DELETE `/:id/favorite` | |

**Components used:** `ServiceCard`, `AppBrowseLayout`, `LocalHuudHubHeader`, `BrowseEmptyState`.
**Observed states:** loading skeleton, error + retry, empty (category/rating-aware copy + "Offer a service" CTA), populated grid with infinite scroll.

## Page: /services/[id]
**File(s):** `pwa/src/app/(app)/services/[id]/page.tsx` → `pwa/src/app/(app)/services/[id]/PageClient.tsx`
**Purpose:** Service detail — image gallery, pricing, availability, provider card, reviews; book/rate (non-owner), boost (owner).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /services/{serviceId} | GET | servicesService.getService() → useService() | services.md: GET `/:id` | |
| /services/{serviceId}/reviews | GET | servicesService.getReviews() → useServiceReviews() | services.md: GET `/:id/reviews` | Infinite scroll, "Load more reviews" |
| /services/{serviceId}/favorite | POST/DELETE | servicesService.favoriteService()/unfavoriteService() → useFavoriteService() | services.md: POST/DELETE `/:id/favorite` | Overlay heart icon on gallery |
| /services/{serviceId}/boost | POST | servicesService.boostService() → useBoostService() (inside `components/gamification/BoostModal.tsx`) | services.md: POST `/:id/boost` | Registry notes this handler was a previously-fixed real bug, now confirmed working — not an open issue |
| /services/{serviceId}/book | POST | servicesService.bookService() → useBookService() (inside `BookModal`) | services.md: POST `/:id/book` | Opens the negotiation chain per services.md's comment ("mirrors marketplace's offer endpoints") |
| /services/{serviceId}/rate | POST | servicesService.rateService() → useRateService() (inside `RateServiceModal`) | services.md: POST `/:id/rate` | Star rating (1-5) + optional review text |

**Components used:** `StarRating`, `ReviewCard`, `BookModal`, `RateServiceModal`, `components/gamification/BoostModal.tsx`.
**Observed states:** loading skeleton, error ("Service not found" + Go Back), populated detail with owner-only Boost action vs. non-owner Book/Rate actions, image gallery with thumbnail strip, Verified-provider badge.
**Cross-reference — ratings.md**: `POST /services/:id/rate` and `GET /services/:id/reviews` are **service-module-specific** rating endpoints, not the generic `ratings.md` module (`POST /ratings`, `GET /ratings`). No page in this cluster calls the generic `/ratings` endpoints — consistent with `ratings.md`'s own open question about whether it's reachable from the frontend at all. **Confirmed for this cluster: it is not** (services has its own dedicated rate/review routes instead).

## Page: /services/create
**File(s):** `pwa/src/app/(app)/services/create/page.tsx`, `pwa/src/components/services/CreateServiceForm.tsx`
**Purpose:** Create a new service listing (multipart, up to images).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /services | POST | servicesService.createService() → useCreateService() (inside CreateServiceForm) | services.md: POST `/` | Multipart FormData; registry notes <=6 images + `requireVerified`. Frontend does not appear to enforce the 6-image cap client-side (not confirmed in the portion of `CreateServiceForm.tsx` read) |

**Components used:** `CreateServiceForm`, `PremiumTextArea`.
**Observed states:** auth-gate redirect (same pattern as jobs/create), form.

## Page: /services/my-bookings
**File(s):** `pwa/src/app/(app)/services/my-bookings/page.tsx`
**Purpose:** List the user's live booking negotiations (client or provider); withdraw own pending/countered requests; deep-link to chat.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /services/my/booking-requests | GET | servicesService.getMyBookingRequests() → useMyBookings() | services.md: GET `/my/booking-requests` | This is the **current** system per registry — page correctly uses this, not the legacy `getMyBookings()`/`GET /my/bookings` |
| /services/bookings/requests/{bookingOfferId}/withdraw | PATCH | servicesService.withdrawBooking() → useWithdrawBooking() | services.md: PATCH `/bookings/requests/:bookingOfferId/withdraw` | Only shown when `isClient && status is pending/countered` |

**Components used:** none shared — inline card markup.
**Observed states:** loading skeleton, empty ("No bookings yet" + Browse Services CTA), populated list with per-status color/label (pending/countered/accepted/rejected/expired/cancelled), "Respond in chat" vs "Open chat" link depending on status, auth-gate redirect to `/login`.
**Note — legacy vs current split, confirmed real**: `services.service.ts` still exports `getMyBookings()` (GET `/services/my/bookings`, explicitly `@deprecated LEGACY`), `cancelBooking()` (DELETE `/services/bookings/:bookingId`, `@deprecated LEGACY`), and `updateBookingStatus()` (PATCH `/services/bookings/:bookingId/status`, `@deprecated LEGACY`) — all three match real routes in `services.md`'s "My bookings / favorites" table but **none has a call site found anywhere in this cluster's pages/components**. This confirms `services.md`'s own open question: the frontend has already fully migrated to `getMyBookingRequests`/the negotiation chain, and the legacy bookings routes (`GET /my/bookings`, `DELETE /bookings/:bookingId`, `PATCH /bookings/:bookingId/status`) appear to have **no frontend caller at all** — real candidates for backend deprecation, not just UI consolidation.
**Also note**: `services.service.ts`'s `getServiceBookings()` (GET `/services/:serviceId/bookings`) matches no route in `services.md`'s 21-route table at all (registry has no such collection endpoint under a service id) — **unmatched**, and also has no call site found.

## Page: /services/my-favorites
**File(s):** `pwa/src/app/(app)/services/my-favorites/page.tsx`
**Purpose:** Grid of favorited services; unfavorite inline.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /services/my/favorites | GET | servicesService.getMyFavorites() → useMyFavorites() | services.md: GET `/my/favorites` | |
| /services/{serviceId}/favorite | POST/DELETE | servicesService.favoriteService()/unfavoriteService() → useFavoriteService() (passed into `ServiceCard`) | services.md: POST/DELETE `/:id/favorite` | |

**Components used:** `ServiceCard`.
**Observed states:** loading skeleton grid, empty ("No saved services yet" + Browse Services CTA), populated grid with infinite scroll, auth-gate redirect.

## Page: /work
**File(s):** `pwa/src/app/(app)/work/page.tsx` (reuses `JobsBrowse`/`ServicesBrowse`/`JobsToolbar`/`ServicesToolbar` from `components/work/`)
**Purpose:** Unified "Hiring / For Hire" hub — a tabbed shell around the exact same `JobsBrowse`/`ServicesBrowse` components used standalone at `/jobs` and `/services`. Confirmed no separate API surface — identical calls to those two pages, just toggled by tab state (`?tab=for_hire`/`?tab=services` query param selects initial tab).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| (same as /jobs) | GET | jobsService.getJobs() → useJobs() | jobs.md: GET `/` | Hiring tab |
| /jobs/{jobId}/save | POST/DELETE | jobsService.saveJob()/unsaveJob() → useSaveJob() | jobs.md: POST/DELETE `/:id/save` | Hiring tab |
| /jobs/{jobId}/apply | POST | jobsService.applyForJob() → useApplyForJob() | jobs.md: POST `/:id/apply` | Hiring tab, via `ApplyModal` |
| (same as /services) | GET | servicesService.getServices() → useServices() | services.md: GET `/` | For Hire tab |
| /services/{serviceId}/favorite | POST/DELETE | servicesService.favoriteService()/unfavoriteService() → useFavoriteService() | services.md: POST/DELETE `/:id/favorite` | For Hire tab |

**Components used:** `JobsBrowse`, `ServicesBrowse`, `JobsToolbar`, `ServicesToolbar`, `AppBrowseLayout`.
**Observed states:** identical to `/jobs` and `/services` individually, plus a tab switcher (Hiring/For Hire) with `role="tablist"`.

## Page: /premium
**File(s):** `pwa/src/app/(app)/premium/page.tsx`
**Purpose:** **Not a real page** — client-side redirect only, comment: "Legacy route — activity tier lives in the HuudCoins wallet hub." Redirects to `/huud-economy/wallet?tab=tier`, which is outside this cluster entirely (no API calls made from this file itself).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| (none) | — | — | — | No API calls — pure redirect |

**Components used:** none.
**Observed states:** none (renders `null` while redirecting).

## Page: /premium/success
**File(s):** `pwa/src/app/(app)/premium/success/page.tsx`
**Purpose:** HuudCoin payment verification/confirmation screen. This IS the page `payments.md` refers to in its comment on `GET /verify/:reference` ("used by the frontend's success page").

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /payments/verify/{reference} | GET | paymentsService.verifyPayment() → useVerifyPayment() | payments.md: GET `/verify/:reference` | Reference read from `?reference=` or legacy `?trxref=` query param; `hc_` prefix confirms HuudCoin-only per registry's note |

**Components used:** none shared — inline markup.
**Observed states:** no-reference state (message + "View Wallet" link), loading (spinner, "Confirming Transaction"), success (`payment.status === "completed"`, shows coins deducted + description, invalidates wallet/stats/currentUser caches), failure/error (transaction-not-found vs transaction-failed, distinct copy, "Contact Support" mailto link).
**Note:** This page is reached from nowhere in this cluster's pages (no `/premium/success` link found in marketplace/jobs/services/work) — it's presumably linked from the HuudCoin wallet/boost purchase flow (`huud-economy/`), outside this cluster. Its only tie to this cluster is functional: boosting a listing/job/service (`useBoostProduct`/`useBoostJob`/`useBoostService`) calls `POST /marketplace|jobs|services/{id}/boost` directly (HuudCoin-paid, instant, no redirect per `usePayments.ts`'s own comment: "All platform transactions are instant (no redirect)") — **not** via `/payments/initiate` + this success page. So despite the registry's payments.md pairing initiate to verify, this cluster's boost flows bypass `/payments/initiate` entirely and call the module-specific boost endpoints instead. `useInitiatePayment()` (which does call `POST /payments/initiate`) has **no call site found anywhere in this cluster's pages/components** — it's presumably used by the tip/event-ticket/marketplace_pledge/service_payment flows elsewhere in the app, not boosts.

## Page: /settings/payout
**File(s):** `pwa/src/app/(app)/settings/payout/page.tsx`
**Purpose:** Seller sets/updates their bank payout details (the account buyers transfer to directly — NeyborHuud never holds funds).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| /marketplace/payout-details | GET | marketplaceService.getMyPayoutDetails() (called directly, not through a hook) | marketplace.md: GET `/payout-details` | Fetched fresh on mount, never cached client-side (explicit comment about not persisting bank details in localStorage) |
| /marketplace/payout-details | PUT | marketplaceService.savePayoutDetails() (called directly, not through a hook) | marketplace.md: PUT `/payout-details` | Requires current password as step-up re-auth in the payload; 10-digit account number validated client-side |

**Components used:** `PremiumInput`, `AppBrowseLayout`.
**Observed states:** prefilled form (if existing details found) vs blank form, inline account-number validation error, submit-disabled until all fields + password valid, loading ("Saving…") toast-based success/error (no dedicated loading/error page state — uses `sonner` toasts).
**Note:** This page calls `marketplaceService` methods directly with no React Query hook wrapper — the only page in this cluster that does so (every other page goes through a `use*` hook in `hooks/`). Worth flagging for the later component/hook registry step as an inconsistency in the codebase's own conventions.

## Cross-cluster notes

**Tip endpoint duplication (per task's specific ask) — resolved for this cluster: not used here at all.**
Searched the entire marketplace/jobs/services/work/premium/payout page and component tree for tipping. **No page or component in this cluster calls either `paymentsService.tipUser()` (`POST /payments/tip/:recipientId`) or `gamificationService.tipUser()` (`POST /gamification/users/:userId/tip`).** Both `useTipUser()` (in `usePayments.ts`, wrapping `paymentsService.tipUser`) and the gamification equivalent exist in the codebase and are exported, but their only confirmed call site (per a repo-wide grep for `tipUser`/`/tip/`) is `pwa/src/app/(app)/profile/[username]/PageClient.tsx` and `useGamification.ts` itself — both outside this cluster. So the known duplicate-tip-endpoint issue flagged in `payments.md` is real but **does not surface anywhere in Marketplace/Jobs/Services/Work/Payments-adjacent pages** — it's purely a profile-page feature.

**Registry routes with no caller found in this cluster:**
- `marketplace.md`: `GET /` used, but no caller found for `useCancelOrder()`'s underlying `PATCH /orders/:orderId/status` anywhere in the pages/components read (may exist in an un-read chat component).
- `services.md`: `GET /my/bookings` (legacy), `DELETE /bookings/:bookingId` (legacy `cancelBooking`), `PATCH /bookings/:bookingId/status` (legacy `updateBookingStatus`) — all superseded by the negotiation-request flow, no call sites found. `GET /:serviceId/bookings`-shaped call (`getServiceBookings`) also has no route match in the registry AND no call site.
- `payments.md`: `POST /initiate` (`initiatePayment`/`useInitiatePayment`) has no call site in this cluster — boost flows call module-specific `/boost` endpoints directly instead. `POST /tip/:recipientId` not used in this cluster (see above). `GET /stats`, `GET /:id`, `GET /:id/receipt`, `POST /:id/refund` (`getPaymentStats`, `getPayment`, `requestRefund`) have hooks (`usePaymentStats`) but **no page in this cluster renders them** — presumably used in a wallet/history page outside this cluster.
- `ratings.md`: confirmed genuinely unreachable from this cluster — services has its own `/:id/rate` + `/:id/reviews` instead (see services/[id] page notes above).
- `media.md`: not used anywhere in this cluster — all image uploads (marketplace listing images, service listing images, job resumes) go through each module's own dedicated multer route (`POST /marketplace`, `POST /services`, `POST /jobs/:id/apply`), never through the generic `POST /media/upload`. Consistent with `media.md`'s own note that module-specific uploads are a separate pattern from the shared endpoint.

**Anything surprising or worth flagging for the human reviewer:**
1. **Confirmed real bug**: `jobs/[id]/PageClient.tsx`'s "Close Job" button calls `jobsService.closeJob()` → `POST /jobs/{id}/close`, a route `jobs.md` confirms does not exist on the backend (dead controller import, never wired). This button would fail in production against the real API.
2. **Two visually-different `BoostModal` components** exist: `components/marketplace/BoostModal.tsx` (marketplace-only, 4 duration options 3/7/14/30 days, its own coin-cost table) vs. `components/gamification/BoostModal.tsx` (shared by jobs + services, 2 options 3/7 days, generic `type` prop). Both ultimately call module-specific boost mutations. Not a bug, but a real inconsistency for the component registry step to capture as two distinct components, not one reused one.
3. **`marketplace/[id]` and `premium` are both dead-end legacy redirects**, not real detail/feature pages — anyone building a component/route inventory purely from the file tree (as this step's instructions initially assumed) would incorrectly count them as content pages. `services/[id]` and `jobs/[id]`, by contrast, are real.
4. **Marketplace's "save/unsave item" and "saved items" calls appear broken**: `saveItem`/`unsaveItem`/`getSavedItems` in `marketplace.service.ts` hit paths (`/marketplace/items/:id/save`, `/marketplace/saved`) that don't exist anywhere in `marketplace.md`'s verified 30-route table. If real, these would 404. Not confirmed as actually called from any page in this pass (the `/marketplace` page doesn't wire a dedicated save button into its `ProductCard` invocation directly, so this may be dead code — but the functions exist, are exported, and are referenced inside `ProductCard`/`useSaveProduct`, which IS rendered from `/marketplace`, so the risk is real, not purely theoretical).
5. **`/settings/payout` bypasses the hooks layer** — the only page in this cluster calling `marketplaceService` methods directly instead of via a `use*` React Query hook, an inconsistency worth normalizing in the rebuild.
6. **`components/chat/DealStatusCard.tsx` and `OfferCard.tsx` are the real actors for most of marketplace.md's order/offer lifecycle**, not any page in this cluster's assigned list — the actual UI for confirm-payment/confirm-receipt/mark-shipped/confirm-delivery/accept/reject/counter/withdraw offer lives in the chat feature. This cluster's pages (`/marketplace`, `/marketplace/my-deals`, `/marketplace/my-listings`) only initiate deals (buy now / make offer) and display status badges — they don't action them. Important for the later page-mapping/component-registry steps not to miss this actor living outside marketplace's own page tree.
