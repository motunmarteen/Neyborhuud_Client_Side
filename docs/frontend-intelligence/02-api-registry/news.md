# API Registry — News (RSS Proxy)

> Mount: `app.use("/api/v1/news", newsRoutes)` — `app.ts:348`
> Source: `NeyborHuud-ServerSide/src/modules/news/news.routes.ts`
>
> **Total: 5 routes.** All public — source comment: "news feeds are public information." Server-side
> cached RSS proxy per the `app.ts` mount comment.

| Method | Path | Auth | Handler | Notes |
|---|---|---|---|---|
| GET | `/categories` | public | `listNewsCategories` | Regions + topics, per source comment |
| GET | `/topics` | public | `listNewsTopics` | Topic taxonomy only |
| GET | `/sources` | public | `listNewsSources` | `?region=nigeria\|international` |
| GET | `/articles` | public | `getNewsArticles` | `?region=&topic=&sources=&limit=` |
| GET | `/feed` | public | `getNewsFeed` | Returns raw XML, `?source=` — the only non-JSON response shape found in the registry so far |

## Known issues found while building this registry

- **`/feed` returning raw XML is the only non-JSON API response found across the entire registry
  so far** — worth remembering for the API client/data-layer design in the Frontend Contract step,
  since this one endpoint can't go through the same JSON-assuming response handling as everything
  else. Confirmed this connects to `pwa/src/app/(app)/local-news/` (seen in the earlier gossip grep
  results) and `pwa/src/lib/localNewsConfig.ts` — not re-traced in detail this pass, but the
  frontend clearly already has a dedicated local-news feature area distinct from Huud Gist.
