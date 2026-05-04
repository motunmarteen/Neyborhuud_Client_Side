"use client";

/**
 * Marketplace Main Page
 * Browse and search marketplace products
 */

import { useState } from "react";
import { useMarketplaceProducts } from "@/hooks/useMarketplace";
import { useMarketplaceSocket } from "@/hooks/useMarketplaceSocket";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ProductCard } from "@/components/marketplace";
import Link from "next/link";
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { location } = useGeolocation();
  
  // Connect to WebSocket for real-time updates
  useMarketplaceSocket();

  const filter = selectedCategory !== "All" ? { category: selectedCategory } : undefined;
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useMarketplaceProducts(filter);

  const products = data?.pages.flatMap((page) => page.data || []) ?? [];

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800 backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-green-400 text-2xl">storefront</span>
              <h1 className="text-2xl font-bold text-white">Marketplace</h1>
            </div>
            <Link
              href="/marketplace/create"
              className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-full font-semibold transition-all flex items-center gap-2 text-white"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Sell Item
            </Link>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? "bg-green-500 text-white"
                    : "bg-gray-800/50 text-gray-400 hover:bg-gray-700/50"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Quick Links */}
        <div className="mb-6 flex gap-3 flex-wrap">
          <Link
            href="/marketplace/my-listings"
            className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all text-sm flex items-center gap-2 border border-gray-700"
          >
            <span className="material-symbols-outlined text-[16px]">inventory_2</span>
            My Listings
          </Link>
          <Link
            href="/marketplace/my-orders"
            className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all text-sm flex items-center gap-2 border border-gray-700"
          >
            <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
            My Orders
          </Link>
          <Link
            href="/marketplace/my-sales"
            className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all text-sm flex items-center gap-2 border border-gray-700"
          >
            <span className="material-symbols-outlined text-[16px]">sell</span>
            My Sales
          </Link>
          <Link
            href="/marketplace/my-offers"
            className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all text-sm flex items-center gap-2 border border-gray-700"
          >
            <span className="material-symbols-outlined text-[16px]">local_offer</span>
            My Offers
          </Link>
          <Link
            href="/marketplace/saved"
            className="px-4 py-2 bg-gray-800/50 hover:bg-gray-700/50 rounded-full transition-all text-sm flex items-center gap-2 border border-gray-700"
          >
            <span className="material-symbols-outlined text-[16px]">bookmark</span>
            Saved Items
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
            <p className="text-red-400 mb-4">Failed to load products</p>
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
              No products found
            </h3>
            <p className="text-gray-500 mb-6">
              {selectedCategory !== "All"
                ? `No products in ${selectedCategory} category`
                : "Be the first to list something!"}
            </p>
            <Link
              href="/marketplace/create"
              className="inline-block px-6 py-3 bg-green-500 hover:bg-green-600 rounded-lg font-semibold transition-colors"
            >
              Create Listing
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
