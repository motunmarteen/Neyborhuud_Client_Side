"use client";

/**
 * My Listings Page
 * View and manage user's own marketplace listings
 */

import { useMyListings } from "@/hooks/useMarketplace";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ProductCard } from "@/components/marketplace";
import Link from "next/link";

export default function MyListingsPage() {
  const { location } = useGeolocation();
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
    <div className="min-h-screen bg-[#0f0f1e] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/marketplace"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-2"
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
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors flex items-center gap-2"
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
                <div className="aspect-square bg-gray-800 rounded-xl mb-3" />
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-6 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">Failed to load your listings</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!isLoading && !error && products.length > 0 && (
          <>
            <div className="mb-4 text-gray-400">
              {products.length} {products.length === 1 ? "listing" : "listings"}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product, index) => {
                // Unwrap product if it's wrapped in an API response
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

            {/* Load More */}
            {hasNextPage && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-900 disabled:text-gray-600 rounded-lg font-semibold transition-colors"
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
              className="w-24 h-24 mx-auto mb-4 text-gray-600"
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
            <h3 className="text-xl font-semibold mb-2 text-gray-400">
              No listings yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start selling items in your neighborhood
            </p>
            <Link
              href="/marketplace/create"
              className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors"
            >
              Create Your First Listing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
