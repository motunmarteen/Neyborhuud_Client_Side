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
      try {
        const [ngRes, intRes] = await Promise.all([
          newsService.getArticles({ region: 'nigeria', limit: 10 }).catch(() => []),
          newsService.getArticles({ region: 'international', limit: 10 }).catch(() => []),
        ]);

        const ng = (ngRes || []).map(a => ({ ...a, region: 'nigeria' as const }));
        const int = (intRes || []).map(a => ({ ...a, region: 'international' as const }));

        const interleaved: RssArticle[] = [];
        const maxLen = Math.max(ng.length, int.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < ng.length) interleaved.push(ng[i]);
          if (i < int.length) interleaved.push(int[i]);
        }
        return interleaved;
      } catch (err) {
        console.error("Error fetching feed news:", err);
        return [];
      }
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

  // --- MOCK FALLBACK DATA ---
  const MOCK_EVENTS = useMemo(() => [
    { id: 'evt-1', title: 'Community Cleanup Drive', description: 'Join us to clean the neighborhood park!', startDate: new Date(Date.now() + 86400000).toISOString(), coverImage: 'https://images.unsplash.com/photo-1618477461853-cf6ed80fbfc9?w=500&q=80', type: 'Community', attendeesCount: 45, venue: 'Central Park' },
    { id: 'evt-2', title: 'Weekend Farmers Market', description: 'Fresh organic produce', startDate: new Date(Date.now() + 172800000).toISOString(), coverImage: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=500&q=80', type: 'Market', attendeesCount: 120, venue: 'Town Square' },
    { id: 'evt-3', title: 'Local Tech Meetup', description: 'Networking for devs', startDate: new Date(Date.now() + 345600000).toISOString(), coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80', type: 'Tech', attendeesCount: 60, venue: 'Co-working Hub' },
    { id: 'evt-4', title: 'Neighborhood Barbecue', description: 'Free food and drinks', startDate: new Date(Date.now() + 604800000).toISOString(), coverImage: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500&q=80', type: 'Social', attendeesCount: 85, venue: 'Community Center' },
    { id: 'evt-5', title: 'Yoga in the Park', description: 'Morning yoga session', startDate: new Date(Date.now() + 43200000).toISOString(), coverImage: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=500&q=80', type: 'Health', attendeesCount: 25, venue: 'Greenwood Park' }
  ] as unknown as Event[], []);

  const MOCK_JOBS = useMemo(() => [
    { id: 'job-1', title: 'Barista (Part-time)', employerName: 'Daily Grind Coffee', location: { state: 'Lagos', lga: 'Ikeja' }, salary: '₦80,000/mo' },
    { id: 'job-2', title: 'Front-End Developer', employerName: 'TechStart', location: { state: 'Lagos', lga: 'Yaba' }, salary: '₦400,000/mo' },
    { id: 'job-3', title: 'Delivery Rider', employerName: 'QuickDrop Logistics', location: { state: 'Lagos', lga: 'Surulere' }, salary: '₦120,000/mo' },
    { id: 'job-4', title: 'Retail Store Manager', employerName: 'SuperMart', location: { state: 'Lagos', lga: 'Lekki' }, salary: '₦250,000/mo' },
    { id: 'job-5', title: 'Graphic Designer', employerName: 'Creative Hive', location: { state: 'Lagos', lga: 'Victoria Island' }, salary: '₦300,000/mo' }
  ] as unknown as Job[], []);

  const MOCK_HELP = useMemo(() => [
    { id: 'help-1', content: 'Does anyone have a jump starter? Car battery is dead near the mall.', createdAt: new Date(Date.now() - 3600000).toISOString(), author: { name: 'Sarah O.', avatarUrl: 'https://i.pravatar.cc/150?u=sarah' } },
    { id: 'help-2', content: 'Looking for recommendations for a reliable plumber urgently!', createdAt: new Date(Date.now() - 7200000).toISOString(), author: { name: 'Michael K.', avatarUrl: 'https://i.pravatar.cc/150?u=michael' } },
    { id: 'help-3', content: 'Found a lost golden retriever with a blue collar around Elm St.', createdAt: new Date(Date.now() - 14400000).toISOString(), author: { name: 'Jessica T.', avatarUrl: 'https://i.pravatar.cc/150?u=jessica' } },
    { id: 'help-4', content: 'Need someone to help lift a heavy couch up one flight of stairs today.', createdAt: new Date(Date.now() - 86400000).toISOString(), author: { name: 'David B.', avatarUrl: 'https://i.pravatar.cc/150?u=david' } },
    { id: 'help-5', content: 'Can anyone recommend a good tutor for JSS3 Math?', createdAt: new Date(Date.now() - 172800000).toISOString(), author: { name: 'Amina S.', avatarUrl: 'https://i.pravatar.cc/150?u=amina' } }
  ] as unknown as Post[], []);

  const MOCK_SERVICES = useMemo(() => [
    { id: 'srv-1', title: 'Professional House Cleaning', providerName: 'CleanSweep Co.', rating: 4.8, images: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80'] },
    { id: 'srv-2', title: 'Expert AC Repair & Installation', providerName: 'CoolBreeze Tech', rating: 4.9, images: ['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80'] },
    { id: 'srv-3', title: 'Personal Fitness Trainer', providerName: 'FitLife by John', rating: 5.0, images: ['https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80'] },
    { id: 'srv-4', title: 'Reliable Moving & Packing', providerName: 'SwiftMovers', rating: 4.7, images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&q=80'] },
    { id: 'srv-5', title: 'Dog Walking & Pet Sitting', providerName: 'Happy Paws', rating: 4.9, images: ['https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=500&q=80'] }
  ] as unknown as Service[], []);

  const MOCK_NEIGHBORS = useMemo(() => [
    { id: 'usr-1', username: 'alexandra_c', firstName: 'Alexandra', lastName: 'C.', avatarUrl: 'https://i.pravatar.cc/150?u=alex' },
    { id: 'usr-2', username: 'sam_builder', firstName: 'Sam', lastName: 'Builder', avatarUrl: 'https://i.pravatar.cc/150?u=sam' },
    { id: 'usr-3', username: 'cindy_tech', firstName: 'Cindy', lastName: 'T.', avatarUrl: 'https://i.pravatar.cc/150?u=cindy' },
    { id: 'usr-4', username: 'mr_baker', firstName: 'Tom', lastName: 'Baker', avatarUrl: 'https://i.pravatar.cc/150?u=tom' },
    { id: 'usr-5', username: 'emma_w', firstName: 'Emma', lastName: 'Watson', avatarUrl: 'https://i.pravatar.cc/150?u=emma' }
  ] as unknown as User[], []);

  const pools = useMemo<DiscoveryPools>(
    () => ({
      marketplace: marketplace.data ?? [],
      events: events.data?.length ? events.data : MOCK_EVENTS,
      jobs: jobs.data?.length ? jobs.data : MOCK_JOBS,
      helpRequests: helpRequests.data?.length ? helpRequests.data : MOCK_HELP,
      services: services.data?.length ? services.data : MOCK_SERVICES,
      news: news.data ?? [],
      neighbors: neighbors.data?.length ? neighbors.data : MOCK_NEIGHBORS,
    }),
    [marketplace.data, events.data, jobs.data, helpRequests.data, services.data, news.data, neighbors.data, MOCK_EVENTS, MOCK_JOBS, MOCK_HELP, MOCK_SERVICES, MOCK_NEIGHBORS],
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
