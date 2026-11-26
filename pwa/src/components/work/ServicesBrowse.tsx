"use client";

/**
 * ServicesBrowse — the services filters + listing grid, without page chrome.
 * Reused by both /services and the unified /work hub (For Hire tab).
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { BrowseEmptyState } from "@/components/layout/BrowseEmptyState";
import { ChipRow, ChipSelect, FilterChip } from "@/components/ui/Chip";
import ServiceCard from "@/components/services/ServiceCard";
import { useServices, useFavoriteService } from "@/hooks/useServices";
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonTiles } from '@/components/ui/Skeleton';

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
  { label: "Any rating", value: undefined },
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
    <ChipRow label="Filter services">
      <ChipSelect
        label="Rating"
        value={String(minRating ?? "")}
        options={SERVICE_MIN_RATINGS.map((r) => ({ value: String(r.value ?? ""), label: r.label }))}
        onChange={(v) => onMinRating(v ? Number(v) : undefined)}
      />
      <span aria-hidden className="h-5 w-px shrink-0 bg-line" />
      {SERVICE_CATEGORIES.map((cat) => (
        <FilterChip key={cat} active={category === cat} onClick={() => onCategory(cat)}>
          {cat}
        </FilterChip>
      ))}
    </ChipRow>
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
        <div role="status" aria-label="Loading">
          <SkeletonTiles count={4} />
        </div>
      )}

      {error && !isLoading && (
        <ErrorState onRetry={() => refetch()} homeHref={null} />
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
