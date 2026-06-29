# NeyborHuud 3-Tab Feed Integration

## What is already wired

The PWA now requests the backend feed using the production tab names:

- `your_huud`
- `street_radar`
- `following_places`

The feed page also reads `meta.missedAlerts` from the backend and shows a reminder banner when the server detects unseen nearby alerts.

## Backend contract

Primary endpoint:

- `GET /api/v1/feed`

Query params:

- `lat`, `lng`
- `page`, `limit`
- `feedTab`
- optional `ranked`

Example:

```ts
const feed = await contentService.getLocationFeed(lat, lng, {
  page: 1,
  limit: 20,
  feedTab: 'your_huud',
});
```

## Feed response fields to use

Each post can now include:

- `contentType`
- `severity`
- `emergencyType`
- `verificationStatus`
- `cardStyle`
- `_feedLayer`
- `availableActions`
- `isAcknowledged`
- `savedCollection`

Feed metadata can now include:

- `feedType`
- `blendRatio`
- `localLgas`
- `hasExtendedContent`
- `hasExploreContent`
- `missedAlerts`

## Recommended UI behavior

### Your Huud

Use as the default landing tab.

Show:

- local posts first
- missed-alert reminder banner if present
- pinned FYI bulletins above the main stream

### Street Radar

Use for explore/trending content.

Show:

- `_feedLayer === 'explore'`
- stronger section labeling
- higher tolerance for non-local content

### Following Places

Use for explicit location subscriptions.

Show:

- empty state with CTA to follow locations
- location label chip when a followed area produced the post

## Emergency interaction mapping

When `contentType` is `emergency` or `alert`, show the branded actions returned in `availableActions`.

Suggested labels:

- `acknowledge` -> `Acknowledge`
- `aware` -> `I'm Aware`
- `nearby` -> `I'm Nearby`
- `safe` -> `I'm Safe`
- `confirm_dispute` -> `Confirm / Dispute`
- `follow_update` -> `Follow Updates`
- `cross_post` -> `Cross-post`

## Notification endpoints

Use these routes from the PWA service layer:

- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread-count`
- `POST /api/v1/notifications/mark-all-read`
- `PATCH /api/v1/notifications/:id/read`
- `GET /api/v1/notifications/settings`
- `PUT /api/v1/notifications/settings`
- `POST /api/v1/auth/device/register`
- `POST /api/v1/auth/device/remove`

## Next UI tasks

1. Add branded action buttons to the post card and post details modal.
2. Add a saved collection picker when the user taps `Save`.
3. Add a location follow management screen for `Following Places`.
4. Add push-permission onboarding on web and register the push token through `auth/device/register`.
5. Add a dedicated emergency composer that calls `POST /api/v1/content/emergency`.
