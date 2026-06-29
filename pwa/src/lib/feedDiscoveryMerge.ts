/**
 * Deterministic mixed-content feed merge: injects marketplace / events / jobs
 * at pseudo-random intervals without extra client state (stable across pagination).
 */

import type { Post } from "@/types/api";
import type { Event, Job, Service, User } from "@/types/api";
import type { Product } from "@/services/marketplace.service";
import type { RssArticle } from "@/types/incident";

export type BaseFeedItem = { _type: "post"; data: Post };

export type DiscoveryFeedItem =
  | BaseFeedItem
  /** Horizontal strip of listings in the feed */
  | { _type: "discovery_marketplace"; products: Product[]; key: string }
  | { _type: "discovery_event"; data: Event; key: string }
  | { _type: "discovery_job"; data: Job; key: string }
  | { _type: "discovery_help"; requests: Post[]; key: string }
  | { _type: "discovery_services"; services: Service[]; key: string }
  | { _type: "discovery_news"; articles: RssArticle[]; key: string }
  | { _type: "discovery_neighbors"; users: User[]; key: string };

export type DiscoveryPools = {
  marketplace: Product[];
  events: Event[];
  jobs: Job[];
  helpRequests: Post[];
  services: Service[];
  news: RssArticle[];
  neighbors: User[];
};

function unitRandom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h2u32(h) >>> 0) / 4294967296;
}

function h2u32(h: number): number {
  return h >>> 0;
}

function feedSalt(base: BaseFeedItem[]): string {
  if (!base.length) return "empty";
  const first = base[0];
  return first.data.id || String(first.data.createdAt || "");
}

/**
 * Merge discovery cards into the main timeline. Gaps and rotation are derived from
 * content ids so the pattern shifts when the feed changes but stays stable while scrolling.
 */
export function mergeDiscoveryIntoFeed(
  base: BaseFeedItem[],
  pools: DiscoveryPools,
  enabled: boolean,
): DiscoveryFeedItem[] {
  if (!enabled || base.length < 2) {
    return base as DiscoveryFeedItem[];
  }

  const hasAnyPool =
    pools.marketplace.length > 0 || 
    pools.events.length > 0 || 
    pools.jobs.length > 0 ||
    pools.helpRequests.length > 0 ||
    pools.services.length > 0 ||
    pools.news.length > 0 ||
    pools.neighbors.length > 0;
  if (!hasAnyPool) {
    return base as DiscoveryFeedItem[];
  }

  const salt = feedSalt(base);
  // Allow up to 2 injections per 7 posts — scales with feed length
  const maxInjections = Math.min(30, Math.max(10, Math.floor(base.length / 3)));

  const out: DiscoveryFeedItem[] = [];
  let baseIdx = 0;
  let injections = 0;
  // First injection after 3 posts, then every 5–8 posts for a natural feel
  let nextInjectAt = 3;
  let rotate = Math.floor(unitRandom(`${salt}:rot`) * 48);

  const kindOrder = ["marketplace", "event", "job", "help", "service", "news", "neighbor"] as const;

  const pickPool = (kind: (typeof kindOrder)[number]): any[] => {
    if (kind === "marketplace") return pools.marketplace;
    if (kind === "event") return pools.events;
    if (kind === "job") return pools.jobs;
    if (kind === "help") return pools.helpRequests;
    if (kind === "service") return pools.services;
    if (kind === "news") return pools.news;
    return pools.neighbors;
  };

  while (baseIdx < base.length) {
    out.push(base[baseIdx] as DiscoveryFeedItem);
    baseIdx++;

    if (injections >= maxInjections) continue;

    if (baseIdx >= nextInjectAt) {
      let placed = false;
      // Rotate evenly across all available types — no marketplace bias
      const available = kindOrder.filter((k) => pickPool(k).length > 0);
      const o = rotate % available.length;
      const withMarketplaceFirst = [...available.slice(o), ...available.slice(0, o)];

      for (const kind of withMarketplaceFirst) {
        if (placed) break;
        const pool = pickPool(kind);
        const pickIdx = (baseIdx * 17 + injections * 11 + rotate) % pool.length;

        if (kind === "marketplace") {
          const mp = pool as Product[];
          const stripLen = Math.min(8, mp.length);
          const start = pickIdx % mp.length;
          const products: Product[] = [];
          for (let i = 0; i < stripLen; i++) {
            const p = mp[(start + i) % mp.length];
            const id = p?.id || (p as { _id?: string })?._id;
            if (id) products.push(p);
          }
          if (products.length === 0) continue;
          const firstId = products[0].id || (products[0] as { _id?: string })._id;
          out.push({
            _type: "discovery_marketplace",
            products,
            key: `dm-${String(firstId)}-${injections}-${baseIdx}`,
          });
          placed = true;
        } else if (kind === "event") {
          const poolE = pool as Event[];
          const e = poolE[pickIdx % poolE.length];
          const id = e.id || (e as { _id?: string })._id;
          if (!id) continue;
          out.push({
            _type: "discovery_event",
            data: e,
            key: `de-${id}-${injections}`,
          });
          placed = true;
        } else if (kind === "job") {
          const poolJ = pool as Job[];
          const j = poolJ[pickIdx % poolJ.length];
          const id = j.id || (j as { _id?: string })._id;
          if (!id) continue;
          out.push({
            _type: "discovery_job",
            data: j,
            key: `dj-${id}-${injections}`,
          });
          placed = true;
        } else if (kind === "help") {
          const mp = pool as Post[];
          const stripLen = Math.min(8, mp.length);
          const start = pickIdx % mp.length;
          const requests: Post[] = [];
          for (let i = 0; i < stripLen; i++) {
            const p = mp[(start + i) % mp.length];
            if (p?.id) requests.push(p);
          }
          if (requests.length === 0) continue;
          out.push({
            _type: "discovery_help",
            requests,
            key: `dh-${requests[0].id}-${injections}-${baseIdx}`,
          });
          placed = true;
        } else if (kind === "service") {
          const mp = pool as Service[];
          const stripLen = Math.min(8, mp.length);
          const start = pickIdx % mp.length;
          const services: Service[] = [];
          for (let i = 0; i < stripLen; i++) {
            const s = mp[(start + i) % mp.length];
            if (s?.id) services.push(s);
          }
          if (services.length === 0) continue;
          out.push({
            _type: "discovery_services",
            services,
            key: `ds-${services[0].id}-${injections}-${baseIdx}`,
          });
          placed = true;
        } else if (kind === "news") {
          const mp = pool as RssArticle[];
          const stripLen = Math.min(8, mp.length);
          const start = pickIdx % mp.length;
          const articles: RssArticle[] = [];
          for (let i = 0; i < stripLen; i++) {
            const a = mp[(start + i) % mp.length];
            if (a?.id) articles.push(a);
          }
          if (articles.length === 0) continue;
          out.push({
            _type: "discovery_news",
            articles,
            key: `dn-${articles[0].id}-${injections}-${baseIdx}`,
          });
          placed = true;
        } else if (kind === "neighbor") {
          const mp = pool as User[];
          const stripLen = Math.min(8, mp.length);
          const start = pickIdx % mp.length;
          const users: User[] = [];
          for (let i = 0; i < stripLen; i++) {
            const u = mp[(start + i) % mp.length];
            if (u?.id || (u as any)._id) users.push(u);
          }
          if (users.length === 0) continue;
          const firstId = users[0].id || (users[0] as any)._id;
          out.push({
            _type: "discovery_neighbors",
            users,
            key: `dnb-${firstId}-${injections}-${baseIdx}`,
          });
          placed = true;
        }
      }

      if (placed) {
        injections++;
        rotate += 1 + Math.floor(unitRandom(`${salt}-${baseIdx}-placed`) * 2);
      }

      // Space injections 5–8 posts apart for a natural feel
      nextInjectAt = baseIdx + 5 + Math.floor(unitRandom(`${salt}-gap-${baseIdx}`) * 4);
    }
  }

  return out;
}
