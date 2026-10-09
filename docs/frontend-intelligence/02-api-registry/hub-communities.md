# API Registry — Hub Communities

> Mount: `app.use("/api/v1/hub-communities", hubCommunityRoutes)` — `app.ts:350`
> Source: `NeyborHuud-ServerSide/src/modules/hub-community/hubCommunity.routes.ts`
>
> **Total: 15 routes.** Mixed public/`optionalAuth`/`protect` (Bearer-only — see
> `_auth-middleware-split.md`). Per the `app.ts` mount comment: "Hyperlocal group communities +
> chat" — a distinct concept from `geo.md`'s admin-boundary-based Communities (LGA/state-level) and
> `chat.md`'s 1:1/group messaging.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/` | `optionalAuth` | `listHubs` | |
| GET | `/conversation/:conversationId` | `optionalAuth` | `getHubByConversation` | Confirms each hub is backed by a `chat.md`-style conversation |
| GET | `/join/:code/preview` | `optionalAuth` | `previewInvite` | |
| GET | `/join/:code` | `optionalAuth` | `previewInvite` | Alias of the `/preview` route above — same handler |
| POST | `/` | `protect`, validated | `createHub` | |
| POST | `/join/:code` | `protect` | `joinHubByCode` | |
| GET | `/:hubId` | `optionalAuth` | `getHub` | |
| GET | `/:hubId/members` | `optionalAuth` | `listMembers` | |
| GET | `/:hubId/invites` | `protect` | `getInvites` | |
| GET | `/:hubId/join-requests` | `protect` | `getJoinRequests` | |
| POST | `/:hubId/join` | `protect` | `joinHub` | Direct join, distinct from code-based join above |
| POST | `/:hubId/leave` | `protect` | `leaveHub` | |
| POST | `/:hubId/invites` | `protect` | `createInvite` | |
| POST | `/:hubId/join-requests/:requestId/review` | `protect` | `reviewJoin` | |
| PATCH | `/:hubId` | `protect` | `updateHub` | Labeled "Admin management" in source |
| PATCH | `/:hubId/members/:userId/role` | `protect` | `changeMemberRoleHandler` | Same |

## Known issues found while building this registry

- **No `restrictedTo`/`requireAdmin`/`requirePermission` gate on the two "Admin management" routes**
  (`updateHub`, `changeMemberRoleHandler`) despite the source comment labeling them as such — same
  pattern already flagged in `fyi.md` (comment claims a restriction the route middleware doesn't
  enforce). Whether hub-level admin permission is checked inside the controller is not traced this
  pass; worth checking before assuming any authenticated member can rename a hub or change another
  member's role.
- Two distinct join paths (`joinHub` — direct, presumably for public hubs; `joinHubByCode` — invite
  code) plus a request/review flow (`join-requests`, `reviewJoin`) suggests hubs support at least
  three membership models: open, invite-code, and approval-gated. Worth confirming this three-way
  split explicitly in the later feature-mapping step so the hub-creation UI can surface the right
  privacy/join-mode options.
- `getHubByConversation` confirms hubs and chat conversations are directly linked 1:1 at the data
  level — relevant for how the frontend should route from a chat screen back to its parent hub.
