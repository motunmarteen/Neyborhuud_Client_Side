/**
 * ProductCard — a marketplace item as a BrowseTile (photo slider, price, condition, like,
 * comments, share, and the compact Buy / Price am / Chat actions).
 */

"use client";

import { Product, DealStatus } from "@/services/marketplace.service";
import { DEAL_STATUS_META } from "@/lib/dealStatus";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistance, haversineDistance } from "@/utils/distance";
import { useProductLike } from "@/hooks/useMarketplace";
import { useAuth } from "@/hooks/useAuth";
import { formatTimeAgo } from "@/utils/timeAgo";
import { fromKobo } from "@/lib/currency";
import { BuyerIntentActions } from "@/components/marketplace/BuyerIntentActions";
import { MarketplaceCommentsSheet } from "@/components/marketplace/MarketplaceCommentsSheet";
import { MarketplaceShareSheet } from "@/components/marketplace/MarketplaceShareSheet";
import { getViewerId } from "@/lib/auth-user";
import apiClient from "@/lib/api-client";
import { MessageCircle, Share2 } from "lucide-react";
import { BrowseTile } from "@/components/feed/BrowseTile";
import { Chip } from "@/components/ui/Chip";

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
  return formatConditionWords(condition);
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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const productId = product.id || (product as any)._id || "";
  const toggleLike = useProductLike(productId);

  const hasImage = (product.images?.length ?? 0) > 0;

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

  // product.price from the API is integer kobo — convert to naira for display.
  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: product.currency || "NGN",
    minimumFractionDigits: 0,
  }).format(fromKobo(product.price));

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

  const onLike = () => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    toggleLike.mutate();
  };

  const meta = [distanceLabel ? `${distanceLabel} away` : null, product.createdAt ? formatTimeAgo(product.createdAt) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <BrowseTile
        id={cardDomId}
        href={`/marketplace/${productId}`}
        kind="marketplace"
        title={product.title}
        images={hasImage ? product.images : []}
        status={isSold ? "Sold" : undefined}
        highlight={
          <>
            {formattedPrice}
            {product.negotiable && !isSold ? (
              <span className="ml-1 font-body text-[11px] font-bold text-brand-green-dark">Negotiable</span>
            ) : null}
          </>
        }
        chips={
          <>
            {dealStatus ? <Chip tone="purple">{DEAL_STATUS_META[dealStatus].label}</Chip> : null}
            {isActiveBoosted ? <Chip tone="amber" icon="🚀">Boosted</Chip> : null}
            {conditionBadge ? <Chip>{conditionBadge}</Chip> : null}
            {!dealStatus && !isActiveBoosted && categoryLabel ? <Chip>{categoryLabel}</Chip> : null}
          </>
        }
        meta={meta || undefined}
        action={{
          icon: "heart",
          label: isLiked ? "Unlike" : `Like${likesCount ? `, ${likesCount}` : ""}`,
          on: !!isLiked,
          disabled: toggleLike.isPending,
          onPress: onLike,
        }}
        footer={
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCommentsOpen(true)}
                aria-label={`Comments, ${commentsCount}`}
                className="tap-target inline-flex h-8 items-center gap-1 rounded-full px-2 text-xs font-bold text-muted hover:bg-background"
              >
                <MessageCircle size={16} aria-hidden /> {commentsCount > 0 ? commentsCount : null}
              </button>
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                aria-label="Share"
                className="tap-target inline-flex h-8 items-center rounded-full px-2 text-muted hover:bg-background"
              >
                <Share2 size={16} aria-hidden />
              </button>
              {dealStatus && dealConversationId ? (
                <button
                  type="button"
                  onClick={() => router.push(`/chat/${dealConversationId}`)}
                  className="tap-target ml-auto inline-flex h-8 items-center rounded-full px-2 text-xs font-bold text-brand-green-dark hover:bg-green-soft"
                >
                  Open chat
                </button>
              ) : null}
            </div>
            {isOwner ? (
              <p className="rounded-full bg-background py-2 text-center text-xs font-bold text-muted">Your listing</p>
            ) : isSold ? (
              <p className="rounded-full bg-background py-2 text-center text-xs font-bold text-muted">No longer available</p>
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
        }
      />

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
