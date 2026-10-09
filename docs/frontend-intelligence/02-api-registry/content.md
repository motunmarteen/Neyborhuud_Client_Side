# API Registry — Content (Feed, Posts, Comments, FYI, Emergency)

> Mounts:
> - `app.use("/api/v1/content", contentRoutes)` — `app.ts:316`
> - `app.use("/api/v1/feed", feedOnlyRouter)` — `app.ts:315` — a **named export from this same
>   file**, not a separate module. It has exactly one route: `GET /` → `getFeed` (the same handler
>   `GET /api/v1/content/posts` uses). So `GET /api/v1/feed` and `GET /api/v1/content/posts` are the
>   same feed, two URLs.
>
> Source: `NeyborHuud-ServerSide/src/modules/content/content.routes.ts`
>
> **Total: 71 routes** (including the alias duplicates below, each counted once). This is the
> largest single route file. It contains **deliberate, commented route duplication** — e.g.
> `/:id/acknowledge` and `/posts/:id/acknowledge` both exist and do the same thing, because (per an
> explicit comment at line 335) "frontend API client uses `/content/posts/:id/...`". This is not
> drift — treat every alias below as intentionally supported, not a bug to consolidate silently.
>
> `contentProtect` = `protectAny` (Bearer or Better Auth session — aliased locally in this file).
> `requireNigeriaLocation` = blocks posting from outside Nigeria. `requireVerification`/
> `requireVerified` = profile-completeness gates, used selectively (not on every write).

## Posts — create / read / feed
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/posts` | `contentProtect`, `requireNigeriaLocation`, validated | `createPostForApi` | Accepts JSON or multipart (image upload via optional multer) |
| POST | `/` | `contentProtect`, `requireVerified`, `requireNigeriaLocation`, validated | `createPost` (= `createContent`) | Separate creation path from `/posts` above — different validation schema (`createPostSchema` vs `createPostApiSchema`) |
| GET | `/` , `/posts` | `contentProtect` | `getFeed` | Same handler, two paths. Also aliased at top-level `GET /api/v1/feed` |
| GET | `/user/:userId/posts`, `/users/:userId/posts` | none | `getUserPosts` | Alias pair, both live |
| GET | `/saved` | `contentProtect` | `getSavedContent` | Must be registered before `/:id` — static-route-first ordering matters here |
| GET | `/posts/:id`, `/:id` | `contentProtect` | `getContentDetails` | |
| GET | `/:id/analytics` | `contentProtect` | `getContentAnalytics` | |
| GET | `/:id/history` | `contentProtect` | `getEditHistory` | |
| PATCH | `/:id` | `contentProtect`, validated | `updatePost` (= `updateContent`) | |
| DELETE | `/:id` | `contentProtect` | `deletePost` (= `deleteContent`) | |

## Comments
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/posts/:id/comments`, `/:id/comments` | `contentProtect`, validated | `addComment` | Alias pair |
| DELETE | `/:id/comments/:commentId`, `/posts/:id/comments/:commentId` | `contentProtect` | `deleteComment` | Alias pair |
| POST/DELETE | `/comments/:commentId/like` | `contentProtect` | `toggleCommentLike` | Same handler for both methods (toggle) |
| POST | `/comments/:commentId/report` | `contentProtect`, validated | `reportComment` | |

## Likes, Reposts, Pins, Shares
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/posts/:id/like`, `/:id/like` | `contentProtect` | `toggleLike` | Alias pair |
| POST | `/:id/echo`, `/posts/:id/echo`, `/posts/:id/repost` | `contentProtect` | `echoContent` | **3 aliases**, one handler — repost/quote |
| DELETE | `/posts/:id/repost`, `/:id/repost` | `contentProtect` | `deleteRepost` | Alias pair |
| GET | `/posts/:id/repost-chain`, `/:id/repost-chain` | `contentProtect` | `getRepostChain` | Alias pair |
| POST | `/:id/pin` | `contentProtect` | `pinContent` | Labeled "Save (legacy)" in source comment — likely superseded by `/:id/save` below |
| POST | `/:id/helpful` | `contentProtect` | `markHelpful` | |
| POST | `/:id/share/external` | `contentProtect` | `shareExternal` | Awards points |
| POST/DELETE | `/:id/save`, `/posts/:id/save` | `contentProtect` | `saveToCollection` / `unsaveFromCollection` | Alias pair, current save-to-collection path (distinct from legacy `/:id/pin`) |
| POST | `/:id/cross-post` | `contentProtect` | `crossPost` | Cross-post to another "Huud" |

## Branded Interactions (Emergency/Safety-flavored engagement)
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/:id/acknowledge`, `/posts/:id/acknowledge` | `contentProtect` | `toggleAcknowledge` | Alias pair |
| POST | `/:id/aware`, `/posts/:id/aware` | `contentProtect` | `toggleImAware` | "I'm Aware" — emergency posts |
| POST | `/:id/nearby`, `/posts/:id/nearby` | `contentProtect` | `toggleImNearby` | "I'm Nearby" — emergency posts |
| POST | `/:id/safe`, `/posts/:id/safe` | `contentProtect` | `toggleSafeMark` | "I'm Safe" — emergency posts |
| POST | `/:id/confirm-dispute`, `/posts/:id/confirm-dispute` | `contentProtect` | `confirmOrDispute` | Community accuracy confirmation |
| POST | `/:id/follow-update`, `/posts/:id/follow-update` | `contentProtect` | `toggleFollowUpdate` | Follow a post for edit notifications |

## Reporting
| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/posts/:id/report`, `/:id/report` | `contentProtect`, validated | `reportPost` |

## Feed Signal (per-post, per-user preference — e.g. "show less like this")
| Method | Path | Auth | Handler |
|---|---|---|---|
| GET | `/posts/:id/feed-signal` | `contentProtect` | `getPostFeedSignal` |
| POST | `/posts/:id/feed-signal` | `contentProtect`, validated | `setPostFeedSignal` |
| DELETE | `/posts/:id/feed-signal` | `contentProtect` | `clearPostFeedSignal` |
| GET | `/:id/interactions` | `contentProtect` | `getPostInteractions` | All interaction states in one call |

## Follow Locations (follow a place, not a person)
| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/locations/follow` | `contentProtect` | `followLocation` |
| DELETE | `/locations/follow/:lga` | `contentProtect` | `unfollowLocation` |
| GET | `/locations/following` | `contentProtect` | `getFollowedLocations` |

## Emergency Post Creation
| Method | Path | Auth | Handler |
|---|---|---|---|
| POST | `/emergency` | `contentProtect`, `requireNigeriaLocation` | `createEmergencyPost` |

## FYI Bulletins
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| POST | `/fyi` | `contentProtect`, `requireNigeriaLocation`, `requireVerification`, validated | `createBulletin` | The only FYI write gated by full verification |
| GET | `/fyi` | `contentProtect` | `getBulletins` | |
| PATCH | `/fyi/:id/status` | `contentProtect`, validated | `updateBulletinStatus` | |
| POST | `/fyi/:id/rsvp` | `contentProtect`, validated | `rsvpToBulletin` | |
| POST | `/fyi/:id/receipt` | `contentProtect` | `confirmReceipt` | |
| POST | `/fyi/:id/endorse` | `contentProtect` | `endorseBulletin` | |
| GET | `/fyi/:id/endorsements` | `contentProtect` | `getEndorsements` | |
| GET | `/fyi/:id/status-history` | `contentProtect` | `getStatusHistory` | |
| POST/DELETE | `/fyi/:id/pin` | `contentProtect` | `pinBulletin` / `unpinBulletin` | |

## Marketplace Status (inline handler, not imported from a controller)
| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| PATCH | `/marketplace/:id/status` | `contentProtect`, validated | inline arrow function (lines 259-273) | Seller-only listing status update. **Notable: this handler is written directly in the routes file, not in a controller** — inconsistent with every other route in this file and the codebase's general pattern |

## Help Request
| Method | Path | Auth | Handler |
|---|---|---|---|
| PATCH | `/posts/:id/amount` | `contentProtect`, validated | `updateHelpRequestAmount` |
| POST | `/posts/:id/help-offers` | `contentProtect`, validated | `submitHelpOffer` |
| GET | `/posts/:id/help-offers` | `contentProtect` | `getHelpOffers` |
| PATCH | `/posts/:id/help-offers/:offerId/confirm` | `contentProtect` | `confirmHelpOffer` |
| PATCH | `/posts/:id/help-offers/:offerId/reject` | `contentProtect` | `rejectHelpOffer` |
| PATCH | `/posts/:id/help-status` | `contentProtect` | `updateHelpRequestStatus` |

## Known issues found while building this registry

- **Two distinct post-creation endpoints** (`POST /posts` and `POST /`) with different validation
  schemas and different multipart handling — `/posts` supports image upload via multer,
  `/` does not appear to. A rebuild needs to confirm which one the frontend actually uses (likely
  `/posts`, per the doc comment at line 201) and treat the other as legacy/unused rather than
  building new UI against both.
- **`PATCH /marketplace/:id/status` has its handler written inline in the routes file** instead of
  in a controller — the only route in this file (and one of the only ones seen across the whole
  backend so far) that breaks the routes/controller separation. Worth normalizing during the
  rebuild if this code path is touched, not urgent otherwise.
- Extensive intentional aliasing (`/:id/x` vs `/posts/:id/x`) is real and load-bearing, not
  cleanup-eligible — see the header note above.
