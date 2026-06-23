# NeyborHuud — Content Architecture Audit (the shared map)

> **Purpose:** One true picture of every content type, what backs it, where it
> lives in navigation, and where things overlap — so product decisions
> (category merges, the HuudGist move) are made on fact, not guesses.
>
> **Status:** Stage 1 (map reality). No code changed to produce this.
> **Date:** 2026-06-23. **Scope:** PWA (`NeyborHuud-PWA`) + Server (`NeyborHuud-ServerSide`).

---

## TL;DR — the three facts that change everything

1. **There are two storage layers, not one.** A single polymorphic `Content`
   collection holds feed/social posts (all 9 `contentType`s), **but** the
   "structured" sections (Marketplace, Jobs, Services, Events, Incident Reports)
   each own a **dedicated model and collection** that the feed types do not query.
   So "category" means two different things depending on the type.
2. **HuudGist is a separate pillar already** — backed by its own `gossip` model,
   not `Content`. It is structurally a forum, not a category.
3. **`community_alert` ("Alerts") has no backend at all** — it is a frontend-only
   dial label with zero server code. (Like Events' comments were before this work.)

---

## The 8 dial categories (from `src/components/feed/FeedRadialCategories.tsx`)

| # | Dial label | `type` | Tier | Dedicated route | Backend model | Notes |
|---|-----------|--------|------|-----------------|---------------|-------|
| 1 | Market | `marketplace` | A — structured | `/marketplace` +create +detail | `Product` (+`MarketplaceOffer`) | Real commerce store; own module |
| 2 | Services | `services` | A — structured | `/services` +create +detail | `Service` (+`ServiceBooking`/`Rating`/`Favorite`) | Skills/labor |
| 3 | Jobs | `job` | A — structured | `/jobs` +create +detail | `Jobs` (`NewJob`+`JobApplication`/`SavedJob`/…) | Hiring |
| 4 | Events | `event` | A — structured | `/events` +create +detail | `Event` (+`EventAttendee`/`Share`/`Report`/**`EventComment`**) | Comments added this cycle |
| 5 | FYI | `fyi` | B — feed type | `/fyi` (no create/detail) | `Content` (+`FyiModels`) | Notice-board posts |
| 6 | Help | `help_request` | B — feed type | `/help-request` +detail (no create) | `Content` (+`HelpOffer`) | Mutual aid |
| 7 | Alerts | `community_alert` | B — **frontend only** | — | **NONE** ⚠️ | No server code anywhere |
| 8 | Safety Alert | `incident_report` / `emergency` | B/structured hybrid | `/incident-reports` +detail | `IncidentReport` (+`IncidentComment`) | Flagship safety feature |

**Tier A** = own model + collection + CRUD module (a real sub-app).
**Tier B** = a `contentType` value on a `Content` feed post.

---

## The `Content` collection (the feed/social layer)

`src/modules/content/content.model.ts` — one schema, polymorphic:

```
contentType ∈ { post, fyi, gossip, help_request, job, emergency, event, marketplace, services }
cardStyle   ∈ { default, emergency_red, fyi_blue, gossip_neutral,
                marketplace_green, event_purple, services_teal }
```

**Important nuance:** `Content` *can represent* marketplace/job/services/event
posts (for feed display / cross-posting), but the Tier-A modules
(`marketplace`, `jobs`, `services`, `events`) **query their own dedicated
collections, not `Content`.** So for the structured sections, `Content` is at
most a feed mirror — the source of truth is the dedicated model.

This means the same noun (e.g. "a job") can exist in **two places**: the real
`Jobs` collection and (optionally) a `Content` post with `contentType: "job"`.
This duplication is a key thing to resolve in Stage 2.

---

## HuudGist — the forum (separate pillar)

- **Frontend:** `src/types/huudGist.ts`, `huudGist.service.ts`, `useHuudGist.ts`,
  `huud-gist/` components, routes under `/local-news` + `/local-news/gist/[id]`.
- **Backend:** `src/modules/content/gossip.*` — its own `gossip.model.ts`
  (`discussionType`, `channel`), routes, controller. **Not `Content`.**
- **Shape:** Nairaland-style titled threads + nested comments.
- **Sections (~30):** General, Local Gist, Politics, Sports, Relationships,
  Religion, Comedy, Education, Technology, Music, NYSC, University, Health,
  Fashion, Food, Property, Traffic … **plus** `jobs_hustle`, `buy_sell`,
  `local_services`, `events_places`, `safety_alert`, `fyi_notice`,
  `help_support`.

### ⚠️ The collision
HuudGist's section list **duplicates 7 of the 8 dial categories by name**:

| Dial category | HuudGist section that overlaps |
|---|---|
| Market (`marketplace`) | `buy_sell` |
| Services (`services`) | `local_services` |
| Jobs (`job`) | `jobs_hustle` |
| Events (`event`) | `events_places` |
| FYI (`fyi`) | `fyi_notice` |
| Help (`help_request`) | `help_support` |
| Safety (`incident_report`) | `safety_alert` |

If HuudGist becomes a 9th dial category, the app has **two "Jobs," two "Safety,"
two "Buy & Sell."** This is why HuudGist must be a **top-level pillar**
(beside Feed), not a category — a decision already taken.

---

## Current navigation (where things are reachable)

- **Feed** (`/feed`) — primary; hosts the 8-category radial dial.
- **Local News** (`/local-news`) — RSS articles **+ a HuudGist tab** (the
  bundling we plan to undo).
- **Explore / Notifications / Chat** — top-nav actions (`TopNav.tsx`).
- Other routes exist (safety, sos, community-emergency, communities,
  gamification, premium, etc.) but are outside the content-category question.

---

## Overlaps & duplications to resolve (Stage 2 inputs)

1. **HuudGist sections vs. dial categories** — 7 name collisions (table above).
   Decision pending: trim HuudGist's transactional sections so it's pure
   discussion?
2. **`Content` mirror vs. dedicated models** — job/service/marketplace/event can
   live in two collections. Decision pending: is `Content` a deliberate feed
   mirror, or accidental duplication?
3. **Alerts vs. Safety Alert** — `community_alert` (no backend) vs.
   `incident_report` (full backend). Near-synonyms in the UI. Strong merge
   candidate. `community_alert` may simply be dead/aspirational.
4. **Jobs vs. Services** — near-identical card/detail shape; inverse intent
   (hiring vs. offering). Possible "Work" hub merge (lower priority).

---

## Comment surfaces (recent work — for reference)

Unified comment design (FB bubble + IG heart + feed fonts) now applied to:
Feed/FYI/Help (shared `FeedCommentsSheet`), Marketplace (`ProductComments`),
Incident Reports, and **Events** (new backend + UI this cycle).
HuudGist has its **own** comment system (`HuudGistComment`, threaded/`depth`) —
not yet on the unified design.

---

---

# Stage 2 — The destination (decisions taken 2026-06-23)

## Decision 1 — Drop "Alerts", keep "Safety Alert" ✅ AGREED
**Evidence:** `community_alert` has no backend, AND `feed/page.tsx` (lines 141–142)
already maps both `community_alert` and `incident_report` → the SAME `'emergency'`
filter. They are one query wearing two labels.
**Outcome:** Remove the `community_alert` entry from the dial. **8 → 7 categories.**
Zero data loss (it stores nothing). Also remove its now-orphaned welcome-sheet
copy and any `CONTENT_TYPE_TABS` reference.

## Decision 2 — Trim HuudGist's 7 transactional sections ✅ AGREED
**Evidence:** 7 of ~30 Gist sections duplicate dial categories by name.
**Outcome:** Remove `buy_sell`, `jobs_hustle`, `local_services`, `events_places`,
`safety_alert`, `fyi_notice`, `help_support` from Gist. Gist becomes **pure
discussion** (Politics, Sports, Relationships, Culture, Education, …).
**Note:** section list is served by `GET /huud-gist/sections` (backend registry) —
the trim is primarily a **backend registry** change, with frontend fallback labels
(`GIST_SECTION_LABELS`/`GIST_SECTION_ICONS`) updated to match.

## Decision 3 — Content-mirror investigation ✅ DONE (read-only)
**Question:** Is the `Content` collection's marketplace/job/services/event a
deliberate feed mirror or accidental duplication?
**Findings (decisive):**
- `feed.service.ts` queries **`Content` only** — never `Product`/`NewJob`/
  `Service`/`Event`. The feed cannot see the real structured collections.
- The structured modules (`marketplace`/`jobs`/`services`/`events`) **never write
  a `Content` mirror** on create — no `Content.create`, no import.
- **Therefore the two stores are fully disconnected.** A real product is invisible
  in the feed; a feed post with `contentType:"marketplace"` is unrelated to any
  real product. The feed's structured contentTypes are a **parallel "social
  mention" layer**, not a view into the sections.
**Implication for later:** the `Content` structured-types are NOT redundant copies
to delete — they're a distinct (if confusingly-named) feature. Any future
"surface real listings in the feed" work would require explicitly bridging the two
(e.g. mirror-on-create, or feed reads from multiple collections). **Out of scope
now** — flagged for a dedicated decision.

## Decision 4 — Jobs + Services "Work" hub ⏸ DEFERRED
Real candidate (near-identical shape, inverse intent) but lower priority. Revisit
after Decisions 1, 2 and the HuudGist pillar move land.

## Also agreed earlier
- **HuudGist → top-level pillar**, removed from Local News (Local News = RSS only).

---

# Stage 3 — Sequenced moves (FULL PLAN — awaiting approval)

**Principle:** smallest reversible wins first; each step builds + typechecks
before the next; no big-bang refactor. Nothing here is executed until approved.

## Target bottom-nav shape (agreed)
```
BEFORE: Home · Sentinel · [SOS] · Connect · Calls · Profile
AFTER:  Home · Sentinel · [SOS] · Connect · Gist  · Profile
                                   └─ merged hub (tabs):
                                      Near Me / Following / Followers / Map / DMs / Communities
```
- "Connect" absorbs the old "Calls" (`/chat`) inbox as tab(s); name stays **Connect**.
- Freed slot → **Gist** (`/gist`), the HuudGist pillar.

---

## STEP 1 — Drop "Alerts" (`community_alert`) — *frontend only, trivial, reversible*
**Why first:** zero backend, zero data, already aliased to `emergency`. Safest.
**Files:**
- `src/components/feed/FeedRadialCategories.tsx` — remove the `community_alert`
  dial entry (8 → 7).
- `src/app/(app)/feed/page.tsx` — remove `community_alert` from `CONTENT_TYPE_TABS`
  and the welcome-sheet `case 'community_alert'` copy (the `'emergency'` alias on
  L141–142 can stay or be simplified).
- Sweep `FeedSkyHero.tsx`, `FeedDiscoveryBlock.tsx`, `explore/page.tsx`,
  `public/sw.js` for stray `community_alert` references; remove/redirect.
**Test:** dial shows 7; clicking old links doesn't 500; build green.
**Rollback:** re-add one array entry.

---

## STEP 2 — Merge Connect + Calls into one "Connect" hub — *prereq for Gist slot*
**Why second:** frees the bottom-nav slot Step 3 needs. Both already share
`FriendshipChatInbox` + `chatService`, so this is consolidation, not new build.
**Approach:** make `/friendship` (Connect) the hub; fold the `/chat` inbox tabs
(All / DMs / Communities) in alongside Connect's tabs (Near Me / Following /
Followers / Map). `/chat/[conversationId]` (the actual conversation view) stays a
separate route — only the *inbox landing* merges.
**Files:**
- `src/components/feed/BottomNav.tsx` — remove the `Calls`→`/chat` `LINK_TAB`
  (slot freed). Keep `Connect`→`/friendship`.
- `src/app/(app)/friendship/page.tsx` — add the chat-inbox tabs (reuse
  `FriendshipChatInbox`, `CHAT_TABS`); becomes the combined hub.
- `src/app/(app)/chat/page.tsx` — convert the inbox landing to redirect into the
  Connect hub (e.g. `/friendship?tab=dms`); leave conversation routes intact.
- Update any links pointing at `/chat` inbox (TopNav chat action, `chatPaths.ts`).
**Test:** Connect shows people + chat tabs; opening a DM still works; deep links to
conversations unaffected.
**Rollback:** restore the `Calls` LINK_TAB; revert `/chat` redirect.
**⚠️ Risk:** this is the heaviest step (real UX surface). If it feels too big,
fallback = Step-3-alt below (6th slot) and defer this merge.

---

## STEP 3 — HuudGist → top-level pillar at `/gist` — *the main move*
**Why third:** needs the freed slot from Step 2.
**Key fact:** `/gossip` is already a legacy redirect → `local-news?tab=huud-gist`,
and the data model IS `gossip`. So `/gist` becomes the real home.
**Files:**
- **New route** `src/app/(app)/gist/page.tsx` — host the Gist list/sections
  currently rendered in the `huud-gist` tab of `local-news/page.tsx`.
- **Move detail** `src/app/(app)/local-news/gist/[id]/` → `src/app/(app)/gist/[id]/`.
- `src/app/(app)/gossip/page.tsx` — repoint redirect `/gossip` → `/gist`.
- `src/app/(app)/local-news/page.tsx` — **remove the HuudGist tab**; Local News
  becomes RSS/articles only. Redirect `local-news?tab=huud-gist` → `/gist`.
- `src/components/feed/BottomNav.tsx` — add **Gist** tab in the freed slot
  (`/gist`, icon e.g. `forum`); add `'gist'` to `AppNavIcon` icon set.
- Update links: `navigateBack.ts`, `localNewsConfig.ts`, `HuudGistRow.tsx`,
  `CreateHuudGistModal.tsx`, `local-news/[id]/PageClient.tsx`, `feed/page.tsx`
  — any `tab=huud-gist` / `local-news/gist` → `/gist`.
**Test:** Gist reachable from bottom nav; threads + create + detail work; Local
News shows only news; old gist links redirect.
**Rollback:** keep old route; remove nav entry.

### STEP 3-alt (fallback if Step 2 is deferred)
Add Gist as a 6th bottom-nav slot (accept tighter mobile layout). Everything else
in Step 3 identical.

---

## STEP 4 — Trim HuudGist's 7 transactional sections — *backend registry + FE labels*
**Why last of the agreed set:** independent of nav; safe cleanup.
**Single source:** `NeyborHuud-ServerSide/src/modules/content/huudGist.registry.ts`
(35 sections today).
**Remove:** `jobs_hustle`, `buy_sell`, `local_services`, `events_places`,
`safety_alert`, `fyi_notice`, `help_support` (→ 28 sections).
**Files:**
- Server: `huudGist.registry.ts` — delete the 7 entries.
- PWA: `src/lib/huudGistSections.ts` + `src/lib/huudGistConfig.ts` — remove the 7
  from `GIST_SECTION_LABELS` / `GIST_SECTION_ICONS` fallbacks to match.
**⚠️ Data note:** existing gist posts already tagged with a removed
`discussionType` must not vanish. Decide: (a) leave them readable under a
"General" fallback (`gistSectionLabel` already falls back), or (b) migrate them.
**Recommend (a)** — no migration, label falls back gracefully.
**Test:** `GET /huud-gist/sections` returns 28; old-tagged posts still render.
**Rollback:** restore registry entries.

---

## DEFERRED (separate future passes — not in this sequence)
- **Jobs + Services → "Work" hub** (Decision 4).
- **Content ↔ structured-sections bridge** (Decision 3 finding): feed and real
  listings are disconnected stores. Surfacing real listings in the feed is a
  net-new feature, not cleanup.

---

## Suggested execution order & checkpoints
1. **Step 1** (Alerts) → build/test → ✅ commit-point.
2. **Step 4** (Gist section trim) → independent, low-risk → ✅ commit-point.
   *(moved up: doesn't depend on nav, gets a safe win in early.)*
3. **Step 2** (Connect+Calls merge) → build/test → ✅ commit-point. *(heaviest)*
4. **Step 3** (Gist pillar + nav) → build/test → ✅ commit-point.

> Rationale for reorder: do the two *independent, low-risk* steps (1, 4) first for
> quick safe wins, then the *coupled* pair (2 unlocks 3) last. If Step 2 stalls,
> Step 3-alt still ships Gist.

**APPROVAL GATE:** awaiting your sign-off on this sequence before any code changes.

---

# Stage 3 — REVISED & EXPANDED (decisions 2026-06-23, phased execution)

Superuser asked to also: (a) merge **Messages** into the Connect+Calls hub —
investigation shows `/messages` already redirects to `/chat`, so this is the SAME
merge (no third surface); (b) do the **deferred** items; (c) "everything else".
Decisions taken:
- **Merge** → one **Connect** hub = find-people + chat inbox (+`/messages` alias).
  Conversation view (`/chat/[id]`) stays a separate full-screen route.
- **Feed↔listings bridge** → **YES, auto-post** real listings to the feed on create.
- **Sequencing** → **phased; approve each phase** before the next.

## PHASE 1 — Safe cleanup (independent, low-risk)
- **Step 1** — Drop "Alerts" (`community_alert`). *(as above)*
- **Step 4** — Trim 7 Gist sections (registry 35→28, graceful label fallback). *(as above)*
- **Gate:** build + typecheck both repos → review → approve Phase 2.

## PHASE 2 — Navigation (the coupled pair)
- **Step 2 (revised)** — Merge **Connect + Chat (+`/messages`)** into one Connect hub.
  - `/messages` already → `/chat`; now `/chat` inbox landing → folds into `/friendship`.
  - Conversation route `/chat/[conversationId]` untouched.
  - Frees one bottom-nav slot.
- **Step 3** — HuudGist → `/gist` pillar; add Gist to the freed slot; strip from
  Local News; redirect `/gossip` + `tab=huud-gist` → `/gist`. *(as above)*
- **Gate:** build + manual nav check → review → approve Phase 3.

## PHASE 3 — Deferred features (heaviest, last, own gates)
- **Step 5 — Feed↔listings bridge (auto-post):** when a product/job/service/event
  is created, also write a `Content` feed post (`contentType` = matching type) so
  it surfaces in the feed. **Backend-led** (each structured module's create path
  writes a mirror `Content`). Must address: dedupe, edit/delete propagation,
  moderation, notification volume. **Sub-gate before building** — I scope the
  exact mirror contract first.
- **Step 6 — Jobs + Services → "Work" hub:** combine the two near-identical
  sections into one hub with a Hiring/For-hire toggle. UX + route consolidation.
- **Gate:** each step builds + tested independently.

---

# PHASE 2.5 — Connect hub redesign (people-as-map) — PLAN (pre-approval)

Inserted before Phase 3. Goal: a richer Connect hub with a persistent
context-aware search + a personalized collapsible map header on the people tabs.

## Agreed design
- **Tab order:** Calls · Near me · Following · Followers · Messages · Communities.
  **"Map" tab is REMOVED** — it dissolves into the shared collapsible map header.
  (7 → 6 tabs.)
- **Persistent search bar** on every tab, context-aware:
  Calls → call history · Near me/Following/Followers → users by name ·
  Messages → threads · Communities → communities.
- **Collapsible map header** (~30% height, expand/collapse, mirrors the feed's
  weather-hero pattern) — shown ONLY on the spatial people tabs
  (Near me, Following, Followers). NOT on Calls/Messages/Communities.
- **Per-tab map content:**
  - Near me → nearby NeyborHuud users we do NOT follow
  - Following → users I follow
  - Followers → users who follow me

## CRITICAL location principle (user-stated)
- Plot the **REGISTERED / home location** every user gave at signup — the same
  location that drives their feed. **NOT** live/current GPS.
- Field: read **`primaryLocation`** (and/or `lga`/`state`), NOT `currentLocation`
  and NOT the synced `geoLocation` (which prefers `currentLocation`).

### The three location fields (clarified from backend code)
- **`primaryLocation`** = HOME / registered neighborhood. Set at signup; stable;
  drives the feed. ✅ THIS is what all Connect people-maps use.
- **`currentLocation`** = LIVE GPS position. Throttled writes (15 min / 400m move).
  ❌ Not used for Connect maps — we are not tracking live position.
- **`geoLocation`** = a GeoJSON `Point` MIRROR (for `$geoNear` queries), auto-synced
  from `currentLocation || primaryLocation` — so it usually reflects LIVE position.
  The existing "Near me" map uses this (= live-based today).

### DECISION (agreed): all 3 people-maps use `primaryLocation` (home)
- Near me / Following / Followers all plot by **registered home**.
- ⚠️ CONSEQUENCE ACCEPTED: this CHANGES "Near me" from "near my live GPS" to
  "registered home near my home (and not followed)." Intentional — more correct
  for a neighborhood app. New backend nearby query must filter on home location
  (lga/state or primaryLocation distance), NOT the live `geoLocation` index.
- This is privacy-safe: self-declared neighborhood, already used app-wide, no
  real-time tracking. No `showLocation`/browser-geolocation needed for these pins.
- "This is NeyborHuud, we all see ourselves" — every registered user is plottable
  by their declared location.

## What exists vs. what to build
EXISTS:
- User model has `primaryLocation`, `lga`, `state` (registered location).
- MapComponent works + plots nearby users; weather-hero collapse pattern in
  `FeedSkyHero`.
- Connect page already has `search` state (people).
BUILD:
- **Backend:** add registered-location fields to the `getFollowers`/`getFollowing`
  populate in `follow.controller.ts` (currently omits location). ~2 spots.
- **MapComponent:** accept an optional `users` prop (list to plot) instead of
  always self-fetching nearby; add marker clustering for large lists.
- **Connect header:** shared collapsible map (30%, expand/collapse) + persistent
  context-aware search, wired per active tab.
- **Remove** the Map tab; route `/friendship?tab=map` → default tab.

## Steps & gates
1. Backend: followers/following return registered location → server typecheck.
2. MapComponent: prop-driven `users` + clustering → typecheck.
3. Connect header: collapsible map + persistent search; remove Map tab → typecheck.
4. Per-tab wiring (search targets + map data per tab) → typecheck + manual check.
- **Gate** after each; nothing runtime-verified until manual pass.

## Open considerations (raised, resolved)
- Privacy → resolved: registered location only, not live GPS.
- Marker clustering → include from the start (following/followers may be large).
- Map on non-spatial tabs → excluded (Calls/Messages/Communities = search only).

---

## Execution status
- [x] Phase 1 (Steps 1, 4) — done, typecheck clean
- [x] Phase 2 (Steps 2, 3) + Calls tab — done, typecheck clean
- [ ] Phase 2.5 (Connect redesign) — PLANNED, awaiting approval
- [ ] Phase 3 (Steps 5, 6)

**CURRENT:** Phase 2.5 planned. Awaiting approval to build.

---

# COMMUNITY FEATURES — Item 4 scope (plan, pre-build)

## Key finding: the community model already EXISTS
The `hub-community` system already implements the requested model and should be
the single "community" concept (chat-only `/chat/groups` become legacy):
- Public to browse (`GET /hub-community` list), per-community group chat
  (each hub has a `conversationId`).
- **Admin-approved joins** already built: join-request + `reviewJoin`
  (approve/reject), `listJoinRequests`.
- Roles owner/admin/member; `onlyAdminsCanPost`.
- `leaveHub`, `listMembers`, invites/join-by-code — all present.
- Client: `/communities` list + `/communities/[id]` detail (members, leave,
  role-aware) + hooks (list/get/members/create/join/leave).

## Agreed requirements
- Communities: **public to SEE**, **join only via admin approval** (already built).
- Creating a community is gated by **BOTH** a reputation tier threshold **AND**
  a HuudCoin spend.
- Build group-management on **hub-community** (not chat-only groups).
- Want: rename + edit photo/description, promote/demote admin, leave, group-info
  screen.

## Actual gaps to build (small — most exists)
SERVER:
1. **Edit hub** — new `PATCH /hub-community/:hubId` (admin-only): name, photo,
   description, settings. (No edit endpoint today.)
2. **Change member role** — new `POST /hub-community/:hubId/members/:userId/role`
   (owner/admin-only): promote/demote admin. (Roles exist; no change endpoint.)
3. **Coin + tier gate on create** — in `createHub`: check user tier ≥ threshold
   AND `spendHuudCoins(cost)` before creating. (`spendHuudCoins` already exists;
   `createHub` currently has NO gate.) Amount/tier = config (TBD value).
CLIENT:
4. **Group Info / admin screen** — extend `/communities/[id]` (or a header tap in
   the chat thread) to surface: members list with roles, admin actions
   (rename/edit, promote/demote, remove), pending join-requests review, leave.
   Add hooks: `useEditHubCommunity`, `useChangeMemberRole`, `useReviewJoinRequest`.
5. **Wire group-info entry** from the community chat thread header.

## Open value to set
- Creation cost (coins) + required tier (e.g. Silver/500 pts) — wire as config,
  set the number later.

## Sequencing
- COMMIT current checkpoint FIRST (Phases 1,2,2.5,2.6, Step 6, call/nav fixes).
- Then build Item 4: server gaps (1–3) → client (4–5) → typecheck gates.
- Item 5 (Feed↔listings auto-post bridge) still deferred/unscoped.
