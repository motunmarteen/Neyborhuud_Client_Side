# User Journeys — Marketplace / Jobs / Events / Services

> Step 6. Built on Step 4's `03-api-page-matrix/{marketplace-jobs-services,chat-social-connections}.md`
> and Step 5's `04-route-map/route-classification.md` (trusted, not re-derived). New source read this
> pass: `components/chat/DealStatusCard.tsx`, `components/chat/OfferCard.tsx`,
> `components/chat/EventRsvpCard.tsx`, `components/marketplace/BuyerIntentActions.tsx`,
> `components/events/EventCard.tsx`, `components/services/BookModal.tsx`,
> `app/(app)/events/[id]/PageClient.tsx`, `hooks/useEvents.ts`, `services/events.service.ts`,
> `services/jobs.service.ts`, `hooks/useServices.ts`. No `/jobs/[id]/applications` route exists in the
> file tree — confirmed by directory listing, not just absence of a link.

---

# Journey: Marketplace deal — browse → offer/buy → payment → delivery → completion

## Trigger
User is on `/marketplace`, viewing the browse grid. Product "detail" is inline in each `ProductCard`
(confirmed by Step 4 — no standalone detail page; `/marketplace/[id]` is a dead redirect back to
`?product={id}`).

## Flow

```
/marketplace (grid, ProductCard)
   |
   |-- non-negotiable product --> "Buy now" (BuyerIntentActions.handleBuyNow)
   |        POST /marketplace/orders {productId, buyNow:true}
   |        -> order created, conversationId returned
   |        -> router.push(/chat/{conversationId})   [or, if no convId returned,
   |                                                    toast + push to /marketplace/my-deals]
   |
   |-- negotiable product --> "Make offer" opens MakeOfferDialog (in-card modal, portal to body)
   |        POST /marketplace/items/{itemId}/offer {amount, message?}
   |        -> router.push(/chat/{conversationId})  (or toast-only if no convId in response)
   |
   |-- either path --> "Chat with seller" icon button (independent of buy/offer)
            chatService.startMarketplaceConversation(productId)
            -> 404 falls back to chatService.getOrCreateDirectConversation(sellerId) [plain DM]
            -> 400 = "can't message yourself"; 410 = "product no longer available"
            -> router.push(/chat/{conversationId})

===== EVERYTHING BELOW HAPPENS INSIDE /chat/[conversationId], NOT ON ANY MARKETPLACE PAGE =====

Chat thread renders system messages with role-aware action cards:

  OfferCard (meta.offerAction: new | counter | accept | reject | withdrawn | expired)
     seller sees (on 'new'):     Accept | Counter (window.prompt for ₦) | Reject
        PATCH /offers/:id/accept | /offers/:id/respond (counter) | /offers/:id/reject
     buyer sees (on 'counter'):  Accept counter | Counter back | Withdraw
        PATCH /offers/:id/accept | /offers/:id/respond (counter) | /offers/:id/withdraw
     accept -> "Deal agreed — starting the order" -> next system message is a DealStatusCard

  DealStatusCard (meta.dealAction: started | accepted | paid | paid_confirmed | shipped | completed | cancelled)
     'started'/'accepted', buyer's turn:
        shows seller's bank details (inline in meta.payoutDetails, or fetched via
        GET /orders/:orderId/payout-details if absent) + PaymentCountdown timer
        buyer taps "I've Paid · add proof" (uploads receipt image via POST /chat/upload,
           then POST /orders/:orderId/confirm-payment {proofUrl})
           OR "Paid, no proof" (POST /orders/:orderId/confirm-payment {proofUrl:''})
     'paid', seller's turn:
        "Confirm Payment Received" -> POST /orders/:orderId/confirm-receipt
     'paid_confirmed', seller's turn:
        physical goods: optional tracking-number field -> "Mark as Sent"
        service booking (dealKind='service'): "Mark Job Started" (no shipping form)
        -> POST /orders/:orderId/mark-shipped {trackingNumber?}
     'shipped', buyer's turn:
        "Confirm Delivery Received" (or "Confirm Job Completed" for services)
        -> POST /orders/:orderId/confirm-delivery
     'completed': static badge, "+N HuudCoins each · trust boosted"
     'cancelled', reason='payment_window_expired': "listing is back on the market" (abandonment path —
        buyer didn't pay within the countdown window; server-driven, no client action)

Deal status is also visible OUTSIDE chat, read-only:
  /marketplace/my-deals — badges each deal via DEAL_STATUS_META (offer_pending, offer_countered,
     committed, payment_sent, completed, expired); tapping a row routes into the same chat thread.
     Filter chips: All / Buying / Selling.
  /marketplace (grid) and /marketplace/my-listings — same badge pattern per-card via GET /marketplace/my-deals.
```

## Prose walkthrough
The buyer starts on `/marketplace`, taps either "Buy now" (creates an order immediately, no negotiation)
or "Make offer" (opens an in-card modal, POSTs an offer). Both paths end by pushing the buyer straight
into `/chat/{conversationId}` — there is no marketplace-hosted confirmation screen. From that point on,
**the entire deal lifecycle is chat UI**: `OfferCard` renders the accept/reject/counter cycle as
role-gated buttons on system messages, and once an offer is accepted the thread starts receiving
`DealStatusCard` messages instead, which drive the manual (non-custodial) payment attestation chain —
pay → confirm receipt → ship/start job → confirm delivery/completion — each step gated to whichever
party's turn it is (`isBuyer`/`isSeller` derived from `meta.buyerId`/`sellerId` matched against the
viewer's own id). `/marketplace/my-deals` and the two browse grids only ever *display* the current stage
via badges; they never expose an action button for it. If the buyer misses the payment countdown window,
the deal auto-cancels server-side and the listing returns to market — the frontend just renders that as
a passive status card, no retry affordance shown.

## Cross-references
- Step 4 pages: `/marketplace`, `/marketplace/my-deals`, `/marketplace/my-listings` (marketplace-jobs-services.md)
- Step 4 chat page: `/chat/[conversationId]` (chat-social-connections.md) — confirmed the only live messaging surface
- Step 5 routes: `/marketplace/[id]` (dead redirect → `?product=`), `/chat` and `/messages/*` (redirect chain into `/chat/[conversationId]`)
- Components (new this pass, not in Step 4's page list): `components/marketplace/BuyerIntentActions.tsx`, `components/chat/OfferCard.tsx`, `components/chat/DealStatusCard.tsx`

## Gaps or inconsistencies found
- **Confirmed via source**: the entire negotiate/pay/ship/deliver lifecycle lives in `components/chat/{OfferCard,DealStatusCard}.tsx`, rendered inside `/chat/[conversationId]` — not on any marketplace page. This matches Step 4's flag; now verified line-by-line. The real information architecture is "marketplace pages *initiate*, chat *fulfills*" — a rebuild that treats marketplace as a self-contained page tree would miss most of the actual UI.
- `BuyerIntentActions.handleBuyNow`/`handleMakeOffer` both have a **silent degraded path**: if the API response doesn't include a `conversationId` (only `order`/`offer` created), the buyer is redirected to `/marketplace/my-deals` (buy) or just shown a toast with no navigation at all (offer) — inconsistent recovery between the two entry points.
- Counter-offer amount entry uses a raw `window.prompt()` (`OfferCard.askCounter`) — not a styled input, a real UX gap distinct from the polished `MakeOfferDialog` used for the initial offer.
- `useCancelOrder()` (`PATCH /orders/:orderId/status`, pre-payment cancel/reject) — flagged by Step 4 as having no confirmed call site anywhere in marketplace pages or in `DealStatusCard`/`OfferCard` (both read in full this pass) — still unconfirmed. There is no visible "cancel deal" button in either card once an order exists; the only cancellation path observed is the automatic payment-window-expiry one.
- `DealStatusCard`'s "Paid, no proof" affordance means payment confirmation can be entirely self-attested with zero evidence — a real trust-model gap, not a bug, but worth flagging since NeyborHuud never holds funds (per the card's own in-code disclaimer).

---

# Journey: Job application — browse → apply → employer review → outcome

## Trigger
User is on `/jobs` (browse grid) or lands directly on `/jobs/[id]` (real detail page, confirmed by Step 4/5 — not a redirect like marketplace's).

## Flow

```
/jobs  or  /jobs/[id]
   |
   |-- Apply (ApplyModal, opened from either the grid card or the detail page)
   |      POST /jobs/{jobId}/apply {coverLetter}  (multipart, resume as file, if attached)
   |      -> job.hasApplied flips true; Apply button becomes disabled "Applied" state on /jobs/[id]
   |
   v
/jobs/my-applications  (APPLICANT'S view of their own application status)
   GET /jobs/my/applications  -> per-status badges: pending / reviewing / accepted / rejected / withdrawn
   "Withdraw" button shown only while status === 'pending'
      DELETE /jobs/applications/{applicationId}
   No deep-link to a per-application detail/chat thread was found on this page (page notes
   in Step 4 say inline card markup only, no shared component) — contrast with marketplace deals,
   where each row routes into a chat thread. Job applications have no equivalent visible thread here.

   ??? EMPLOYER'S REVIEW SIDE — NOT FOUND ???
   jobs.service.ts DOES define:
     getJobApplications(jobId)          GET  /jobs/{jobId}/applications
     getApplicationStatus(applicationId) GET  /jobs/applications/{applicationId}
     updateApplicationStatus(id, status) PATCH /jobs/applications/{applicationId}/status
        status: 'reviewing' | 'shortlisted' | 'rejected' | 'accepted'
   But: no page.tsx exists at any `/jobs/[id]/applications`-shaped path (directory listing confirms
   no such file), and a repo-wide grep for `getJobApplications`/`updateApplicationStatus`/
   `useJobApplications`/`useUpdateApplicationStatus` returns ONLY the service-file definitions
   themselves — zero call sites in any hook, page, or component. There is no employer-side
   application-review UI anywhere in the frontend.

   -> Consequence: an employer today has NO in-app way to see who applied to their job, or to
      accept/reject/shortlist anyone, despite the backend-shaped service methods existing client-side.
      The only jobs owner-only actions actually wired on /jobs/[id] are "Close Job" (confirmed dead —
      no backend route, per Step 4) and "Boost" (works).

   -> Applicant's outcome visibility: entirely dependent on /jobs/my-applications' status badge
      changing on next fetch/poll. No push/socket event for job-application status change was found
      in this pass (contrast marketplace's real-time chat system messages) — if the backend does emit
      a notification, the applicant would see it via /notifications (per chat-social-connections.md's
      30+ mapped notification types, which does include "job_*" as an icon-mapped prefix), not via any
      dedicated in-app job-status alert.
```

## Prose walkthrough
The applicant's path is fully wired: browse or land on a job, apply (with optional resume upload),
and track status on `/jobs/my-applications`, with withdrawal available while still pending. The
employer's side is where the journey breaks down — there is no page, modal, or component anywhere in
the codebase that lists a job's applicants or lets an employer act on them, even though the exact
service methods needed (`getJobApplications`, `updateApplicationStatus`) exist, are exported, and match
plausible backend routes. This is a dead-end: applications can be submitted but never reviewed through
the UI. The applicant would only ever see a status change if it happens through some other mechanism
(backend automation, admin tooling, or a future employer surface not yet built) and would learn about it
either by revisiting `/jobs/my-applications` or, speculatively, via a `job_*`-prefixed row in
`/notifications` — not confirmed to actually fire for this case in this pass.

## Cross-references
- Step 4 pages: `/jobs`, `/jobs/[id]`, `/jobs/create`, `/jobs/my-applications`, `/jobs/saved`, `/work` (marketplace-jobs-services.md)
- Step 4 notifications page: `/notifications` (chat-social-connections.md) — generic type→icon map includes `job_*` prefixes, not verified to fire for application-status changes specifically
- Step 5 routes: `/jobs/[id]` (real, has the confirmed-dead "Close Job" button)

## Gaps or inconsistencies found
- **New finding, confirmed by directory listing + repo-wide grep**: `jobsService.getJobApplications()` and `jobsService.updateApplicationStatus()` (the entire employer-review API surface) have **zero call sites anywhere in the frontend** — no page, hook, or component calls them. This is a bigger gap than Step 4's "Close Job" finding: it's not a broken button, it's an entire missing screen. An employer cannot review, accept, or reject applicants anywhere in the current UI.
- No `/jobs/[id]/applications` (or similarly-shaped) route exists in the file tree at all — this isn't a redirect or dead button, the page was simply never built.
- No chat-thread equivalent for job applications was found (unlike marketplace deals, which get an auto-created chat thread with live status cards). Job applications appear to be a pure REST resource with no messaging/negotiation layer in the frontend.
- `/jobs/my-applications`'s "withdrawn" status badge has no visible server-side status-setting counterpart beyond the DELETE call — consistent with Step 4's note that this may just reflect a status value set server-side after the DELETE, not independently confirmed here.

---

# Journey: Event RSVP — browse → RSVP → reminders → attendance

## Trigger
User is on `/events`, `/events/nearby`, or `/events/my-events` (all three browse variants render the same `EventCard`), or lands on `/events/[id]` detail.

## Flow

```
/events | /events/nearby | /events/my-events   (EventCard, "Attend"/"Going" pill button)
   |
   |  onAttend(eventId) -> useAttendEvent().mutate({eventId, attending: event.isAttending})
   |     attending=true  -> DELETE /events/{id}/attend   (un-RSVP)
   |     attending=false -> POST   /events/{id}/attend   (RSVP "going", BINARY only)
   |     on success: invalidates feed-discovery / events detail / events list / my-events caches;
   |        awards HuudCoins on first attend ("event_attended"); toast "You're going!" / "RSVP removed"
   |     on error: 409-shaped "already attending" -> silent refresh (no toast);
   |               400-shaped "capacity"/"full" -> "This event is at full capacity."
   |
   |  THIS IS THE ONLY RSVP MECHANISM ON ANY STANDALONE EVENTS PAGE. It is strictly binary
   |  (attending / not attending) — there is NO "Maybe" option anywhere on /events, /events/nearby,
   |  /events/my-events, or /events/[id]/PageClient.tsx (confirmed: that file renders attendee COUNT
   |  and an "Attendees" list-viewing modal, but does not itself render an RSVP button at all —
   |  RSVP-ing from the detail page isn't wired; only EventCard, used on the browse/list pages, has it).
   v
/events/[id]  (detail page — NOT where you RSVP, per above)
   Owner-only ("isOrganizer") actions:
     "Post an Update" -> PostUpdateModal -> eventsService.postEventUpdate(eventId, text)
        posts into the event's chat thread + notifies everyone who RSVP'd going/maybe
        ("No one has RSVP'd yet" info toast if zero recipients)
     "Edit Event" -> /events/{id}/edit
     "Cancel Event" -> CancelModal (reason required, min 5 chars) -> POST /events/{id}/cancel
     "Delete" (window.confirm guard) -> DELETE /events/{id}
   Everyone:
     "Attendees" link (tap attendee count) -> AttendeesModal -> GET /events/{id}/attendees
     "Share" -> EventShareSheet;  "Report" (non-organizer) -> ReportModal -> POST /events/{id}/report

===== TRI-STATE RSVP EXISTS, BUT ONLY INSIDE THE EVENT'S CHAT THREAD =====
components/chat/EventRsvpCard.tsx — renders on a chat system message carrying meta.rsvpAction,
   auto-created presumably when someone first RSVPs or when the event's chat thread is seeded (thread
   creation trigger itself not traced this pass — out of scope of the pages read).
   Three real buttons: Going 🎉 / Maybe 🤔 / Can't Go 🙅 (RsvpStatus = 'going'|'maybe'|'not_going')
     -> POST /events/{id}/rsvp {status}   (eventsService.setRsvp)
   Live counts: card listens for socket event 'event:rsvp_update' (goingCount/maybeCount), same
      fan-out pattern as marketplace's live-location card.
   Non-announcing viewers: card fetches their own prior answer via GET /events/{id}/rsvp
      (eventsService.getMyRsvp) so the buttons show the correct pressed state.
   Choosing a status is idempotent/changeable at any time; never removes the user from the thread.

REMINDERS AS THE EVENT DATE APPROACHES:
   No client-rendered reminder/countdown UI was found on any events page or in EventCard/PageClient
   (no "starts in Xh" banner, no local-notification scheduling call). The only proactive-communication
   mechanism confirmed from source is the organizer-triggered "Post an Update" broadcast above, which
   is manual, not automatic and not date-driven. Any push-notification-based reminder is unverifiable
   from frontend code (would be a backend/server-cron concern, no client subscription/schedule call
   found) — flagged per the task's framing, not fabricated.
```

## Prose walkthrough
The RSVP story is split in the same architectural pattern as marketplace deals: standalone event pages
(`/events`, `/events/nearby`, `/events/my-events`) only ever expose a **binary** attend/un-attend toggle
via `useAttendEvent`/`EventCard`, calling `POST`/`DELETE /events/:id/attend`. The event detail page
(`/events/[id]`) doesn't even have its own RSVP button — it shows the attendee count and a
list-viewing modal, but RSVP-ing happens on the card, not the detail screen. The **tri-state** RSVP
(Going / Maybe / Can't Go) that events.md's registry documents is real and fully wired, but lives
exclusively inside `EventRsvpCard`, rendered on system messages in the event's own chat thread —
mirroring exactly how marketplace deal actions live in chat rather than on marketplace pages. Organizers
get a one-way broadcast tool ("Post an Update") that posts to the event chat and notifies
going/maybe attendees; there's no automated date-proximity reminder UI anywhere in the frontend — if
reminders exist they're server/push-only and invisible to source review.

## Cross-references
- Step 5 routes: `/events`, `/events/[id]`, `/events/[id]/edit`, `/events/create`, `/events/my-events`, `/events/nearby` (route-classification.md) — all classified "real", no redirects in this cluster
- Chat page: `/chat/[conversationId]` (chat-social-connections.md) — same live surface that hosts `EventRsvpCard`, `OfferCard`, `DealStatusCard`
- No Step 4 events.md page-matrix file was in scope for this pass; RSVP endpoint list here is from direct source read of `services/events.service.ts` and `hooks/useEvents.ts`, cross-checked against the two RSVP-capable components

## Gaps or inconsistencies found
- **Confirmed dual RSVP system**: the browse/list pages hard-wire the legacy-shaped binary attend/un-attend (`/events/:id/attend`), while the tri-state `/events/:id/rsvp` endpoint is only reachable from inside the event's chat thread via `EventRsvpCard`. A user who never opens the event's chat (i.e., anyone who only ever uses `/events`, `/events/nearby`, or `/events/my-events`) can never say "Maybe" — they can only toggle fully in or fully out. This is a real UX inconsistency, not just an architectural curiosity: the two mechanisms track state independently (`event.isAttending` boolean vs. `RsvpStatus` tri-state) and it's unclear from source whether the backend reconciles "attending=true" with "rsvp=going" as the same fact or two separate records.
- `/events/[id]` (detail page) has no RSVP button of its own at all — an odd gap, since it's the natural place a user would expect to RSVP after reading full event details; they'd have to go back to a list view's `EventCard` or find the event's chat thread instead.
- No reminder/countdown UI found anywhere in the traced files — if this is a product requirement, it's currently either push-notification-only (unverifiable here) or entirely unbuilt.
- `PostUpdateModal`'s "no one has RSVP'd yet" case is handled gracefully (info toast, no error) — not a gap, noted for completeness.

---

# Journey: Service booking — browse → request booking → negotiate → complete

## Trigger
User is on `/services` (browse grid) or `/services/[id]` (real detail page — confirmed by Step 4, not a redirect).

## Flow

```
/services  (grid, favorite-only actions)
   |
   v
/services/[id]  (detail — gallery, pricing, availability, provider card, reviews)
   |
   |-- non-owner: "Book" -> BookModal
   |      Fields: Date & Time (datetime-local, min = now+30min), Notes (optional, 500 char cap)
   |      useBookService().mutate({serviceId, date, notes})
   |         POST /services/{serviceId}/book
   |      Per services.md (Step 4, trusted): this "mirrors marketplace's offer endpoints" —
   |         i.e. booking opens the SAME negotiation-chain pattern as a marketplace offer,
   |         not a one-shot confirmed booking.
   |
   v
/services/my-bookings   (booking-request list, buyer=client or provider side, same page for both)
   GET /services/my/booking-requests   (current system; legacy GET /my/bookings confirmed
      dead in Step 4 — no call site anywhere)
   Per-row status: pending / countered / accepted / rejected / expired / cancelled
   "Respond in chat" (pending/countered) vs "Open chat" (other statuses) — routes to the booking's
      chat thread, same UI pattern as marketplace's my-deals page
   Client-only "Withdraw" button, shown when isClient && status in {pending, countered}
      PATCH /services/bookings/requests/{bookingOfferId}/withdraw

===== NEGOTIATION AND FULFILLMENT HAPPEN IN CHAT, SAME CARDS AS MARKETPLACE =====
DealStatusCard.tsx explicitly branches on meta.dealKind === 'service' (isService flag):
   - Label swaps: "Service Booking" (not "NeyborHuud Deal"), shows meta.serviceTitle +
     meta.scheduledAt (formatted date/time) instead of a generic amount-only display
   - 'paid_confirmed' stage: provider taps "Mark Job Started" (no shipping/tracking form —
     services skip the physical-shipment step entirely) instead of "Mark as Sent"
   - 'shipped' stage relabeled "Job Started" (not "On The Way")
   - final confirm-delivery button relabels to "Confirm Job Completed" (not "Confirm Delivery
     Received") — same underlying call: POST /orders/{orderId}/confirm-delivery

   -> CONFIRMED FROM SOURCE: service bookings, once accepted, flow into the exact same Order
      object/lifecycle as marketplace deals (orderId, confirm-payment, confirm-receipt,
      mark-shipped, confirm-delivery — all identical marketplace.service.ts calls), with
      DealStatusCard's isService flag purely a presentation-layer branch, not a separate
      data model or separate set of API calls. This directly confirms services.md's
      "hands off to marketplace's order lifecycle" flag from Step 4.

   -> OfferCard.tsx has no service-specific branch at all (no isService/dealKind check found in
      that file) — accept/reject/counter for a booking presumably still routes through the same
      offer endpoints (acceptOffer/rejectOffer/respondToOffer/withdrawOffer), unconfirmed whether
      a booking-negotiation actually creates an "offer" record or a "booking request" record
      under the hood; OfferCard's generic marketplace-branded copy ("Marketplace · New Offer")
      was not seen to special-case bookings — worth flagging, not confirmed as a bug.
   v
Completion:
   /services/[id]'s own page (non-owner) also exposes "Rate" independently of the chat flow:
      RateServiceModal -> POST /services/{id}/rate {rating 1-5, review?}
      This is a SEPARATE action from the chat-driven "Confirm Job Completed" button — rating is
      not gated behind order completion in the UI (no client-side check that the order/booking
      reached 'completed' before showing Rate), per Step 4's services.md page-matrix entry.
```

## Prose walkthrough
Booking starts identically to a marketplace purchase intent: pick a service, open `BookModal`, submit a
date/time and optional notes, which fires `POST /services/:id/book`. Per Step 4's cross-reference this
mirrors marketplace's offer flow rather than instantly confirming — the request lands in a negotiation
state visible on `/services/my-bookings` (pending/countered/accepted/rejected/expired/cancelled), with
the client able to withdraw while still pending or countered. Reading `DealStatusCard.tsx` directly
confirms the handoff Step 4 flagged: once a booking is accepted, it becomes a real marketplace Order —
the exact same `orderId`-keyed confirm-payment/confirm-receipt/mark-shipped/confirm-delivery calls run,
just with service-flavored labels (no shipping step, "Mark Job Started" instead of "Mark as Sent",
"Confirm Job Completed" instead of "Confirm Delivery Received"). Rating is a separate, ungated action
available directly from the service's detail page at any time — not strictly sequenced after order
completion in the frontend.

## Cross-references
- Step 4 pages: `/services`, `/services/[id]`, `/services/create`, `/services/my-bookings`, `/services/my-favorites`, `/work` (marketplace-jobs-services.md) — trusted the "mirrors marketplace's offer endpoints" and legacy-bookings-dead findings, confirmed the order-handoff directly this pass
- Chat components: `components/chat/DealStatusCard.tsx` (service branch verified line-by-line), `components/chat/OfferCard.tsx` (no service-specific branch found)
- Step 5 routes: `/services/[id]` (real detail page), `/services/my-bookings` (auth-gated, redirects to `/login`)

## Gaps or inconsistencies found
- **Confirmed handoff to marketplace Order lifecycle**, directly from `DealStatusCard.tsx`'s `isService`/`meta.dealKind === 'service'` branching — this is not an inference, the same component and same API calls (`marketplaceService.confirmPayment/confirmReceipt/markShipped/confirmDelivery`) serve both flows, differing only in copy.
- `OfferCard.tsx` shows no service-aware branch — its accept/reject/counter UI is generically marketplace-labeled ("Marketplace · New Offer/Counter Offer") even when it's actually mediating a service booking negotiation, unlike `DealStatusCard` which does relabel for services. Worth checking against real booking-negotiation chat data in a later step to confirm whether this is a real inconsistency or whether bookings never actually flow through `OfferCard` (unconfirmed which record type — offer vs. booking-request — a countered booking actually produces).
- Rating (`RateServiceModal`, `POST /services/:id/rate`) is not gated behind order/booking completion status anywhere in the traced `/services/[id]` code — a user could rate a provider before (or without) ever completing a booking through the chat flow.
- Confirms Step 4's finding: `/services/my-bookings` correctly uses the current `getMyBookingRequests()` system, not the three legacy-deprecated methods (`getMyBookings`, `cancelBooking`, `updateBookingStatus`), which still have zero call sites anywhere.

---

# Journey: Listing/posting creation and management — sell an item, hire, or offer a service

## Trigger
User taps a "Create"/"Post" CTA from `/marketplace`, `/jobs`, `/services`, or `/work` (which reuses the
same browse components and their CTAs) — landing on `/marketplace/create`, `/jobs/create`, or
`/services/create`. Owners of an existing listing reach `/marketplace/[id]/edit` from `/marketplace/my-listings`.

## Flow

```
/marketplace/create (page.tsx) -> ProductForm (shared with edit, isEditing=false)
   Fields: title (3-100 chars), description (>=10 chars), price (₦, converted to kobo via toKobo()),
   category (fixed 9-option dropdown), condition (new/like_new/good/fair/poor pill picker),
   images (up to 5, <input type=file multiple>, client-side count validated), negotiable (checkbox,
   create-only — hidden entirely on edit), location (NOT entered by the user — silently pulled from
   useRegisteredLocation(), i.e. the signup-time address; shows "Set location" CTA to /settings/location
   if none found; blocks submit)
      -> POST /marketplace  (multipart if File[] images present, else JSON)
      -> onSuccess: PostCreationSuccessSheet shown in-page, "Dismiss" pushes to
         /marketplace?product={id}  (back into the browse-grid inline-detail pattern, Journey 1)

/marketplace/[id]/edit (PageClient.tsx) -> same ProductForm, isEditing=true
   -> GET /marketplace/{id} to prefill -> PATCH /marketplace/{id} on submit
   -> onSuccess: router.push(/marketplace?product={id}) directly (NO PostCreationSuccessSheet on edit,
      unlike create)
   -> NO in-code guard, warning, or check anywhere in ProductForm.tsx/PageClient.tsx for "does this
      listing have an active deal in progress?" before allowing an edit or resubmitting price/images —
      see Gaps below, this was checked directly, not assumed.

/jobs/create (page.tsx) -> CreateJobForm.tsx (jobs-only, NOT shared with services/marketplace)
   Fields: title, description, type (5-option select: full-time/part-time/contract/freelance/internship),
   category (10-option select), workMode (on-site/remote/hybrid), salary (optional: min+max -> toKobo(),
   currency, period), skills (dynamic add/remove text-input rows, min 1), requirements (same pattern,
   optional), expiresAt (optional date picker, min=today), location (same pattern as marketplace —
   silently pulled from useRegisteredLocation(), no user-facing field)
      -> POST /jobs (JSON, no multipart — no image/file upload in this form at all)
      -> onSuccess: setShowSuccess(true) -> PostCreationSuccessSheet(type="job") -> dismiss pushes /jobs

/services/create (page.tsx) -> CreateServiceForm.tsx (services-only, NOT shared with jobs/marketplace)
   Fields: title, description, category (12-option select) + subcategory (dependent select, options
   keyed off category via a local SUBCATEGORIES map), pricing (3-way type picker: fixed/hourly/custom
   -- "custom" hides the amount field entirely and shows "Clients will contact you to negotiate a
   price"), availability (day-of-week multi-toggle, defaults Mon-Fri, min 1 required + free-text hours
   string, no time picker), images (up to 6, FileReader-based live preview grid, distinct upload UI from
   marketplace's)
      -> POST /services (multipart via imageFiles field)
      -> onSuccess: router.push("/services") DIRECTLY — no PostCreationSuccessSheet at all, the only one
         of the three creation flows that skips it entirely (see Gaps)
   No useRegisteredLocation()/location field found in this form at all — services listings appear to
   carry no geolocation the way marketplace/jobs do (not confirmed against the actual POST /services
   payload shape beyond what CreateServiceForm.tsx sends; flagging, not fabricated).

===== SAVE-FOR-LATER: THREE SEPARATE MECHANISMS, NOT SHARED =====
/jobs/saved   GET /jobs/my/saved -> useSavedJobs()  |  toggle via POST/DELETE /jobs/{id}/save
   BUG, confirmed by direct read of both files: JobCard.tsx's onSave callback signature is
   (jobId, isSaved) => onSave(jobId, !isSaved) — i.e. it always tells the caller the OPPOSITE of the
   current state, so the caller can decide save vs unsave. But /jobs/saved's page wires
   onSave={(id) => saveJob.mutate({ jobId: id, saved: true })} — hardcoded saved:true, ignoring the
   boolean JobCard actually passes. Since useSaveJob() branches POST-vs-DELETE on that `saved` flag
   (per Step 4's page-matrix notes), tapping "unsave" on an already-saved job on THIS page would fire a
   second POST /jobs/{id}/save (re-save), not the DELETE needed to remove it from the list. This is a
   new, sharper confirmation of the "worth checking JobCard's internal toggle logic" flag Step 4 raised
   but left open — now confirmed as a real wiring bug, not just worth checking.
/services/my-favorites   GET /services/my/favorites -> useMyFavorites()  |  toggle via
   POST/DELETE /services/{id}/favorite, wired correctly (mutate receives {serviceId, favorited} pulled
   straight from ServiceCard's own callback args, no hardcoded flag).
/marketplace has NO dedicated "my-saved-items" PAGE at all. Step 4 already flagged marketplace's
   save/unsave calls (saveItem/unsaveItem/getSavedItems, hitting /marketplace/items/{id}/save and
   /marketplace/saved) as UNMATCHED against the 30-route registry — i.e. likely-dead/broken calls that
   don't correspond to any real backend route. Confirmed again this pass: no /marketplace/saved or
   /marketplace/my-saved page.tsx exists anywhere in the file tree. So marketplace's "save an item for
   later" concept — unlike jobs (saved) and services (favorites) — has no working end-to-end feature at
   all: the mutation calls may 404, and even if they didn't, there is no page to view the resulting list.
   The closest marketplace analog to bookmarking is "Like" (POST /marketplace/{id}/like, a different,
   working, registry-matched endpoint) — but likes aren't surfaced as a personal saved-items list
   anywhere either.
```

## Prose walkthrough
The three creation forms are entirely independent implementations, not a shared component or pattern —
confirmed by reading all three source files directly. `ProductForm` (marketplace) uses a
"glass"-styled input system (`glassField`/`glassLabel` classes) and is the only one of the three that's
dual-purpose (same component drives both create and edit, switching on an `isEditing` prop and an
optional `product` prop). `CreateJobForm` and `CreateServiceForm` are single-purpose, create-only
components using a completely different "neu"/`mod-card`/`mod-chip` neumorphic styling system, and
neither has a corresponding edit form anywhere in the tree — jobs and services listings, once posted,
cannot be edited through the UI at all (only marketplace has `/[id]/edit`). All three silently source
their money fields through the same `toKobo()` helper and their location (where present) through the
same `useRegisteredLocation()` hook — the one piece of real convergence — but the actual form markup,
validation, image-upload UI, and post-submit success handling are all bespoke per module. Editing a
marketplace listing raises a real, unresolved question: `ProductForm`/`PageClient.tsx` for
`/marketplace/[id]/edit` contain no check, warning, or lock for the case where the listing already has
one or more live deals attached to it (an accepted offer, a paid-but-unshipped order, etc.) — a seller
can freely change the price, condition, or images of a listing mid-deal, and nothing in the traced
source reconciles that against whatever `DealStatusCard` is showing the buyer in the deal's chat
thread. Save-for-later is the second real inconsistency in this journey: jobs and services each have a
working, page-backed bookmark feature (though jobs' is bugged on the unsave path), while marketplace has
no equivalent feature at all — its closest analog (Like) doesn't produce a personal reading list, and
its actual saved-items API calls are the same ones Step 4 already flagged as unmatched against the
verified route registry.

## Cross-references
- Step 4 pages: `/marketplace/create`, `/marketplace/[id]/edit`, `/jobs/create`, `/jobs/saved`,
  `/services/create`, `/services/my-favorites` (marketplace-jobs-services.md) — trusted the unmatched
  marketplace save/unsave finding, confirmed the JobCard/jobs-saved wiring bug directly this pass
- Components (new this pass): `components/marketplace/ProductForm.tsx`, `components/jobs/CreateJobForm.tsx`,
  `components/services/CreateServiceForm.tsx`, `components/jobs/JobCard.tsx` (onSave signature read
  line-by-line), `components/shared/PostCreationSuccessSheet.tsx` (referenced, not opened — its own
  internals weren't traced, only its call sites and the `type` prop values passed to it)
- Journey 1 (this file): the created/edited listing feeds directly into the buy-now/make-offer flow
  traced there; this journey stops at "listing exists," Journey 1 picks up from "listing is browsed"

## Gaps or inconsistencies found
- **New finding, confirmed by direct source comparison**: `/jobs/saved`'s unsave button is wired
  backwards — it always re-issues a save call instead of an unsave call, because the page hardcodes
  `saved: true` in its `onSave` callback instead of using the boolean `JobCard` actually passes. A user
  on this specific page cannot successfully remove a job from their saved list by tapping the bookmark
  icon there (the same action from `/jobs` or `/jobs/[id]`, where `saved` is presumably computed
  correctly per Step 4's page notes, isn't affected — this is specific to `/jobs/saved`'s own wiring).
- **New finding**: marketplace has no save-for-later feature end-to-end — no page, and the only backing
  calls (`saveItem`/`unsaveItem`/`getSavedItems`) are the same ones Step 4 flagged as hitting routes
  absent from the verified 30-route registry. Combined with today's confirmation there's no
  `/marketplace/saved`-shaped page in the file tree, this looks like a fully-abandoned feature stub, not
  just a broken button.
- **New finding**: no listing-edit affordance exists for jobs or services at all — only marketplace has
  `/[id]/edit`. Whether this is intentional (job/service reposting instead of editing) or a missing
  screen is unconfirmed from source; flagging since it's a real asymmetry between the three creation
  flows a rebuild should decide on deliberately rather than copy accidentally.
- **New finding**: editing a marketplace listing (`/marketplace/[id]/edit`) has no guard against editing
  out from under an in-progress deal — no check for existing offers/orders on that product anywhere in
  `ProductForm.tsx` or the edit `PageClient.tsx`. Whether the backend independently protects
  in-progress-deal fields (e.g. locking price once an offer is accepted) is outside frontend-code scope
  and unverified here — flagged as an open question, not a confirmed backend gap.
- The three creation forms share zero component code beyond generic primitives (`PremiumTextArea`) and
  the `toKobo()`/`useRegisteredLocation()` utilities — confirmed by reading all three in full, not
  inferred from naming. A rebuild aiming for a unified "create a listing" pattern would be building that
  convergence fresh, not extracting an existing one.
- `CreateServiceForm`'s success path (`router.push("/services")`, no success sheet) is inconsistent with
  both `ProductForm`'s and `CreateJobForm`'s use of `PostCreationSuccessSheet` — a real UX gap, not
  fabricated, confirmed by the absence of any `PostCreationSuccessSheet`/`showSuccess` state anywhere in
  `CreateServiceForm.tsx`.
- Per Step 4's already-flagged note (re-confirmed by reading `CreateServiceForm.tsx` directly): no
  client-side 6-image cap enforcement bug was found here — the component does correctly cap at 6 via
  `files.slice(0, 6 - imageFiles.length)` and disables the add-photo button/hides the "Add" tile past 6.
  Marketplace's cap (5 images) is similarly enforced client-side. Noting as confirmed-fine, not a gap.

---

# Journey: Work hub (/work)

## Trigger
User navigates to `/work` directly, or via a nav entry (not traced this pass — out of scope, this
journey only covers the page's own behavior once landed on).

## Flow

```
/work (page.tsx)
   Renders a Hiring / For Hire tab switcher (role="tablist") over a shared AppBrowseLayout shell.
   Initial tab resolved from ?tab= query param: "for_hire" or "services" -> For Hire tab; anything
      else (including no param) -> Hiring tab.

   Hiring tab   -> <JobsBrowse filters={jobFilters}> + <JobsToolbar>
                   SAME component (components/work/JobsBrowse.tsx) that /jobs itself renders --
                   confirmed by import, not inference. Identical API calls: GET /jobs, POST/DELETE
                   /jobs/{id}/save, POST /jobs/{id}/apply (via the same ApplyModal chain).
   For Hire tab -> <ServicesBrowse category minRating> + <ServicesToolbar>
                   SAME component (components/work/ServicesBrowse.tsx) /services renders. Identical
                   calls: GET /services, POST/DELETE /services/{id}/favorite.

   Filter state (jobFilters, category, minRating) is local to this page's own useState -- switching
      tabs does NOT navigate to /jobs or /services; both browse surfaces render inline, tab-hidden,
      inside the same /work route. No separate API surface of its own.
```

## Prose walkthrough
`/work` is exactly what its own top-of-file comment says it is (verified, not assumed from the route
name): "a light merge" — a single page wrapping the exact same `JobsBrowse`/`ServicesBrowse` components
that back the standalone `/jobs` and `/services` routes, toggled by local tab state rather than routing.
It is not a distinct feature, a dashboard, or a "your work" personal summary — it is a second entry
point into browsing the same two datasets, with no page-specific API calls, no unique data, and no
unique actions beyond what `/jobs` and `/services` already offer individually (apply, save, favorite —
all identical hook calls). The standalone `/jobs`/`/services` routes and all of their sub-pages
(`/jobs/create`, `/jobs/saved`, `/jobs/my-applications`, `/services/create`, `/services/my-favorites`,
`/services/my-bookings`) remain fully intact and reachable outside `/work` — this page is purely an
additional aggregating shell, confirmed by the file's own comment and by the shared-component imports.

## Cross-references
- Step 4 page: `/work` (marketplace-jobs-services.md) — this pass directly confirms Step 4's finding
  word-for-word: "unified Hiring/For Hire hub... identical calls to those two pages, just toggled by
  tab state." No new discrepancy found; this journey exists mainly to give `/work` an explicit,
  documented flow entry since it wasn't one of the four original journeys.
- Journey 2 (Job application) and the service-booking journey (Journey 4, original file): both apply
  unchanged when reached via `/work`'s Hiring/For Hire tabs — same `ApplyModal`, same favorite/save
  toggles, same downstream chat handoff for bookings.

## Gaps or inconsistencies found
- None found specific to `/work` itself beyond what Step 4 already flagged — this pass's direct read of
  `work/page.tsx` fully confirms the "identical API surface, no separate data" finding rather than
  surfacing anything new. Noting for completeness: the `jobFilters`/`category`/`minRating` filter state
  is NOT synced to the URL (only the initial tab is, via `?tab=`), so refreshing the page or sharing a
  `/work` link loses any in-progress filter selection — a minor UX gap, not present on `/jobs`/`/services`
  standalone (not independently verified whether those two persist filters to the URL either — out of
  scope, flagging only the `/work`-specific loss-on-refresh behavior actually observed in this file).

---

# Journey: Premium / HuudCoin purchase and seller payout setup

## Trigger
User navigates to `/premium` (legacy link/bookmark) or is mid-way through a HuudCoin-spending action
elsewhere in the app (boost a listing, tip a user, etc. — those flows live outside this cluster per
Step 4). Separately, a seller who wants to receive marketplace sale proceeds visits `/settings/payout`.

## Flow

```
/premium (page.tsx)
   NOT a real page — client-side redirect only (confirmed, matches Step 4/5 exactly):
      router.replace("/huud-economy/wallet?tab=tier")   [renders null, zero API calls]
   Comment in source: "Legacy route — activity tier lives in the HuudCoins wallet hub."
   -> "Premium" as a product concept does NOT exist as verified from source. There is no tier
      purchase, subscription, or paywall found anywhere in this cluster or its redirect target's
      first ~120 lines read this pass (/huud-economy/wallet's "tier" tab shows an activity-tier
      panel — HuudCoinTierPanel — which by name and by every other confirmed pattern in this app is
      a GAMIFICATION/achievement tier (earned via activity), not a paid subscription tier; its
      internals were not read exhaustively enough to rule out a purchase CTA inside that specific
      panel, flagging as the one soft spot in this finding).

===== HOW A USER ACTUALLY SPENDS/ACQUIRES HUUDCOIN =====
usePayments.ts's own top-of-file comment states the ground truth plainly:
   "All platform transactions are denominated in HuudCoins. There is no fiat gateway.
    Transactions are instant (no redirect)."
This directly confirms payments.md's earlier "internal points economy, no external gateway" finding —
   now verified against the hook implementation itself, not just the registry doc.

useInitiatePayment()  (wraps POST /payments/initiate, type: listing_boost | job_boost | service_boost |
   event_boost | tip_user | event_ticket | marketplace_pledge | service_payment)
   onSuccess handling in the hook itself:
      IF result.paymentUrl exists -> window.location.href redirect (dead code path per the hook's own
         inline comment: "If a legacy paymentUrl somehow exists, redirect (future-proofing only)" —
         i.e. the author does not expect this branch to fire under current backend behavior)
      ELSE (the actual/only observed path) -> toast "🪙 N HuudCoins deducted • Balance: X", then
         invalidate wallet/stats/payment-history caches IN PLACE. No navigation. No success page.
   -> CONFIRMED BY REPO-WIDE GREP: useInitiatePayment has ZERO call sites anywhere in the frontend.
      Not called from the wallet page, not from HuudCoinTierPanel (grepped directly, no match), not
      from any boost modal (Journey-1/4-confirmed: boosts call marketplace/jobs/services' own
      module-specific /boost endpoints directly, bypassing /payments/initiate entirely), not from any
      tip UI (per Step 4's cross-cluster notes, tipping goes through profile page's own
      gamificationService.tipUser or paymentsService.tipUser — a separate hook, useTipUser, which
      IS wired to a real call site outside this cluster). No event-ticket or marketplace_pledge or
      service_payment call site was found either.
   -> CONSEQUENCE: nothing in the currently-traced frontend actually calls the one hook that could
      produce a paymentUrl-shaped redirect or a reference a user would later verify. The generic
      "initiate a payment" pathway appears to be dead/unused code, not a live feature with a
      not-yet-discovered entry point — every real spend in this app (boosts, tips) goes through its
      own dedicated, instant, non-redirecting endpoint instead.

/premium/success (page.tsx) — real page, IS the page payments.md's GET /verify/:reference comment
   refers to (confirmed directly, matches Step 4's finding word-for-word)
   Reads reference from ?reference= (current) or ?trxref= (legacy Paystack-shaped fallback, kept for
      compatibility per its own comment)
   GET /payments/verify/{reference} -> useVerifyPayment()
   States: no-reference (info + "View Wallet" link) / loading (spinner) /
      success (payment.status==="completed": shows coinsSpent + description, invalidates wallet/stats/
      currentUser caches, "View Wallet" + "Go to Feed" buttons) /
      failure (isError: "Transaction Not Found" vs plain failure: "Transaction Failed", "Contact
      Support" mailto link)
   -> CONFIRMED BY REPO-WIDE GREP: zero internal links to "/premium/success" or "premium/success"
      exist anywhere in pwa/src. Combined with the useInitiatePayment dead-code finding above, this
      page currently has NO discoverable entry point from anywhere in the traced frontend — a user
      could only land here via a bookmarked/shared URL or a reference embedded in some
      out-of-app channel (email, push notification deep link — unverifiable from frontend source).
      This sharpens Step 4's softer "reached from nowhere in this cluster... presumably linked from
      the wallet/boost purchase flow" note into a stronger, repo-wide-confirmed finding: it isn't just
      unreachable from marketplace/jobs/services, it's unreachable from anywhere in pwa/src that was
      grep-checked.

/settings/payout (page.tsx) — seller's bank-payout setup, UNRELATED to HuudCoin (fiat bank transfer,
   not points economy)
   GET /marketplace/payout-details -> prefills form if hasPayoutDetails; never cached (explicit
      in-code comment: not persisted to localStorage, refetched fresh every visit)
   Fields: bank name, 10-digit account number (client-validated regex), account name (must match the
      user's registered signup name — enforced server-side per the page's own copy, not independently
      confirmed against a real backend response in this pass), current password (step-up re-auth,
      required on every save, explained in-copy as protection against session hijacking redirecting
      payouts)
      -> PUT /marketplace/payout-details
      -> toast-only success/error (sonner), no dedicated success screen
   -> THIS is the account DealStatusCard shows to the BUYER during a deal (Journey 1 in the existing
      file: "'started'/'accepted', buyer's turn: shows seller's bank details... via
      GET /orders/:orderId/payout-details if absent") — confirmed by this page's own top-of-file
      comment: "the account buyers pay into when they buy from you... shown to the buyer in the deal
      chat." A seller needs to have completed THIS page at least once before their first sale can
      show the buyer where to send money; if they haven't, DealStatusCard's fallback fetch
      (GET /orders/:orderId/payout-details) would presumably come back empty — not independently
      traced what DealStatusCard renders in that specific empty-details case this pass (flagged, not
      fabricated).
   -> Per Step 4: the only page in this entire cluster calling marketplaceService methods directly
      instead of through a React Query hook — reconfirmed, no hook wrapper found for
      getMyPayoutDetails/savePayoutDetails anywhere in hooks/.
```

## Prose walkthrough
"/premium" as a concept does not exist in any purchasable-tier sense — it is a dead legacy URL that
immediately bounces to the HuudCoins wallet's gamification-styled "tier" tab, which by every pattern
confirmed elsewhere in this app (streaks, badges, activity scores) is an earned tier, not a paid one, a
reading this pass could not fully rule out but found no purchase CTA for. The real story, confirmed at
the hook level in `usePayments.ts`'s own header comment, is that NeyborHuud has no fiat payment gateway
at all — HuudCoin is a closed points economy, and every real spend observed elsewhere in the app (boosts
in Journeys 1 and 4, tips on profile pages per Step 4) calls its own dedicated, instant, non-redirecting
endpoint rather than the generic `/payments/initiate` → `/payments/verify` → `/premium/success` pipeline
that `payments.md` documents as the registry's intended shape. That generic pipeline is fully built —
`useInitiatePayment`'s redirect-handling branch, `/premium/success`'s four rendered states, the
`PAYMENT_TYPE_LABELS` map covering boosts/tips/tickets/pledges — but a repo-wide grep this pass found
**zero call sites** for `useInitiatePayment` and **zero internal links** to `/premium/success` anywhere
in the frontend. This is a stronger, source-confirmed version of what Step 4 only lightly flagged: the
entire "initiate → verify → success page" payment flow appears to be dead scaffolding in the current
frontend, superseded everywhere by module-specific instant-spend endpoints that never touch it.
`/settings/payout` is a completely separate, unrelated concern despite living in the same task grouping
— it's the seller's real-money bank account (fiat, not HuudCoin), set up once and then silently consumed
by `DealStatusCard` (Journey 1) every time a buyer needs to know where to send payment for that seller's
listings. The step-up password re-entry on this one settings page is a deliberate, explained security
measure given what's at stake (redirecting someone's sale proceeds), not an oversight.

## Cross-references
- Step 4 pages: `/premium`, `/premium/success`, `/settings/payout` (marketplace-jobs-services.md) —
  trusted the page-type classifications (redirect / real / real) and the initial verify-page/payout
  findings, source-confirmed and sharpened both this pass (dead-code call-site status for
  useInitiatePayment; zero-internal-link status for /premium/success)
- Step 5 routes: `/premium` (redirect to `/huud-economy/wallet?tab=tier`), `/premium/success` (real, no
  Step 5 flag beyond noting it as real) (route-classification.md)
- Journey 1 (this file, original): DealStatusCard's payout-details display for the buyer is the direct
  downstream consumer of whatever the seller sets on `/settings/payout` — this journey traces the
  producer side of that same data
- `hooks/usePayments.ts`, `services/payments.service.ts` (new source this pass, not in either Step 4 or
  Step 5's file lists)

## Gaps or inconsistencies found
- **New finding, confirmed by repo-wide grep**: `useInitiatePayment()` — the hook wrapping the
  registry's central `POST /payments/initiate` route and the only client-side path that could produce a
  `paymentUrl`/reference flow into `/premium/success` — has no call sites anywhere in `pwa/src`. This
  upgrades Step 4's "no call site found in this cluster" (scoped to marketplace/jobs/services/work) to a
  repo-wide finding: it has no call site anywhere in the traced frontend, period.
- **New finding, confirmed by repo-wide grep**: `/premium/success` has zero internal links anywhere in
  `pwa/src` — no page or component constructs a URL to it. Combined with the above, this page is
  currently reachable only by a bookmarked/shared/deep-linked URL from outside the traced frontend
  (e.g., an email or push notification, unverifiable from this codebase). A rebuild should treat this as
  either dead code to retire or a flow to actually finish wiring up, not as a working, reachable screen.
- `/premium` itself is confirmed dead-end legacy (Step 4/5 already established this; re-confirmed, no
  new finding).
- `HuudCoinTierPanel.tsx` (the actual content shown after `/premium`'s redirect) was not read in full
  this pass — only grepped for purchase-flow keywords (`initiatePayment`, `reference`,
  `premium/success`), all of which returned no matches. This is suggestive but not a complete read;
  flagging that a full read of that component would be needed to fully rule out any coin-purchase CTA
  living inside the tier panel itself.
- `/settings/payout`'s account-name-must-match-registered-name claim is UI copy only — this pass did not
  independently verify server-side enforcement (no backend code read); noting per the task's own
  "trust Step 4's findings" framing, this specific claim was not previously verified by Step 4 either,
  so it's carried forward as unconfirmed UI copy, not fact.
- Re-confirms Step 4's finding: `/settings/payout` is the only page in this whole cluster (across all 7
  journeys now traced) that bypasses the hooks layer, calling `marketplaceService` methods directly —
  worth normalizing in a rebuild's component/hook conventions.

---

## Summary

Traced all seven journeys end-to-end from source. Marketplace and service-booking fulfillment are
architecturally identical and both live almost entirely inside chat (`DealStatusCard`/`OfferCard`), not
on their respective browse/list pages — confirmed the service booking hands off into the exact same
Order (`orderId`) lifecycle as marketplace, differing only in UI copy. Event RSVP has a confirmed
split-brain: standalone pages only offer binary attend/un-attend, while the documented tri-state
Going/Maybe/Can't-Go only exists inside the event's chat thread via `EventRsvpCard`. The job-application
journey has a real dead end, more severe than Step 4's "Close Job" bug: the entire employer-side review
API (`getJobApplications`, `updateApplicationStatus`) has zero frontend call sites — no page was ever
built for employers to see or act on applicants.

The three creation flows (Journey 5) are confirmed, by direct read of all three components, to be
independent implementations sharing no component code beyond generic primitives (`toKobo()`,
`useRegisteredLocation()`, `PremiumTextArea`) — different styling systems, different form shapes, and
only marketplace supports post-publish editing at all. Save-for-later is similarly fragmented: jobs and
services each have a working bookmark feature, but jobs' own unsave button on `/jobs/saved` is
confirmed wired backwards (always re-saves instead of unsaving), and marketplace has no save-for-later
feature at all beyond the same broken/unmatched API calls Step 4 already flagged. Marketplace listing
edits carry no in-code guard against editing a listing that has a live deal in progress — a real,
unresolved question for the rebuild, not confirmed as a bug but confirmed as unguarded.

`/work` (Journey 6) is exactly what its own source comments say: a thin tabbed shell reusing the exact
same `JobsBrowse`/`ServicesBrowse` components and API calls as the standalone `/jobs`/`/services`
routes, with no unique data or actions of its own — Step 4's finding fully confirmed, no new
discrepancy surfaced.

Premium/HuudCoin (Journey 7) turned out to be the most surprising area: `/premium` is dead legacy
scaffolding (confirmed, bounces to a gamification tier panel, not a purchase flow), and — newly
confirmed by repo-wide grep this pass, not just cluster-scoped as Step 4 left it — the entire generic
"initiate payment → verify → success page" pipeline (`useInitiatePayment`, `/premium/success`) has zero
call sites and zero internal links anywhere in the frontend. Every real HuudCoin spend observed
elsewhere in the app (boosts, tips) calls its own dedicated, instant, non-redirecting module-specific
endpoint instead, fully bypassing this pipeline — meaning `/premium/success`, despite being a
fully-built and well-handled page, is currently unreachable from inside the traced frontend.
`/settings/payout`, by contrast, is a live, necessary, and simple page: it's the seller's real-money
bank account, entirely separate from HuudCoin, that `DealStatusCard` (Journey 1) reads from every time a
buyer needs to know where to send payment — the producer side of data Journey 1 already documented being
consumed on the buyer's side.

Across all seven journeys, the same architectural pattern recurs: standalone module pages
(`/marketplace`, `/jobs`, `/services`, `/events`) are almost entirely *initiation and display* surfaces,
while the real fulfillment logic, negotiation, and payment-adjacent action buttons live either inside
chat components (`DealStatusCard`, `OfferCard`, `EventRsvpCard`) or, in the HuudCoin case, inside
module-specific instant-spend hooks that never touch the generic payments pipeline documented in the
registry. A rebuild that treats each module's own page tree as self-contained, or that assumes the
generic payments pipeline is live, would miss most of the actual working UI and would resurrect a dead
pathway, respectively.
