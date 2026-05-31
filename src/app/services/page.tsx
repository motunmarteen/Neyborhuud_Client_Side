"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import ServiceCard from "@/components/services/ServiceCard";
import { useServices, useFavoriteService } from "@/hooks/useServices";
import Link from "next/link";

const CATEGORIES = [
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

const MIN_RATINGS = [
  { label: "Any Rating", value: undefined },
  { label: "3+ ★", value: 3 },
  { label: "4+ ★", value: 4 },
  { label: "4.5+ ★", value: 4.5 },
];

export default function ServicesPage() {
  const [category, setCategory] = useState("All");
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const favoriteService = useFavoriteService();

  const apiFilter = {
    ...(category !== "All" ? { category: category.toLowerCase() } : {}),
    ...(minRating != null ? { minRating } : {}),
  };

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useServices(apiFilter);

  const services = data?.pages.flatMap((page) => {
    const inner = (page as any)?.data;
    return Array.isArray(inner) ? inner : (inner?.data ?? inner?.services ?? []);
  }) ?? [];

  const { ref: loadMoreRef, inView } = useInView({ threshold: 0, rootMargin: "400px" });
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="relative flex h-screen w-full overflow-hidden neu-base">
      <LeftSidebar />
      <main className="flex flex-col flex-1 overflow-y-auto">
        <TopNav />
        <div className="flex flex-col pb-20">
          {/* Header */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="mod-inset rounded-xl size-10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl text-primary">handyman</span>
                </div>
                <div>
                  <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>Find help near you</p>
                </div>
              </div>
              <Link
                href="/services/create"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-sm mod-chip mod-chip-active text-primary transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Offer Service
              </Link>
            </div>

            {/* Quick action links */}
            <div className="flex gap-2 mb-4">
              <Link
                href="/services/my-bookings"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold mod-chip transition-all"
                style={{ color: "var(--neu-text-muted)" }}
              >
                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                My Bookings
              </Link>
              <Link
                href="/services/my-favorites"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold mod-chip transition-all"
                style={{ color: "var(--neu-text-muted)" }}
              >
                <span className="material-symbols-outlined text-[14px]">favorite</span>
                Saved
              </Link>
            </div>

            {/* Category chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none mb-2">
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-all ${
                      active ? "mod-chip mod-chip-active text-primary" : "mod-chip"
                    }`}
                    style={active ? {} : { color: "var(--neu-text-muted)" }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Rating filter */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {MIN_RATINGS.map((r) => {
                const active = minRating === r.value;
                return (
                  <button
                    key={r.label}
                    onClick={() => setMinRating(r.value)}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                      active ? "mod-chip mod-chip-active text-primary" : "mod-chip"
                    }`}
                    style={active ? {} : { color: "var(--neu-text-muted)" }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4">
            {/* Loading skeletons */}
            {isLoading && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="mod-card rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-36" style={{ background: "var(--neu-shadow-dark)" }} />
                    <div className="p-4 space-y-2">
                      <div className="h-4 rounded w-3/4" style={{ background: "var(--neu-shadow-dark)" }} />
                      <div className="h-3 rounded w-1/2" style={{ background: "var(--neu-shadow-dark)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-5xl mb-3" style={{ color: "var(--brand-red)" }}>error</span>
                <p className="mb-4 font-semibold" style={{ color: "var(--neu-text-muted)" }}>Failed to load services</p>
                <button onClick={() => refetch()} className="px-6 py-3 mod-chip rounded-xl font-semibold transition-all" style={{ color: "var(--neu-text)" }}>
                  Try Again
                </button>
              </div>
            )}

            {/* Grid */}
            {!isLoading && services.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 pb-6">
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

            {/* Empty */}
            {!isLoading && !error && services.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--neu-text-muted)" }}>handyman</span>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--neu-text)" }}>No services found</h3>
                <p style={{ color: "var(--neu-text-muted)" }}>Try a different category or rating filter</p>
              </div>
            )}

            {/* Infinite scroll sentinel */}
            {hasNextPage && (
              <div ref={loadMoreRef} className="flex justify-center py-6">
                {isFetchingNextPage && (
                  <div className="flex items-center gap-2" style={{ color: "var(--neu-text-muted)" }}>
                    <svg className="animate-spin size-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading…
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <RightSidebar />
      <BottomNav />
    </div>
  );
}
