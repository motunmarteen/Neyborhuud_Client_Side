# API Registry — Chat / Messaging

> Mount: `app.use("/api/v1/chat", messagingRoutes)` — `app.ts:342`
> Source: `NeyborHuud-ServerSide/src/modules/chat/chat.routes.ts`
>
> **⚠️ Naming trap** (found while resolving mounts in Step 2): the real, live messaging system is
> imported in `app.ts` as `messagingRoutes` from `./modules/chat/chat.routes.js`. There is a
> **separate, differently-named** `modules/social/chat.routes.ts` mounted at `/api/v1/social` —
> per its own source comment, that one is legacy-named but "only mounts the live username-lookup
> route now." **If searching the codebase for "chat routes," this file (`modules/chat/`) is the
> real one — do not confuse it with `modules/social/chat.routes.ts`.** See `social.md`.
>
> All routes use `protect` (Bearer-only — see `_auth-middleware-split.md`).
>
> **Total: 32 routes.**

## Conversations
| Method | Path | Middleware | Handler |
|---|---|---|---|
| GET | `/conversations` | `protect` | `listConversations` |
| GET | `/conversations/detail/:conversationId` | `protect`, `verifyConversationParticipant` | `getConversationDetail` |
| POST | `/conversations/marketplace/:productId` | `protect` | `getOrCreateMarketplaceInquiryConversation` | Must be registered before `/:userId` to avoid route shadowing |
| GET | `/conversations/:userId` | `protect` | `getOrCreateDirectConversation` |
| POST | `/conversations/:conversationId/leave` | `protect`, `verifyConversationParticipant` | `leaveConversation` |
| POST | `/conversations/:conversationId/read` | `protect`, `verifyConversationParticipant` | `markAsRead` |
| POST | `/conversations/:conversationId/delivered` | `protect`, `verifyConversationParticipant` | `markAsDelivered` |
| POST | `/conversations/:conversationId/mute` | `protect`, `verifyConversationParticipant`, validated | `muteConversation` |
| GET | `/conversations/:conversationId/key-bundle` | `protect` | `getConversationKeyBundle` | All participants' E2EE public keys in one call |

## Messages
| Method | Path | Middleware | Handler | Notes |
|---|---|---|---|---|
| POST | `/send` | `protect`, rate-limited, `verifyMarketplaceConversationAccess`, validated | `sendMessage` | |
| GET | `/messages/:conversationId` | `protect`, `verifyConversationParticipant` | `getMessages` | |
| DELETE | `/messages/:messageId` | `protect`, validated | `deleteMessage` | |
| PUT | `/messages/:messageId` | `protect`, validated | `editMessage` | |
| POST | `/messages/:messageId/report` | `protect`, validated | `reportMessage` | |

## Reactions, Polls, Live Location (in-chat)
| Method | Path | Middleware | Handler | Notes |
|---|---|---|---|---|
| POST | `/messages/:messageId/reactions` | `protect`, rate-limited | `setMessageReaction` | |
| DELETE | `/messages/:messageId/reactions` | `protect` | `removeMessageReaction` | |
| POST | `/messages/:messageId/vote` | `protect`, rate-limited, validated | `votePoll` | Real backing model, `src/models/Poll.ts` |
| POST | `/messages/:messageId/location` | `protect`, rate-limited, validated | `updateLiveLocation` | **Casual** "share my location in chat" — explicitly distinct from the emergency-specific Live Tracking / Kidnapping Tracking feature in `safety.md` |
| POST | `/messages/:messageId/location/stop` | `protect` | `stopLiveLocation` | |

## Incognito Invite (time-boxed "witness" participants)
| Method | Path | Middleware | Handler |
|---|---|---|---|
| POST | `/:conversationId/incognito/invite` | `protect`, `verifyConversationParticipant` | `proposeIncognitoInvite` |
| POST | `/incognito/:inviteId/approve` | `protect` | `reviewIncognitoInvite` |
| POST | `/incognito/:inviteId/accept` | `protect` | `acceptIncognitoInvite` |

## Group Management
| Method | Path | Middleware | Handler |
|---|---|---|---|
| POST | `/groups` | `protect`, `requireVerification`, rate-limited, validated | `createGroup` |
| POST | `/groups/:conversationId/participants` | `protect`, rate-limited, validated | `addParticipant` |
| DELETE | `/groups/:conversationId/participants/:userId` | `protect` | `removeParticipant` |

## Media Upload
| Method | Path | Middleware | Handler | Notes |
|---|---|---|---|---|
| POST | `/upload` | `protect`, multer (single file) | `uploadChatMedia` | 50MB document cap at the multer layer; a tighter 20MB media cap enforced explicitly inside the handler (multer's `fileFilter` runs before final byte count is known — see source comment) |

## E2EE Key Management
| Method | Path | Middleware | Handler | Notes |
|---|---|---|---|---|
| POST | `/keys/register` | `protect` | `registerPublicKey` | Private keys never reach the server — public keys only |
| DELETE | `/keys/revoke` | `protect` | `revokePublicKeys` | |
| GET | `/keys/:userId/fingerprint` | `protect` | `getKeyFingerprint` | Safety number for out-of-band comparison |
| POST | `/keys/verify/:userId` | `protect` | `verifyUserKey` | Records that caller has confirmed a key fingerprint |
| GET | `/keys/verification-status/:userId` | `protect` | `getVerificationStatus` | Is the target's key still the one that was verified? |
| GET | `/keys/:userId` | `protect` | `getPublicKey` | General fetch — registered after the more specific `/keys/*` routes to avoid conflict |

## Known issues found while building this registry

- The `modules/social/chat.routes.ts` naming trap (see header) is the most important thing to
  flag here — it's a real trap for anyone (human or AI) searching the codebase by filename rather
  than by mount point.
- This module is genuinely mature — E2EE key verification, casual vs. emergency location sharing
  correctly kept separate, incognito witnesses, real poll backing. No dead/unmounted code found in
  this pass (unlike `auth`'s `compliance.routes.ts`).
