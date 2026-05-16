/**
 * Deterministic mixed-content feed merge: injects marketplace / events / jobs
 * at pseudo-random intervals without extra client state (stable across pagination).
 */

import type { Post } from "@/types/api";
import type { Event, Job } from "@/types/api";
import type { GossipPost } from "@/types/gossip";
import type { Product } from "@/services/marketplace.service";

export type BaseFeedItem =
  | { _type: "post"; data: Post }
  | { _type: "gossip"; data: GossipPost };

export type DiscoveryFeedItem =
  | BaseFeedItem
  /** Horizontal strip of listings in the feed */
  | { _type: "discovery_marketplace"; products: Product[]; key: string }
  | { _type: "discovery_event"; data: Event; key: string }
  | { _type: "discovery_job"; data: Job; key: string };

export type DiscoveryPools = {
  marketplace: Product[];
  events: Event[];
  jobs: Job[];
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
  if (first._type === "post") return first.data.id || String(first.data.createdAt || "");
  const g = first.data;
  return String(g.id || g._id || g.createdAt || "");
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
    pools.marketplace.length > 0 || pools.events.length > 0 || pools.jobs.length > 0;
  if (!hasAnyPool) {
    return base as DiscoveryFeedItem[];
  }

  const salt = feedSalt(base);
  const maxInjections = Math.min(16, Math.max(1, Math.floor(base.length / 3)));

  const out: DiscoveryFeedItem[] = [];
  let baseIdx = 0;
  let injections = 0;
  let nextInjectAt =
    3 + Math.floor(unitRandom(`${salt}:gap0`) * 4); // first slot after ~3–6 items
  let rotate = Math.floor(unitRandom(`${salt}:rot`) * 48);

  const kindOrder = ["marketplace", "event", "job"] as const;

  const pickPool = (kind: (typeof kindOrder)[number]): Product[] | Event[] | Job[] => {
    if (kind === "marketplace") return pools.marketplace;
    if (kind === "event") return pools.events;
    return pools.jobs;
  };

  while (baseIdx < base.length) {
    out.push(base[baseIdx] as DiscoveryFeedItem);
    baseIdx++;

    if (injections >= maxInjections) continue;

    if (baseIdx >= nextInjectAt) {
      let placed = false;
      /** Marketplace first when the pool has rows; rotate event/job for variety */
      const available = kindOrder.filter((k) => pickPool(k).length > 0);
      const withMarketplaceFirst = [
        ...available.filter((k) => k === "marketplace"),
        ...(() => {
          const rest = available.filter((k) => k !== "marketplace");
          if (rest.length === 0) return rest;
          const o = rotate % rest.length;
          return [...rest.slice(o), ...rest.slice(0, o)];
        })(),
      ];

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
        } else {
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
        }
      }

      if (placed) {
        injections++;
        rotate += 1 + Math.floor(unitRandom(`${salt}-${baseIdx}-placed`) * 2);
      }

      nextInjectAt = baseIdx + 5 + Math.floor(unitRandom(`${salt}-next-${baseIdx}`) * 5);
    }
  }

  return out;
}
