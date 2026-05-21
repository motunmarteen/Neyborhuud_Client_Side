"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import ServiceCard from "@/components/services/ServiceCard";
import { useMyFavorites, useFavoriteService } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function MyFavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [user, authLoading, router]);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMyFavorites();
  const favoriteService = useFavoriteService();

  const services = data?.pages.flatMap((page) => {
    const inner = (page as any)?.data;
    return Array.isArray(inner) ? inner : (inner?.data ?? []);
  }) ?? [];

  if (authLoading || !user) return null;

  return (
    <div className="relative flex h-screen w-full overflow-hidden neu-base">
      <LeftSidebar />
      <main className="flex flex-col flex-1 overflow-y-auto">
        <TopNav />
        <div className="flex flex-col pb-20">
          {/* Header */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full mod-chip transition-all"
                style={{ color: "var(--neu-text-muted)" }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold" style={{ color: "var(--neu-text)" }}>Saved Services</h1>
                <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>
                  {services.length} saved
                </p>
              </div>
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

            {/* Load more */}
            {hasNextPage && !isLoading && (
              <div className="text-center pb-6">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 mod-chip disabled:opacity-50 rounded-xl font-semibold transition-all text-sm"
                  style={{ color: "var(--neu-text)" }}
                >
                  {isFetchingNextPage ? "Loading…" : "Load More"}
                </button>
              </div>
            )}

            {/* Empty */}
            {!isLoading && services.length === 0 && (
              <div className="text-center py-16">
                <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--neu-text-muted)" }}>favorite</span>
                <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--neu-text)" }}>No saved services yet</h3>
                <p className="mb-6" style={{ color: "var(--neu-text-muted)" }}>
                  Tap the heart icon on a service to save it here
                </p>
                <Link
                  href="/services"
                  className="inline-block px-6 py-3 mod-chip mod-chip-active text-primary rounded-xl font-semibold transition-all"
                >
                  Browse Services
                </Link>
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
