# API → Feature → Page Matrix — Feed / Content / Search

## Page: `/feed`
**File(s):** `pwa/src/app/(app)/feed/page.tsx`
**Purpose:** Primary infinite-scroll feed (location + tab based), merges real posts with discovery blocks (marketplace/events/jobs/help/services/news/neighbors), supports content-type filtering, FYI subtype filtering, emergency actions, comments, pin/save/like/report/delete/repost.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/feed` (falls back to `/content/posts`) | GET | `contentService.getLocationFeed()` → `useLocationFeed()` | content.md: `GET /`,`/posts` (same handler, aliased at top-level `/api/v1/feed`) | Primary feed call. Falls back to `/content/posts?filter=neighborhood` on 404/500/502/503. Mock data (`getMockFeedPage`) is merged in regardless of API success/failure — real API failure silently returns 100% mock content. |
| `/content/posts/:id/like` | POST | `contentService.likePost()`/`unlikePost()` → `usePostMutations()` | content.md: `POST /posts/:id/like` (`toggleLike`, alias of `/:id/like`) | Both like and unlike call the *same* toggle endpoint — correctly documented as intentional in content.md. |
| `/content/posts/:id/save` | POST | `contentService.savePost()`/`unsavePost()` → `usePostMutations()` | content.md: `POST/DELETE /:id/save`,`/posts/:id/save` | Frontend uses POST with `{unsave:true}` body instead of the documented DELETE alias — functionally fine since backend aliases both, but frontend never calls the DELETE variant. |
| `/content/:id/helpful` | POST | `fyiService.markHelpful()` (called from `handleHelpful` for FYI cards) | content.md: `POST /:id/helpful` | |
| `/content/posts/:id/acknowledge` | POST | `contentService.acknowledgePost()` | content.md: `POST /:id/acknowledge`,`/posts/:id/acknowledge` | Emergency card action. |
| `/content/posts/:id/aware` | POST | `contentService.toggleImAware()` | content.md: `POST /:id/aware`,`/posts/:id/aware` | |
| `/content/posts/:id/nearby` | POST | `contentService.toggleImNearby()` | content.md: `POST /:id/nearby`,`/posts/:id/nearby` | |
| `/content/posts/:id/safe` | POST | `contentService.toggleSafeMark()` | content.md: `POST /:id/safe`,`/posts/:id/safe` | |
| `/content/posts/:id/confirm-dispute` | POST | `contentService.confirmOrDispute()` | content.md: `POST /:id/confirm-dispute`,`/posts/:id/confirm-dispute` | |
| `/content/:id` | DELETE | `contentService.deletePost()` → `usePostMutations().deletePost` | content.md: `DELETE /:id` | |
| `/content/posts/:id/report` | POST | `contentService.reportPost()` (via `ReportModal.onSubmit`) | content.md: `POST /posts/:id/report`,`/:id/report` | Not moderation.md — reporting is a content-module route; moderation.md only has admin resolve/assign/bulk-resolve, no create-report route. |
| `/gamification/feed/:postId/pin` | POST | `gamificationService.pinPost()` → `usePinPost()` (from `useGamification.ts`) | gamification.md: `POST /feed/:postId/pin` | Pin-to-feed via HuudCoin, triggered from `BoostModal` on the feed page. Cross-cluster (gamification), included because feed page owns the trigger UI. |
| `/departments` | GET | `departmentService.getDepartments()` → `useDepartments()` | Not in this cluster's assigned registry files (departments.md, not reviewed here) | Used to populate the department filter dropdown. Cross-cluster — noted, not deep-traced. |
| `/profile/me` (patches localStorage) | GET | `authService.syncCommunityFromProfile()` | auth.md (not this cluster) | Runs on mount to sync community context / redirect to `/pick-community` or `/verify-location`. Out of scope, noted only. |
| `useFeedDiscoveryPools()` → marketplace/events/jobs/help-request/services/news/geo/search services | GET (various) | See "Discovery pool" note below | marketplace.md / events.md / jobs.md / geo.md / news.md (not this cluster's files) | Feeds the `FeedDiscoveryBlock` mixed-content rows. Falls back to hardcoded MOCK_* arrays when live data is empty — real backend failures are invisible to the user. `neighbors` pool falls back to `searchService.searchUsers("", 1, 18)` (search.md: `GET /` with `type=users`) when `geoService.getNearbyUsers` has no geo. |

**Components used:** `TopNav`, `LeftSidebar`, `RightSidebar`, `BottomNav`, `FeedSkyHero`, `FeedNewsTicker`, `FeedProfilePrompt`, `FrequentPlaceContextBanner`, `RedZoneBanner`, `XPostCard`, `HelpRequestCard`, `FYICard` (imported, not visibly rendered in the reviewed JSX path), `FeedDiscoveryBlock`, `FeedSkeleton`, `PostDetailsModal`, `FeedCommentsSheet` (→ `CommentForm`, `CommentItem`), `CreatePostModal`, `ReportModal`, `BoostModal`, `FeedWelcomeSheet`, `FeedSentinelRow` (imported, banner data not confirmed rendered in reviewed section).
**Observed states:** loading (`FeedSkeleton count=5`), error (retry button with `isRefetching` spinner), two distinct empty states (no-location-with-error vs. no-posts-with-location, each with illustration + CTA), infinite scroll (`react-intersection-observer` `loadMoreRef` + `hasNextPage`/`fetchNextPage`), pulsing-dots "load more" indicator, missed-alerts banner (`meta.missedAlerts`), content-type filter banner with clear button, FYI subtype chip row (only when `contentType==='fyi'`). No explicit pull-to-refresh handler found in this file (only manual `refetchFeed()` on error retry).
**Unmatched calls (if any):** None outside cross-cluster services — all `contentService`/`fyiService`/`gamificationService` calls used directly on this page match documented content.md/gamification.md routes.

## Page: `/feed/media-preview`
**File(s):** `pwa/src/app/(app)/feed/media-preview/page.tsx`
**Purpose:** Static, hardcoded design-preview page for `XPostCard` media/repost layouts. Not a real data page.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| None | — | — | — | Renders `XPostCard` with static sample data from `@/lib/feedPreviewSamples` (`FEED_MEDIA_PREVIEW_SAMPLES`, `FEED_REPOST_PREVIEW_SAMPLES`). All `on*` handlers are no-ops (`noop`). No network calls of any kind. |

**Components used:** `TopNav`, `BottomNav`, `XPostCard`.
**Observed states:** None (static content only).
**Unmatched calls (if any):** N/A — no calls made.

## Page: `/explore`
**File(s):** `pwa/src/app/(app)/explore/page.tsx`
**Purpose:** Combined search UI (search bar + tabbed results) and a pre-search "Explore dashboard" (trending searches, recent local search history from localStorage, Nigeria news hero).

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/search` | GET | `searchService.search()` → `useSearch()` | search.md: `GET /` (`globalSearch`) | Debounced (300ms) via `useDebouncedValue`. Drives all result sections (users/locations/posts + content-type sub-tabs). |
| `/search/trending` | GET | `searchService.getTrendingSearches(10)` | **No match** — search.md documents `GET /trends`, not `/trending` | Unmatched call. On any failure (including a 404 from calling the wrong path) it silently falls back to a hardcoded topic list (`#SafetyFirst`, `#LocalJobs`, etc.), so the bug is invisible in the UI — worth flagging for the human reviewer as a likely-always-failing call. |
| `/news/articles?region=nigeria&limit=5` | GET | `newsService.getArticles()` | news.md (not this cluster's assigned file, but directly used here) | Powers the "Discover" news hero card. Falls back to empty array on error. |
| localStorage `searchHistory` | — | Local only, no backend call | — | Recent-search history and its clearing are 100% client-side (`localStorage`), not backed by `search.md`'s `GET/DELETE /search/history` routes — those backend routes appear unused from this page. |

**Components used:** `AppBrowseLayout`, `UserSearchResult`, `PostSearchResult`, `LocationSearchResult` (all three are presentational — no API calls of their own, confirmed by grep).
**Observed states:** loading spinner during search (`searchLoading`), error text (`searchError`), zero-results message with suggestions, "Explore dashboard" default state (trending/history/news) shown when query is empty. No infinite scroll or pagination UI observed — results render as a single flat list regardless of `totalResults`. No pull-to-refresh.
**Unmatched calls (if any):** `searchService.getTrendingSearches()` → `GET /search/trending`, not present in `search.md` (registry only has `GET /trends`). Flagged above.

## Page: `/popular`
**File(s):** `pwa/src/app/(app)/popular/page.tsx`
**Purpose:** Not a real content page — pure client-side redirect. Immediately routes to `/neighborhood?tab=street-radar` (or the legacy `tab` query param value, defaulting `hot`→`street-radar`). Comment in source confirms: "Legacy /popular URL — merged into My Huud (Street Radar tab)."

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| None | — | — | — | Zero API calls. Renders `null`, only does `router.replace()`. The actual "Popular" content now lives at `/neighborhood`, which is **outside this cluster's assigned page list** and was not traced here. |

**Components used:** None (no UI rendered).
**Observed states:** None — component returns `null` while redirecting.
**Unmatched calls (if any):** N/A.

## Page: `/saved`
**File(s):** `pwa/src/app/(app)/saved/page.tsx`
**Purpose:** Authenticated-only bookmarks page — lists the user's saved posts with client-side filter chips (content type) and client-side text search, plus unsave action.

| API Called | Method | Via Service/Hook | Registry Match | Notes |
|---|---|---|---|---|
| `/content/saved` | GET | `contentService.getSavedPosts(1, 40)` (direct `useQuery`, not via `useSavedPosts()` hook in `usePosts.ts`) | content.md: `GET /saved` | Note: page uses its own inline `useQuery({queryKey:['saved-posts'], ...})` rather than the `useSavedPosts()` infinite-query hook exported from `usePosts.ts` — that hook (`queryKey: ["savedPosts"]`, different key, singular fetch of page 1 with `getNextPageParam`) exists but is not used by this page; fixed `limit=40`, no pagination/infinite-scroll wired up despite the underlying hook supporting it. |
| `/content/posts/:id/save` | POST (with `{unsave:true}`) | `contentService.unsavePost()` (via inline `useMutation`) | content.md: `POST/DELETE /:id/save`,`/posts/:id/save` | Same unsave-via-POST pattern as the feed page. Optimistic removal from the local list with rollback on error. |

**Components used:** `AppBrowseLayout`, `BrowseEmptyState`, `BrowseFilterChip`, `BrowseSearchField`, `BrowseTabStrip`, `SavedPostRow` (presentational, no API calls of its own — confirmed by grep), `StatCard` (local to this file).
**Observed states:** not-mounted skeleton (`SavedToolbarSkeleton` + card skeletons, SSR/hydration guard via `useClientAuthUser().mounted`), signed-out empty state (`BrowseEmptyState` with sign-in CTA), loading skeleton (`isLoading`), zero-saved-posts empty state, zero-filtered-results empty state ("No matches"), manual refresh button with spin animation (`isFetching`). No infinite scroll (single fixed-size fetch of 40); filtering/search happen entirely client-side over the already-fetched 40.
**Unmatched calls (if any):** None — both calls match content.md exactly.

## Cross-cluster notes

- **Registry routes in `content.md` with no caller found in this cluster:** `POST /` (secondary create-post path, distinct validation schema — cluster's `CreatePostModal` was not deep-traced but `contentService.createPost` targets `/content/posts` only), `GET /:id/analytics`, `PATCH /marketplace/:id/status`, `POST /:id/echo` alias forms of repost used elsewhere but not directly observed being called from this cluster's pages (repost UI lives inside `XPostCard`, which takes an `onReposted` callback but the repost mutation call site itself was not located inside this cluster's page files — likely triggered from a modal outside the traced files), `POST /:id/cross-post`, `POST /:id/follow-update`, `GET /:id/interactions`, `/locations/follow` family (follow-a-place), all `help-offers` routes, `PATCH /posts/:id/help-status`. These may well be called from other pages/components outside this cluster (e.g. profile, help-request detail) — not claiming they're dead app-wide, only that this cluster's traced files don't call them.
- **Registry routes in `search.md` with no caller found anywhere in `pwa/src` (grepped globally for `searchService.`):** `searchEvents`, `searchJobs`, `searchMarketplace`, `searchServices`, `getSuggestions` (`GET /search/suggestions`), `getSearchHistory`/`clearSearchHistory` (`GET`/`DELETE /search/history` — also has no matching registry route at all, since search.md only documents 4 routes total), `globalSearch()` legacy method. `POST /ai` (AI search) also has no caller found. Likely dead from the frontend's perspective, but only confirmed absent in `pwa/src`, not verified against every possible caller.
- **Unmatched/broken call:** `searchService.getTrendingSearches()` on the Explore page calls `GET /search/trending`, but `search.md` documents `GET /search/trends` — different path, no alias noted in the registry. This call is silently masked by a try/catch fallback to hardcoded topics, so it's a real bug that would not surface visually to a user or a casual QA pass.
- **Bug-shaped feed behavior worth flagging:** `useLocationFeed` (in `usePosts.ts`) always merges in mock/fake posts from `getMockFeedPage()` regardless of whether the real API call succeeds, and returns 100% mock content silently if the real call throws. This means `/feed` can render a fully populated, seemingly-normal feed even when the backend is completely down or unreachable — no error state would ever show in that case since the catch path returns `mock`, not a thrown error.
- **`/saved` page and `usePosts.ts`'s exported `useSavedPosts()` hook have diverged**: the page reimplements its own `useQuery` for saved posts (different query key: `saved-posts` vs `savedPosts`) instead of reusing the hook. `usePostMutations()`'s `savePost`/`unsavePost` mutations (used by the feed page) invalidate `["savedPosts"]` (the hook's key), not `["saved-posts"]` (the page's actual key) — so saving/unsaving a post from `/feed` does NOT reliably invalidate/refresh the `/saved` page's query cache, only a matching-key coincidence in `onSettled` of the page's own `unsaveMutation` covers its own action. This is a real cache-invalidation bug worth flagging (not fixed here).
- **`useFeedTabSwipe` hook** (`pwa/src/hooks/useFeedTabSwipe.ts`) has zero importers anywhere in `pwa/src` (confirmed via grep) — appears to be dead/unused code despite being explicitly named in this task's hint list as "likely involved." The feed page manages `feedTab` state directly via `useState`/URL params with no swipe gesture wiring found in `feed/page.tsx`.
- **`/popular` is not a real page** — it's a legacy redirect shim to `/neighborhood?tab=street-radar`, outside this cluster's actual scope. The real "Popular"/"Street Radar" content and its API calls live in `/neighborhood`, which was not part of the assigned page list and was not traced.
- Reporting for feed posts goes through `content.md` (`POST /content/posts/:id/report`), not `moderation.md` — `moderation.md` is confirmed admin/moderator-only (`restrictedTo('Moderator','Super Admin')`) and has no end-user report-creation route; this matches the registry's own note that any moderation-queue UI belongs in an admin surface, not the general app shell.
- No direct `follow.md`/`trust.md` API callers were found inside `XPostCard`, `ReportModal`, or other feed-card components in this cluster — trust/verification badges and follow state appear to arrive purely as normalized props (`author.trustScore`, `verificationTier`, etc.) already baked into the `Post` object from `contentService`'s `normalizeFeedItem`, not fetched client-side per-card.
