"use client";

import { useState } from "react";
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
  { label: "3+ stars", value: 3 },
  { label: "4+ stars", value: 4 },
  { label: "4.5+ stars", value: 4.5 },
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

  const services = data?.pages.flatMap((page) => (page as any).data ?? []) ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800 backdrop-blur-md bg-opacity-95">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-xl font-bold">Services</h1>
                <Link
                  href="/services/my-bookings"
                  className="text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300"
                >
                  My Bookings
                </Link>
              </div>

              {/* Category chips */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={`shrink-0 text-sm px-4 py-1.5 rounded-full transition-colors ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Rating filter */}
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-none">
                {MIN_RATINGS.map((r) => {
                  const active = minRating === r.value;
                  return (
                    <button
                      key={r.label}
                      onClick={() => setMinRating(r.value)}
                      className={`shrink-0 text-xs px-3 py-1 rounded-full transition-colors ${
                        active
                          ? "bg-yellow-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Loading */}
            {isLoading && (
              <div className="grid sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden"
                  >
                    <div className="h-36 bg-gray-800" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-gray-800 rounded w-3/4" />
                      <div className="h-3 bg-gray-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="text-center py-12">
                <p className="text-red-400 mb-4">Failed to load services</p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* Grid */}
            {!isLoading && services.length > 0 && (
              <>
                <div className="grid sm:grid-cols-2 gap-4">
                  {services.map((service: any) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      onFavorite={(serviceId, favorited) =>
                        favoriteService.mutate({ serviceId, favorited })
                      }
                      favoriting={favoriteService.isPending}
                    />
                  ))}
                </div>

                {hasNextPage && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="px-8 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded-lg font-semibold transition-colors"
                    >
                      {isFetchingNextPage ? "Loading…" : "Load More"}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Empty */}
            {!isLoading && !error && services.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-gray-600 text-6xl">handyman</span>
                <h3 className="text-xl font-semibold text-gray-400 mt-4 mb-2">No services found</h3>
                <p className="text-gray-500">Try a different category or rating filter</p>
              </div>
            )}
          </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
