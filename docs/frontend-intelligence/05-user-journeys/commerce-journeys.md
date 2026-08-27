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

## Summary

Traced all four journeys end-to-end from source. Marketplace and service-booking fulfillment are
architecturally identical and both live almost entirely inside chat (`DealStatusCard`/`OfferCard`), not
on their respective browse/list pages — confirmed the service booking hands off into the exact same
Order (`orderId`) lifecycle as marketplace, differing only in UI copy. Event RSVP has a confirmed
split-brain: standalone pages only offer binary attend/un-attend, while the documented tri-state
Going/Maybe/Can't-Go only exists inside the event's chat thread via `EventRsvpCard`. The job-application
journey has a real dead end, more severe than Step 4's "Close Job" bug: the entire employer-side review
API (`getJobApplications`, `updateApplicationStatus`) has zero frontend call sites — no page was ever
built for employers to see or act on applicants.
