# API → Feature → Page Matrix — Chat / Social / Connections

> Cluster: Chat, Messages, Social/Follow/Connections, Friendship, Profile (viewing others), Trust/Vouch, Notifications.
> Cross-referenced against `docs/frontend-intelligence/02-api-registry/{chat,social,follow,connections,trust,profile,notifications,gamification}.md`.
> All paths below verified by reading the actual page/service/hook source, not inferred from filenames.

---

## Page: `/chat` (inbox landing — REDIRECT ONLY, not a real page)
**File(s):** `pwa/src/app/(app)/chat/page.tsx`
**Purpose:** Client-side redirect to `/friendship?tab=dms` (or `?tab=communities` if `?tab=communities|groups`). Comment in the file states the inbox landing "now lives inside the unified Connect hub (`/friendship`)". A matching server-side redirect also exists in `next.config` for the web build; this client component exists only to cover the static-export (Capacitor) build. No API calls of its own.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| — none — | — | — | — | Pure redirect, no data fetching |

**Components used:** none (renders `null`)
**Observed states:** n/a
**Unmatched calls (if any):** none

---

## Page: `/chat/[conversationId]` (REAL — the live conversation view)
**File(s):** `pwa/src/app/(app)/chat/[conversationId]/page.tsx` (wraps `PageClient.tsx`), `pwa/src/app/(app)/chat/[conversationId]/PageClient.tsx` (1182 lines — the entire conversation UI), `error.tsx`, `loading.tsx`
**Purpose:** The one genuinely live chat surface. Renders a single conversation's messages, composer, E2EE key panel, incognito-invite flow, community-chat banner, marketplace-context banner, live socket updates (new/priority messages, delivered/read receipts, marketplace offer/order events), casual live-location sharing, reactions, replies, edit/delete, media upload, and legacy `/chat/new?sellerId=` resolution.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/chat/conversations/detail/:conversationId` | GET | `chatService.getConversationDetail()` via `useQuery(['conversation-detail', ...])` | chat.md: GET `/conversations/detail/:conversationId` | |
| `/chat/conversations/:userId` | GET | `chatService.getOrCreateDirectConversation()` | chat.md: GET `/conversations/:userId` | Used only to resolve the legacy `/chat/new?sellerId=` deep link |
| `/chat/messages/:conversationId` | GET | `chatService.getMessages()` | chat.md: GET `/messages/:conversationId` | Cursor-based `before` pagination on scroll-to-top (loadOlderMessages) |
| `/chat/conversations/:conversationId/read` | POST | `chatService.markAsRead()` | chat.md: POST `/conversations/:conversationId/read` | Fired on mount and on every incoming `message:new`/`message:priority` socket event |
| `/chat/conversations/:conversationId/delivered` | POST | `chatService.markAsDelivered()` | chat.md: POST `/conversations/:conversationId/delivered` | Fired on mount |
| `/chat/send` | POST | `chatService.sendMessage()` | chat.md: POST `/send` | Optimistic bubble with `temp-` id, reconciled on response or socket echo |
| `/chat/messages/:messageId` | DELETE | `chatService.deleteMessage(id, false)` | chat.md: DELETE `/messages/:messageId` | "Delete for me" only (`deleteForEveryone: false`) |
| `/chat/upload` | POST (multipart) | `chatService.uploadChatMedia()` | chat.md: POST `/upload` | With progress callback |
| `/chat/messages/:messageId/location` | POST | `chatService.updateLiveLocation()` | chat.md: POST `/messages/:messageId/location` | Casual live-location share, watched via `getGeolocation().watchPosition` |
| `/chat/conversations/:conversationId/key-bundle` | GET | `chatService.getKeyBundle()` (inside `KeyBundlePanel`) | chat.md: GET `/conversations/:conversationId/key-bundle` | |
| `/chat/keys/verify/:userId` | POST | `e2eeService.verifyUserKey()` (inside `KeyBundlePanel`) | chat.md: POST `/keys/verify/:userId` | |

**Components used:** `ChatRoomLayout`, `ChatThreadPlaceholder`, `ChatRoomHeader`, `ChatMessageCard`, `ChatComposer`, `IncognitoInviteSheet`, `MentionInvitePicker`, `GuestCountdownBanner`, `CommunityInfoSheet`, `CommunityChatBanner`, `KeyBundlePanel` (local, defined in this file), `ChatActionMenu` (type only, `ActionResult`)
**Observed states:** optimistic "sending" bubble (`temp-` id) with rollback on error; per-message delivery/read receipt ticks (`applyPeerDeliveredReceipt`, `applyPeerReadReceipt`, `getOutgoingReadLabel` shown in header subtitle for direct chats); typing indicator NOT observed in this file (no `typing` socket event wired here — worth flagging for the component-registry step, may exist elsewhere or may be missing); E2EE key panel shows explicit unencrypted-messages disclaimer banner ("Messages are not end-to-end encrypted yet... Public keys below are registered in preparation for that, but aren't currently used to protect your messages") — the E2EE UI is real and callable but **not actually wired into message content encryption**; live-location share indicator via `locationSnapshot.isLive`; incognito "witness" join/left system message pills; marketplace offer/deal system message cards with role-aware toasts.
**Unmatched calls (if any):** none — every call in this page matches a documented chat.md route exactly.

---

## Page: `/messages` (REDIRECT ONLY — NOT a distinct feature)
**File(s):** `pwa/src/app/(app)/messages/page.tsx`
**Purpose:** Client-side redirect to `/chat` (which itself then redirects to `/friendship?tab=dms`). Comment: "On the web/server build this redirect is handled by `next.config` `redirects()`... static export does not support `redirects()`, so this client-side replace covers it." Confirmed server-side redirect exists in `next.config.*` (`source: "/messages" → destination: "/chat"`).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| — none — | — | — | — | Pure redirect |

**Components used:** none
**Observed states:** n/a
**Unmatched calls (if any):** none

---

## Page: `/messages/[conversationId]` (REDIRECT ONLY — NOT a distinct feature)
**File(s):** `pwa/src/app/(app)/messages/[conversationId]/page.tsx` (wraps `PageClient.tsx`), `PageClient.tsx`
**Purpose:** Client-side redirect to `/chat/:conversationId`. Also mirrored server-side in `next.config` (`source: "/messages/:conversationId" → destination: "/chat/:conversationId"`).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| — none — | — | — | — | Pure redirect |

**Components used:** none
**Observed states:** n/a
**Unmatched calls (if any):** none

---

## `chat/` vs `messages/` — DEFINITIVE RESOLUTION

**There is exactly ONE live messaging page tree: `/chat/[conversationId]`.** Everything else in both `chat/` and `messages/` is a redirect chain:

- `/messages` → `/chat` (client redirect + server `next.config` redirect)
- `/messages/[conversationId]` → `/chat/:conversationId` (client redirect + server `next.config` redirect)
- `/chat` (bare inbox landing) → `/friendship?tab=dms` (or `?tab=communities`)
- `/chat/[conversationId]` → the real conversation UI (no further redirect)

So the actual inbox / conversation list UI is **not** at `/chat` or `/messages` at all — it lives inside `/friendship` (tab="chats"), rendered by the `ChatsStream` component (`pwa/src/components/friendship/ChatsStream.tsx`), which calls `chatService.getConversations()` → `GET /chat/conversations`. `messages/` is a dead route kept alive only for backward-compat links/bookmarks; it has zero unique functionality. For the page inventory, **`messages/*` should not be counted as a real page** — it is a redirect shim, same tier as a 301.

---

## Page: `/friendship` (REAL — the actual "Connect hub" / chat inbox / follow/followers/near-me hub)
**File(s):** `pwa/src/app/(app)/friendship/page.tsx`
**Purpose:** Tabbed hub with 4 tabs: `chats` (default — unified DM+community inbox via `ChatsStream`), `near_me` (registered-home neighbours, NOT live GPS), `following`, `followers`. Also renders a collapsible map (`ConnectMap`) on the 3 spatial tabs. Legacy `?tab=dms|direct|communities|groups|map` query params are normalized into the 4 current tab ids.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/chat/conversations` | GET | `chatService.getConversations()` via `ChatsStream`'s `useQuery(['conversations'])` | chat.md: GET `/conversations` | "Chats" tab (default) |
| `/follow/:userId/followers` | GET | `followService.getFollowers()` via `useQuery(['followers', user?.id])` | follow.md: GET `/:userId/followers` | Fetched whenever tab is `followers`, `near_me`, or `following` (used for map + following-status cross-check) |
| `/follow/:userId/following` | GET | `followService.getFollowing()` via `useQuery(['following', user?.id])` | follow.md: GET `/:userId/following` | Same multi-tab fetch pattern |
| `/geo/neighbors` (assumed mount — see geo.md) | GET | `geoService.getNeighbors(50)` via `useQuery(['connect-neighbors'])` | geo.md (not in this cluster's registry set) | "Near me" tab — explicitly registered-home based, NOT live GPS, per in-code comment referencing "Phase 2.5 location principle" |
| `/follow/:userId` | POST | `followService.followUser()` (`handleFollowToggle`) | follow.md: POST `/:userId` | |
| `/follow/:userId` | DELETE | `followService.unfollowUser()` (`handleFollowToggle`) | follow.md: DELETE `/:userId` | |
| `/chat/conversations/:userId` | GET | `chatService.getOrCreateDirectConversation()` (`handleMessage`) | chat.md: GET `/conversations/:userId` | "Message" action from a follower/following/near-me card → navigates to `/chat/:convId` |

**Components used:** `TopNav`, `ChatsStream`, `ConnectMap`, `BottomNav`, `BrowseEmptyState`, local `UserCard`, `TabCircle`, `Avatar`, `EmptyState`, `ListSkeleton`
**Observed states:** follower/following counts as tab badges; optimistic follow/unfollow (`followingState`, `pendingUsers` sets) with rollback silently no-op'd on error (no toast shown on follow/unfollow failure here — a UX gap); per-user "messaging…" busy state (`messagingUsers`) while resolving/creating a conversation; map auto-collapses on scroll-down via `useScrollHideBottomNav`.
**Unmatched calls (if any):** `geoService.getNeighbors()` targets the `geo` module, out of this cluster's registry scope — flagged, not verified against geo.md route text in this pass.

---

## Page: `/profile/[username]` (REAL — public/own profile view)
**File(s):** `pwa/src/app/(app)/profile/[username]/page.tsx` (wraps `PageClient.tsx`), `pwa/src/app/(app)/profile/[username]/PageClient.tsx` (1793 lines), `pwa/src/app/(app)/profile/loading.tsx`
**Purpose:** Full profile surface for both own and others' profiles (no separate `/profile` self-route exists — own profile is reached via this same dynamic route using the current user's username). Tabs: Overview, Posts, Trust, Listings, Saved, Economy, Street Radar (Radar). Handles follow/unfollow, block/unblock, vouch/revoke-vouch, start-chat, avatar upload (own only), tipping, milestone celebrations, username-history display.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/profile/me` | GET | `apiClient.get('/profile/me')` directly (inlined in the page's `useQuery`, tried first if authenticated and username matches) | profile.md: GET `/me` | Preferred path for own profile so first/last name are populated |
| `/social/users/username/:username` | GET | `socialService.getUserByUsername()` (fallback when `/profile/me` doesn't match or user unauthenticated) | social.md: GET `/users/username/:username` (the ONE surviving legacy route) | Confirms the naming-trap resolution: `socialService` correctly calls the legacy `/social` mount's one surviving route, NOT `chat.routes.ts`-under-`social` group-chat stuff (which is fully removed per social.md). This is the correct, intentional usage of the legacy route. |
| `/follow/status/:userId` | GET | `useFollow(profile?.id)` → `followService.getFollowStatus()` | follow.md: GET `/status/:userId` | |
| `/follow/:userId` | POST/DELETE | `useFollow` → `followService.followUser`/`unfollowUser` | follow.md | Follow/unfollow button |
| `/follow/milestones/me` | GET | `useMyMilestoneStatus()` → `followService.getMyMilestoneStatus()` | follow.md: GET `/milestones/me` | Own-profile only, drives confetti celebration via localStorage-tracked "seen" milestones |
| `/follow/counts/:userId` | GET | `useFollowCounts(profile?.id)` → `followService.getFollowCounts()` | follow.md: GET `/counts/:userId` | |
| `/follow/:userId/followers` | GET | `useFollowers(profile?.id, 1, 12)` → `followService.getFollowers()` | follow.md: GET `/:userId/followers` | Preview list (12) for `ProfileSnapFriends` |
| `/follow/block/status/:userId` | GET | `useBlock(profile?.id)` → `blockService.getBlockStatus()` | follow.md: GET `/block/status/:userId` | |
| `/follow/block/:userId` | POST/DELETE | `useBlock` → `blockService.blockUser`/`unblockUser` | follow.md: POST/DELETE `/block/:userId` | |
| `/trust/vouch-status/:userId` | GET | `useVouchStatus(profileId)` → `trustService.getVouchStatus()` | trust.md: GET `/vouch-status/:userId` | Drives the whole "Community Trust" vouch card (distance, canVouch, tier gating) |
| `/trust/vouch-metrics/:userId` | GET | `useVouchMetrics(profileId)` → `trustService.getVouchMetrics()` | trust.md: GET `/vouch-metrics/:userId` | |
| `/trust/vouch/:userId` | POST | `useVouchUser(profileId)` → `trustService.vouchForUser()` | trust.md: POST `/vouch/:userId` | Optimistic update + toast; client-side gating on `canVouch`/`locationRequired`/`withinRange` before firing (see cross-cluster note on trust.md's known synthetic-score drift issue) |
| `/trust/vouch/:userId` | DELETE | `useRevokeVouch(profileId)` → `trustService.revokeVouch()` | trust.md: DELETE `/vouch/:userId` | |
| `/trust/vouches/:userId` | GET | `useVouches(profileId)` → `trustService.getVouches()` | trust.md: GET `/vouches/:userId` | "Vouched by" chip list, links to each voucher's profile |
| `/gamification/users/:userId/trust-profile` | GET | `useUserTrustProfile(profileId)` → `trustService.getUserTrustProfile()` | gamification.md: GET `/users/:userId/trust-profile` | Recent Trust Events list in the Trust tab — correctly a `gamification.md` route per that registry's own cross-reference note, not a bug |
| `/gamification/users/:userId/verification` (via `gamificationService.getUserVerification`) | GET | `useQuery(['userVerification', ...])` | gamification.md (out of this cluster's registry set — not independently verified here) | Drives "Verification" fact + Verification Journey section |
| `/chat/conversations/:userId` | GET | `chatService.getOrCreateDirectConversation()` (`handleStartChat`) | chat.md: GET `/conversations/:userId` | "Message" button → navigates to `/chat/:convId` |

**Components used:** `ProfileBrowseHero`, `ProfileBrowseEyebrow`, `ProfileBrowseSectionTitle`, `ProfileSnapStatsRow`, `ProfileSnapPlusCard`, `ProfileSnapHub`, `ProfileSnapFriends`, `FollowerMilestoneCelebration` (dynamic import), `XPostCard`, `ReportModal`, `PostSkeleton`, `PostDetailsModal`, `CreatePostModal`, `AvatarAdjusterModal`, `TipModal`, `AppBrowseLayout`, `BrowseTabStrip`, `BrowseEmptyState`, `TopNav`, `BottomNav`
**Observed states:** follow button 3-state (Follow / Follow back / Following, with "…ing" pending labels); block button states (Blocked / Unblock / hidden-if-blocked-by-them "Unavailable"); vouch button states (Vouch / Vouched / disabled pending) with distance badges ("Xm away", "Too far — 500m limit", "Location needed"); vouch progress bar toward Tree tier (`vouchCount`/3); trust score numeric + tier + percent-to-next-tier progress bar; verification tier badges/progress axes/blockers; username handle-history timeline; mutual-follow / follows-you badges; avatar upload progress (`isUploadingAvatar`); infinite-scroll posts tab with skeleton/error/empty states; own-profile-only badges/HuudCoins/wallet links.
**Unmatched calls (if any):** none within this cluster's registry files — the two gamification.md calls are legitimate per that file's own routes, but were not independently re-verified against gamification.md's full route table in this pass (only spot-checked for `trust-profile`).

---

## Page: `/profile/[username]/followers`
**File(s):** `pwa/src/app/(app)/profile/[username]/followers/page.tsx` (wraps `PageClient.tsx`), `PageClient.tsx`
**Purpose:** Paginated followers list for the given username, separate from the 12-item preview embedded in the main profile page.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/profile/me` (fallback path) or `/social/users/username/:username` | GET | Same inline pattern as main profile page | profile.md: GET `/me`; social.md: GET `/users/username/:username` | Re-resolves the profile just to get the `userId` needed for the followers call |
| `/follow/:userId/followers` | GET | `useFollowers(userId, page, 20)` → `followService.getFollowers()` | follow.md: GET `/:userId/followers` | Paginated (page/limit=20), unlike the main profile page's fixed 12-preview |

**Components used:** `ProfileConnectionsLayout`, `ProfileConnectionsEmpty`, `ProfileConnectionsPagination`, `UserListItem`
**Observed states:** pagination controls (page/totalPages/total), loading/error/empty states
**Unmatched calls (if any):** none

---

## Page: `/profile/[username]/following`
**File(s):** `pwa/src/app/(app)/profile/[username]/following/page.tsx` (wraps `PageClient.tsx`), `PageClient.tsx`
**Purpose:** Paginated following list, structurally identical to the followers page above.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/profile/me` (fallback) or `/social/users/username/:username` | GET | Same inline pattern | profile.md / social.md | |
| `/follow/:userId/following` | GET | `useFollowing(userId, page, 20)` → `followService.getFollowing()` | follow.md: GET `/:userId/following` | |

**Components used:** `ProfileConnectionsLayout`, `ProfileConnectionsEmpty`, `ProfileConnectionsPagination`, `UserListItem`
**Observed states:** same as followers page
**Unmatched calls (if any):** none

---

## Page: `/notifications`
**File(s):** `pwa/src/app/(app)/notifications/page.tsx`, `pwa/src/app/(app)/notifications/loading.tsx`
**Purpose:** Notification inbox with All/Unread filter tabs, mark-one-read on click (plus `actionUrl` navigation), mark-all-read. Client-side filters out `type === 'message'` notifications (messages have their own surface).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/notifications` | GET | `notificationsService.getNotifications(1, 50, filter)` via `useQuery(['notifications', filter])` | notifications.md: GET `/` | `filter` param (`all`/`unread`) passed through to the query string — registry doesn't document a `filter` query param explicitly, worth flagging for the Frontend Contract step |
| `/notifications/:id/read` | PATCH | `notificationsService.markAsRead()` via `useMutation` | notifications.md: PATCH `/:id/read` | |
| `/notifications/mark-all-read` | POST | `notificationsService.markAllAsRead()` via `useMutation` | notifications.md: POST `/mark-all-read` | Registry flags this as the "likely client-migration leftover" alias of `PATCH /read-all` — confirmed here: the frontend actually calls the POST alias, not the PATCH primary, so `/mark-all-read` is the live one in practice, not dead code |

**Components used:** local `NotificationCard`, `EmptyState`, `AppBrowseLayout`
**Observed states:** unread visual state (bold text + blue dot + tinted background row); per-notification type→icon map (30+ notification types mapped, including `sos`, `connection_request`, `follower_milestone`, `offer_*`, `job_*`); actor-name extraction heuristic from `data.actor`/`data.user`/message text; "Mark all read" button only shown when `unreadCount > 0`.
**Unmatched calls (if any):** none on this page itself — but see cross-cluster notes below for `notifications.service.ts` calls made elsewhere in the app that don't match the registry.

---

## Cross-cluster notes

**Registry routes with no caller found in this cluster's pages:**
- chat.md: `/conversations/marketplace/:productId` (used via `chatService.startMarketplaceConversation`, called from marketplace pages, not this cluster), all Group Management routes (`/groups`, `/groups/:conversationId/participants`), Incognito routes are called from `IncognitoInviteSheet`/`CommunityInfoSheet` components (not traced line-by-line here, out of page-level scope), `PUT /messages/:messageId` (edit — `chatService.editMessage` exists but no direct call site found in the pages read), `POST/DELETE /messages/:messageId/reactions` (`chatService.setReaction`/`removeReaction` — called from `ChatMessageCard`, a component not traced in depth here), `POST /messages/:messageId/vote` (poll voting, not observed in pages read), `POST /messages/:messageId/location/stop` (`stopLiveLocation` exists in service but no call site found), `/keys/register`, `/keys/revoke`, `/keys/:userId/fingerprint`, `/keys/verification-status/:userId`, `/keys/:userId` (E2EE registration lifecycle — presumably called from a settings/onboarding surface outside this cluster).
- connections.md: all 4 routes (`POST /request`, `PUT /respond`, `GET /`, `GET /pending`) — no caller found anywhere in this cluster. No `connections.service.ts` file exists in `pwa/src/services/`. This strongly suggests the "Connections" mutual-request system documented in connections.md is either unimplemented on the frontend, superseded by Follow, or implemented under a service name not searched for. Worth a dedicated grep across the whole `pwa/src` in a later step — this cluster's page set (friendship, profile, chat, notifications) shows zero connection-request UI (no "pending requests" list, no accept/reject buttons observed anywhere).
- notifications.md: `PATCH /read-all` (frontend uses the `/mark-all-read` alias instead — see notifications page notes above), `GET/PATCH /preferences` (frontend's `notificationsService.getSettings/updateSettings` call `/notifications/settings` GET/PUT instead — same alias pair, opposite member chosen), `POST /test/push`, `POST /test/sms` (debug routes, correctly not called from any page — but see unmatched call below, the service does have a differently-pathed test-push method).
- trust.md: all 5 routes are called from the profile page.

**Unmatched / suspicious calls found in services (not registry routes as documented):**
- `notificationsService.deleteNotification(id)` calls `DELETE /notifications/:id` — not in notifications.md's 11 routes. No delete-single-notification route documented.
- `notificationsService.deleteAllNotifications()` calls `DELETE /notifications` — not in notifications.md's 11 routes. No bulk-delete route documented. Neither delete method's call site was found in the pages read in this pass (not called from `/notifications`'s `NotificationCard`/page code), so these may be dead service methods — but if called from elsewhere, they'd hit undocumented/possibly-404ing endpoints.
- `notificationsService.testPushNotification()` calls `POST /notifications/test-push` — registry documents the debug route as `POST /test/push` (with a slash), not `/test-push` (hyphenated). Path mismatch — as written this call would likely 404 unless there's an additional undocumented alias route. Not called from any page in this cluster; likely a dead/untested service method.
- `notificationsService.registerPushToken`/`unregisterPushToken` call `POST /auth/device/register` / `POST /auth/device/remove` — these are auth.md territory, not notifications.md, despite living in `notifications.service.ts`. Not independently verified against auth.md in this pass; flagged for the auth cluster's reviewer.
- `usePushNotifications.ts`'s `syncSubscription` calls `POST /mobile/push/subscribe` directly via `apiClient` (bypassing `notifications.service.ts` entirely) — this is `mobile.md` territory. Two different push-registration paths exist in the codebase (`notificationsService.registerPushToken` via `/auth/device/register`, and `usePushNotifications` via `/mobile/push/subscribe`) — worth flagging as a possible duplicate/inconsistent push-registration implementation for a later step.

**chat/ vs messages/ resolution:**
Only `/chat/[conversationId]` is a real page. `/chat` (bare), `/messages`, and `/messages/[conversationId]` are all pure client+server redirects that ultimately funnel into `/friendship?tab=dms` (bare `/chat`) or `/chat/:id` (the two `messages/*` routes). The actual "inbox" UI (conversation list) lives inside `/friendship`'s "Chats" tab via the `ChatsStream` component, which calls `chatService.getConversations()`. Treat `messages/*` as dead/legacy routes in the page inventory, not as a second messaging feature.

**Naming-trap confirmation (chat.md / social.md):**
Directly confirmed from source: `chat.service.ts` calls exclusively `/chat/*` paths (the real, live `modules/chat/chat.routes.ts` mount) for all conversation/message/E2EE operations. `social.service.ts` is a single-function file that calls only `/social/users/username/:username` — the one surviving legacy route on the `modules/social/chat.routes.ts` mount, used correctly by the profile pages as a public-profile-by-username lookup fallback. No frontend code was found calling into the removed legacy group-chat routes. The naming trap is real in the codebase's file layout but the frontend does not fall into it.

**Anything surprising or worth flagging for the human reviewer:**
1. `messages/*` is entirely dead weight — three files (`page.tsx` x2 + `PageClient.tsx`) that do nothing but redirect, duplicated by a `next.config` server-side redirect. Candidate for deletion in the rebuild rather than reimplementation.
2. No `/profile` self-route — own profile is only reachable via `/profile/[username]` with the current user's own username. If the rebuild wants a canonical `/profile/me`-style route, this is a gap today (though `GET /profile/me` is called under the hood).
3. Connections module (connections.md) appears to have zero frontend implementation in this cluster — no service file, no UI. Needs verification against the full `pwa/src` tree (a service could exist outside the checked file list) before concluding it's truly unbuilt.
4. Two parallel push-notification registration paths (`/auth/device/register` via `notifications.service.ts` vs `/mobile/push/subscribe` via `usePushNotifications.ts` directly) — possible duplication/inconsistency.
5. `notificationsService.testPushNotification()` targets a path (`/notifications/test-push`) that doesn't match the registry's documented debug route (`/test/push`) — likely to 404 if ever called; appears to be dead/unused code in this pass since no page called it.
6. Two dead-looking notification service methods (`deleteNotification`, `deleteAllNotifications`) call routes not present in the notifications.md registry at all — either the registry missed real routes (unlikely given its "verified from source" methodology) or these are frontend-only speculative methods never backed by a route.
7. Both alias pairs flagged by notifications.md as ambiguous are resolved by this trace: frontend uses `POST /mark-all-read` (not `PATCH /read-all`) and `GET/PUT /settings` (not `GET/PATCH /preferences`) — useful for the Frontend Contract step to know which member of each pair to standardize on.
8. Trust score display/enforcement drift (already flagged in trust.md) is directly visible in the profile page's vouch button logic — client-side gating text ("Reach Tree tier to unlock vouching") is driven by `vouchStatus.canVouch` from `GET /trust/vouch-status/:userId` (server's raw-score check), which is correct and matches trust.md's own recommendation — but the displayed trust score elsewhere on the same page (`trustScore` used for the big TrustOS number, tier badge, `nextTrustTier`) comes from `normalizeTrustScore()` client-side, which per trust.md may show a higher synthetic-boosted tier than what actually gates vouching. Both computations coexist on this one page.
9. The Trust tab's "Recent Trust Events" correctly pulls from `gamification.md`'s `/users/:userId/trust-profile`, not `trust.md` — this is intentional per both registries' cross-references, not a bug, but easy to misclassify without checking source.
