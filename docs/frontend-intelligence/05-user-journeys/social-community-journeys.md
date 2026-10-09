# User Journey Mapping — Social & Community (Step 6)

> Traces 4 end-to-end user journeys across pages already inventoried in Step 4
> (`03-api-page-matrix/*.md`) and classified in Step 5 (`04-route-map/route-classification.md`).
> Sources read directly for this pass: `pwa/src/components/feed/CreatePostModal.tsx`,
> `pwa/src/components/feed/XPostCard.tsx`, `pwa/src/hooks/usePosts.ts`,
> `pwa/src/services/content.service.ts`, `pwa/src/components/feed/RepostComposerSheet.tsx`,
> `pwa/src/app/(app)/profile/[username]/PageClient.tsx`, `pwa/src/components/follow/FollowerMilestoneCelebration.tsx`,
> `pwa/src/components/communities/CommunityHubAdminPanel.tsx`, `pwa/src/app/(app)/communities/[id]/PageClient.tsx`,
> `pwa/src/components/huud-gist/CreateHuudGistModal.tsx`, `pwa/src/app/(app)/gist/[id]/PageClient.tsx`.

---

# Journey 1: Create and engage with a feed post

## Trigger
User is on `/feed`, taps the composer trigger to open `CreatePostModal`.

## Flow

```
/feed
  └─ CreatePostModal opens (formStep = 'type_select', unless a defaultContentType is passed
     e.g. from /fyi or /help-request which lock the type)
       │
       ├─ Nigeria gate: isUserInNigeria() checked BEFORE anything else renders.
       │     If false → modal shows a dead-end "Nigeria only" panel with just a Close button.
       │     No form is ever reached. (createPost.nigeriaOnly / createPost.canInteract copy)
       │
       ├─ Type grid (8 cards): Services / FYI / Help Request / Marketplace / Event / Job /
       │     Safety Alert (emergency) / Urgent Alert (fyi+alert subtype, forces priority=critical)
       │     → tap a card → formStep = 'form'
       │
       ├─ Form screen (shared shell, type-specific fields injected):
       │     - Text/media composer (textarea + hashtag auto-extract + optional media picker,
       │       native camera on Capacitor via canUseNativeCamera()/pickNativePhotos())
       │     - Type-specific blocks: FYI subtype+contact, Event date/venue/tickets,
       │       Marketplace price/condition/delivery, Help Request category/target amount/bank
       │       details, Job fields, Services fields, Emergency hazard fields, Alert fields
       │     - No standalone "poll" content type exists in POST_TYPES — polls are NOT a
       │       composer option despite chat.md documenting a message-poll-vote route elsewhere
       │
       ├─ Submit (handleSubmit):
       │     - FYI-locked path (lockContentType, e.g. entered from /fyi):
       │         media upload → POST /media/upload, then fyiService.createBulletin()
       │         → POST /content/fyi  (awards 'fyi_created' coins)
       │     - Generic path (everything else, including FYI reached via the general
       │         composer with lockContentType unset):
       │         usePostMutations().createPost() → contentService.createPost()
       │         → POST /content/posts  (multipart when media attached, onProgress wired
       │         to an upload-progress bar)
       │     - On success: full form reset + 1400ms "Post shared!" success screen, then
       │       onSuccess()/onClose() fire
       │     - On error: caught and silently swallowed (catch (error) { void error; }) —
       │       NO error UI is shown to the user on a failed post creation
       │
       └─ Modal closes → /feed's own query (useLocationFeed) is expected to pick up the
             new post on next fetch/invalidation

/feed (any other user, or the author on reload)
  └─ XPostCard renders the post
       ├─ Like  → contentService.likePost()/unlikePost() (POST /content/posts/:id/like, toggle)
       ├─ Comment → onComment() opens FeedCommentsSheet (CommentForm/CommentItem)
       ├─ Save → contentService.savePost()/unsavePost() (POST /content/posts/:id/save)
       ├─ Report → ReportModal → POST /content/posts/:id/report
       ├─ Repost (instant, one-tap):
       │     handleInstantRepost() → usePostMutations().sharePost()/unsharePost()
       │     → contentService.repostPost()/unrepostPost()
       │     → POST/DELETE /content/posts/:id/repost   ← REAL endpoint, resolves Step 4's
       │       open question. It is NOT /:id/echo (that alias appears nowhere in the
       │       frontend). Optimistic isShared/shares update with rollback on error.
       │     Toggle button also serves as "un-repost" when post.isShared is already true.
       │     No location gate on this path — if getRegisteredLocationSync() returns null,
       │       `location: undefined` is silently sent (unlike the quote-repost sheet below).
       │
       └─ Quote-repost (RepostComposerSheet, comment + repost):
             Component and its wiring (contentService.repostPost(postId, comment, loc),
             blocks submission with a toast if no home location set) are fully built, but
             `setShowRepostComposer(true)` — the only way to open it — is never called
             anywhere in XPostCard.tsx or usePostCardMenuActions.ts (grepped, zero hits).
             DEAD UI: the quote-repost flow is unreachable from the running app; only the
             instant, comment-less repost is actually triggerable by a user.
```

Prose walkthrough: a user opens the composer from `/feed`, is immediately blocked with a dead-end panel if geolocated outside Nigeria, otherwise picks one of 8 content types (no poll option exists despite it being flagged as a possible type), fills a type-specific form, and submits. Text/marketplace/event/job/services/emergency/help_request all funnel through the single generic `POST /content/posts`; FYI posts opened directly from `/fyi` go through a separate `POST /content/fyi` path. On success, a 1.4s in-modal celebration plays before closing — there is no toast/error surfaced if the API call fails, the user just sees the modal hang and then presumably fail to close (isSubmitting resets but no message appears). Once live, other users see the post in `XPostCard` on `/feed`, `/neighborhood`, or `/explore`, and can like/comment/save/report it. The one-tap repost button is the only real "echo" mechanism; it calls `POST /content/posts/:id/repost`, not the `/:id/echo` route Step 4 could not locate a caller for (that route appears to be genuinely unused by the frontend). The richer quote-repost sheet exists in code but has no reachable trigger. The author is not shown any explicit "someone liked/commented on your post" surface inside the feed itself — that would have to arrive via `/notifications` (see chat-social-connections.md), which the feed page does not deep-link to on a per-post basis.

## Cross-references
- Pages: `/feed` (feed-content-search.md), `/fyi`, `/help-request` (community-events-gist.md)
- Routes: `/feed` (real, route-classification.md)
- Components newly traced this pass: `CreatePostModal`, `XPostCard`, `RepostComposerSheet`, `usePostMutations` (in `usePosts.ts`)

## Gaps or inconsistencies found
- Quote-repost (`RepostComposerSheet`) is dead code — never opened from any traced call site. Only instant one-tap repost works.
- The documented `POST /:id/echo` alias (flagged unresolved in Step 4) has no frontend caller at all; the frontend exclusively uses `/content/posts/:id/repost`. Either `/echo` is dead backend surface or a different, unfound caller exists — not found in this pass either.
- `CreatePostModal.handleSubmit` swallows all errors silently (`void error`) — a failed post (e.g. validation error, server 500) shows no toast/inline error, only that the loading spinner stops. This is a real UX gap.
- No poll content type exists in the composer's `POST_TYPES` list, despite `chat.md`'s message-poll-vote route existing elsewhere in the app (chat messages, not feed posts) — polls are not a feed post type today.
- Instant repost never checks for a home location before sending (sends `location: undefined` silently), while the (unreachable) quote-repost sheet does gate on it — an inconsistency between the two repost paths if the quote sheet is ever wired up later.

---

# Journey 2: Follow → vouch → trust tier progression

## Trigger
User visits `/profile/[username]` (another user's profile).

## Flow

```
/profile/[username]
  ├─ Follow button (PostCardFollowButton-style, via useFollow(profile.id)):
  │     GET /follow/status/:userId  → 3-state button (Follow / Follow back / Following)
  │     POST /follow/:userId  or  DELETE /follow/:userId  on toggle
  │     No blocking gate on follow — always available (unless blocked)
  │
  ├─ "Community Trust" vouch card (only rendered if: not own profile, not blocked either
  │   direction, currentUser exists):
  │     GET /trust/vouch-status/:userId  → drives vouchStatus:
  │       { hasVouched, canVouch, locationRequired, withinRange, distanceMeters, vouchCount,
  │         vouchesNeeded }
  │     GET /trust/vouch-metrics/:userId → vouchMetrics.received/given (stats row)
  │
  │     Eyebrow badge (only when !hasVouched), 3 mutually exclusive states:
  │       - locationRequired → gray "Location needed" pill
  │       - withinRange === true → green "{distance}m away ✓" pill
  │       - withinRange === false → red "{distance}m away — 500m limit" pill
  │
  │     Vouch button click → CLIENT-SIDE gate chain (checked in this exact order,
  │     each a toast.error, no API call fired if any trip):
  │       1. canVouch === false → "You need Tree 🌳 tier (300+ NeyburH Score) to vouch
  │          for others" + "Keep contributing, completing jobs, and getting verified
  │          to level up."
  │       2. locationRequired → "Location required to vouch" + "...Enable it in your
  │          profile settings."
  │       3. withinRange === false → "You are {X}m away — vouching requires you to be
  │          within 500m" + "NeyborHuud is hyperlocal..."
  │       4. else → vouchMutation.mutate() → POST /trust/vouch/:userId
  │
  │     Progress bar (only shown if vouchesNeeded > 0 && !hasVouched):
  │       "Progress to Tree 🌳 tier — {vouchCount} / 3 vouches"
  │       NOTE: this progress bar tracks VOUCHES RECEIVED BY THE VIEWED PROFILE, i.e. it's
  │       showing the target user's own progress toward Tree tier via vouches from others —
  │       not the viewer's. Same vouchStatus payload drives both the gate and this bar.
  │
  │     Already-vouched state: gray "🤜 Vouched" button → revokeMutation.mutate()
  │       → DELETE /trust/vouch/:userId
  │
  │     Block button sits alongside (POST/DELETE /follow/block/:userId via useBlock)
  │
  ├─ Trust tab: numeric trust score, tier badge, percent-to-next-tier bar, "Vouched by"
  │   chip list (GET /trust/vouches/:userId), Recent Trust Events (GET
  │   /gamification/users/:userId/trust-profile)
  │
  └─ Own-profile milestone celebration (FollowerMilestoneCelebration):
        Wired ONLY to follower-count milestones via useFollow's MilestonePayload
        (celebrationTier 1-5, confetti/fireworks scaled by count). Triggered from
        ownerMilestone state set on the owner's own profile after a follow event pushes
        them across a threshold.
        NO equivalent celebration component or trigger exists for TRUST TIER crossings
        (e.g. reaching Tree 300+) — grepped repo-wide for
        Trust*Celebration/tierCelebration/celebrationTier outside the follow hook and
        found no match. Crossing a trust tier is only ever visible passively (progress
        bar moving, tier badge label changing on next profile load) — no proactive
        toast/confetti/modal fires for the user who leveled up.
```

Prose walkthrough: on another user's profile, Follow is unconditional (just optimistic POST/DELETE). Vouch is gated by three independently-surfaced conditions — tier (viewer must be Tree/300+), location availability, and 500m proximity — all enforced client-side with distinct toast copy per failure before any network call is attempted, matching the server-side gate documented in trust.md (belt-and-suspenders). A small pill badge above the vouch card previews which of these states currently blocks the user (location-needed / in-range / too-far), so the failure reason is visible even before tapping the button. Once vouched, the target's `vouchCount` moves and, if it crosses 3, they become eligible for Tree tier — but nothing in the UI proactively tells the vouched-for user this happened; they'd have to revisit their own profile/Trust tab to notice the bar filled or the tier badge changed. This is a genuine UX asymmetry versus follow milestones, which do get a full-screen confetti celebration.

## Cross-references
- Pages: `/profile/[username]` (chat-social-connections.md — vouch/follow/block cluster already inventoried there)
- Routes: `/profile/[username]`, `/profile/[username]/followers`, `/profile/[username]/following` (route-classification.md)
- Prior flagged issue reused here: chat-social-connections.md's note #8 on trust score display/enforcement drift (`normalizeTrustScore()` client-side synthetic tier vs. server's raw-score `canVouch` gate) — both are visible on this same vouch card (the gate uses server truth; the big trust number elsewhere on the page may show a different, boosted tier).

## Gaps or inconsistencies found
- No trust-tier-crossing celebration exists anywhere in the codebase, despite `FollowerMilestoneCelebration` establishing the exact pattern (tiered confetti component) that a "TrustTierCelebration" could reuse. Confirmed via repo-wide grep for tier/celebration trust naming — no match outside the follow hook.
- The vouch progress bar shown on a profile ("Progress to Tree tier") reflects the VIEWED user's incoming-vouch count, not any state belonging to the viewer — could be misread as the viewer's own progress if skimmed.
- Follow has no gating of any kind (no distance/tier check), while vouch has three — the UI makes this asymmetry visible but does not explain to a first-time user why Follow is instant and Vouch is not (no onboarding/tooltip found explaining "vouching is high-trust, follow is not").

---

# Journey 3: Join and participate in a hub community

## Trigger
`/communities` (browse) or `/communities/join/[code]` (invite-link landing).

## Flow

```
/communities
  ├─ GET /hub-communities  (list, search/category/joined filters)
  └─ Join button per row → POST /hub-communities/:hubId/join
        Response branches:
          - payload.pending === true → toast "Join request submitted - an admin will
            review it" (APPROVAL-GATED hub — user does NOT enter yet)
          - payload.conversationId present → immediate join, router push to
            /chat/:conversationId (DIRECT-JOIN hub — no approval needed)
        This confirms 2 of the 3 possible join modes are live from the browse list:
        direct-join and request-to-join (approval-gated), both reachable from the
        SAME button — the branch is decided server-side by the hub's own settings,
        not by a separate UI control.

/communities/join/[code]   (3rd mode: invite-code join)
  ├─ GET /hub-communities/join/:code/preview   → preview card before committing
  ├─ Join button → POST /hub-communities/join/:code
  │     Branches identically to the direct-list join: either immediate entry, or
  │     "Join request sent for admin approval" — confirms invite-code hubs can ALSO
  │     be approval-gated, so the 3 modes are not mutually exclusive; approval-gating
  │     is an orthogonal hub setting that layers onto any of the 3 entry paths.
  └─ Invalid/expired code → "Invalid invite" empty state, dead end.

/communities/[id]  (hub detail, reached from browse row tap or post-join redirect)
  ├─ GET /hub-communities/:hubId
  ├─ GET /hub-communities/:hubId/members  (up to 12 shown + "+N more")
  ├─ "Open group chat" button → router.push(`/chat/${hub.conversationId}`)
  │     Confirms hub-communities.md's 1:1 hub↔conversation link: every hub carries its
  │     own conversationId, surfaced directly as a button on the detail page.
  ├─ Join/Leave toggle (handleJoinLeave):
  │     - Not joined → POST /hub-communities/:hubId/join → on success, if a
  │       conversationId is returned, router.push(/chat/:cid) immediately (same
  │       direct-join branch as the list page)
  │     - Joined, not owner → POST /hub-communities/:hubId/leave
  │     - Joined, owner → button disabled, label "You own this hub" (owners cannot
  │       leave their own hub via this control — no transfer-ownership UI found)
  └─ CommunityHubAdminPanel (owner/admin only):
        GET /hub-communities/:hubId/join-requests  (approval queue)
        POST /hub-communities/:hubId/join-requests/:requestId/review  (approve/reject)
        POST /hub-communities/:hubId/invites  (generate invite code, 168h expiry)
```

Prose walkthrough: a user discovers a hub either by browsing `/communities` or via a shared `/communities/join/[code]` link that previews the hub before any commitment. All 3 join modes documented in hub-communities.md/community-events-gist.md are confirmed live in the UI: direct join (immediate), invite-code join (with preview), and approval-gated join (a "pending" branch that can trigger from either the direct-list button or the invite-code button — approval-gating is a hub-level toggle, not a separate join type in the UI). Once inside, the hub's own group chat is one tap away via a dedicated "Open group chat" button that resolves the hub's `conversationId` — confirming the 1:1 hub-to-chat linkage. Leaving is available to any non-owner member; owners are permanently stuck with no in-UI transfer-ownership or delete-hub path found in this pass. Admins get a separate panel to review pending join requests and mint invite codes.

## Cross-references
- Pages: `/communities`, `/communities/[id]`, `/communities/join/[code]` (community-events-gist.md)
- Routes: `/communities`, `/communities/[id]`, `/communities/join/[code]` (all real, route-classification.md)
- `hub-communities.md`'s 1:1 hub↔chat link (referenced in the prompt) is directly confirmed by the "Open group chat" button's redirect-on-join behavior.

## Gaps or inconsistencies found
- Owners have no way to leave, transfer ownership, or delete a hub from the traced UI — `hub.myRole === 'owner'` simply disables the Leave button with no alternative action offered.
- `hubCommunityService.update()`/`changeMemberRole()` (PATCH routes) are defined and hooked (per community-events-gist.md's own note) but no confirmed caller was found in `CommunityHubAdminPanel` in either this or the prior pass — still unverified rather than confirmed-dead.
- Approval-gating is not visually previewed before a user commits to joining (neither the browse list nor the invite-code preview page shows "this hub requires approval" ahead of time) — the user only learns this after clicking Join, via the pending-toast.

---

# Journey 4: Community discussion (Huud Gist) — post → comment → moderate

## Trigger
`/gist` (top-level Huud Gist forum, `protectAny`-gated, confirmed live/deployed 2026-08-27 per community-events-gist.md).

## Flow

```
/gist
  ├─ GET /huud-gist/sections   (tab list, static fallback on failure)
  ├─ GET /huud-gist            (thread list, ?section= filter, infinite scroll)
  ├─ 401 state: distinct "Sign in to view Huud Gist" empty state (not a generic error) —
  │   directly reflects the protectAny auth gate
  └─ "New" → CreateHuudGistModal
        Fields: Section picker (postableSections, default 'local_gist'), Title (100 char
        max), Body, "Post anonymously" checkbox. NO explicit Nigeria/location field or
        client-side pre-check is rendered in this modal — unlike CreatePostModal's
        isUserInNigeria() dead-end panel, CreateHuudGistModal has no equivalent gate
        component.
        Submit → useCreateHuudGist().mutateAsync() → POST /huud-gist
          (discussion_type: section, tags: ['huudgist'], awards gossip_created coins)
        If the backend's requireNigeriaLocation gate rejects the request (location
        outside Nigeria), the ONLY UI response is whatever generic message
        getErrorMessage(err) extracts from the API error payload, rendered as a plain
        red text line above the submit button — there is no dedicated "Nigeria only"
        panel/copy the way CreatePostModal has. The failure is caught but not
        specially handled or explained beyond the raw server message.
        On success: modal closes, router.push(/gist/:id) — no in-modal celebration
        screen (unlike CreatePostModal's 1.4s success animation).

/gist/[id]  (thread detail)
  ├─ GET /huud-gist/:threadId          (full thread incl. inline comments array)
  ├─ Like  → POST /huud-gist/:threadId/like  (heart color state toggle)
  ├─ Add comment → POST /huud-gist/:gossipId/comments
  │     Supports its own "post anonymously" checkbox (separate from the thread's).
  │     Awards gossip_commented coins.
  ├─ Delete (owner-only, non-anonymous authorship match) → DELETE /huud-gist/:threadId
  │     mutations.deleteThread() — this is the only moderation-style action found;
  │     it is author-self-moderation only. No comment-level delete/like UI, no
  │     community-manager/admin moderation surface found on this page (comment
  │     like/delete/update-thread service methods exist per community-events-gist.md
  │     but have zero call sites here, confirmed again this pass).
  └─ 401 vs not-found empty states are distinct.
```

Prose walkthrough: Huud Gist is structurally its own vertical, NOT a reuse of `XPostCard`/`CreatePostModal`/feed components — it has entirely separate components (`CreateHuudGistModal`, page-local thread/comment markup in `gist/[id]/PageClient.tsx`, no shared `GistDetailCard`) and a separate service (`huudGistService`) hitting `/huud-gist/*` rather than `/content/*`. Visually and functionally it is a distinct forum: threads have titles + sections + anonymous posting (neither exists on regular feed posts), while feed posts have content-type-specific structured fields (price, venue, funding goal, etc.) that Gist threads don't. Creating a thread has no dedicated pre-flight location gate in the UI the way image/media posts do — a location failure surfaces only as whatever raw error string the backend returns, inline in red text, a materially worse UX than `CreatePostModal`'s dedicated dead-end panel for the same class of problem (being outside Nigeria). Once live, others can like and comment (each with independent anonymous toggles), and the flow ends either at organic engagement or the author deleting their own thread — there is no community-manager/moderator action, no report button, and no comment-level moderation (delete/like a specific comment) wired into this page at all, despite the service layer supporting all of that.

## Cross-references
- Pages: `/gist`, `/gist/[id]`, `/local-news` (community-events-gist.md — includes the note that `/local-news`'s embedded Gist tab is unreachable legacy weight)
- Routes: `/gist`, `/gist/[id]` (real), `/gossip`, `/local-news/[id]`, `/local-news/gist/[id]` (all redirect shims into `/gist[/[id]]`) (route-classification.md)
- Auth-fix note carried forward: community-events-gist.md already flags `/gist`'s create-thread POST as "Auth-gated (fixed 2026-08-27)" — confirmed consistent with today's date context.

## Gaps or inconsistencies found
- No client-side Nigeria/location pre-check in `CreateHuudGistModal`, unlike the equivalent gate in `CreatePostModal` — a `requireNigeriaLocation` failure surfaces only as a raw, ungated error string, not a purpose-built UI state.
- No moderation surface at all beyond author-self-delete: no report button on a Gist thread or comment, no comment-level delete/like, no community-manager action — despite `huudGistService` defining `getComments`, `likeComment`, `deleteComment`, `updateThread` (per community-events-gist.md, reconfirmed zero call sites this pass).
- Gist reuses none of the feed's card/composer components — it is a fully parallel implementation, which is a maintenance-surface observation (two independent post/comment/like stacks) worth flagging for anyone consolidating in the rebuild.
- Success feedback asymmetry: `CreatePostModal` gives a 1.4s in-modal success animation before closing; `CreateHuudGistModal` just closes and navigates immediately with no equivalent confirmation moment.

---

# Journey 5: Notifications — receiving and acting on alerts

## Trigger
Passive: any of ~30+ backend event types generates a notification row, surfaced immediately via an unread badge in the persistent app chrome (`TopNav`, all pages) and, for messages specifically, also on `BottomNav`'s "Connect" tab. User taps the bell icon (or the Connect tab, for messages) to land on `/notifications`.

## Flow

```
Anywhere in the (app) shell
  ├─ TopNav (rendered on every app page)
  │     useUnreadCount(undefined, 'message')  → GET /notifications/unread-count?excludeType=message
  │       (type=undefined = ALL notification types EXCEPT 'message', which has its own
  │       badge elsewhere — see below)
  │     refetchInterval: 30000  (polls every 30s, no socket/push-driven live update
  │       observed on this badge specifically)
  │     Bell icon link → /notifications, red pill badge shows count (99+ cap) when > 0
  │
  ├─ BottomNav (rendered on every app page)
  │     useUnreadCount('message')  → GET /notifications/unread-count?type=message
  │       (the COMPLEMENTARY count — message-type only)
  │     Badge rendered only on the "Connect" tab (→ /friendship, which hosts the actual
  │       chat inbox — see chat-social-connections.md's chat/messages resolution)
  │     No badge on the "Gist" or other BottomNav tabs for non-message notification types
  │       — all non-message unread count is exclusively surfaced via the TopNav bell,
  │       which is not part of BottomNav at all. Two independent counters, two independent
  │       polling queries, split cleanly along the message/non-message line — confirmed
  │       not duplicated or double-counted (`excludeType` vs `type` are complementary
  │       filters on the same GET /notifications/unread-count endpoint).
  │
  30+ notification `type`s (typeIcon map in /notifications/page.tsx, verbatim from source):
  │     like, comment, mention, follow, message, event, job, system, red_zone, sos,
  │     sos_alert, sos_triggered, sos_escalated, sos_resolved, trip_alert, geofence_alert,
  │     emergency, emergency_post, missed_alert_summary, connection_request,
  │     connection_accepted, guardian_request, guardian_accepted, follower_milestone,
  │     offer_received, offer_accepted, offer_rejected, offer_countered, offer_cancelled,
  │     order_received, order_status, service_booking, service_status, job_application,
  │     job_status, security, suspicious_login — each mapped to a Material Symbols icon
  │     name; unmapped types fall back to a generic 'notifications' icon.
  │     NOTE: connection_request/connection_accepted notification types exist here despite
  │     chat-social-connections.md finding ZERO frontend implementation of the Connections
  │     module (no service file, no request/accept UI anywhere) — these notification types
  │     may be dead/unreachable in practice (nothing in the traced UI would ever trigger
  │     the backend event that creates them), or a caller exists outside this pass's scope.
  │     Not resolved here, flagged forward.
  │
  └─ /notifications page
        GET /notifications  (page=1, limit=50, filter='all'|'unread') on mount and on
          filter-tab change — client-side filters OUT type === 'message' from the
          rendered list entirely (messages have their own surface at /friendship, so
          they'd otherwise double-appear)
        All / Unread filter tabs (pill buttons, client state only, each re-fires the
          GET with the new filter param — not a client-side re-filter of one cached list)
        Tap a notification card (handleClick):
          - if !isRead → markRead.mutate(id) → PATCH /notifications/:id/read
              (optimistic: invalidates ['notifications'] on success, no optimistic UI,
              user sees the bold/unread styling persist until the invalidated refetch lands)
          - if notification.actionUrl present → router.push(actionUrl)
              (both fire in the same click handler, not sequenced/awaited — the
              navigation can occur before the mark-read request resolves)
        "Mark all read" button (only rendered when unreadCount > 0, computed client-side
          from the currently-loaded page of notifications, not a separate server count):
          markAllRead.mutate() → POST /notifications/mark-all-read → on success, toast
          "All notifications marked as read" + invalidates ['notifications'] and
          ['notifications', 'unread-count'] (NOTE: this second invalidated key does not
          match the actual query key used by useUnreadCount, which is
          ['unreadCount', type, excludeType] — the TopNav/BottomNav badges are NOT
          directly invalidated by this mutation's queryClient calls; they only refresh
          via their own independent 30-second refetchInterval poll, not immediately
          after Mark All Read is pressed)
        Empty states: distinct copy for 'unread' ("You're all caught up") vs 'all'
          ("No notifications yet")
```

Prose walkthrough: notification generation is entirely server-driven — the frontend never creates a notification directly, it only displays what `GET /notifications` returns and reacts to two independent unread-count queries that split cleanly on the message/non-message boundary (`TopNav`'s bell = everything except messages, `BottomNav`'s Connect tab = messages only). Both counters poll every 30 seconds rather than updating live off a socket event, so a genuinely new notification can take up to 30s to surface as a badge even though the underlying event (e.g. a like, a follow) may have already landed via a different real-time channel elsewhere in the app. On `/notifications` itself, tapping a card marks it read and, if the notification carries a deep-link (`actionUrl`), navigates there in the same handler — these two effects are not sequenced, so a fast navigation could in principle race ahead of the mark-read request. "Mark all read" gives explicit toast confirmation, unlike most other mutations traced in this document set, but its cache-invalidation call targets a notifications-page-local query key (`['notifications', 'unread-count']`) that does not match the actual hook-level key (`['unreadCount', type, excludeType]`) used to drive the two nav badges — so pressing "Mark all read" clears the in-page list immediately but the bell/Connect-tab badges will still show the stale count until their own next 30-second poll fires, a small but real UI lag between two supposedly-linked pieces of state.

## Cross-references
- Page: `/notifications` (chat-social-connections.md — full route table, service/hook mapping, and the "30+ notification types mapped to icons" already inventoried there; this pass adds the badge-source trace TopNav/BottomNav and the actionUrl/mark-read click-handler race)
- Two dead/mismatched notification service methods already flagged in chat-social-connections.md, referenced not re-verified here: `notificationsService.deleteNotification(id)` calls `DELETE /notifications/:id`, a route not documented in notifications.md and with no call site found in either pass; `notificationsService.testPushNotification()` calls `POST /notifications/test-push` (hyphenated) while the registry's debug route is `POST /test/push` (slash) — a path mismatch that would likely 404 if ever invoked, and it is not called from any traced page.
- Connections module cross-reference: chat-social-connections.md's cross-cluster notes already flag `connections.md`'s 4 routes (`request`/`respond`/list/pending) as having zero frontend implementation (no service file, no UI) anywhere in the friendship/profile/chat/notifications cluster — directly relevant here because `connection_request`/`connection_accepted` are both live entries in this page's own `typeIcon` map, meaning the notification-display layer is ready for a feature that (per that prior pass) may not otherwise exist in the frontend.

## Gaps or inconsistencies found
- `markAllRead`'s `onSuccess` invalidates the query key `['notifications', 'unread-count']`, but `useUnreadCount` (the hook actually driving the TopNav bell and BottomNav Connect-tab badges) uses the key `['unreadCount', type, excludeType]` — these do not match. Pressing "Mark all read" does not immediately clear the nav badges; they only catch up on their own next 30-second `refetchInterval` poll. A real, previously-unflagged cache-key mismatch.
- Both unread-count badges (TopNav bell, BottomNav Connect tab) are polling-only (`refetchInterval: 30000`) with no socket-driven push observed in this pass — a new notification can be up to 30 seconds stale before a badge appears, even in an app that otherwise has live socket wiring for chat (per chat-social-connections.md's `/chat/[conversationId]` trace).
- `handleClick` on a notification card fires `markRead.mutate(id)` and `router.push(actionUrl)` without sequencing — the mark-read PATCH is not awaited before navigation, so in principle a user could navigate away before the read-state is committed (unlikely to cause a visible bug given optimistic-adjacent invalidation, but it's an unenforced ordering).
- `connection_request`/`connection_accepted` notification types are fully wired into the display layer's icon map, but chat-social-connections.md found zero frontend implementation of the underlying Connections feature (no service, no request/accept UI) — these notification types may currently be unreachable dead codepaths from the frontend's own perspective, or the triggering UI lives outside the pages traced in either pass. Not resolved, flagged forward again here since it directly touches notification generation.
- The "unread" filter tab re-fires a full `GET /notifications` with `filter=unread` rather than client-filtering an already-fetched "all" list — functionally fine, but means switching tabs always costs a network round trip even if the "all" data was just loaded seconds earlier.

---

# Journey 6: Help request — ask for help → offers → resolution

## Trigger
`/help-request` (browse board) — a user either browses to find an active request or taps the composer to create one via `CreateHelpRequestModal` (or the generic `CreatePostModal` with `contentType: 'help_request'` reached from elsewhere, e.g. TopNav's dropdown grid "Help Request" tile — confirmed directly this pass: the dropdown links straight to `/help-request`, not into a locked composer).

## Relationship to Huud Gist and the feed's help_request post type — resolved
`/help-request` is NOT a separate backend system layered next to the feed — it is a dedicated front-end lens onto the exact same generic content pipeline the feed composer uses. Confirmed directly from source:
- `CreatePostModal`'s `POST_TYPES` list (Journey 1) includes `help_request` as one of its 8 selectable content types, with its own 3-step sub-form (Category → Funding → Payment Details) injected when that type is picked — this is the SAME modal, SAME submit path (`POST /content/posts`, `contentType: 'help_request'`) as any other feed post type.
- `/help-request`'s own list page (`helpRequestService.getRequests()`) calls `GET /content/posts?contentType=help_request` — the generic content feed endpoint, filtered by content type, not a dedicated `/help-request` backend route. `community-events-gist.md` already noted this is expected (content.md documents only action sub-routes for Help Request, no separate list route) rather than a bug.
- `/help-request/[id]`'s detail fetch (`helpRequestService.getById()`) calls `GET /content/posts/:id` — again the generic content-detail route, just wrapped in a help-request-specific service/hook layer (`useHelpRequestDetail`) and rendered by help-request-specific components (`HelpRequestCard`, `OfferForm`, `OfferRow`) rather than `XPostCard`.
- So: `/help-request` is a distinct PAGE/UI (own card component, own detail layout, own offer-thread model) for a content TYPE that lives in the same unified `content_type` taxonomy as regular posts and is also directly creatable from the generic feed composer — not a fully separate system, and not merely a feed post type with no dedicated surface either. It is both at once, unlike Huud Gist (Journey 4), which is a genuinely parallel implementation on its own `/huud-gist/*` route mount with its own service, no content-type overlap with `/content/posts` at all.

## Flow

```
/help-request  (list)
  ├─ GET /content/posts?contentType=help_request  (category tab filter, infinite scroll)
  └─ Create → CreateHelpRequestModal → POST /content/posts (contentType: help_request)
        Same underlying route/type as CreatePostModal's help_request path in Journey 1 —
        two different modal components exist for entering the same content type
        (CreateHelpRequestModal here vs. the generic type-grid path via CreatePostModal),
        not independently re-diffed line-by-line this pass but both confirmed to target
        the identical POST /content/posts + contentType field.

/help-request/[id]  (detail)
  ├─ GET /content/posts/:id  → post detail: content/body, media, category, target amount
  │     (targetAmount, kobo units per lib/currency.ts), amountReceived, helpRequestPayment
  │     (bank name/account name/account number, optional — "No bank details provided —
  │     contact the requestor directly" shown if absent), current helpStatus
  │     (open/in_progress/fulfilled/closed, read from post.metadata.helpStatus)
  │
  ├─ Funding-goal progress bar: amountReceived / targetAmount, color flips to a darker
  │     green at ≥100%; if no targetAmount is set, shows "No target set — any amount
  │     welcome" instead of a bar — funding goals are optional, not mandatory
  │
  ├─ "Pay with HuudCoins" — visibly rendered as a disabled/dashed-border affordance
  │     labeled "Coming soon", NOT a real, callable action. No API call exists behind it.
  │     The only real payment path is manual: copy-to-clipboard bank account number
  │     (navigator.clipboard.writeText, 2s "Copied" feedback) and the helper sends money
  │     externally, off-platform, entirely outside NeyborHuud's own systems.
  │
  ├─ Offer to help (non-owner, only if isActive === true i.e. status is open/in_progress,
  │   and the viewer hasn't already got a pending/confirmed offer on this request):
  │     "Offer Help" button → OfferForm (message ≥5 chars required, optional offeredAmount
  │       in Naira, converted to kobo via toKobo() before sending)
  │     → POST /content/posts/:postId/help-offers  (useSubmitHelpOffer)
  │     If the viewer already has an offer, they instead see a static "You offered to
  │       help — Status: {pending|confirmed|rejected|expired}" badge, no re-offer path
  │
  ├─ GET /content/posts/:postId/help-offers  → offer list (useHelpOffers), each row shows
  │     helper identity (avatar/name/username, links to their /profile/[username]),
  │     message, optional offered amount, "+5 HuudCoins awarded ✓" if coinsAwarded is set,
  │     relative timestamp, status badge (pending/confirmed/rejected/expired)
  │
  ├─ Owner-only per-offer actions (only while offer.status === 'pending'):
  │     "✓ Confirm Help Received" → PATCH /content/posts/:postId/help-offers/:offerId/confirm
  │       (useConfirmHelpOffer) — this is the moment +5 HuudCoins is awarded to the helper
  │       (max 3/week per the UI's own copy on the offer form), and is a manual,
  │       owner-attested confirmation — there is no automatic detection that money/help
  │       was actually transferred; the platform trusts the requester's self-report.
  │     "Reject" → PATCH /content/posts/:postId/help-offers/:offerId/reject
  │       (useRejectHelpOffer)
  │
  ├─ Owner-only status control (4-state button row, always visible to the owner
  │   regardless of offer activity): open / in_progress / fulfilled / closed
  │     → PATCH /content/posts/:postId/help-status  (useUpdateHelpStatus)
  │     This is a fully independent state machine from individual offer confirm/reject —
  │     an owner can mark the whole request "fulfilled" or "closed" without having
  │     confirmed any specific offer (e.g. help arrived off-platform entirely), and
  │     conversely confirming an offer does NOT automatically flip helpStatus for them —
  │     the two controls are decoupled, not one triggering the other in the traced UI.
  │     Once inactive (fulfilled/closed), the Offer Help button and OfferForm are hidden
  │     (isActive gate) — "This request is {status}" is implied by the disappearance of
  │     the offer CTA rather than an explicit banner message (no such banner string found
  │     in the read portion of this page).
  │
  └─ Owner also has a separate amount-received self-report path found only on the LIST
        page's card (HelpRequestCard → PATCH /content/posts/:postId/amount, via
        contentService.updateHelpRequestAmount / helpRequestService.updateAmountReceived,
        two different service wrappers hitting the identical route per
        community-events-gist.md's own note) — NOT present as a control on the detail
        page itself; an owner has to go back to the list view to update how much money
        they've received so far.
```

Prose walkthrough: a help request starts life exactly like any other feed post — created either through the dedicated `/help-request` composer or the generic feed composer's Help Request type, both hitting the same `POST /content/posts`. Once live, the resolution mechanic is entirely its own: prospective helpers submit a message-plus-optional-amount "offer" against the post (not a comment — there is no comment thread on this detail page at all, unlike the feed or Huud Gist), and the requester works through those offers one at a time, confirming (which pays the helper +5 HuudCoins as a thank-you, capped at 3/week) or rejecting each. Actual money movement is manual and off-platform — bank details are copy-pasted, "Pay with HuudCoins" is a visible but non-functional placeholder — so the whole system is really a coordination/reputation layer around help, not a payment processor. Resolution is a fully separate, always-available 4-state status toggle the owner controls directly; it does not auto-advance from offer confirmations, so a careful requester has to remember to also mark the post fulfilled/closed once they're done, and nothing in the UI nudges them to do so.

## Cross-references
- Pages: `/help-request`, `/help-request/[id]` (community-events-gist.md — full route table already inventoried; this pass adds the offer/status decoupling analysis and the CreatePostModal cross-link)
- Journey 1 (this file): confirms `help_request` is one of `CreatePostModal`'s 8 `POST_TYPES`, submitted via the identical `POST /content/posts` route `/help-request` itself reads from
- `helpRequestService.updateAmountReceived()` vs `contentService.updateHelpRequestAmount()`: two service wrappers, one route (`PATCH /content/posts/:id/amount`) — already noted in community-events-gist.md, reconfirmed here that the control is list-page-only, not present on the detail page.

## Gaps or inconsistencies found
- "Pay with HuudCoins" is a visible, styled, "Coming soon"-labeled dead affordance on every help-request detail page — not wired to any API call. It sets a real user expectation (a labeled payment button) that currently does nothing if tapped-adjacent (it's disabled, but its prominence suggests otherwise-imminent functionality).
- Offer confirmation (which pays HuudCoins) and the owner's separate 4-state status control are fully decoupled — confirming every offer does not auto-transition status to `fulfilled`, and setting status to `fulfilled`/`closed` does not auto-resolve outstanding pending offers. Both are manual, independent owner actions, which could leave a request that's genuinely "closed" still showing "pending" offers indefinitely, or vice versa.
- No comment/discussion thread exists on `/help-request/[id]` — the offer list is the only structured interaction surface; anyone wanting to ask a clarifying question before offering help has no in-page mechanism to do so (would have to DM the requester via their profile's Message button instead, a multi-hop detour).
- The amount-received self-report control (`PATCH .../amount`) lives only on the list page's card, not the detail page itself, despite the detail page being where the funding-goal progress bar and full context live — a UI-placement inconsistency, not a missing route.
- Help offer confirmation is entirely trust-based/self-attested by the requester; there is no verification that funds or aid were actually delivered before HuudCoins are awarded to the helper — a fraud/gaming surface (an owner could confirm their own alt account, or a helper could pressure a confirm without delivering), noted as an observation, not something this pass can further verify from the frontend alone.

---

# Journey 7: Local news consumption (/local-news)

## Trigger
`/local-news` — reached via TopNav's "Local News" route title mapping, BottomNav has no direct tab for it (not one of the 6 `LINK_TABS`), so it's a secondary/menu-level destination rather than a primary nav item.

## Flow

```
/local-news
  ├─ 3-tab strip: Nigeria / International / (legacy) huud-gist
  │     The 'huud-gist' tab immediately self-redirects on activation:
  │       useEffect watches activeTab === 'huud-gist' → router.replace('/gist'
  │       [+ '?section=' + section if one was set]) — confirms community-events-gist.md's
  │       finding that this tab is unreachable legacy weight; even though the tab button,
  │       CreateHuudGistModal, and HuudGistRow are still imported/rendered in this file's
  │       source, activating the tab bounces the user straight out to /gist before any of
  │       that UI is actually seen. GET /huud-gist/sections and GET /huud-gist (thread
  │       list) are ALSO both still fetched unconditionally on every /local-news mount
  │       regardless of which tab is active — confirmed dead API weight, not just dead UI.
  │
  ├─ Nigeria / International tabs (the only two tabs that actually render content here):
  │     GET /news/categories  (on mount, populates topic taxonomy + source lists per
  │       region, with hardcoded local fallback arrays NIGERIA_SOURCES/
  │       INTERNATIONAL_SOURCES/NEWS_TOPICS if the call fails)
  │     GET /news/articles  (region, topic, sources[], limit=12) — the primary path
  │     On failure of /news/articles: falls back to GET /news/feed (per-source RSS,
  │       merged client-side via newsService.getMultipleFeeds(), raw XML parsed with
  │       DOMParser in the browser) — this is a genuine client-side RSS parser as a
  │       resilience fallback, not just a retry of the same endpoint
  │     Topic chips + per-source toggle chips (multi-select, "All sources" clears
  │       selection) — every chip tap re-fires loadRss with the new filter combination,
  │       no debounce observed
  │
  ├─ Article list (NewsArticleRow, one per article):
  │     Renders as a plain `<a href={article.link} target="_blank" rel="noopener
  │       noreferrer">` — i.e. EVERY article tap is a full external navigation straight
  │       to the original publisher's website in a new tab/window. There is NO in-app
  │       article reader/detail view of any kind. The dynamic route file
  │       `/local-news/[id]/page.tsx` DOES exist on disk, but per direct source read of
  │       its PageClient.tsx, it is exclusively the legacy Gist-thread redirect
  │       (`router.replace('/gist/:id')`) — RSS articles never navigate there; there is
  │       no article-id-keyed route at all. Confirmed by grep: NewsArticleRow's only
  │       navigation affordance is the external `href`, no internal Link/router.push.
  │
  └─ "Headlines open on the publisher site" — the ONE piece of in-app copy that tells
        the user what's about to happen, shown as a small caption below the article list
        whenever articles are loaded successfully.
```

Prose walkthrough: browsing local news is purely a curated RSS reader with zero interactive or social layer of its own — confirmed directly from `NewsArticleRow`'s markup, which is a bare anchor tag pointing at the original publisher's URL with `target="_blank"`. There is no like, comment, save, or share action anywhere in this flow (compare to every other content surface traced in this document, all of which have at least like+comment). The page fetches from `NEXT_PUBLIC` news endpoints with a genuine two-tier resilience strategy — a structured `/news/articles` API first, falling back to raw per-source RSS-feed fetching and client-side XML parsing if that fails — which is more defensive engineering than most other list pages in this app show, but all of it is in service of a read-only, outbound-only experience: NeyborHuud never hosts the actual article content, comments, or any engagement metric for it. The one social/interactive feature literally embedded on this same page — the Huud Gist tab — has been fully superseded and now exists only as a bounce-out redirect to `/gist`, with the irony that the app still pays the API cost of fetching Gist sections and threads on every `/local-news` page load even though a user can never actually see that data rendered here.

## Cross-references
- Pages: `/local-news` (community-events-gist.md — full API table for the RSS + legacy-gist-tab behavior already inventoried; this pass adds the confirmation that article rows navigate externally with zero in-app detail route, and that the huud-gist tab's data fetches are dead API weight, not just a dead UI tab)
- Routes: `/local-news`, `/local-news/[id]`, `/local-news/gist/[id]` (route-classification.md — both dynamic routes confirmed client-side redirects into `/gist[/[id]]`, distinct from the plain `/local-news` list page traced here)
- Journey 4 (this file): Huud Gist is the "real" successor destination this page's legacy tab redirects into.

## Gaps or inconsistencies found
- `GET /huud-gist/sections` and `GET /huud-gist` (thread list) both fire unconditionally on every `/local-news` mount regardless of active tab — since the huud-gist tab immediately self-redirects away and its data can never actually be displayed to the user on this page, these two calls are pure wasted network/API load on every visit to `/local-news`, not merely dead UI.
- No in-app article reader exists despite a dynamic `/local-news/[id]` route file being present on disk — that route is entirely reserved for the unrelated legacy Gist-thread redirect, so there is no id-keyed destination an article could ever link to even if the product wanted one; this is a structural gap (would require a genuinely new route), not a wiring bug.
- Zero social/interactive layer on news content — no like/comment/save/share on any article, a stark contrast with every other content type traced in this document. Whether this is intentional (RSS content isn't NeyborHuud's own, so no engagement surface makes sense) or an unbuilt feature is not determinable from the frontend alone.
- The "huud-gist" tab button, `CreateHuudGistModal`, and `HuudGistRow` imports are all still present and rendered/instantiated in `/local-news/page.tsx`'s source despite being functionally unreachable content (the tab bounces out before any of it displays) — dead code surface for a future cleanup pass, consistent with community-events-gist.md's framing of this as "legacy weight."

---

# Journey 8: Event creation and management (organizer side)

## Trigger
`/events/create` (new event) or `/events/[id]/edit` (existing event, organizer-only) — distinct from the attendee RSVP journey already covered in commerce-journeys.md, which starts from `/events`/`/events/[id]`'s Attend/RSVP controls.

## Flow

```
/events/create
  ├─ Auth guard: redirects to /login if unauthenticated (route-classification.md already
  │     confirms this at the routing level; CreateEventForm itself does not re-check auth
  │     internally beyond that route-level gate)
  ├─ Location: useRegisteredLocation() — explicitly the user's registered SIGNUP location,
  │     NOT a live GPS prompt at creation time (in-code comment: "Use the user's
  │     registered (signup) location — no live GPS prompt")
  ├─ Form fields: title, description, type (community/social/sports/cultural/
  │     educational/business/other), start date+time, end date+time, venue (free text,
  │     not a structured address/map-pick field), capacity (optional, blank = unlimited),
  │     Free-event toggle → reveals a Naira ticket-price field if turned off (price
  │     converted to kobo via toKobo() before sending), visibility
  │     (public/neighborhood/private), tags (free-form, comma/Enter-added, no cap on the
  │     create form itself, though the edit form caps tags at 10 — an inconsistency
  │     between the two forms, see Gaps), cover image (optional, ≤10MB client-validated,
  │     base64 preview via FileReader before upload)
  ├─ Submit → useCreateEvent() → eventsService.createEvent() → POST /events (multipart
  │     when a cover image is attached, with upload-progress callback)
  │     On success: invalidates ['events','list'] and ['events','organized'] caches,
  │     then — per this page's own PostCreationSuccessSheet import — shows an in-app
  │     success sheet (component present; exact trigger/copy not further traced line-
  │     by-line beyond confirming the import and showSuccess state exist) rather than an
  │     immediate silent redirect
  └─ On error: toast-based error handling (pattern confirmed consistent with the edit
        hook, useUpdateEvent, whose exact onError copy — "Failed to update event" via
        getErrorMessage() — was directly read this pass; useCreateEvent's own onError
        string was not re-read character-for-character, flagged as unverified but
        toast-based, not silent, based on the shared pattern)

/events/[id]/edit  (organizer-only)
  ├─ Access guard: CLIENT-SIDE ONLY — `user.id !== event.organizerId` renders a lock-icon
  │     "You can only edit events you organized" panel with a Go Back button, instead of
  │     the form. This is a UI-level check on data already fetched via GET /events/:id;
  │     no evidence in this page of a distinct pre-flight authorization call, meaning the
  │     event payload itself is fetched for a non-organizer before the guard even
  │     evaluates (not a data leak beyond what GET /events/:id already exposes to anyone
  │     who can view the event, but worth noting the enforcement point is client-side
  │     rendering, not request-blocking, on this specific page — matches
  │     route-classification.md's own note that this route's organizer check is
  │     "client-side check" only).
  ├─ GET /events/:id (useEvent) — pre-fills every form field 1:1 from the live event
  │     record via a `hydrated` guard (only hydrates once, on first load, so the form
  │     won't clobber in-progress edits if the query silently refetches in the background)
  ├─ Same field set as create MINUS the "no tag cap" difference (edit caps tags at 10,
  │     `tags.length < 10` guard in `addTag()`; create's `addTag()` has no such cap —
  │     confirmed by direct read of both forms' addTag functions)
  ├─ Submit → useUpdateEvent(eventId) → eventsService.updateEvent() → PUT /events/:id
  │     (multipart if a NEW cover image was attached this session; if none was re-picked,
  │     the existing cover is left alone since coverFile stays null and the payload
  │     simply omits coverImage)
  │     PARTIAL PAYLOAD: only fields with truthy/changed local state are included
  │     (`if (title.trim()) payload.title = ...`, etc.) — so clearing a field back to
  │     empty in the edit form does NOT send an explicit "clear this" instruction for
  │     several fields (title/description/venue/tags-via-truthy-check), it simply omits
  │     them from the PUT body, which means the backend's own semantics for "field
  │     omitted" (leave unchanged vs. clear) determine the actual outcome — not
  │     independently verified against events.md's PUT /:id contract in this pass.
  │     isFree and visibility and type ARE always included regardless of truthiness
  │     (no `if` guard on those three), so those three fields are the only ones
  │     guaranteed to always reflect the form's current state on every save.
  │
  └─ On success (useUpdateEvent's onSuccess, directly read from hooks/useEvents.ts):
        invalidates ['events','detail',eventId], ['events','list'], ['events','organized']
        toast.success("Event updated!")
        router.push(`/events/${eventId}`)  — navigates the organizer back to the event's
          own detail page
        NO call of any kind to notify existing attendees that the event changed — no
        push/notification-service call, no attendee-facing banner mechanism, no distinct
        "notify attendees of this change" checkbox/option anywhere in the edit form's
        traced fields. Existing RSVPs (tri-state going/maybe/not_going per events.md,
        or the legacy binary attend/unattend the attendee-facing pages actually use per
        commerce-journeys.md's own trace) are NOT touched, reset, or re-confirmed by this
        mutation in any way visible from the frontend — `useUpdateEvent`'s onSuccess only
        touches event-list/detail caches, never an attendees or RSVP query key. If an
        organizer moves the date or venue after people have already RSVP'd, those
        attendees' RSVP records remain exactly as they were; the only way they would ever
        learn of the change is by revisiting the event's own detail page and noticing the
        new date/venue themselves — there is no proactive signal.
```

Prose walkthrough: creating an event is a single-shot form gated behind login, using the organizer's registered signup location (not a fresh GPS read) as the implicit location context, with all the structured fields (type/dates/venue/capacity/pricing/visibility/tags/cover image) submitted in one multipart POST. Editing reuses none of the create form's component code — it is a separate, page-local form in `PageClient.tsx` with its own field set and its own (looser in one respect, tighter in another) validation: the edit form caps tags at 10 while create has no cap, a small but real inconsistency between what should be the same data shape. The organizer-only guard on the edit page is enforced purely by client-side comparison of `user.id` to the already-fetched event's `organizerId` — functional for hiding the form from a casual non-organizer, but not a request-level authorization boundary from what this page's own code shows. The most consequential finding is what does NOT happen on a successful edit: no attendee notification of any kind fires, and no RSVP state is touched, reset, or flagged as needing re-confirmation. If an organizer changes the date or venue after people have already committed to attending, every existing "going"/"maybe" RSVP silently continues to point at an event record that has moved out from under it, with the only chance of an attendee noticing being a self-initiated revisit to the event page.

## Cross-references
- Pages: `/events/create`, `/events/[id]/edit` (community-events-gist.md — API tables for both already fully inventoried: POST /events for create, GET+PUT /events/:id for edit; this pass adds the field-level create/edit comparison and the RSVP-on-edit gap)
- Attendee-side RSVP journey (tri-state `/rsvp` vs. legacy binary `/attend`, boost, cancel, comments) — traced separately in `commerce-journeys.md`, intentionally not re-derived here per this pass's scope
- Routes: `/events/create` (auth-gated, redirects to `/login`), `/events/[id]/edit` (organizer-only, client-side check) — both confirmed in route-classification.md's route table

## Gaps or inconsistencies found
- Editing an event never notifies existing attendees and never touches/invalidates any RSVP-related query — a date or venue change after people have RSVP'd is entirely silent from the platform's side; attendees have no proactive way to learn their plans may now be wrong. This is the most significant finding of this journey.
- Tag-count validation differs between create (`CreateEventForm`, no cap) and edit (`PageClient.tsx`, hard cap of 10 via `tags.length < 10` in `addTag()`) — the same logical field has two different client-side rules depending on which form the organizer happens to be using.
- The edit form's submit payload only includes several fields (title/description/venue/tags/coverImage) when they are truthy/changed, but always includes `isFree`, `visibility`, and `type` unconditionally — meaning clearing a text field back to blank in the edit UI silently omits it from the PUT body rather than explicitly instructing the backend to clear it; the actual resulting behavior depends on backend semantics for omitted PUT fields, not independently verified in this pass.
- The organizer-only guard on `/events/[id]/edit` is enforced entirely client-side (compare `user.id` to `event.organizerId` after the event has already been fetched and rendered into local state) — consistent with, and directly confirming, route-classification.md's existing note that this route's protection is a "client-side check" only.
- `useCreateEvent`'s own error-toast copy was not independently re-verified character-for-character in this pass (only `useUpdateEvent`'s was directly read); flagged as unverified rather than assumed identical.

---

# Journey 9: FYI bulletin — post a community notice → RSVP/acknowledge → authority endorsement → resolution

## Trigger
`/fyi` (community-notice bulletin board, subtype-filterable: All / Safety / Lost & Found / Announcements / Alerts) — a user either browses the board or taps "Post bulletin" to open `CreatePostModal` with `defaultContentType="fyi"` and `lockContentType` set.

## Relationship to fyi.md's backend registry — resolved
`fyi.md` documents a genuinely formal bulletin-lifecycle system mounted standalone at `/api/v1/fyi` (10 routes: create, list, pin/unpin, RSVP, receipt-confirmation, authority endorsement + list endorsements, status update, status-history audit trail). Confirmed directly from source that the frontend **never calls that mount at all**. Every one of `fyiService`'s methods — including the richer ones (`pinBulletin`, `unpinBulletin`, `endorseBulletin`, `getEndorsements`, `rsvpToBulletin`, `confirmReceipt`, `getStatusHistory`, `updateStatus`) — targets `/content/fyi/...` paths (`pwa/src/services/fyi.service.ts`, read directly), i.e. content.md's alias cluster, not fyi.md's own mount. This confirms and extends community-events-gist.md's `/fyi` entry, which had already flagged the base `/content/fyi` GET/POST split as an alias-not-standalone-mount situation but left the richer lifecycle methods as "service-defined, UI-caller-unconfirmed" pending further tracing.

That further tracing is done here, with a material correction to the earlier framing: **the richer lifecycle is not unreachable dead code.** `pwa/src/components/feed/PostDetailsModal.tsx` (read directly) calls all of it — `fyiService.updateStatus`, `endorseBulletin`, `rsvpToBulletin`, `confirmReceipt`, `pinBulletin`/`unpinBulletin`, and `getStatusHistory` — each wired to real buttons/selects with loading states and toast feedback, gated on `details.content.contentType === 'fyi'` and, for some controls, on `fyiSubtype` (RSVP only for `community_announcement`/`local_news`; receipt-confirm only for `safety_notice`; pin/unpin and status-update restricted to the post's own author via a client-side `author.id === currentUserId` check — no server-side role gate visible from the frontend, consistent with fyi.md's own note that `/pin`/`/unpin`/`/endorse` carry no `restrictedTo` middleware). The catch: **`PostDetailsModal` is never opened from `/fyi` itself.** Grepped both `fyi/page.tsx` and `FYICard.tsx` directly — zero references to `PostDetailsModal` in either file. `PostDetailsModal` is only imported and mounted in two other places: `pwa/src/app/(app)/feed/page.tsx` and `pwa/src/app/(app)/profile/[username]/PageClient.tsx`, both of which open it via `openPostDetails(postId)` wired to `XPostCard`'s `onCardClick`. So the answer to the central question is: the live `/fyi` page's own card/click surface (`FYICard`) exposes NONE of the richer lifecycle — no RSVP, no receipt-confirm, no endorsement request/display, no pin/unpin, no status history — but a FYI-type post IS reachable through the richer `PostDetailsModal` UI if a user encounters that same post rendered as an `XPostCard` on `/feed` or on the author's own `/profile/[username]` page and taps into it. The feature is real, built, and wired — just not reachable from the page that is nominally "the FYI page."

## Flow

```
/fyi  (bulletin board)
  ├─ GET /content/fyi  (useFYIList, ?type=<subtype>&priority&lga&state&feedTab, infinite scroll)
  │     — content.md's alias, NOT fyi.md's own /api/v1/fyi mount (confirmed again this pass)
  ├─ FYISubtypeTabs: All / Safety / Lost & Found / Announcements / Alerts (client filter,
  │     re-fires the GET with a new `type` param per tap)
  ├─ "Post bulletin" → CreatePostModal (defaultContentType="fyi", lockContentType,
  │     defaultFyiSubtype = current active tab if one is selected)
  │     Submit → fyiService.createBulletin() → POST /content/fyi
  │       (fyiType hardcoded to 'community_announcement' in the FYI-locked submit branch of
  │       CreatePostModal regardless of which subtype tab the user was viewing when they
  │       tapped Post — the modal's own fyiSubtype state IS used for the generic-path FYI
  │       creation flow elsewhere in the same file, but the locked/direct path from `/fyi`
  │       specifically sends a fixed 'community_announcement' fyiType, a real discrepancy
  │       worth flagging — see Gaps)
  │     awards 'fyi_created' coins on success
  │
  └─ FYICard (rendered per bulletin — its OWN parallel card, not XPostCard):
        ├─ Tap card (no button/link/video target) → onComment(postId) →
        │     opens FeedCommentsSheet anchored under the card — NOT PostDetailsModal.
        │     This is the only "detail" surface `/fyi` ever opens.
        ├─ Like → contentService.likePost()/unlikePost()  (POST /content/posts/:id/like)
        ├─ Helpful (thumbs-up) → fyiService.markHelpful()  (POST /content/:postId/helpful)
        │     — optimistic isHelpful/helpfulCount toggle, the ONE fyi.md-flavored reaction
        │     actually reachable from this page
        ├─ Save → contentService.savePost()/unsavePost()
        ├─ Share → ShareModal (generic share sheet, not fyiService.shareExternal — that
        │     method exists in fyi.service.ts but has zero call sites anywhere in the repo,
        │     grepped this pass, genuinely dead)
        ├─ Long-press / menu icon → PostCardActionsSheet, built from usePostCardMenuActions()
        │     — includes an owner-only "Pin to feed"/"Extend pin" menu item IF an `onPin`
        │     prop is supplied to FYICard, but `/fyi/page.tsx` never passes `onPin` when
        │     rendering FYICard (confirmed by direct read — only onComment/onDelete/onReport
        │     are wired), so even the ONE pin-adjacent affordance FYICard's own menu system
        │     supports is switched off on this page specifically
        ├─ Report → ReportModal → POST /content/posts/:id/report
        └─ Delete (owner) → confirm dialog → usePostMutations().deletePost()
              → generic post-delete, same as feed posts

/feed  or  /profile/[username]   (the SAME fyi-contentType post, encountered elsewhere)
  └─ XPostCard renders it like any other feed post
        Tap → openPostDetails(postId) → PostDetailsModal opens (usePost(postId) →
          GET /content/posts/:id, which returns the fyi-specific fields — fyiStatus,
          fyiSubtype, endorsements[], isPinned/metadata.isPinned — inline on the generic
          post-detail payload)
        Inside PostDetailsModal, gated on details.content.contentType === 'fyi':
          ├─ FYI Status badge (read-only, shown whenever fyiStatus !== 'active')
          ├─ "Update Status" select (author-only, client-checked via currentUserId ===
          │     author.id from localStorage, NOT a server-role check visible here):
          │     options vary by fyiSubtype — lost_found: active/found/returned/closed;
          │     safety_notice: active/resolved/expired/closed; community_announcement:
          │     active/expired/closed; local_news: active/outdated/closed; alert:
          │     active/resolved/expired/closed; default: active/closed
          │     → fyiService.updateStatus(id, newStatus) → PATCH /content/fyi/:id/status
          │     invalidates ['post', postId] + ['posts']; toast.error on failure only,
          │     no success toast
          ├─ Endorsements block (read-only list, rendered only if details.content
          │     .endorsements is a non-empty array already present on the post payload)
          ├─ "Request Endorsement" button (visible on ANY fyi post, not gated to a
          │     particular subtype or role) → fyiService.endorseBulletin(id,
          │     'Endorsed by community member', 'Community Member') → POST
          │     /content/fyi/:id/endorse — hardcoded note/title strings, no form/input
          │     for the endorser to customize their own endorsement text; toast.success
          │     "Endorsement submitted successfully!" on success
          ├─ RSVP buttons (going/maybe/declined) — ONLY rendered if fyiSubtype is
          │     'community_announcement' or 'local_news' → fyiService.rsvpToBulletin(id,
          │     status) → POST /content/fyi/:id/rsvp; invalidates ['post', postId];
          │     toast.error only on failure
          ├─ "I Acknowledge This" receipt-confirm button — ONLY rendered if fyiSubtype
          │     === 'safety_notice' → fyiService.confirmReceipt(id) → POST
          │     /content/fyi/:id/receipt; toast.success "Receipt confirmed. Stay safe!"
          ├─ Pin/Unpin button — author-only (currentUserId === author.id) →
          │     fyiService.pinBulletin()/unpinBulletin() → POST/DELETE
          │     /content/fyi/:id/pin; invalidates ['post', postId] + ['posts']
          └─ "Status History" button → fyiService.getStatusHistory(id) → GET
                /content/fyi/:id/status-history → opens a history list (component reads
                res.data.history with a data.data.history fallback, defensive against two
                possible envelope shapes) — the audit trail fyi.md documents IS surfaced,
                just only from this modal, never from `/fyi` itself
```

Prose walkthrough: creating a FYI bulletin from `/fyi` is a locked variant of the same `CreatePostModal` used for every other feed content type (Journey 1), submitting to `POST /content/fyi` with a hardcoded `fyiType: 'community_announcement'` regardless of which subtype tab was active — a real mismatch between the tab the user was filtering on and the type actually recorded on their new post unless they happened to be on the Announcements tab already. Once live, `/fyi`'s own board renders each bulletin with a bespoke `FYICard` (not `XPostCard`), and every interaction available there — like, helpful, save, share, report, comment, author-delete — is either the generic content-engagement set or, for "helpful," a genuinely FYI-flavored one-off reaction. None of fyi.md's formal bulletin-lifecycle actions (RSVP, receipt-acknowledgment, authority endorsement, pin, status transitions, audit trail) are reachable from this page: they are not buttons on `FYICard`, not options in its long-press menu (pin exists in the menu-actions hook but `/fyi/page.tsx` never wires the `onPin` prop that would surface it), and not behind the card's tap target either (which opens a comments sheet, not a detail modal). The entire richer lifecycle lives instead inside `PostDetailsModal`, a component `/fyi` never imports — it only becomes reachable if the same fyi-contentType post happens to also surface as an `XPostCard` on `/feed` or on its author's `/profile/[username]` page, where tapping the card opens the detail modal that DOES contain every one of these controls, correctly subtype-gated (RSVP only on announcement/news bulletins, receipt-confirm only on safety notices) and author-gated for status/pin (client-side only, matching fyi.md's own note that pin/unpin/endorse carry no server-side role restriction). A user who only ever visits `/fyi` to browse and post bulletins — the page whose entire purpose is bulletins — would never discover that RSVPing, acknowledging a safety notice, requesting an endorsement, or viewing a status-change audit trail is even possible; they would have to stumble onto the same post via the general feed or the author's profile to find those controls at all.

## Cross-references
- Pages: `/fyi` (community-events-gist.md — base GET/POST `/content/fyi` alias already noted there; this pass fully resolves its own "service-defined, UI-caller-unconfirmed" flag on the richer methods)
- Backend registry: `fyi.md` (`02-api-registry`) — confirms the frontend never calls the standalone `/api/v1/fyi` mount at all; every fyiService method, including the ones this journey found ARE called, targets `/content/fyi/*` (content.md's cluster) exclusively
- Journey 1 (this file): `/fyi`'s create flow reuses `CreatePostModal`, the same component traced there — this pass adds the FYI-locked submit branch's hardcoded `fyiType` detail
- Journey 6 (this file, Help Request): a structurally similar case of a page having its own bespoke card/detail UI layered over the generic content pipeline — but Help Request's richer actions (offers, confirm/reject) ARE reachable from its OWN detail page (`/help-request/[id]`), unlike FYI's richer actions, which are reachable only from a DIFFERENT page's (`/feed`, `/profile`) detail modal. This is a meaningfully worse placement than Help Request's equivalent gap.

## Gaps or inconsistencies found
- The single biggest finding: `/fyi`'s own board (`FYICard`) exposes none of fyi.md's formal bulletin-lifecycle actions (RSVP, receipt-confirmation, authority endorsement, pin/unpin, status transitions, status-history audit trail) despite every one of those actions being fully built, wired, and functional in `fyiService` and in `PostDetailsModal`. The functionality is real, not dead code — it is simply mounted on the wrong page from a user's perspective. Anyone browsing `/fyi` — the page whose entire premise is community notices — cannot RSVP to an announcement, acknowledge a safety alert, request an endorsement, or view a bulletin's status history without first navigating away to `/feed` or the author's profile and finding the same post rendered there instead.
- `CreatePostModal`'s FYI-locked submit path (triggered specifically when reached from `/fyi` via `lockContentType`) hardcodes `fyiType: 'community_announcement'` in its `fyiService.createBulletin()` call, ignoring the modal's own `fyiSubtype` state (which the generic, non-locked FYI creation path elsewhere in the same file DOES use) and ignoring which subtype tab was active on `/fyi` when the user tapped "Post bulletin" — a bulletin created while filtered to "Safety" or "Lost & Found" is still recorded server-side as a `community_announcement` type unless this is compensated for elsewhere not visible in this trace.
- `fyiService.shareExternal()` is defined (`POST /content/:postId/share/external`) but has zero call sites anywhere in the codebase (grepped repo-wide this pass) — genuinely dead, distinct from the RSVP/receipt/endorse/pin/status-history set, which are dead-from-`/fyi`-but-alive-from-elsewhere; this one has no caller anywhere.
- Pin/unpin is technically plumbed through `FYICard`'s own long-press menu system (`usePostCardMenuActions` supports an `onPin` action) but `/fyi/page.tsx` never passes an `onPin` prop to `FYICard`, so the menu-level pin entry never renders there either — a second, independent reason (beyond the missing detail-modal route) that pinning is unreachable from `/fyi` specifically, even though it's one tap away on `/feed`/`/profile`.
- All of `PostDetailsModal`'s FYI lifecycle mutations (status update, endorse, RSVP, receipt-confirm, pin/unpin) show `toast.error` on failure but only endorse and receipt-confirm show a `toast.success` on success — status-update, RSVP, and pin/unpin succeed silently (their only success feedback is the subsequent query-invalidation-driven UI change), an inconsistency in feedback pattern across five sibling actions in the same modal.
- Author/owner gating on Update Status and Pin/Unpin in `PostDetailsModal` is enforced entirely client-side (`currentUserId === details.content.author?.id`, with `currentUserId` itself read from `localStorage.getItem('neyborhuud_user_id')` rather than the authenticated user object used elsewhere in the app) — consistent with fyi.md's own registry note that `/pin`, `/unpin`, and `/endorse` carry no `restrictedTo` server-side role middleware; the "authorities"/"community leaders" language in the backend route comments is not enforced at either the route or (from what this trace can see) the frontend beyond simple post-authorship, meaning any authenticated user, not just verified community leaders/authorities, can currently submit an endorsement via the "Request Endorsement" button.

---

## Summary

Traced all 9 journeys end-to-end from source.

**Journeys 1-4 (prior pass):** the feed's quote-repost sheet is fully built but never triggered (dead UI) — only instant one-tap repost works, hitting `POST/DELETE /content/posts/:id/repost` (not the `/:id/echo` alias Step 4 flagged as untraced, which appears genuinely unused). Vouching has three client-enforced gates (tier/location/proximity) with distinct toast copy each, but crossing a trust tier never triggers a celebration — unlike follower milestones, which do. Hub-community joining confirms all three modes (direct, invite-code, approval-gated) are live and can combine; hubs link 1:1 to chat via a dedicated button; owners cannot leave. Huud Gist is a fully parallel, non-shared implementation with no moderation UI beyond author-delete and a materially weaker location-failure UX than the main feed composer.

**Journeys 5-8 (this pass):** Notifications are entirely server-driven and displayed via two independently-polling (30s interval, not socket-live) unread-count queries that split cleanly on message vs. non-message — but "Mark all read" invalidates a query key (`['notifications', 'unread-count']`) that doesn't match the actual hook key (`['unreadCount', type, excludeType]`) driving the nav badges, so the bell/Connect-tab counts lag behind the in-page list after a mark-all-read action, a previously-unflagged cache-key mismatch. Help Request is confirmed to be neither a fully separate system nor a plain feed post type but both at once: it's a real `contentType` in the same unified `/content/posts` pipeline the feed composer's 8-type grid also writes to, wrapped in its own dedicated list/detail pages, its own offer-based resolution model (not comments), and a manual, self-attested confirm/reject flow that pays HuudCoins on trust alone — with a visible but non-functional "Pay with HuudCoins — Coming soon" affordance and a fully decoupled owner status toggle that doesn't auto-sync with offer confirmations. Local news is confirmed purely read-only with zero social layer: every article is a bare external `<a target="_blank">` to the publisher's own site, there is no in-app article detail route despite a `/local-news/[id]` file existing on disk (that route is entirely reserved for an unrelated legacy Gist-thread redirect), and the page's embedded legacy Huud Gist tab still fires two API calls on every mount even though it immediately self-redirects to `/gist` before a user can ever see that data — dead API weight, not just a dead UI tab. Event creation/editing are two independently-coded forms (not shared components) with a tag-cap inconsistency between them (create: uncapped, edit: capped at 10), a client-side-only organizer guard on the edit page, and — most significantly — zero attendee-notification or RSVP-invalidation behavior when an organizer changes an event's date or venue after people have already committed to attending; existing RSVPs sit unchanged and unflagged, with no proactive signal to attendees that anything moved.

**Journey 9 (this pass):** FYI bulletins resolve the cross-cluster oddity flagged going in — the frontend never calls fyi.md's standalone `/api/v1/fyi` mount at all, exclusively using content.md's `/content/fyi` alias cluster — but the more consequential finding is a page-placement gap, not a dead-code one: fyi.md's formal bulletin-lifecycle actions (RSVP, receipt-confirmation, authority endorsement, pin/unpin, status transitions, status-history audit trail) are all fully built and wired in `fyiService` and consumed by `PostDetailsModal`, yet `/fyi` — the page whose entire purpose is bulletins — never imports that modal and exposes none of these actions on its own `FYICard`/board UI (confirmed by direct grep, zero references). The same fyi-typed post only gains access to its own richer lifecycle if a user happens to encounter it via `/feed` or the author's `/profile/[username]` page instead, where `XPostCard`'s tap-through does open `PostDetailsModal`. Additional gaps found: the FYI-locked composer path hardcodes `fyiType: 'community_announcement'` regardless of the active subtype tab or the modal's own subtype state; `shareExternal` is genuinely dead (no caller anywhere); pin/unpin is separately unreachable via `FYICard`'s own menu system because `/fyi/page.tsx` never wires the `onPin` prop; success-toast feedback is inconsistent across the five lifecycle mutations; and author/role gating on status-update, pin, and endorse is client-side only, with "Request Endorsement" callable by any authenticated user despite fyi.md's route comments implying it's restricted to authorities.
