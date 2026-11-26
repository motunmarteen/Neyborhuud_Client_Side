"use client";

/**
 * My Listings: what you are selling. Each card carries its own Edit and Boost buttons and, when
 * buyers have made offers, a link to them (offers are answered in the deal chat).
 * Restyled 2026-11-26: the buttons sit inside the card (they floated under it, Edit looked greyed out).
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Rocket } from "lucide-react";
import { useMyListings, useProductOffers, useMyDeals } from "@/hooks/useMarketplace";
import { useGeolocation } from "@/hooks/useGeolocation";
import { ProductCard } from "@/components/marketplace";
import { BoostModal } from "@/components/marketplace/BoostModal";
import { DealStatus, Product } from "@/services/marketplace.service";
import { LocalHuudSubpageShell } from "@/components/local-huud/LocalHuudSubpageShell";
import { LocalHuudHubPrimaryAction } from "@/components/local-huud/LocalHuudHubHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SkeletonTiles } from "@/components/ui/Skeleton";

type BoostTarget = { id: string; title: string; isBoosted: boolean; boostedUntil?: string };

const idOf = (p: Product) => String((p as { _id?: string })._id ?? p.id ?? "");

/** "2 offers" when buyers are waiting; opens the newest offer's chat. */
function OffersLink({ product }: { product: Product }) {
  const router = useRouter();
  const { data } = useProductOffers(idOf(product), "pending");
  const offers = data?.offers ?? [];
  if (offers.length === 0) return null;
  const chat = offers.find((o) => o.conversationId)?.conversationId;
  return (
    <button
      type="button"
      onClick={() => router.push(chat ? `/chat/${chat}` : "/marketplace/my-deals")}
      className="tap-target w-full rounded-full bg-amber-soft py-2 text-[13px] font-bold text-amber-ink"
    >
      {offers.length === 1 ? "1 offer waiting" : `${offers.length} offers waiting`}
    </button>
  );
}

function OwnerButtons({ product, onBoost }: { product: Product; onBoost: (b: BoostTarget) => void }) {
  const id = idOf(product);
  const until = (product as { boostedUntil?: string }).boostedUntil;
  const isBoosted = (product as { isBoosted?: boolean }).isBoosted === true;
  const boostActive = isBoosted && !!until && new Date(until) > new Date();
  return (
    <div className="flex flex-col gap-2">
      <OffersLink product={product} />
      <div className="flex gap-2">
        <Link
          href={`/marketplace/${id}/edit`}
          className="tap-target inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-background text-[13px] font-bold text-navy hover:bg-[#E6EAF0]"
        >
          <Pencil size={15} aria-hidden /> Edit
        </Link>
        <button
          type="button"
          onClick={() => onBoost({ id, title: product.title, isBoosted, boostedUntil: until })}
          className="tap-target inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-green-soft text-[13px] font-bold text-brand-green-dark hover:bg-[#D6F1DE]"
        >
          <Rocket size={15} aria-hidden /> {boostActive ? "Extend" : "Boost"}
        </button>
      </div>
      {boostActive ? (
        <p className="text-center text-[12px] text-muted">
          Boosted until {new Date(until!).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
        </p>
      ) : null}
    </div>
  );
}

export default function MyListingsPage() {
  const { location } = useGeolocation();
  const [boost, setBoost] = useState<BoostTarget | null>(null);

  // One deal stage per card: fetch the seller's live deals once and look them up by item.
  const { data: myDeals } = useMyDeals("selling");
  const dealByProductId = new Map(
    (myDeals ?? [])
      .filter((d) => d.product?.id || d.product?._id)
      .map((d) => [String(d.product?.id ?? d.product?._id), d]),
  );
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error, refetch } = useMyListings();
  const products = (data?.pages.flatMap((page) => page.data || []) ?? []).map(
    (p) => ((p as unknown as { data?: Product }).data ?? p) as Product,
  );
  const userLocation = location ? { lat: location.latitude, lng: location.longitude } : null;

  return (
    <LocalHuudSubpageShell hubId="marketplace" action={<LocalHuudHubPrimaryAction href="/marketplace/create" label="Sell item" />}>
      {boost ? (
        <BoostModal
          productId={boost.id}
          productTitle={boost.title}
          alreadyBoosted={boost.isBoosted}
          boostedUntil={boost.boostedUntil}
          onClose={() => setBoost(null)}
        />
      ) : null}

      {isLoading ? (
        <SkeletonTiles count={4} />
      ) : error ? (
        <ErrorState onRetry={() => void refetch()} homeHref={null} />
      ) : products.length === 0 ? (
        <EmptyState
          icon="🛍️"
          title="You are not selling anything yet"
          description="List something you no longer need. Neighbours nearby will see it."
          action={{ label: "Sell an item", href: "/marketplace/create" }}
        />
      ) : (
        <>
          <p className="px-1 text-[13px] font-semibold text-muted">
            {products.length === 1 ? "1 item for sale" : `${products.length} items for sale`}
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {products.map((product, index) => {
              const id = idOf(product);
              const deal = dealByProductId.get(id);
              return (
                <ProductCard
                  key={id || `product-${index}`}
                  product={product}
                  userLocation={userLocation}
                  dealStatus={deal?.dealStatus as DealStatus | undefined}
                  dealConversationId={deal?.conversationId}
                  ownerFooter={<OwnerButtons product={product} onBoost={setBoost} />}
                />
              );
            })}
          </div>
          {hasNextPage ? (
            <div className="flex justify-center">
              <Button variant="secondary" loading={isFetchingNextPage} onClick={() => fetchNextPage()}>
                Show more
              </Button>
            </div>
          ) : null}
        </>
      )}
    </LocalHuudSubpageShell>
  );
}
