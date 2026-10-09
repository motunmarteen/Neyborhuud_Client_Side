# API → Feature → Page Matrix — Community / Events / Gist / FYI

> Cluster: Communities/Hub-Communities, Events, Gist/Gossip/Local News, FYI, Departments, Help
> Request, Weather, News. All routes verified by reading the actual page/component/service source
> under `pwa/src`, cross-referenced against `docs/frontend-intelligence/02-api-registry/*.md`.
> API base URL: `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_API_URL`, falling back to
> `https://api.neyborhuud.com/api/v1` (`pwa/src/lib/api-client.ts`). All paths below are relative to
> that base.

---

## Page: `/communities`
**File(s):** `pwa/src/app/(app)/communities/page.tsx`
**Purpose:** Browse/search/filter hyperlocal hub communities (all/joined/discover tabs), join or create one.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/hub-communities` | GET | `hubCommunityService.list()` -> `useHubCommunitiesList()` | hub-communities.md: GET `/` | search/category/joined filters map to query params |
| `/hub-communities/:hubId/join` | POST | `hubCommunityService.join()` -> `useJoinHubCommunity()` | hub-communities.md: POST `/:hubId/join` | Direct join; success payload may carry `pending` (approval-gated hub) or `conversationId` (routes to chat) |

**Components used:** `CommunityRow`, `CreateCommunityModal`, `AppBrowseLayout`, `BrowseEmptyState`, `BrowseFilterChip`, `BrowseSearchField`, `BrowseTabStrip`.
**Observed states:** join-pending (`pendingJoinId` disables the row's join button while in flight); "Join request submitted - an admin will review it" toast when `payload.pending` true (approval-gated hub); redirect to `/chat/:conversationId` on immediate join; unauthenticated CTA ("Sign in to create or join communities").
**Unmatched calls (if any):** None on this page directly, but see `CreateCommunityModal` below.

### Sub-behavior: `CreateCommunityModal` (rendered from `/communities`)
| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/hub-communities` | POST | `hubCommunityService.create()` -> `useCreateHubCommunity()` | hub-communities.md: POST `/` | |

---

## Page: `/communities/[id]`
**File(s):** `pwa/src/app/(app)/communities/[id]/page.tsx`, `PageClient.tsx`
**Purpose:** Hub community detail - info, join/leave, member list, admin panel, link into group chat.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/hub-communities/:hubId` | GET | `hubCommunityService.get()` -> `useHubCommunity()` | hub-communities.md: GET `/:hubId` | |
| `/hub-communities/:hubId/members` | GET | `hubCommunityService.getMembers()` -> `useHubCommunityMembers()` | hub-communities.md: GET `/:hubId/members` | page 1, up to 12 shown, "+N more" |
| `/hub-communities/:hubId/join` | POST | `hubCommunityService.join()` -> `useJoinHubCommunity()` | hub-communities.md: POST `/:hubId/join` | |
| `/hub-communities/:hubId/leave` | POST | `hubCommunityService.leave()` -> `useLeaveHubCommunity()` | hub-communities.md: POST `/:hubId/leave` | Disabled when `hub.myRole === 'owner'` (owner can't leave own hub) |

**Components used:** `CommunityHubAdminPanel`, `AppBrowseLayout`, `BrowseEmptyState`.
**Observed states:** joined vs not-joined button states; owner cannot leave ("You own this hub"); private vs public badge (`lock`/`public` icon); activity level ("High activity" badge, tone-colored).
**Unmatched calls (if any):** None.

### Sub-behavior: `CommunityHubAdminPanel` (rendered inside `/communities/[id]`)
| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/hub-communities/:hubId/join-requests` | GET | `hubCommunityService.listJoinRequests()` | hub-communities.md: GET `/:hubId/join-requests` | |
| `/hub-communities/:hubId/invites` | POST | `hubCommunityService.createInvite()` | hub-communities.md: POST `/:hubId/invites` | called with `expiresInHours: 168` (7 days) |
| `/hub-communities/:hubId/join-requests/:requestId/review` | POST | `hubCommunityService.reviewJoinRequest()` | hub-communities.md: POST `/:hubId/join-requests/:requestId/review` | approve/reject |

**Observed states:** pending join-request queue (approval-gated membership model in action).
**Note:** `hubCommunityService` also exposes `update()` (PATCH `/:hubId`) and `changeMemberRole()` (PATCH `/:hubId/members/:userId/role`), both wired to hooks (`useUpdateHubCommunity`, `useChangeMemberRole`) - **no caller found in any page/component read in this cluster**. They may be used inside `CommunityHubAdminPanel` beyond what a name-based grep surfaced, or may be dead in the current UI; flagging as unverified rather than confirmed-unused.

---

## Page: `/communities/join/[code]`
**File(s):** `pwa/src/app/(app)/communities/join/[code]/page.tsx`, `PageClient.tsx`
**Purpose:** Invite-code landing page - preview a hub before joining via a shared invite link.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/hub-communities/join/:code/preview` | GET | `hubCommunityService.previewInvite()` (direct `useQuery`, not via a named hook) | hub-communities.md: GET `/join/:code/preview` | |
| `/hub-communities/join/:code` | POST | `hubCommunityService.joinByCode()` (called directly, not through `useJoinHubCommunity`) | hub-communities.md: POST `/join/:code` | Third membership model: invite-code join, distinct from direct `/join` and approval `/join-requests` |

**Components used:** `AppBrowseLayout`, `BrowseEmptyState`.
**Observed states:** invalid/expired invite ("Invalid invite"); pending admin approval even via invite code ("Join request sent for admin approval") - confirms invite-code hubs can still be approval-gated.
**Unmatched calls (if any):** None.

---

## Page: `/events`
**File(s):** `pwa/src/app/(app)/events/page.tsx`
**Purpose:** Browse/filter all events, infinite-scroll list, quick attend action.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/events` | GET | `eventsService.getEvents()` -> `useEvents()` | events.md: GET `/` | type/date filters |
| `/events/:id/attend` | POST | `eventsService.attendEvent()` -> `useAttendEvent()` | events.md: POST `/:id/attend` (legacy binary) | Page uses the legacy binary attend/unattend, not the tri-state `/rsvp` the service also exposes |
| `/events/:id/attend` | DELETE | `eventsService.unattendEvent()` -> `useAttendEvent()` | events.md: DELETE `/:id/attend` | |

**Components used:** EventCard, EventFilters, LocalHuudHubHeader, LocalHuudHubPrimaryAction, AppBrowseLayout, BrowseEmptyState.
**Observed states:** binary attending/not-attending toggle via event.isAttending; loading skeletons; empty state with CTA to create.
**Unmatched calls (if any):** None - but see cross-cluster note on legacy vs tri-state RSVP below.

---

## Page: `/events/[id]`
**File(s):** `pwa/src/app/(app)/events/[id]/page.tsx`, `PageClient.tsx`
**Purpose:** Full event detail - hero, organizer actions (cancel/delete/edit/post update/boost), attendees, comments, share, report.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/events/:id` | GET | `eventsService.getEvent()` -> `useEvent()` | events.md: GET `/:id` | Cached client-side via event-detail-cache for instant reload |
| `/events/:id/cancel` | POST | `eventsService.cancelEvent()` -> `useCancelEvent()` | events.md: POST `/:id/cancel` | Reason required, min 5 chars |
| `/events/:id` | DELETE | `eventsService.deleteEvent()` -> `useDeleteEvent()` | events.md: DELETE `/:id` | Organizer-only, confirm() dialog |
| `/events/:id/report` | POST | `eventsService.reportEvent()` -> `useReportEvent()` | events.md: POST `/:id/report` | Non-organizers only |
| `/events/:id/attendees` | GET | `eventsService.getAttendees()` -> `useEventAttendees()` | events.md: GET `/:id/attendees` | Opened via View list on attendee count |
| `/events/:id/update` | POST | `eventsService.postEventUpdate()` (direct call in PostUpdateModal, no hook) | events.md: POST `/:id/update` | Organizer broadcast |
| `/events/:id/comments` | GET | `eventsService.listComments()` -> `useEventComments()` | events.md: GET `/:id/comments` | |
| `/events/:id/comments` | POST | `eventsService.addComment()` -> `useEventCommentMutations()` | events.md: POST `/:id/comments` | |
| `/events/comments/:commentId` | DELETE | `eventsService.deleteComment()` -> `useEventCommentMutations()` | events.md: DELETE `/comments/:commentId` | |
| `/events/:id/share` | GET | `eventsService.getEventSharePayloadWithFallback()` -> `useEventSharePayload()` | events.md: GET `/:id/share` | Falls back to client-built share links on 404/502/503 |
| `/events/:id/share` | POST | `eventsService.recordEventShare()` -> `useRecordEventShare()` | events.md: POST `/:id/share` | Analytics record after actual share |

**Components used:** EventComments, EventShareSheet, CancelModal, ReportModal, PostUpdateModal, AttendeesModal, LocalHuudSubpageShell.
**Observed states:** organizer-only action panel; cancelled ring + cancellation-reason banner; completed status badge; free vs ticketed price badge.
**Unmatched calls (if any):** None.

---

## Page: `/events/create`
**File(s):** `pwa/src/app/(app)/events/create/page.tsx`, `components/events/CreateEventForm.tsx`
**Purpose:** Create a new event (auth-gated, redirects to /login if unauthenticated).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/events` | POST | `eventsService.createEvent()` -> `useCreateEvent()` | events.md: POST `/` | Multipart when cover image attached |

**Components used:** CreateEventForm, GlassFormPage, LocalHuudSubpageShell.
**Observed states:** upload progress callback; redirect to /events on success.
**Unmatched calls (if any):** None.

---

## Page: `/events/[id]/edit`
**File(s):** `pwa/src/app/(app)/events/[id]/edit/page.tsx`, `PageClient.tsx`
**Purpose:** Organizer-only event edit form.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/events/:id` | GET | `eventsService.getEvent()` -> `useEvent()` | events.md: GET `/:id` | Pre-fills form |
| `/events/:id` | PUT | `eventsService.updateEvent()` -> `useUpdateEvent()` | events.md: PUT `/:id` | Multipart when new cover image attached |

**Components used:** LocalHuudSubpageShell (page-local form, not shared with create).
**Observed states:** access guard - edit blocked unless user.id equals event.organizerId (client-side only).
**Unmatched calls (if any):** None.

---

## Page: `/events/my-events`
**File(s):** `pwa/src/app/(app)/events/my-events/page.tsx`
**Purpose:** Tabbed view of events the user is attending vs organizing; organizer boost action.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/events/my/attending` | GET | `eventsService.getMyEvents()` -> `useMyEvents()` | events.md: GET `/my/attending` | |
| `/events/my/organized` | GET | `eventsService.getMyOrganizedEvents()` -> `useMyOrganizedEvents()` | events.md: GET `/my/organized` | |
| `/events/:id/attend` | POST/DELETE | `eventsService.attendEvent()`/`unattendEvent()` -> `useAttendEvent()` | events.md: POST/DELETE `/:id/attend` | Same legacy-binary pattern |
| `/events/:id/boost` | POST | `eventsService.boostEvent()` -> `useBoostEvent()` | events.md: POST `/:id/boost` | HuudCoin-paid; 3 or 7 day options |

**Components used:** EventCard, BoostModal.
**Observed states:** Boost pill shows active suffix when event.isBoosted; tab badges showing counts; boosted-until date formatting.
**Unmatched calls (if any):** None.

---

## Page: `/events/nearby`
**File(s):** `pwa/src/app/(app)/events/nearby/page.tsx`
**Purpose:** Geolocation-based nearby events with adjustable radius.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/events/nearby` | GET | `eventsService.getNearbyEvents()` -> `useNearbyEvents()` | events.md: GET `/nearby` | radius options 5/10/20/50 km |
| `/events/:id/attend` | POST/DELETE | `eventsService.attendEvent()`/`unattendEvent()` -> `useAttendEvent()` | events.md: POST/DELETE `/:id/attend` | |
| `/geo/reverse-geocode` (indirect, via useGeolocation) | GET | `geoService.reverseGeocode()` | geo.md: GET `/reverse-geocode` | Used by useGeolocation hook, not called directly by the page |

**Components used:** EventCard.
**Observed states:** Acquiring-location loading state; location-denied error state; empty state with radius-expand CTA.
**Unmatched calls (if any):** None.

---

## Page: `/gist`
**File(s):** `pwa/src/app/(app)/gist/page.tsx`
**Purpose:** Current, live top-level Huud Gist community-forum pillar (promoted out of Local News). Section-filterable thread list, create-thread modal.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/huud-gist/sections` | GET | `huudGistService.getSections()` (direct call in useEffect, not a named hook) | gossip.md: GET `/sections` | Falls back to local static section list on failure |
| `/huud-gist` | GET | `huudGistService.listThreads()` -> `useHuudGistList()` | gossip.md: GET `/` | ?section= filter |
| `/huud-gist` | POST | `huudGistService.createThread()` -> `useCreateHuudGist()` | gossip.md: POST `/` | Auth-gated (fixed 2026-08-27); awards gossip_created coins |

**Components used:** HuudGistRow, CreateHuudGistModal, TopNav, BottomNav, BrowseEmptyState.
**Observed states:** 401-specific "Sign in to view Huud Gist" empty state, distinct from generic error state - directly reflects the now-fixed protectAny auth requirement; section-tab active/inactive accent colors; infinite-scroll loading.
**Unmatched calls (if any):** None.

---

## Page: `/gist/[id]`
**File(s):** `pwa/src/app/(app)/gist/[id]/page.tsx`, `PageClient.tsx`
**Purpose:** Single Huud Gist thread detail - full body, like, comment, delete (owner).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/huud-gist/:threadId` | GET | `huudGistService.getThread()` -> `useHuudGistDetail()` | gossip.md: GET `/:id` | |
| `/huud-gist/:threadId/like` | POST | `huudGistService.likeThread()` -> `useHuudGistMutations().likeThread` | gossip.md: POST `/:id/like` | |
| `/huud-gist/:threadId` | DELETE | `huudGistService.deleteThread()` -> `useHuudGistMutations().deleteThread` | gossip.md: DELETE `/:id` | Owner-only (author id match and not anonymous) |
| `/huud-gist/:threadId/comments` | POST | `huudGistService.addComment()` -> `useHuudGistMutations().addComment` | gossip.md: POST `/:gossipId/comments` | Supports anonymous flag; awards gossip_commented coins |

**Components used:** page-local thread/comment markup (no extracted GistDetailCard), TopNav, BottomNav, BrowseEmptyState.
**Observed states:** liked/unliked heart color state; anonymous-post display; anonymous-comment checkbox; 401 vs generic not-found empty states.
**Unmatched calls (if any):** huudGistService.getComments(), likeComment(), deleteComment(), updateThread() (gossip.md's GET /:gossipId/comments, POST /:gossipId/comments/:commentId/like, DELETE /:gossipId/comments/:commentId, PUT /:id) are defined in the service but have no caller found anywhere in this cluster - this detail page renders data.comments inline from the thread-detail payload rather than paginating comments separately, and has no comment-like or comment-delete UI, and no thread-edit UI.

---

## Page: `/gossip`
**File(s):** `pwa/src/app/(app)/gossip/page.tsx`
**Purpose:** Dead/legacy redirect only. Entire file body is redirect('/gist'). No UI, no API calls.

**API Called:** none - this route never renders; Next.js redirect() fires server-side before any client code runs.
**Components used:** none.
**Unmatched calls (if any):** N/A.

---

## Page: `/local-news`
**File(s):** `pwa/src/app/(app)/local-news/page.tsx`
**Purpose:** RSS news reader (Nigeria/International tabs) with a legacy huud-gist tab kept only for backward-compatible URL redirect. Not a Gist UI anymore - the Gist tab content immediately redirects to /gist.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/news/categories` | GET | `newsService.getCategories()` (direct call in useEffect) | news.md: GET `/categories` | Populates source lists and topic taxonomy, with local static fallback |
| `/news/articles` | GET | `newsService.getArticles()` (direct call, no hook) | news.md: GET `/articles` | Primary RSS path - region, topic, sources, limit |
| `/news/feed` | GET | `newsService.getFeed()` via `newsService.getMultipleFeeds()` (client-merge fallback) | news.md: GET `/feed` | Only used if /articles throws; raw-XML parsed client-side via DOMParser |
| `/huud-gist/sections` | GET | `huudGistService.getSections()` | gossip.md: GET `/sections` | Still fetched even though the huud-gist tab is legacy/redirect-only - dead weight |
| `/huud-gist` | GET | `huudGistService.listThreads()` -> `useHuudGistList()` | gossip.md: GET `/` | Also still fetched unconditionally on mount regardless of active tab |

**Components used:** NewsArticleRow, NewsFxStrip, CreateHuudGistModal, HuudGistRow (latter two imported/rendered but unreachable - see below), AppBrowseLayout, BrowseTabStrip, BrowseFilterChip.
**Observed states:** RSS loading/error/empty states; topic and source filter chips; "Headlines open on the publisher site" hint.
**Unmatched calls (if any):** Functionally none are wrong per the registry, but note the huud-gist tab is client-unreachable - see cross-cluster note.

---

## Page: `/local-news/[id]`
**File(s):** `pwa/src/app/(app)/local-news/[id]/page.tsx`, `PageClient.tsx`
**Purpose:** Legacy redirect only - router.replace('/gist/:id'). No API calls; no rendered content besides null.

**API Called:** none.
**Unmatched calls (if any):** N/A.

---

## Page: `/local-news/gist/[id]`
**File(s):** `pwa/src/app/(app)/local-news/gist/[id]/page.tsx`, `PageClient.tsx`
**Purpose:** Legacy redirect only - router.replace('/gist/:id'), same pattern as /local-news/[id]. No API calls.

**API Called:** none.
**Unmatched calls (if any):** N/A.

---

## Page: `/fyi`
**File(s):** `pwa/src/app/(app)/fyi/page.tsx`
**Purpose:** Community-notice bulletin board - subtype-filterable feed, create bulletin, comment/report/delete.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/content/fyi` | GET | `fyiService.getBulletins()` -> `useFYIList()` | content.md "FYI Bulletins": GET `/fyi` (not fyi.md's own-mounted `/fyi` - see cross-cluster note) | type/priority/lga/state/feedTab filters |
| `/content/fyi` | POST | `fyiService.createBulletin()` (called directly inside CreatePostModal, not via a hook) | content.md: POST `/fyi` | Reached through the generic CreatePostModal with defaultContentType="fyi" and lockContentType |
| `/content/posts/:postId` | DELETE (implied via usePostMutations().deletePost) | `usePostMutations()` (declared in hooks/usePosts.ts, outside this cluster's explicit hook list) | content.md: DELETE `/:id` (aliased) | Generic post-delete reused for FYI bulletins |
| `/content/posts/:postId/report` | POST | `contentService.reportPost()` (via ReportModal) | content.md "Reporting": POST `/posts/:id/report` | |

**Components used:** FYICard, FYISubtypeTabs, CreatePostModal, FeedCommentsSheet, ReportModal, LocalHuudHubHeader.
**Observed states:** subtype tab filter; infinite scroll via IntersectionObserver; delete-confirmation dialog; report modal.
**Unmatched calls (if any):** None - but note the page/hook use content.md's `/content/fyi` alias exclusively, never fyi.md's standalone `/api/v1/fyi` mount (see cross-cluster note).

### Sub-behavior: FYICard (rendered on /fyi)
| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/content/posts/:id/like` | POST | `contentService.likePost()`/`unlikePost()` | content.md: POST `/posts/:id/like` (alias) | Generic content like, not FYI-specific |
| `/content/posts/:id/save` | POST | `contentService.savePost()`/`unsavePost()` | content.md: POST `/:id/save` (alias) | |
| `/content/:postId/helpful` | POST | `fyiService.markHelpful()` | fyi.md / content.md: POST `/:id/helpful` | "Mark helpful" reaction |

**Note:** fyiService also exposes pinBulletin/unpinBulletin, updateStatus, endorseBulletin, getEndorsements, rsvpToBulletin, confirmReceipt, getStatusHistory, and shareExternal - none of these have a confirmed caller found in /fyi page code or FYICard as read in this pass. FYICard's full menu (usePostCardMenuActions) was not fully traced line-by-line for pin/endorse/RSVP buttons; flagging these as service-defined, UI-caller-unconfirmed rather than dead, since the menu-actions hook was not exhaustively read.

---

## Page: `/help-request`
**File(s):** `pwa/src/app/(app)/help-request/page.tsx`
**Purpose:** Community financial/material help-request board - category-filterable feed, create request.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/content/posts?contentType=help_request` | GET | `helpRequestService.getRequests()` -> `useHelpRequestList()` | content.md: GET `/posts` (generic feed, filtered client-request-side by contentType) | Not a dedicated /help-request endpoint - reuses the generic content feed with a contentType query param; content.md only documents action sub-routes for Help Request, not a list route, so this is expected, not broken |
| `/content/posts` | POST | `contentService.createPost()` (via CreateHelpRequestModal) | content.md: POST `/posts` | contentType: "help_request" |

**Components used:** HelpRequestCard, HelpRequestCategoryTabs, CreateHelpRequestModal, FeedCommentsSheet, LocalHuudHubHeader.
**Observed states:** category tab filter; infinite scroll.
**Unmatched calls (if any):** None strictly - GET list uses the generic feed route, not a dedicated one; noted above rather than flagged as broken.

### Sub-behavior: HelpRequestCard
| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/content/posts/:id/like` | POST | `contentService.likePost()`/`unlikePost()` | content.md: POST `/posts/:id/like` | |
| `/content/posts/:id/save` | POST | `contentService.savePost()`/`unsavePost()` | content.md: POST `/:id/save` | |
| `/content/posts/:postId/amount` | PATCH | `contentService.updateHelpRequestAmount()` | content.md "Help Request": PATCH `/posts/:id/amount` | Owner self-reports amount received |

---

## Page: `/help-request/[id]`
**File(s):** `pwa/src/app/(app)/help-request/[id]/page.tsx`, `PageClient.tsx`
**Purpose:** Help-request detail - funding progress, bank details, offer-to-help flow, owner confirm/reject offers, status control.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/content/posts/:id` | GET | `helpRequestService.getById()` -> `useHelpRequestDetail()` | content.md: GET `/posts/:id` (alias) | |
| `/content/posts/:postId/help-offers` | GET | `helpRequestService.getOffers()` -> `useHelpOffers()` | content.md "Help Request": GET `/posts/:id/help-offers` | |
| `/content/posts/:postId/help-offers` | POST | `helpRequestService.submitOffer()` -> `useSubmitHelpOffer()` | content.md: POST `/posts/:id/help-offers` | Amount converted to kobo client-side (toKobo()) before sending |
| `/content/posts/:postId/help-offers/:offerId/confirm` | PATCH | `helpRequestService.confirmOffer()` -> `useConfirmHelpOffer()` | content.md: PATCH `/posts/:id/help-offers/:offerId/confirm` | Owner-only; "+5 HuudCoins awarded" shown when offer.coinsAwarded |
| `/content/posts/:postId/help-offers/:offerId/reject` | PATCH | `helpRequestService.rejectOffer()` -> `useRejectHelpOffer()` | content.md: PATCH `/posts/:id/help-offers/:offerId/reject` | Owner-only |
| `/content/posts/:postId/help-status` | PATCH | `helpRequestService.updateStatus()` -> `useUpdateHelpStatus()` | content.md: PATCH `/posts/:id/help-status` | Owner-only; 4-state (open/in_progress/fulfilled/closed) button row |

**Components used:** OfferForm, OfferRow (page-local), MapPinAvatar.
**Observed states:** funding-goal progress bar with percentage and color change at >=100%; offer status badges (pending/confirmed/rejected/expired); "You offered to help" badge for non-owners who already submitted; owner-only status-control buttons with active-state highlight; "This request is {status}" message once inactive; copy-to-clipboard bank account with "Copied" feedback; "Pay with HuudCoins - Coming soon" disabled affordance (not a real API call).
**Unmatched calls (if any):** helpRequestService.updateAmountReceived() (PATCH /content/posts/:id/amount) is defined in the service but this detail page does not call it - that call is made from HelpRequestCard on the list page instead (via contentService.updateHelpRequestAmount, same underlying route, different service wrapper - two services hit the identical endpoint).

---
