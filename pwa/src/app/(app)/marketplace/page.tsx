"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppBrowseLayout } from "@/components/layout/AppBrowseLayout";
import { BrowseEmptyState } from "@/components/layout/BrowseEmptyState";
import {
  LocalHuudHubHeader,
  LocalHuudHubPrimaryAction,
} from "@/components/local-huud/LocalHuudHubHeader";
import { useMarketplaceProducts, useMyDeals } from "@/hooks/useMarketplace";
import { useMarketplaceSocket } from "@/hooks/useMarketplaceSocket";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ProductCard } from "@/components/marketplace";
import { ErrorState } from '@/components/ui/ErrorState';
import { SkeletonTiles } from '@/components/ui/Skeleton';
import { ChipRow, FilterChip } from '@/components/ui/Chip';

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
    <Suspense fallback={<div className="mod-card mx-auto mt-8 h-24 max-w-[680px] animate-pulse rounded-2xl" />}>
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } =
    useMarketplaceProducts(filter);

  const products = data?.pages.flatMap((page) => page.data || []) ?? [];

  // One deal-status badge per card instead of a separate page: fetch the
  // viewer's live deals once and look them up by product id per card.
  const { data: myDeals } = useMyDeals();
  const dealByProductId = new Map(
    (myDeals ?? [])
      .filter((d) => d.product?.id || d.product?._id)
      .map((d) => [String(d.product?.id ?? d.product?._id), d]),
  );

  useEffect(() => {
    if (!focusProductId || isLoading) return;
    const el = document.getElementById(`mp-product-${focusProductId}`);
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.outline = "2px solid #0E8A3E";
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
    <AppBrowseLayout
      maxWidth="680"
      header={
        <LocalHuudHubHeader
          action={<LocalHuudHubPrimaryAction href="/marketplace/create" label="Sell item" />}
          hubId="marketplace"
          toolbar={
            <div className="space-y-3">
              <ChipRow label="Categories">
                {CATEGORIES.map((category) => (
                  <FilterChip key={category} active={selectedCategory === category} onClick={() => setSelectedCategory(category)}>
                    {category}
                  </FilterChip>
                ))}
              </ChipRow>
            </div>
          }
        />
      }
    >
      {isLoading && (
        <div role="status" aria-label="Loading">
          <SkeletonTiles count={6} />
        </div>
      )}

      {error && (
        <ErrorState onRetry={() => window.location.reload()} homeHref={null} />
      )}

      {!isLoading && !error && products.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3">
            {products.map((product, index) => {
              const productData = (product as any).data || product;
              const productId = String(productData.id || productData._id || "");
              const deal = dealByProductId.get(productId);
              return (
                <ProductCard
                  key={productId || `product-${index}`}
                  product={productData}
                  userLocation={
                    location
                      ? { lat: location.latitude, lng: location.longitude }
                      : null
                  }
                  dealStatus={deal?.dealStatus}
                  dealConversationId={deal?.conversationId}
                />
              );
            })}
          </div>
          {hasNextPage ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="mod-chip rounded-xl px-6 py-2.5 text-sm font-bold disabled:opacity-50"
                style={{ color: "var(--neu-text)" }}
              >
                {isFetchingNextPage ? "Loading…" : "Load more"}
              </button>
            </div>
          ) : null}
        </>
      )}

      {!isLoading && !error && products.length === 0 && (
        <BrowseEmptyState
          icon="shopping_bag"
          title="No products found"
          description={
            selectedCategory !== "All"
              ? `Nothing in ${selectedCategory} yet.`
              : "Be the first to list something in your Huud."
          }
          action={
            <Link
              href="/marketplace/create"
              className="mod-chip mod-chip-active inline-flex rounded-xl px-5 py-2.5 text-sm font-bold text-primary no-underline"
            >
              Create listing
            </Link>
          }
        />
      )}
    </AppBrowseLayout>
  );
}
