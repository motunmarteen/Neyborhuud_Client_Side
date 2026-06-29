"use client";

/**
 * ServicesBrowse — the services filters + listing grid, without page chrome.
 * Reused by both /services and the unified /work hub (For Hire tab).
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { BrowseEmptyState } from "@/components/layout/BrowseEmptyState";
import { LocalHuudHubPrimaryAction } from "@/components/local-huud/LocalHuudHubHeader";
import ServiceCard from "@/components/services/ServiceCard";
import { useServices, useFavoriteService } from "@/hooks/useServices";

export const SERVICE_CATEGORIES = [
  "All",
  "Cleaning",
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Tutoring",
  "Catering",
  "Photography",
  "Beauty",
  "Laundry",
  "Security",
  "Other",
];

export const SERVICE_MIN_RATINGS: { label: string; value: number | undefined }[] = [
  { label: "Any Rating", value: undefined },
  { label: "3+ ★", value: 3 },
  { label: "4+ ★", value: 4 },
  { label: "4.5+ ★", value: 4.5 },
];

export function ServicesToolbar({
  category,
  minRating,
  onCategory,
  onMinRating,
}: {
  category: string;
  minRating: number | undefined;
  onCategory: (c: string) => void;
  onMinRating: (r: number | undefined) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <LocalHuudHubPrimaryAction href="/services/create" label="Offer service" />
      </div>
      <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
        {SERVICE_CATEGORIES.map((cat) => {
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onCategory(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active ? "mod-chip mod-chip-active text-primary" : "mod-chip"
              }`}
              style={active ? undefined : { color: "var(--neu-text-muted)" }}
            >
              {cat}
            </button>
          );
        })}
      </div>
      <div className="browse-chip-row browse-chip-row--scroll no-scrollbar">
        {SERVICE_MIN_RATINGS.map((r) => {
          const active = minRating === r.value;
          return (
            <button
              key={r.label}
              type="button"
              onClick={() => onMinRating(r.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                active ? "mod-chip mod-chip-active text-primary" : "mod-chip"
              }`}
              style={active ? undefined : { color: "var(--neu-text-muted)" }}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ServicesBrowseProps {
  category?: string;
  minRating?: number | undefined;
}

export function ServicesBrowse({ category = "All", minRating }: ServicesBrowseProps) {
  const favoriteService = useFavoriteService();

  const apiFilter = {
    ...(category !== "All" ? { category: category.toLowerCase() } : {}),
    ...(minRating != null ? { minRating } : {}),
  };

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useServices(apiFilter);

  const services =
    data?.pages.flatMap((page) => {
      const inner = (page as any)?.data;
      return Array.isArray(inner) ? inner : (inner?.data ?? inner?.services ?? []);
    }) ?? [];

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: "400px" });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      {isLoading && (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mod-card aspect-[4/5] animate-pulse rounded-2xl" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <BrowseEmptyState
          icon="error"
          title="Failed to load services"
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="mod-chip rounded-xl px-5 py-2.5 text-sm font-bold"
              style={{ color: "var(--neu-text)" }}
            >
              Try again
            </button>
          }
        />
      )}

      {!isLoading && services.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {services.map((service: any, i: number) => (
            <ServiceCard
              key={service.id ?? service._id ?? i}
              service={service}
              onFavorite={(serviceId, favorited) =>
                favoriteService.mutate({ serviceId, favorited })
              }
              favoriting={favoriteService.isPending}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && services.length === 0 && (
        <BrowseEmptyState
          icon="handyman"
          title="No services found"
          description="Try a different category or rating filter."
          action={
            <Link
              href="/services/create"
              className="mod-chip mod-chip-active inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-primary no-underline"
            >
              Offer a service
            </Link>
          }
        />
      )}

      {hasNextPage ? (
        <div ref={loadMoreRef} className="flex justify-center py-4">
          {isFetchingNextPage ? (
            <span className="text-sm text-[var(--neu-text-muted)]">Loading…</span>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
