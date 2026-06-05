/**
 * ProductCard — compact 2-column grid card with immersive media, glass actions, and buyer bar
 */

"use client";

import { Product } from "@/services/marketplace.service";
import { useState } from "react";
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

/** Uppercase badge text on image overlay */
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

function GlassRoundAction({
  icon,
  count,
  active,
  activeClass,
  label,
  onClick,
  disabled,
}: {
  icon: string;
  count?: number;
  active?: boolean;
  activeClass?: string;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="group flex flex-col items-center gap-0.5 rounded-full p-0.5 transition-transform duration-200 ease-out hover:scale-110 active:scale-90 disabled:opacity-50"
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/35 shadow-[0_4px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-colors ${
          active ? activeClass || "border-rose-400/40 bg-brand-red500/35" : "hover:bg-black/45"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[19px] ${active ? "text-white" : "text-white/95"}`}
          style={{
            ...(icon === "favorite" && active ? { fontVariationSettings: '"FILL" 1' } : {}),
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.85))",
          }}
        >
          {icon}
        </span>
      </span>
      {count !== undefined && count > 0 && (
        <span className="text-[9px] font-black tracking-tight text-white" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>
          {formatCompactCount(count)}
        </span>
      )}
    </button>
  );
}

export function ProductCard({ product, userLocation, currentUserId: currentUserIdProp }: ProductCardProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();
  const currentUserId = currentUserIdProp ?? getViewerId(user);
  const authPending = apiClient.isAuthenticated() && isAuthLoading && !getViewerId(user);
  const [imageError, setImageError] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

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

  const locationLine =
    product.location?.formattedAddress ||
    [product.location?.neighborhood, product.location?.lga, product.location?.state].filter(Boolean).join(" · ") ||
    (distanceLabel ? `${distanceLabel} away` : "") ||
    "";

  const conditionBadge = formatConditionLabel(product.condition);
  const conditionReadable = formatConditionWords(product.condition);
  const categoryLabel = product.category?.trim() || "";
  const productKey = product.id ?? (product as { _id?: string })._id;
  const cardDomId = productKey ? `mp-product-${productKey}` : undefined;
  const rawDescription = product.description?.trim() ?? "";
  /** ~3 lines in card body — toggle to read full text */
  const descriptionToggleThreshold = 96;
  const needsDescToggle = rawDescription.length > descriptionToggleThreshold;

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
        className="group/card flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--border-light)] bg-white/92 shadow-[0_10px_36px_rgba(0,111,53,0.1),0_0_0_1px_rgba(255,255,255,0.8)_inset] backdrop-blur-xl transition-[transform,box-shadow,outline] duration-300 hover:border-primary/25 dark:border-white/[0.08] dark:bg-[rgba(16,22,30,0.65)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_60px_-20px_rgba(0,212,49,0.15)] dark:hover:border-primary/15"
      >
        {/* Image + overlays (no separate detail page — info lives on card) */}
        <div
          className="relative block w-full text-left"
          aria-hidden={false}
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            {hasImage ? (
              <img
                src={primaryImage}
                alt=""
                className={`h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03] ${isSold ? "opacity-55 grayscale-[0.2]" : ""}`}
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[var(--surface-light)] via-white to-[#E9F6E6] px-3 dark:from-emerald-900/40 dark:via-slate-900 dark:to-slate-950"
                aria-hidden
              >
                <span className="material-symbols-outlined text-4xl text-[#006F35]/30 dark:text-primary/40">image</span>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/55" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

            {/* Top badges */}
            <div className="absolute left-2.5 top-2.5 z-10 flex max-w-[calc(100%-4.5rem)] flex-wrap gap-1.5">
              {conditionBadge && (
                <span className="rounded-full border border-white/15 bg-black/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white/95 shadow-lg backdrop-blur-md">
                  {conditionBadge}
                </span>
              )}
              {categoryLabel && (
                <span className="rounded-full border border-primary/25 bg-primary/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-100 shadow-[0_0_20px_rgba(0,212,49,0.25)] backdrop-blur-md">
                  {categoryLabel}
                </span>
              )}
              {isActiveBoosted && (
                <span className="flex items-center gap-0.5 rounded-full border border-status-warning/30 bg-primary/90 px-2 py-0.5 text-[9px] font-black text-slate-900 shadow-md">
                  <span>🚀</span>
                  BOOST
                </span>
              )}
            </div>

            {isSold && (
              <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-red/35 bg-brand-red/90 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white shadow-xl backdrop-blur-md">
                Sold
              </div>
            )}

            {(product.images?.length || 0) > 1 && (
              <div className="absolute bottom-2 left-2.5 z-10 flex items-center gap-0.5 rounded-full border border-white/10 bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                <span className="material-symbols-outlined text-[12px]">photo_library</span>
                {product.images?.length}
              </div>
            )}

            {/* Side glass actions */}
            <div
              className="absolute bottom-3 right-2 z-20 flex flex-col gap-2.5"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="presentation"
            >
              <GlassRoundAction
                icon={isLiked ? "favorite" : "favorite_border"}
                count={likesCount}
                active={!!isLiked}
                activeClass="border-rose-400/40 bg-brand-red500/40"
                label={isLiked ? "Unlike" : "Like"}
                onClick={onLike}
                disabled={toggleLike.isPending}
              />
              <GlassRoundAction
                icon="chat_bubble"
                count={commentsCount}
                label="Comments"
                onClick={(e) => {
                  e.stopPropagation();
                  setCommentsOpen(true);
                }}
              />
              <GlassRoundAction
                icon="ios_share"
                label="Share"
                onClick={(e) => {
                  e.stopPropagation();
                  setShareOpen(true);
                }}
              />
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="flex flex-1 flex-col gap-2 px-3 pb-3 pt-2.5">
          <div className="min-h-0 flex-1 space-y-1">
            <h2 className="line-clamp-2 text-[13px] font-bold leading-snug tracking-tight text-brand-black dark:text-white/95">{product.title}</h2>
            <p className="text-[15px] font-extrabold tracking-tight text-[#006F35] drop-shadow-none dark:text-primary dark:drop-shadow-[0_0_12px_rgba(52,211,153,0.35)]">
              {formattedPrice}
              {product.negotiable && (
                <span className="ml-1.5 text-[10px] font-semibold text-brand-green-dark/70/80 dark:text-white/45">· negotiable</span>
              )}
            </p>
            {locationLine ? (
              <p className="flex items-start gap-1 text-[11px] leading-snug text-brand-green-dark/70 dark:text-white/55">
                <span className="material-symbols-outlined mt-0.5 shrink-0 text-[13px] text-primary dark:text-primary/70">location_on</span>
                <span className="line-clamp-2">{locationLine}</span>
              </p>
            ) : null}
            {(conditionReadable || categoryLabel) && (
              <p className="text-[10px] leading-snug text-brand-green-dark/70/85 dark:text-white/50">
                {conditionReadable ? (
                  <>
                    <span className="font-semibold text-brand-black dark:text-white/75">Condition:</span>{" "}
                    <span className="font-medium text-[#006F35] dark:text-primary/90">{conditionReadable}</span>
                  </>
                ) : null}
                {conditionReadable && categoryLabel ? <span className="text-brand-green-dark/70/50 dark:text-white/35"> · </span> : null}
                {categoryLabel ? <span className="capitalize">{categoryLabel.toLowerCase()}</span> : null}
              </p>
            )}
            {product.createdAt ? (
              <p className="text-[10px] text-brand-green-dark/70/70 dark:text-white/40">Posted {formatTimeAgo(product.createdAt)}</p>
            ) : null}
            {rawDescription ? (
              <div className="space-y-0.5 pt-0.5">
                <p
                  className={`text-[11px] leading-relaxed text-brand-green-dark/70/90 dark:text-white/45 whitespace-pre-wrap break-words ${
                    !descExpanded && needsDescToggle ? "line-clamp-3" : ""
                  }`}
                >
                  {rawDescription}
                </p>
                {needsDescToggle ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDescExpanded((v) => !v);
                    }}
                    className="text-[10px] font-bold tracking-wide text-[#006F35] transition-colors hover:text-primary dark:text-primary dark:hover:text-primary"
                    aria-expanded={descExpanded}
                  >
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div onClick={(e) => e.stopPropagation()} className="mt-auto">
            {isOwner ? (
              <p className="rounded-full border border-[var(--border-light)] bg-[var(--surface-light)] py-2 text-center text-[11px] font-semibold text-[#2E502E] backdrop-blur-md dark:border-white/10 dark:bg-white/[0.06] dark:text-white/60">
                Your listing
              </p>
            ) : isSold ? (
              <p className="rounded-full border border-[var(--border-light)] bg-white/60 py-2 text-center text-[11px] font-medium text-brand-green-dark/70/70 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/45">
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
