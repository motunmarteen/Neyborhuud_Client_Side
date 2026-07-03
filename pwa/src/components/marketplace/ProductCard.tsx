/**
 * ProductCard — Stake-style compact card with full-bleed image and overlaid info
 */

"use client";

import { Product, DealStatus } from "@/services/marketplace.service";
import { DEAL_STATUS_META } from "@/lib/dealStatus";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDistance, haversineDistance } from "@/utils/distance";
import { useProductLike } from "@/hooks/useMarketplace";
import { useAuth } from "@/hooks/useAuth";
import { formatTimeAgo } from "@/utils/timeAgo";
import { BuyerIntentActions } from "@/components/marketplace/BuyerIntentActions";
import { MarketplaceCommentsSheet } from "@/components/marketplace/MarketplaceCommentsSheet";
import { MarketplaceShareSheet } from "@/components/marketplace/MarketplaceShareSheet";
import { getViewerId } from "@/lib/auth-user";
import apiClient from "@/lib/api-client";

interface ProductCardProps {
  product: Product;
  userLocation?: { lat: number; lng: number } | null;
  currentUserId?: string;
  /** If the viewer has a live deal on this product, its lifecycle status + chat. */
  dealStatus?: DealStatus;
  dealConversationId?: string | null;
}

function formatConditionWords(condition?: string) {
  if (!condition) return "";
  return condition
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatConditionLabel(condition?: string) {
  const w = formatConditionWords(condition);
  return w ? w.toUpperCase() : "";
}

function formatCompactCount(value?: number) {
  if (!value) return undefined;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}K`;
  return `${value}`;
}

export function ProductCard({
  product,
  userLocation,
  currentUserId: currentUserIdProp,
  dealStatus,
  dealConversationId,
}: ProductCardProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const currentUserId = currentUserIdProp ?? getViewerId(user);
  const authPending = apiClient.isAuthenticated() && isAuthLoading && !getViewerId(user);
  const [imageError, setImageError] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const productId = product.id || (product as any)._id || "";
  const toggleLike = useProductLike(productId);

  const primaryImage = product.images?.[0];
  const hasImage = primaryImage && !imageError;

  const distanceLabel =
    userLocation && product.location?.latitude != null && product.location?.longitude != null
      ? formatDistance(
          haversineDistance(
            userLocation.lat,
            userLocation.lng,
            product.location.latitude,
            product.location.longitude,
          ),
        )
      : null;

  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: product.currency || "NGN",
    minimumFractionDigits: 0,
  }).format(product.price);

  const isLiked = product.engagement?.isLiked ?? (product as any).isLiked;
  const likesCount = product.engagement?.likesCount ?? 0;
  const commentsCount = product.engagement?.commentsCount ?? 0;

  const isOwner = !!(currentUserId && product.sellerId && currentUserId === product.sellerId);
  const isSold = product.status === "sold";

  const isActiveBoosted =
    product.isBoosted === true &&
    product.boostedUntil &&
    new Date(product.boostedUntil) > new Date();

  const conditionBadge = formatConditionLabel(product.condition);
  const categoryLabel = product.category?.trim() || "";
  const productKey = product.id ?? (product as { _id?: string })._id;
  const cardDomId = productKey ? `mp-product-${productKey}` : undefined;

  const onLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    toggleLike.mutate();
  };

  return (
    <>
      <article
        id={cardDomId}
        className="group/card relative flex flex-col overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        {/* Full-bleed image area */}
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl">
          {hasImage ? (
            <Image
              src={primaryImage}
              alt=""
              fill
              sizes="(max-width: 640px) 50vw, 320px"
              className={`object-cover transition-transform duration-500 group-hover/card:scale-[1.05] ${isSold ? "opacity-50 grayscale-[0.3]" : ""}`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0e2a18 0%, #1a3a22 100%)" }}
            >
              <span className="material-symbols-outlined text-4xl text-white/20">storefront</span>
            </div>
          )}

          {/* Dark gradient overlay for text readability */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

          {/* Top-left badges row */}
          <div className="absolute left-2 top-2 z-10 flex max-w-[calc(100%-3.5rem)] flex-wrap gap-1.5">
            {dealStatus && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (dealConversationId) router.push(`/chat/${dealConversationId}`);
                }}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white shadow-sm ${DEAL_STATUS_META[dealStatus].pill}`}
              >
                <span className="material-symbols-outlined text-[10px]">
                  {DEAL_STATUS_META[dealStatus].icon}
                </span>
                {DEAL_STATUS_META[dealStatus].label}
              </button>
            )}
            {conditionBadge && (
              <span className="rounded-full bg-black/50 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white/90 backdrop-blur-sm border border-white/10">
                {conditionBadge}
              </span>
            )}
            {categoryLabel && (
              <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-100 backdrop-blur-sm border border-primary/20">
                {categoryLabel}
              </span>
            )}
            {isActiveBoosted && (
              <span className="flex items-center gap-0.5 rounded-full bg-primary/90 px-2 py-0.5 text-[8px] font-black text-slate-900">
                🚀 BOOST
              </span>
            )}
          </div>

          {/* Sold overlay */}
          {isSold && (
            <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-red/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
              Sold
            </div>
          )}

          {/* Image count badge */}
          {(product.images?.length || 0) > 1 && (
            <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-md border border-white/10">
              <span className="material-symbols-outlined text-[11px]">photo_library</span>
              {product.images?.length}
            </div>
          )}

          {/* Right-side glass action buttons */}
          <div
            className="absolute bottom-12 right-2 z-20 flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="presentation"
          >
            <button
              type="button"
              onClick={onLike}
              disabled={toggleLike.isPending}
              aria-label={isLiked ? "Unlike" : "Like"}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/15 transition-all hover:scale-110 active:scale-90"
            >
              <span
                className="material-symbols-outlined text-[17px] text-white"
                style={{
                  ...(isLiked ? { fontVariationSettings: '"FILL" 1', color: '#ff4757' } : {}),
                  filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))",
                }}
              >
                {isLiked ? "favorite" : "favorite_border"}
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setCommentsOpen(true); }}
              aria-label="Comments"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/15 transition-all hover:scale-110 active:scale-90"
            >
              <span className="material-symbols-outlined text-[17px] text-white" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                chat_bubble
              </span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShareOpen(true); }}
              aria-label="Share"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/15 transition-all hover:scale-110 active:scale-90"
            >
              <span className="material-symbols-outlined text-[17px] text-white" style={{ filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }}>
                ios_share
              </span>
            </button>
          </div>

          {/* Bottom overlaid content — Stake-style */}
          <div className="absolute inset-x-0 bottom-0 z-10 p-3 space-y-1">
            <h2 className="text-[13px] font-extrabold text-white leading-tight line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
              {product.title}
            </h2>
            <p className="text-[14px] font-black text-primary drop-shadow-[0_0_12px_rgba(0,212,49,0.4)]">
              {formattedPrice}
              {product.negotiable && (
                <span className="ml-1 text-[9px] font-semibold text-white/45">· negotiable</span>
              )}
            </p>

            {/* Stat row */}
            <div className="flex items-center gap-3 pt-0.5">
              {distanceLabel && (
                <div className="flex items-center gap-1">
                  <span className="inline-block w-[5px] h-[5px] rounded-full bg-primary" />
                  <span className="text-[10px] font-medium text-white/55">{distanceLabel} away</span>
                </div>
              )}
              {likesCount > 0 && (
                <span className="text-[10px] font-medium text-white/45">
                  {formatCompactCount(likesCount)} ♥
                </span>
              )}
              {product.createdAt && (
                <span className="text-[10px] text-white/35">
                  {formatTimeAgo(product.createdAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compact buyer action bar below card */}
        <div onClick={(e) => e.stopPropagation()} className="pt-2 px-1">
          {isOwner ? (
            <p className="rounded-xl bg-white/[0.04] border border-white/[0.06] py-1.5 text-center text-[10px] font-semibold text-[var(--neu-text-muted)]">
              Your listing
            </p>
          ) : isSold ? (
            <p className="rounded-xl bg-white/[0.04] border border-white/[0.06] py-1.5 text-center text-[10px] font-medium text-[var(--neu-text-muted)]">
              No longer available
            </p>
          ) : (
            <BuyerIntentActions
              product={product}
              currentUserId={currentUserId}
              isOwner={isOwner}
              layout="compact"
              authPending={authPending}
            />
          )}
        </div>
      </article>

      <MarketplaceCommentsSheet
        open={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        productId={commentsOpen ? productId : null}
        commentsCount={commentsCount}
        currentUserId={currentUserId}
      />

      <MarketplaceShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        productId={productId}
        title={product.title}
      />
    </>
  );
}
