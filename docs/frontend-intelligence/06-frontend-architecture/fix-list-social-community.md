# Fix List — Social & Community (Chat, Follow/Trust/Connections, Notifications, Gamification, Hub Communities, Events, Huud Gist/FYI, Content Endorsements, News)

> Extracted from full reads (not skims) of 16 source documents produced in Steps 1-6 of the NeyborHuud frontend audit:
> `02-api-registry/{chat,social,follow,connections,trust,gamification,notifications,hub-communities,events,gossip,fyi,content-endorsements,news}.md`,
> `03-api-page-matrix/{chat-social-connections,community-events-gist}.md`,
> `05-user-journeys/social-community-journeys.md`.
>
> Every "Known issues found," "Gaps or inconsistencies found," "Cross-cluster notes," and "Unmatched calls" section in each file was captured below — this is intended as exhaustive coverage, not a representative sample.

---

## Chat

- **What:** No typing-indicator socket event wired into the live conversation view — feature may be missing or exist elsewhere, unconfirmed.
  **Where:** `pwa/src/app/(app)/chat/[conversationId]/PageClient.tsx`
  **Severity:** Low
  **Source:** chat-social-connections.md
  **Status:** Open

- **What:** E2EE key-verification UI (fingerprint panel, "verify key" flow) is fully built and callable but not actually wired into message content encryption — messages are sent unencrypted despite the UI implying otherwise; app shows an explicit disclaimer banner.
  **Where:** `/chat/[conversationId]` `KeyBundlePanel`
  **Severity:** Medium
  **Source:** chat-social-connections.md
  **Status:** Open

- **What:** `modules/social/chat.routes.ts` and `modules/chat/chat.routes.ts` share a near-identical name/path pattern ("chat routes"), creating a real risk that a human or AI searching by filename edits/reads the wrong one; the legacy `social` one only survives for one username-lookup route.
  **Where:** Backend `modules/social/chat.routes.ts` vs `modules/chat/chat.routes.ts`
  **Severity:** Medium
  **Source:** chat.md, social.md
  **Status:** Open (frontend itself does not fall into the trap — confirmed correct usage — but the trap remains live in the codebase for future devs)

- **What:** `/messages` and `/messages/[conversationId]` are dead legacy route trees — three files that do nothing but redirect, duplicated by a `next.config` server-side redirect.
  **Where:** `pwa/src/app/(app)/messages/*`
  **Severity:** Low
  **Source:** chat-social-connections.md
  **Status:** Open (cleanup candidate)

- **What:** No canonical `/profile/me`-style self-profile route exists; own profile only reachable via `/profile/[username]` using the current user's own username.
  **Where:** `pwa/src/app/(app)/profile/[username]`
  **Severity:** Low
  **Source:** chat-social-connections.md
  **Status:** Open

---

## Follow / Trust / Connections

- **What:** Trust score displayed to the user (`buildTrustEconomyModel`'s synthetic score, boosted by streaks/badges/achievements) can be higher than the raw score the backend's `canVouch` check actually enforces — a user can see "Tree tier, 320" in the UI while the backend rejects their vouch attempt with a confusing 403 because the backend only evaluates the raw, unboosted `normalizeScore`.
  **Where:** `pwa/src/lib/trust-economy.ts:124-166` (`normalizeTrustScore`, `buildTrustEconomyModel`) vs backend `trust.routes.ts` `canVouch`
  **Severity:** High
  **Source:** trust.md
  **Status:** Open

- **What:** The same trust-score drift is directly visible on the profile page: the vouch card's gating text correctly uses server truth (`GET /trust/vouch-status/:userId`'s `canVouch`), but the large TrustOS number/tier badge elsewhere on the same page uses the client-side synthetic-boosted score — two different trust numbers coexist on one page.
  **Where:** `/profile/[username]` PageClient.tsx
  **Severity:** Medium
  **Source:** chat-social-connections.md
  **Status:** Open

- **What:** No trust-tier-crossing celebration exists anywhere in the codebase (no confetti/toast/modal when a user crosses e.g. 300 into Tree tier), despite `FollowerMilestoneCelebration` establishing the exact reusable pattern for follower-count milestones. Confirmed via repo-wide grep, no match.
  **Where:** Missing component; compare `pwa/src/components/follow/FollowerMilestoneCelebration.tsx`
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 2)
  **Status:** Open

- **What:** The vouch progress bar on a profile ("Progress to Tree tier — X/3 vouches") shows the VIEWED user's incoming-vouch count, not the viewer's own progress — could be misread as the viewer's own progress bar.
  **Where:** `/profile/[username]` vouch card
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 2)
  **Status:** Open

- **What:** Follow has zero gating (no distance/tier check) while Vouch has three (tier, location, 500m proximity) — the asymmetry is visible in the UI but never explained to first-time users (no onboarding/tooltip).
  **Where:** `/profile/[username]` follow vs vouch buttons
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 2)
  **Status:** Open

- **What:** The Connections module (`connections.md`'s 4 routes: `POST /request`, `PUT /respond`, `GET /`, `GET /pending`) has zero frontend implementation found — no `connections.service.ts` file exists in `pwa/src/services/`, and no pending-requests list/accept/reject UI was found anywhere in the friendship/profile/chat/notifications cluster. Unclear whether unimplemented, superseded by Follow, or implemented under an unsearched name.
  **Where:** Backend `connections.routes.ts`; frontend — no service file found
  **Severity:** High
  **Source:** connections.md, chat-social-connections.md
  **Status:** Open

- **What:** `connection_request`/`connection_accepted` notification types are fully wired into the notification display layer's icon map even though the underlying Connections feature appears to have no frontend implementation — these notification types may be currently unreachable/dead from the frontend's own perspective, or a triggering caller exists outside traced scope.
  **Where:** `/notifications/page.tsx` `typeIcon` map
  **Severity:** Medium
  **Source:** chat-social-connections.md, social-community-journeys.md (Journey 5)
  **Status:** Open

- **What:** Block/unblock lives under the Follow mount (`/follow/block/*`) rather than under Safety, which is a mild surprise for anyone expecting a "Blocked users" settings screen to be safety-related.
  **Where:** Backend `follow.routes.ts` (block.controller.ts)
  **Severity:** Low
  **Source:** follow.md
  **Status:** Open

- **What:** Every handler in `follow.routes.ts` (including `getMyMilestoneStatus`) is cast to `unknown as RequestHandler`, suggesting a TypeScript typing mismatch worked around rather than fixed.
  **Where:** Backend `follow.routes.ts`
  **Severity:** Low
  **Source:** follow.md
  **Status:** Open

- **What:** On `/friendship`, follow/unfollow failures fail silently — no toast is shown if the follow/unfollow API call errors, only a silent optimistic-state rollback.
  **Where:** `pwa/src/app/(app)/friendship/page.tsx` (`handleFollowToggle`)
  **Severity:** Medium
  **Source:** chat-social-connections.md
  **Status:** Open

---

## Notifications

- **What:** "Mark all read" invalidates the query key `['notifications', 'unread-count']`, but the hook actually driving the TopNav bell and BottomNav Connect-tab badges (`useUnreadCount`) uses the key `['unreadCount', type, excludeType]` — these do not match, so pressing "Mark all read" does not immediately clear the nav badges; they only refresh on the next 30-second poll. A real, previously-unflagged cache-key mismatch.
  **Where:** `/notifications/page.tsx` markAllRead mutation vs `useUnreadCount` hook
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 5)
  **Status:** Open

- **What:** Both unread-count badges (TopNav bell, BottomNav Connect tab) are polling-only (`refetchInterval: 30000`) with no socket-driven live update, so a new notification can be up to 30 seconds stale even though the app has live socket wiring elsewhere (chat).
  **Where:** `TopNav`, `BottomNav` (`useUnreadCount`)
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 5)
  **Status:** Open

- **What:** Tapping a notification card fires `markRead.mutate(id)` and `router.push(actionUrl)` without sequencing/awaiting — navigation can in principle race ahead of the mark-read request committing.
  **Where:** `/notifications/page.tsx` `handleClick`
  **Severity:** Low
  **Source:** chat-social-connections.md, social-community-journeys.md (Journey 5)
  **Status:** Open

- **What:** Two full alias-route pairs exist in an 11-route module with no documented intent: `PATCH /read-all` duplicates `POST /mark-all-read`; `GET/PATCH /preferences` duplicates `GET/PUT /settings`. Frontend actually uses `/mark-all-read` (not `/read-all`) and `/settings` (not `/preferences`) — confirmed by trace, but the "dead" alias in each pair risks being reintroduced in the rebuild if not flagged.
  **Where:** Backend `notification.routes.ts`
  **Severity:** Low
  **Source:** notifications.md, chat-social-connections.md
  **Status:** Open

- **What:** `notificationsService.deleteNotification(id)` calls `DELETE /notifications/:id` — not documented anywhere in the 11-route registry. No confirmed frontend call site found; if ever invoked, would hit an undocumented/possibly-404ing endpoint.
  **Where:** `pwa/src/services/notifications.service.ts`
  **Severity:** Medium
  **Source:** chat-social-connections.md
  **Status:** Open

- **What:** `notificationsService.deleteAllNotifications()` calls `DELETE /notifications` — same issue as above, not in the documented route table, no confirmed caller.
  **Where:** `pwa/src/services/notifications.service.ts`
  **Severity:** Medium
  **Source:** chat-social-connections.md
  **Status:** Open

- **What:** `notificationsService.testPushNotification()` calls `POST /notifications/test-push` (hyphenated), but the registry's actual debug route is `POST /test/push` (slash) — a path mismatch that would 404 if ever invoked. Not called from any traced page, likely dead.
  **Where:** `pwa/src/services/notifications.service.ts`
  **Severity:** Low
  **Source:** chat-social-connections.md, social-community-journeys.md (Journey 5)
  **Status:** Open

- **What:** Two parallel, inconsistent push-notification registration paths exist: `notificationsService.registerPushToken/unregisterPushToken` call `/auth/device/register`/`/auth/device/remove`, while `usePushNotifications.ts`'s `syncSubscription` calls `POST /mobile/push/subscribe` directly via `apiClient`, bypassing `notifications.service.ts` entirely.
  **Where:** `pwa/src/services/notifications.service.ts` vs `pwa/src/hooks/usePushNotifications.ts`
  **Severity:** Medium
  **Source:** chat-social-connections.md
  **Status:** Open

- **What:** `/test/push` and `/test/sms` are live, `protect`-gated debug routes left mounted in production that genuinely send a real push notification / SMS to whichever authenticated user calls them.
  **Where:** Backend `notification.routes.ts`
  **Severity:** Medium
  **Source:** notifications.md
  **Status:** Open

- **What:** `/notifications` page's `filter` query param (`all`/`unread`) passed to `GET /notifications` is not documented in the registry's route table.
  **Where:** `/notifications/page.tsx`
  **Severity:** Low
  **Source:** chat-social-connections.md
  **Status:** Open

- **What:** Switching between "All" and "Unread" filter tabs always re-fires a full network request rather than client-filtering an already-fetched list, even if the "all" data was just loaded seconds earlier.
  **Where:** `/notifications/page.tsx`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 5)
  **Status:** Open

---

## Gamification

- **What:** Dead controller imports — `getUserStats`, `getAchievements`, and `getLeaderboard` are imported from `gamification.controller.js` but never wired to any route (superseded by `getFullStats`, `getAllAchievements`/`getMyAchievements`, `getLeaderboardV2`).
  **Where:** Backend `gamification.routes.ts`
  **Severity:** Low
  **Source:** gamification.md
  **Status:** Open

---

## Hub Communities

- **What:** No `restrictedTo`/`requireAdmin`/`requirePermission` gate exists on the two routes labeled "Admin management" in source comments (`updateHub`, `changeMemberRoleHandler`) — only `protect` (any authenticated user) is applied at the route level; whether the controller enforces role checks internally is unconfirmed.
  **Where:** Backend `hubCommunity.routes.ts`
  **Severity:** High
  **Source:** hub-communities.md
  **Status:** Open

- **What:** `hubCommunityService.update()` (PATCH `/:hubId`) and `changeMemberRole()` (PATCH `/:hubId/members/:userId/role`) are defined and hooked (`useUpdateHubCommunity`, `useChangeMemberRole`) but no confirmed caller was found in `CommunityHubAdminPanel` or any other traced page/component — flagged unverified rather than confirmed dead.
  **Where:** `pwa/src/services/hubCommunity.service.ts`, `CommunityHubAdminPanel`
  **Severity:** Low
  **Source:** community-events-gist.md, social-community-journeys.md (Journey 3)
  **Status:** Open

- **What:** Hub owners have no way to leave, transfer ownership, or delete a hub from any traced UI — the Leave button is simply disabled with label "You own this hub" and no alternative action is offered.
  **Where:** `/communities/[id]` PageClient.tsx
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 3)
  **Status:** Open

- **What:** Approval-gating (whether a hub requires admin review to join) is never visually previewed before a user commits to joining — neither the browse list nor the invite-code preview page shows "this hub requires approval" ahead of time; the user only learns this after clicking Join, via a pending-toast.
  **Where:** `/communities`, `/communities/join/[code]`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 3)
  **Status:** Open

---

## Events

- **What:** Editing an event never notifies existing attendees and never touches/invalidates any RSVP-related query — if an organizer changes the date or venue after people have already RSVP'd, every existing "going"/"maybe" RSVP silently continues to point at the moved event with no proactive signal to the attendee.
  **Where:** `pwa/src/hooks/useEvents.ts` (`useUpdateEvent`), `/events/[id]/edit`
  **Severity:** High
  **Source:** social-community-journeys.md (Journey 8)
  **Status:** Open

- **What:** The organizer-only guard on `/events/[id]/edit` is enforced entirely client-side (`user.id !== event.organizerId` after the event has already been fetched into local state) — not a request-level authorization boundary from what the page's own code shows.
  **Where:** `/events/[id]/edit` PageClient.tsx
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 8)
  **Status:** Open

- **What:** Tag-count validation differs between the create form (no cap) and the edit form (hard cap of 10 via `addTag()`) — the same logical field has two different client-side rules depending on which form is used.
  **Where:** `CreateEventForm` vs `/events/[id]/edit` PageClient.tsx
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 8)
  **Status:** Open

- **What:** The edit form's submit payload only includes several fields (title/description/venue/tags/coverImage) when truthy/changed, silently omitting a field from the PUT body if cleared back to blank rather than explicitly instructing the backend to clear it — actual resulting behavior depends on unverified backend PUT-omission semantics. `isFree`, `visibility`, and `type` are the only fields always included regardless of truthiness.
  **Where:** `/events/[id]/edit` PageClient.tsx submit handler
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 8)
  **Status:** Open

- **What:** `useCreateEvent`'s error-toast copy was not independently verified character-for-character (only `useUpdateEvent`'s was directly read) — flagged as unverified, not confirmed broken.
  **Where:** `pwa/src/hooks/useEvents.ts`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 8)
  **Status:** Open

---

## Huud Gist / FYI

### Huud Gist (Gossip)

- **What:** `protectWithBetterAuth` (Better Auth cookie-only check, no Bearer fallback) was used on 8 routes while the frontend's `ApiClient` is Bearer-only — every gated route (like/comment/create/update/delete on Huud Gist) 401'd for every real user, every time.
  **Where:** Backend `NeyborHuud-ServerSide/src/modules/content/gossip.routes.ts`
  **Severity:** Critical
  **Source:** gossip.md
  **Status:** FIXED, already deployed (2026-08-27 — swapped `protectWithBetterAuth` → `protectAny` on all 8 affected routes; verified via `tsc --noEmit` clean and 79/79 passing test suite)

- **What:** `protectWithBetterAuth` middleware is still exported from `auth.middleware.ts` with zero remaining callers anywhere in `src/` after the fix — candidate for removal in a future backend cleanup.
  **Where:** Backend `auth.middleware.ts`
  **Severity:** Low
  **Source:** gossip.md
  **Status:** Open

- **What:** The dual-mount pattern (`/gossip` and `/huud-gist` serving the identical router, disambiguated only by a request-tagging middleware) is unusual; whether `/gossip` is fully dead weight or still reachable somewhere is unconfirmed.
  **Where:** Backend `app.ts:330-331`
  **Severity:** Low
  **Source:** gossip.md
  **Status:** Open

- **What:** No standalone "poll" content type exists in the feed composer despite `chat.md` documenting a message-poll-vote route elsewhere in the app (chat messages, not feed posts) — polls are not a feed/gist post type today.
  **Where:** `CreatePostModal` `POST_TYPES`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 1)
  **Status:** Open

- **What:** No client-side Nigeria/location pre-check exists in `CreateHuudGistModal`, unlike `CreatePostModal`'s dedicated dead-end panel for the same class of problem — a `requireNigeriaLocation` backend rejection surfaces only as a raw, ungated error string in red text.
  **Where:** `pwa/src/components/huud-gist/CreateHuudGistModal.tsx`
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 4)
  **Status:** Open

- **What:** No moderation surface exists on `/gist/[id]` beyond author-self-delete — no report button on a thread or comment, no comment-level delete/like, no community-manager action — despite `huudGistService` fully defining `getComments`, `likeComment`, `deleteComment`, `updateThread` with zero call sites found (reconfirmed across two passes).
  **Where:** `/gist/[id]` PageClient.tsx; `pwa/src/services/huudGist.service.ts`
  **Severity:** Medium
  **Source:** community-events-gist.md, social-community-journeys.md (Journey 4)
  **Status:** Open

- **What:** Huud Gist reuses none of the feed's card/composer components — a fully parallel implementation (two independent post/comment/like stacks), a maintenance-surface concern for anyone consolidating in the rebuild.
  **Where:** `pwa/src/app/(app)/gist/*` vs feed components
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 4)
  **Status:** Open

- **What:** Success-feedback asymmetry: `CreatePostModal` gives a 1.4s in-modal success animation before closing; `CreateHuudGistModal` just closes and navigates immediately with no equivalent confirmation moment.
  **Where:** `CreateHuudGistModal` vs `CreatePostModal`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 4)
  **Status:** Open

- **What:** `/local-news` unconditionally fires `GET /huud-gist/sections` and `GET /huud-gist` (thread list) on every mount regardless of active tab, even though the embedded "huud-gist" tab immediately self-redirects to `/gist` before that data can ever be displayed — confirmed dead API weight, not just a dead UI tab.
  **Where:** `pwa/src/app/(app)/local-news/page.tsx`
  **Severity:** Low
  **Source:** community-events-gist.md, social-community-journeys.md (Journey 7)
  **Status:** Open

- **What:** The "huud-gist" tab button, `CreateHuudGistModal`, and `HuudGistRow` imports are all still present and instantiated in `/local-news/page.tsx`'s source despite being functionally unreachable — dead code surface for a future cleanup pass.
  **Where:** `pwa/src/app/(app)/local-news/page.tsx`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 7)
  **Status:** Open

- **What:** Quote-repost (`RepostComposerSheet`) is fully built and wired but `setShowRepostComposer(true)` — the only way to open it — is never called anywhere in `XPostCard.tsx` or `usePostCardMenuActions.ts` (zero grep hits); only instant one-tap repost is reachable by users.
  **Where:** `pwa/src/components/feed/RepostComposerSheet.tsx`, `XPostCard.tsx`
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 1)
  **Status:** Open

- **What:** `CreatePostModal.handleSubmit` swallows all errors silently (`catch (error) { void error; }`) — a failed post (validation error, server 500) shows no toast/inline error to the user, only that the loading spinner stops.
  **Where:** `pwa/src/components/feed/CreatePostModal.tsx`
  **Severity:** High
  **Source:** social-community-journeys.md (Journey 1)
  **Status:** Open

- **What:** Instant (one-tap) repost never checks for a home location before sending — silently sends `location: undefined` if `getRegisteredLocationSync()` returns null — while the (currently unreachable) quote-repost sheet does gate on it, an inconsistency that would surface if quote-repost is ever wired up.
  **Where:** `XPostCard.tsx` `handleInstantRepost`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 1)
  **Status:** Open

- **What:** The documented `POST /:id/echo` alias route (flagged unresolved in an earlier audit step) has no frontend caller anywhere — the frontend exclusively uses `/content/posts/:id/repost`. Either `/echo` is dead backend surface or an unfound caller exists.
  **Where:** Backend content routes; frontend `contentService`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 1)
  **Status:** Open

### FYI Bulletins

- **What:** Two route comments claim role restriction ("community leaders" on pin/unpin, "authorities" on endorse) that is not enforced by any route-level middleware — only plain `protect` (any authenticated user) is applied, unlike `moderation.routes.ts`'s explicit `restrictedTo('Moderator', 'Super Admin')` pattern. Whether the controller enforces this internally is unconfirmed.
  **Where:** Backend `fyi.routes.ts`
  **Severity:** High
  **Source:** fyi.md
  **Status:** Open

- **What:** Confirmed at the frontend layer: author/owner gating on Update Status, Pin/Unpin, and "Request Endorsement" in `PostDetailsModal` is enforced entirely client-side (`currentUserId === author.id`, with `currentUserId` read from `localStorage.getItem('neyborhuud_user_id')` rather than the authenticated user object used elsewhere) — any authenticated user, not just verified community leaders/authorities, can currently submit an endorsement via the visible "Request Endorsement" button.
  **Where:** `pwa/src/components/feed/PostDetailsModal.tsx`
  **Severity:** High
  **Source:** social-community-journeys.md (Journey 9)
  **Status:** Open

- **What:** The single biggest FYI finding: `/fyi`'s own board (`FYICard`) exposes NONE of fyi.md's formal bulletin-lifecycle actions (RSVP, receipt-confirmation, authority endorsement, pin/unpin, status transitions, status-history audit trail) despite all of them being fully built and wired in `fyiService`/`PostDetailsModal`. The functionality is only reachable if the same fyi-typed post happens to also render as an `XPostCard` on `/feed` or the author's `/profile/[username]` page.
  **Where:** `pwa/src/app/(app)/fyi/page.tsx`, `FYICard.tsx` vs `PostDetailsModal.tsx`
  **Severity:** High
  **Source:** social-community-journeys.md (Journey 9)
  **Status:** Open

- **What:** `CreatePostModal`'s FYI-locked submit path (reached specifically from `/fyi` via `lockContentType`) hardcodes `fyiType: 'community_announcement'` regardless of which subtype tab (Safety, Lost & Found, etc.) was active when the user tapped "Post bulletin" — a bulletin created while filtered to "Safety" is still recorded server-side as a `community_announcement`.
  **Where:** `pwa/src/components/feed/CreatePostModal.tsx`
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 9)
  **Status:** Open

- **What:** `fyiService.shareExternal()` (`POST /content/:postId/share/external`) has zero call sites anywhere in the codebase — genuinely dead code, distinct from the RSVP/receipt/endorse/pin/status-history set (which are alive-but-misplaced).
  **Where:** `pwa/src/services/fyi.service.ts`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 9)
  **Status:** Open

- **What:** Pin/unpin is technically supported by `FYICard`'s own long-press menu system (`usePostCardMenuActions` supports an `onPin` action) but `/fyi/page.tsx` never passes the `onPin` prop, so the menu-level pin entry never renders — a second, independent reason pinning is unreachable from `/fyi` beyond the missing-detail-modal issue.
  **Where:** `pwa/src/app/(app)/fyi/page.tsx`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 9)
  **Status:** Open

- **What:** Inconsistent success-toast feedback across five sibling FYI lifecycle mutations in `PostDetailsModal`: only endorse and receipt-confirm show a success toast; status-update, RSVP, and pin/unpin succeed silently (no confirmation beyond the UI updating from cache invalidation).
  **Where:** `pwa/src/components/feed/PostDetailsModal.tsx`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 9)
  **Status:** Open

- **What:** The frontend never calls fyi.md's standalone `/api/v1/fyi` mount at all — every `fyiService` method (including create/list) targets `/content/fyi/*` (content.md's alias cluster) exclusively, making the standalone mount's entire 10-route registry effectively unused by the frontend.
  **Where:** `pwa/src/services/fyi.service.ts` vs backend `fyi.routes.ts`
  **Severity:** Medium
  **Source:** community-events-gist.md, social-community-journeys.md (Journey 9)
  **Status:** Open

---

## Content Endorsements

- **What:** The `GET /:contentId/endorsements` route's own source comment shows the original author was unsure whether it should be public ("Public read access? Or protected? Let's say public can view endorsements.") — an explicit, unresolved author uncertainty left live in production code, not a considered decision.
  **Where:** Backend `endorsement.routes.ts`
  **Severity:** Medium
  **Source:** content-endorsements.md
  **Status:** Open

- **What:** Two different "endorsement" systems exist for the same product concept ("authorities endorsing content") with two different enforcement levels: `content-endorsements.md`'s module uses the real `requirePermission('content:endorse')` RBAC gate, while `fyi.md`'s `/fyi/:id/endorse` uses only plain `protect` with a comment implying (but not enforcing) role restriction. The frontend may need one unified "Endorse" UI actually backed by two inconsistent backend systems.
  **Where:** Backend `endorsement.routes.ts` vs `fyi.routes.ts`
  **Severity:** Medium
  **Source:** content-endorsements.md
  **Status:** Open

---

## News

- **What:** `GET /feed` returns raw XML — the only non-JSON API response found across the entire registry — requiring special-case handling in the API client/data layer rather than the standard JSON-assuming response pipeline used everywhere else.
  **Where:** Backend `news.routes.ts` `/feed`
  **Severity:** Low
  **Source:** news.md
  **Status:** Open

- **What:** `/local-news` has no in-app article reader/detail view of any kind — every article renders as a bare `<a href={article.link} target="_blank">`, a full external navigation to the publisher's site. The dynamic `/local-news/[id]` route file exists on disk but is entirely reserved for an unrelated legacy Gist-thread redirect; RSS articles never navigate there and there is no article-id-keyed route at all.
  **Where:** `pwa/src/app/(app)/local-news/page.tsx`, `NewsArticleRow`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 7)
  **Status:** Open

- **What:** Zero social/interactive layer exists on any news article (no like/comment/save/share), a stark contrast with every other content type in the app. Not determinable from the frontend alone whether this is intentional or an unbuilt feature.
  **Where:** `pwa/src/app/(app)/local-news/page.tsx`
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 7)
  **Status:** Open

---

## Cross-Cutting (Help Request — surfaced via community-events-gist.md / journeys, feature straddles multiple areas above)

- **What:** "Pay with HuudCoins" is a visible, styled, "Coming soon"-labeled affordance on every help-request detail page with no API call behind it — sets a real user expectation of imminent functionality that does not exist.
  **Where:** `/help-request/[id]` PageClient.tsx
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 6)
  **Status:** Open

- **What:** Help-offer confirmation (which pays the helper +5 HuudCoins) and the owner's separate 4-state status control (open/in_progress/fulfilled/closed) are fully decoupled — confirming every offer does not auto-transition status to fulfilled, and setting status to fulfilled/closed does not auto-resolve outstanding pending offers, potentially leaving a "closed" request with indefinitely "pending" offers or vice versa.
  **Where:** `/help-request/[id]` PageClient.tsx
  **Severity:** Medium
  **Source:** social-community-journeys.md (Journey 6)
  **Status:** Open

- **What:** No comment/discussion thread exists on `/help-request/[id]` — the offer list is the only structured interaction surface; a user wanting to ask a clarifying question before offering help has no in-page mechanism, requiring a multi-hop detour via DM.
  **Where:** `/help-request/[id]` PageClient.tsx
  **Severity:** Low
  **Source:** social-community-journeys.md (Journey 6)
  **Status:** Open

- **What:** The amount-received self-report control (`PATCH /content/posts/:id/amount`) lives only on the list page's card (`HelpRequestCard`), not the detail page itself, despite the detail page being where the funding-goal progress bar and full context live — a UI-placement inconsistency.
  **Where:** `HelpRequestCard` vs `/help-request/[id]`
  **Severity:** Low
  **Source:** community-events-gist.md, social-community-journeys.md (Journey 6)
  **Status:** Open

- **What:** Help-offer confirmation, which pays real HuudCoins, is entirely trust-based/self-attested by the requester — no verification that funds or aid were actually delivered before coins are awarded, a fraud/gaming surface (e.g. confirming an alt account, or pressuring a confirm without delivering).
  **Where:** `/help-request/[id]` `useConfirmHelpOffer`
  **Severity:** High
  **Source:** social-community-journeys.md (Journey 6)
  **Status:** Open

- **What:** Two different service wrappers (`contentService.updateHelpRequestAmount` and `helpRequestService.updateAmountReceived`) hit the identical `PATCH /content/posts/:id/amount` endpoint — a duplication worth consolidating.
  **Where:** `pwa/src/services/content.service.ts`, `pwa/src/services/helpRequest.service.ts`
  **Severity:** Low
  **Source:** community-events-gist.md
  **Status:** Open

---

# Completeness Summary

**Total findings extracted: 56**

By severity:
- **Critical:** 1 (the gossip/Huud Gist auth bug — FIXED)
- **High:** 9
- **Medium:** 22
- **Low:** 24

By status:
- **Open:** 55
- **Fixed, already deployed:** 1 (gossip.md `protectWithBetterAuth` bug)

All 16 assigned source files were read in full (not skimmed): chat.md, social.md, follow.md, connections.md, trust.md, gamification.md, notifications.md, hub-communities.md, events.md, gossip.md, fyi.md, content-endorsements.md, news.md, chat-social-connections.md, community-events-gist.md, social-community-journeys.md (781 lines, read across two passes due to truncation).
