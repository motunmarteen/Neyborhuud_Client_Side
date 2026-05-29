"use client";

/**
 * My Listings Page
 * View and manage user's own marketplace listings
 */

import { useState } from "react";
import { useMyListings, useProductOffers } from "@/hooks/useMarketplace";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ProductCard } from "@/components/marketplace";
import { BoostModal } from "@/components/marketplace/BoostModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/services/marketplace.service";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";

// ─── Per-listing pending offer badge ─────────────────────────────────────────

function PendingOffersBadge({ product }: { product: Product }) {
  const router = useRouter();
  const productId = (product as any)._id ?? product.id;
  const { data } = useProductOffers(productId, "pending");
  const count = data?.offers?.length ?? 0;

  if (count === 0) return null;

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        router.push(`/marketplace/${productId}/offers`);
      }}
      className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-amber-300 hover:bg-primary/30 transition-colors"
    >
      <span>💰</span>
      {count} pending {count === 1 ? "offer" : "offers"}
    </button>
  );
}

// ─── Listing card wrapper ─────────────────────────────────────────────────────

function ListingWithOffers({
  product,
  userLocation,
  onBoost,
}: {
  product: Product;
  userLocation: { lat: number; lng: number } | null;
  onBoost: (id: string, title: string, isBoosted: boolean, boostedUntil?: string) => void;
}) {
  const productId = (product as any)._id ?? product.id;
  const productTitle = (product as any).title ?? (product as any).name ?? "Listing";
  const isBoosted = (product as any).isBoosted === true;
  const boostedUntil: string | undefined = (product as any).boostedUntil;
  const boostActive = isBoosted && boostedUntil && new Date(boostedUntil) > new Date();

  return (
    <div className="flex flex-col">
      <ProductCard product={product} userLocation={userLocation} />
      <PendingOffersBadge product={product} />

      {/* Active boost expiry notice */}
      {boostActive && (
        <p className="mt-1 text-center text-[11px] text-primary/80">
          🚀 Boosted until{" "}
          {new Date(boostedUntil!).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}

      {/* Owner actions: Edit + Boost */}
      <div className="mt-2 flex gap-2">
        <Link
          href={`/marketplace/${productId}/edit`}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-brand-black/50 px-3 py-1 text-xs font-semibold text-[var(--neu-text-muted)] hover:bg-brand-black transition-colors"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit
        </Link>
        <button
          onClick={() => onBoost(productId, productTitle, isBoosted, boostedUntil)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            boostActive
              ? "bg-primary/30 text-amber-300 hover:bg-primary/40"
              : "bg-primary/15 text-primary hover:bg-primary/25"
          }`}
        >
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          {boostActive ? "Extend Boost" : "Boost"}
        </button>
      </div>
    </div>
  );
}

export default function MyListingsPage() {
  const { location } = useGeolocation();
  const [
    boostProduct,
    setBoostProduct,
  ] = useState<{ id: string; title: string; isBoosted: boolean; boostedUntil?: string } | null>(null);
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useMyListings();

  const products = data?.pages.flatMap((page) => page.data || []) ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      {boostProduct && (
        <BoostModal
          productId={boostProduct.id}
          productTitle={boostProduct.title}
          alreadyBoosted={boostProduct.isBoosted}
          boostedUntil={boostProduct.boostedUntil}
          onClose={() => setBoostProduct(null)}
        />
      )}
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-brand-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-brand-black border-b border-black/[0.08]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/marketplace"
                className="flex items-center gap-2 text-[var(--neu-text-muted)] hover:text-white transition-colors mb-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Marketplace
              </Link>
              <h1 className="text-2xl font-bold">My Listings</h1>
            </div>
            <Link
              href="/marketplace/create"
              className="px-4 py-2 bg-primary hover:bg-brand-green-dark rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Listing
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-brand-black rounded-xl mb-3" />
                <div className="h-4 bg-brand-black rounded w-3/4 mb-2" />
                <div className="h-6 bg-brand-black rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-brand-red mb-4">Failed to load your listings</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-brand-black hover:bg-brand-black rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="mb-4 text-[var(--neu-text-muted)]">
              {products.length} {products.length === 1 ? "listing" : "listings"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product, index) => {
                // Unwrap product if it's wrapped in an API response
                const productData = (product as any).data || product;
                return (
                  <ListingWithOffers
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
                    onBoost={(id, title, isBoosted, boostedUntil) => setBoostProduct({ id, title, isBoosted, boostedUntil })}
                  />
                );
              })}
            </div>

            {/* Load More */}
            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 bg-brand-black hover:bg-brand-black disabled:bg-brand-black disabled:text-[var(--neu-text-secondary)] rounded-lg font-semibold transition-colors"
                >
                  {isFetchingNextPage ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && products.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-24 h-24 mx-auto mb-4 text-[var(--neu-text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2 text-[var(--neu-text-muted)]">
              No listings yet
            </h3>
            <p className="text-[var(--neu-text-muted)] mb-6">
              Start selling items in your Huud
            </p>
            <Link
              href="/marketplace/create"
              className="inline-block px-6 py-3 bg-primary hover:bg-brand-green-dark rounded-lg font-semibold transition-colors"
            >
              Create Your First Listing
            </Link>
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
