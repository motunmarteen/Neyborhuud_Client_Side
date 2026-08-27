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

## Summary

Traced all 4 journeys end-to-end from source. Key findings: the feed's quote-repost sheet is fully built but never triggered (dead UI) — only instant one-tap repost works, hitting `POST/DELETE /content/posts/:id/repost` (not the `/:id/echo` alias Step 4 flagged as untraced, which appears genuinely unused). Vouching has three client-enforced gates (tier/location/proximity) with distinct toast copy each, but crossing a trust tier never triggers a celebration — unlike follower milestones, which do. Hub-community joining confirms all three modes (direct, invite-code, approval-gated) are live and can combine; hubs link 1:1 to chat via a dedicated button; owners cannot leave. Huud Gist is a fully parallel, non-shared implementation with no moderation UI beyond author-delete and a materially weaker location-failure UX than the main feed composer.
