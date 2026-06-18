/**
 * Lightweight discovery pools for mixed feed — single page per domain, long stale time.
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketplaceService, type Product } from "@/services/marketplace.service";
import { eventsService } from "@/services/events.service";
import { jobsService } from "@/services/jobs.service";
import { helpRequestService } from "@/services/help-request.service";
import { servicesService } from "@/services/services.service";
import { newsService } from "@/services/news.service";
import type { Event, Job, Post, Service, User } from "@/types/api";
import type { RssArticle } from "@/types/incident";
import type { DiscoveryPools } from "@/lib/feedDiscoveryMerge";
import { geoService } from "@/services/geo.service";
import { searchService } from "@/services/search.service";

/** Unwrap Axios `ApiResponse` and common paginated / nested shapes */
function extractRows(res: unknown): unknown[] {
  const r = res as Record<string, unknown> | null | undefined;
  if (!r) return [];
  const node: unknown = r.data ?? r;

  // Double-wrapped: { data: { data: T[] } }
  if (node && typeof node === "object" && !Array.isArray(node)) {
    const o = node as Record<string, unknown>;
    const inner = o.data;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      const innerO = inner as Record<string, unknown>;
      for (const k of ["data", "items", "content", "products", "results"]) {
        const v = innerO[k];
        if (Array.isArray(v)) return v;
      }
    }
    for (const k of ["data", "items", "content", "products", "events", "jobs", "results"]) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  if (Array.isArray(node)) return node;
  return [];
}

function normalizeList<T>(rows: unknown[], predicate: (o: Record<string, unknown>) => boolean): T[] {
  const out: T[] = [];
  for (const raw of rows) {
    const row = (raw as { data?: unknown })?.data ?? raw;
    if (row && typeof row === "object" && predicate(row as Record<string, unknown>)) {
      out.push(row as T);
    }
  }
  return out;
}

function isProductRow(o: Record<string, unknown>): boolean {
  const id = o.id ?? o._id;
  const title = (o.title ?? o.name) as unknown;
  return typeof id === "string" && id.length > 0 && typeof title === "string";
}

function isEventRow(o: Record<string, unknown>): boolean {
  const id = o.id ?? o._id;
  return typeof id === "string" && id.length > 0 && typeof o.startDate === "string";
}

function isJobRow(o: Record<string, unknown>): boolean {
  const id = o.id ?? o._id;
  return (
    typeof id === "string" &&
    id.length > 0 &&
    typeof o.title === "string" &&
    typeof o.startDate !== "string"
  );
}

function extractProducts(res: unknown): Product[] {
  return normalizeList<Product>(extractRows(res), isProductRow);
}

function extractEvents(res: unknown): Event[] {
  return normalizeList<Event>(extractRows(res), isEventRow);
}

function extractJobs(res: unknown): Job[] {
  return normalizeList<Job>(extractRows(res), isJobRow);
}

function extractPosts(res: unknown): Post[] {
  return normalizeList<Post>(extractRows(res), (o) => typeof o.id === "string" && typeof o.contentType === "string");
}

function extractServices(res: unknown): Service[] {
  return normalizeList<Service>(extractRows(res), (o) => typeof o.id === "string" && typeof o.title === "string");
}

function extractUsers(res: unknown): User[] {
  return normalizeList<User>(extractRows(res), (o) => {
    const id = o.id ?? o._id;
    return typeof id === "string" && id.length > 0;
  });
}

/**
 * @param enabled - e.g. main feed without content-type filter
 */
export function useFeedDiscoveryPools(enabled: boolean, geo: { lat: number | null; lng: number | null }) {
  const marketplace = useQuery({
    queryKey: ["feed-discovery", "marketplace", geo.lat, geo.lng],
    queryFn: async (): Promise<Product[]> => {
      if (geo.lat != null && geo.lng != null && !Number.isNaN(geo.lat) && !Number.isNaN(geo.lng)) {
        const res = await marketplaceService.getNearbyItems(geo.lat, geo.lng, 25_000, 1, 18);
        const list = extractProducts(res);
        if (list.length) return list;
      }
      const res = await marketplaceService.getItems(1, 18);
      return extractProducts(res);
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

  const events = useQuery({
    queryKey: ["feed-discovery", "events"],
    queryFn: async (): Promise<Event[]> => {
      const res = await eventsService.getEvents(1, 18, {});
      return extractEvents(res);
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

  const jobs = useQuery({
    queryKey: ["feed-discovery", "jobs"],
    queryFn: async (): Promise<Job[]> => {
      const res = await jobsService.getJobs(1, 18);
      return extractJobs(res);
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

  const helpRequests = useQuery({
    queryKey: ["feed-discovery", "help-requests"],
    queryFn: async (): Promise<Post[]> => {
      const res = await helpRequestService.getRequests({ limit: 18 });
      return extractPosts(res);
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

  const services = useQuery({
    queryKey: ["feed-discovery", "services", geo.lat, geo.lng],
    queryFn: async (): Promise<Service[]> => {
      if (geo.lat != null && geo.lng != null && !Number.isNaN(geo.lat) && !Number.isNaN(geo.lng)) {
        const res = await servicesService.getNearbyServices(geo.lat, geo.lng, 25_000, 1, 18);
        const list = extractServices(res);
        if (list.length) return list;
      }
      const res = await servicesService.getServices(1, 18);
      return extractServices(res);
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

  const news = useQuery({
    queryKey: ["feed-discovery", "news"],
    queryFn: async (): Promise<RssArticle[]> => {
      return await newsService.getArticles({ region: 'nigeria', limit: 18 });
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

  const neighbors = useQuery({
    queryKey: ["feed-discovery", "neighbors", geo.lat, geo.lng],
    queryFn: async (): Promise<User[]> => {
      if (geo.lat != null && geo.lng != null && !Number.isNaN(geo.lat) && !Number.isNaN(geo.lng)) {
        const res = await geoService.getNearbyUsers(geo.lat, geo.lng, 25_000, 18);
        const list = extractUsers(res);
        if (list.length) return list;
      }
      const res = await searchService.searchUsers("", 1, 18);
      return extractUsers(res);
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });

  const pools = useMemo<DiscoveryPools>(
    () => ({
      marketplace: marketplace.data ?? [],
      events: events.data ?? [],
      jobs: jobs.data ?? [],
      helpRequests: helpRequests.data ?? [],
      services: services.data ?? [],
      news: news.data ?? [],
      neighbors: neighbors.data ?? [],
    }),
    [marketplace.data, events.data, jobs.data, helpRequests.data, services.data, news.data, neighbors.data],
  );

  const isLoading = marketplace.isLoading || events.isLoading || jobs.isLoading || helpRequests.isLoading || services.isLoading || news.isLoading || neighbors.isLoading;
  const isError = marketplace.isError && events.isError && jobs.isError && helpRequests.isError && services.isError && news.isError && neighbors.isError;
  const isReady =
    !enabled || (!marketplace.isPending && !events.isPending && !jobs.isPending && !helpRequests.isPending && !services.isPending && !news.isPending && !neighbors.isPending);

  return {
    pools,
    isLoading,
    isError,
    isReady,
  };
}
