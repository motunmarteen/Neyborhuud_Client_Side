"use client";

/**
 * Marketplace — premium grid browse on light doodle surface (brand pattern + soft ambient)
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { useMarketplaceSocket } from "@/hooks/useMarketplaceSocket";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ProductCard } from "@/components/marketplace";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";

const CATEGORIES = [
  "All",
  "Electronics",
  "Furniture",
  "Clothing",
  "Books",
  "Sports",
  "Home & Garden",
  "Toys",
  "Vehicles",
  "Other",
];

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="doodle-surface flex min-h-screen w-full items-center justify-center text-brand-black">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-[#006F35]"
              aria-hidden
            />
            <p className="text-sm font-medium text-brand-green-dark/70">Loading marketplace…</p>
          </div>
        </div>
      }
    >
      <MarketplacePageInner />
    </Suspense>
  );
}

function MarketplacePageInner() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const searchParams = useSearchParams();
  const focusProductId = searchParams.get("product");
  const { location } = useGeolocation();

  useMarketplaceSocket();

  const filter = selectedCategory !== "All" ? { category: selectedCategory } : undefined;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = useMarketplaceProducts(filter);

  const products = data?.pages.flatMap((page) => page.data || []) ?? [];

  useEffect(() => {
    if (!focusProductId || isLoading) return;
    const el = document.getElementById(`mp-product-${focusProductId}`);
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.outline = "2px solid #006F35";
      el.style.outlineOffset = "4px";
    });
    const clear = window.setTimeout(() => {
      el.style.outline = "";
      el.style.outlineOffset = "";
    }, 2200);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(clear);
    };
  }, [focusProductId, isLoading, products.length]);

  return (
    <div className="doodle-surface relative flex h-screen w-full flex-col overflow-hidden text-brand-black">
      {/* Soft brand-tinted washes (same idea as before, tuned for light + doodle visibility) */}
      <div
        className="pointer-events-none fixed inset-0 motion-safe:animate-soft-float opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 85% 55% at 50% -15%, rgba(0, 212, 49, 0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 40%, rgba(0, 111, 53, 0.06), transparent 50%)",
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 opacity-50 motion-safe:animate-soft-float"
        aria-hidden
        style={{
          animationDelay: "-2s",
          background: "radial-gradient(ellipse 60% 50% at 0% 80%, rgba(0, 212, 49, 0.08), transparent 45%)",
        }}
      />

      <TopNav />
      <div className="relative flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="feed-scroll-main relative flex-1 overflow-y-auto overscroll-contain scroll-smooth pb-28">
          <header className="sticky top-0 z-20 border-b border-[var(--border-light)] bg-white/78 shadow-[0_8px_28px_rgba(0,111,53,0.08)] backdrop-blur-xl dark:border-[var(--border-dark)] dark:bg-[rgba(8,12,18,0.72)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <div className="mx-auto max-w-5xl px-3 pt-4 sm:px-4">
              <div className="flex items-start justify-between gap-3 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/20 to-[#006F35]/15 shadow-[0_0_24px_rgba(0,212,49,0.2)]">
                      <span className="material-symbols-outlined text-[22px] text-[#006F35] dark:text-primary">storefront</span>
                    </span>
                    <div>
                      <p className="text-[11px] font-medium text-brand-green-dark/70 dark:text-white/45 sm:text-xs">Buy & sell near you</p>
                    </div>
                  </div>
                </div>
                <Link
                  href="/marketplace/create"
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-[#006F35] px-3.5 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-[0_4px_20px_rgba(0,212,49,0.35)] transition-transform active:scale-95 sm:px-4 sm:text-sm sm:normal-case"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span className="hidden sm:inline">Sell Item</span>
                  <span className="sm:hidden">Sell</span>
                </Link>
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3 scrollbar-hide">
                {CATEGORIES.map((category) => {
                  const active = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      type="button"
                      onClick={() => setSelectedCategory(category)}
                      className={`whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-all sm:text-[13px] ${
                        active
                          ? "border-primary/40 bg-primary text-white shadow-[0_4px_16px_rgba(0,212,49,0.3)] dark:border-primary/35 dark:bg-primary/25 dark:text-emerald-100 dark:shadow-[0_0_20px_rgba(0,212,49,0.2)]"
                          : "border-[var(--border-light)] bg-[var(--surface-light)] text-[#2E502E] hover:border-primary/25 hover:bg-white dark:border-white/10 dark:bg-white/[0.06] dark:text-white/55 dark:hover:border-white/15 dark:hover:bg-white/[0.1] dark:hover:text-white/80"
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>
          </header>

          <div className="relative mx-auto max-w-5xl px-3 py-4 sm:px-4">
            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[
                { href: "/marketplace/my-listings", icon: "inventory_2", label: "Listings" },
                { href: "/marketplace/my-orders", icon: "shopping_bag", label: "Orders" },
                { href: "/marketplace/my-sales", icon: "sell", label: "Sales" },
                { href: "/marketplace/my-offers", icon: "local_offer", label: "Offers" },
                { href: "/marketplace/saved", icon: "bookmark", label: "Saved" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-light)] bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-[#2E502E] shadow-[0_2px_12px_rgba(0,111,53,0.06)] backdrop-blur-md transition-colors hover:border-primary/30 hover:text-[#006F35] dark:border-white/10 dark:bg-white/[0.05] dark:text-white/70 dark:hover:border-primary/20 dark:hover:text-white/90"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#006F35] dark:text-primary/80">{l.icon}</span>
                  {l.label}
                </Link>
              ))}
            </div>

            {isLoading && (
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse overflow-hidden rounded-[22px] border border-[var(--border-light)] bg-white/80 dark:border-white/5 dark:bg-white/[0.04]"
                  >
                    <div className="aspect-[4/5] bg-[var(--surface-light)] dark:bg-white/10" />
                    <div className="space-y-2 p-3">
                      <div className="h-3 rounded bg-[var(--surface-light)] dark:bg-white/10" />
                      <div className="h-4 w-2/3 rounded bg-primary/20 dark:bg-primary/20" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-[var(--border-light)] bg-white/90 px-4 py-10 text-center dark:border-brand-red/25 dark:bg-brand-red/10">
                <p className="mb-4 text-red-600 dark:text-brand-red">Failed to load products</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-full border border-[var(--border-light)] bg-[var(--surface-light)] px-5 py-2 text-sm font-semibold transition-colors hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !error && products.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {products.map((product, index) => {
                    const productData = (product as any).data || product;
                    return (
                      <ProductCard
                        key={productData.id || productData._id || `product-${index}`}
                        product={productData}
                        userLocation={
                          location
                            ? {
                                lat: location.latitude,
                                lng: location.longitude,
                              }
                            : null
                        }
                      />
                    );
                  })}
                </div>

                {hasNextPage && (
                  <div className="mt-8 flex justify-center pb-6">
                    <button
                      type="button"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="rounded-full border border-[var(--border-light)] bg-white/80 px-8 py-3 text-sm font-semibold text-brand-black shadow-sm backdrop-blur-xl transition-all hover:border-primary/30 hover:bg-white disabled:opacity-40 dark:border-white/12 dark:bg-white/[0.07] dark:text-white/90 dark:hover:border-primary/25 dark:hover:bg-primary/10"
                    >
                      {isFetchingNextPage ? "Loading…" : "Load more"}
                    </button>
                  </div>
                )}
              </>
            )}

            {!isLoading && !error && products.length === 0 && (
              <div className="rounded-3xl border border-[var(--border-light)] bg-white/85 px-6 py-16 text-center shadow-[0_8px_32px_rgba(0,111,53,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
                <span className="material-symbols-outlined text-5xl text-brand-green-dark/70/35 dark:text-white/25">shopping_bag</span>
                <h3 className="mt-4 text-lg font-semibold text-brand-black dark:text-white/80">No products found</h3>
                <p className="mt-2 text-sm text-brand-green-dark/70 dark:text-white/45">
                  {selectedCategory !== "All" ? `Nothing in ${selectedCategory} yet.` : "Be the first to list something nearby."}
                </p>
                <Link
                  href="/marketplace/create"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[#006F35] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25"
                >
                  Create listing
                </Link>
              </div>
            )}
          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
