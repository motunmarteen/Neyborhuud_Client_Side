/**
 * ProductCard Component - Reel-style marketplace card
 * Matches XPostCard design with gradient backgrounds and vertical action rail
 */

"use client";

import { Product } from "@/services/marketplace.service";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatTimeAgo } from "@/utils/timeAgo";
import { formatDistance, haversineDistance } from "@/utils/distance";
import MapPinAvatar from "@/components/ui/MapPinAvatar";
import { useProductLike } from "@/hooks/useMarketplace";

interface ProductCardProps {
  product: Product;
  userLocation?: { lat: number; lng: number } | null;
  currentUserId?: string;
}

export function ProductCard({ product, userLocation, currentUserId }: ProductCardProps) {
  const router = useRouter();
  const [imageError, setImageError] = useState(false);
  const toggleLike = useProductLike(product.id);

  // Get primary image  
  const primaryImage = product.images?.[0];
  const hasImage = primaryImage && !imageError;

  // Calculate distance
  const distanceLabel =
    userLocation && product.location?.latitude && product.location?.longitude
      ? formatDistance(
          haversineDistance(
            userLocation.lat,
            userLocation.lng,
            product.location.latitude,
            product.location.longitude,
          ),
        )
      : null;

  // Format price
  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: product.currency || "NGN",
    minimumFractionDigits: 0,
  }).format(product.price);

  // Get seller info
  const sellerName = product.seller?.username || product.seller?.firstName || "Seller";
  const sellerAvatar = (product.seller as any)?.avatarUrl || (product.seller as any)?.profilePicture || 'https://i.pravatar.cc/100?u=seller';

  const isLiked = product.engagement?.isLiked;
  const likesCount = product.engagement?.likesCount || 0;
  const commentsCount = product.engagement?.commentsCount || 0;

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike.mutate();
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest('button') && !target.closest('a')) {
      router.push(`/marketplace/${product.id}`);
    }
  };

  // ── IMAGE CARD (reel-style with background) ──
  if (hasImage) {
    return (
      <article
        className="relative overflow-hidden cursor-pointer rounded-2xl bg-gray-900"
        style={{ minHeight: '70vh' }}
        onClick={handleCardClick}
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={primaryImage}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
        </div>

        {/* Multi-image indicator */}
        {(product.images?.length || 0) > 1 && (
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
            <span className="material-symbols-outlined text-white text-[14px]">photo_library</span>
            <span className="text-white text-xs font-bold">{product.images?.length}</span>
          </div>
        )}

        {/* Status badges */}
        {product.status === "sold" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-md border border-red-400/30">
            <span className="text-white text-xs font-bold uppercase tracking-wider">Sold</span>
          </div>
        )}

        {/* Content overlaid */}
        <div className="relative z-10 flex flex-col justify-between" style={{ minHeight: '70vh' }}>
          {/* ── TOP: Minimal header ── */}
          <div className="p-4 pt-5">
            <div className="flex items-center gap-3">
              <MapPinAvatar
                src={sellerAvatar}
                fallbackInitial={sellerName[0]}
                alt={sellerName}
                size="md"
                onClick={(e) => {
                  e.stopPropagation();
                  if (product.sellerId) router.push(`/profile/${product.sellerId}`);
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{sellerName}</p>
                {distanceLabel && (
                  <p className="text-white/70 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">location_on</span>
                    {distanceLabel} away
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── BOTTOM: Product info ── */}
          <div className="p-4 pb-6">
            {/* Category tag */}
            {product.category && (
              <div className="inline-block px-2.5 py-1 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30 mb-2">
                <span className="text-green-300 text-xs font-semibold">{product.category}</span>
              </div>
            )}

            {/* Title */}
            <h2 className="text-white text-2xl font-bold mb-2 line-clamp-2">{product.title}</h2>

            {/* Price */}
            <div className="text-3xl font-bold text-green-400 mb-1">
              {formattedPrice}
              {product.negotiable && (
                <span className="text-sm text-white/60 ml-2 font-normal">negotiable</span>
              )}
            </div>

            {/* Condition */}
            {product.condition && (
              <p className="text-white/70 text-sm capitalize">
                Condition: <span className="text-white font-medium">{product.condition.replace(/_/g, " ")}</span>
              </p>
            )}

            {/* Time */}
            <p className="text-white/50 text-xs mt-2">{formatTimeAgo(product.createdAt)}</p>
          </div>
        </div>

        {/* ── RIGHT SIDE: Vertical action rail ── */}
        <div className="absolute right-3 top-2/3 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
          {/* Like */}
          <button onClick={handleLike} disabled={toggleLike.isPending} className="flex flex-col items-center gap-0.5 group">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-red-500/90' : 'bg-black/40 backdrop-blur-md group-hover:bg-black/60'}`}>
              <span className={`material-symbols-outlined text-[20px] ${isLiked ? 'text-white' : 'text-white/90'}`}>
                {isLiked ? 'favorite' : 'favorite_border'}
              </span>
            </div>
            {likesCount > 0 && <span className="text-white text-xs font-bold">{likesCount}</span>}
          </button>

          {/* Comments */}
          <button className="flex flex-col items-center gap-0.5">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-all">
              <span className="material-symbols-outlined text-white/90 text-[20px]">chat_bubble</span>
            </div>
            {commentsCount > 0 && <span className="text-white text-xs font-bold">{commentsCount}</span>}
          </button>

          {/* Share */}
          <button className="flex flex-col items-center gap-0.5">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-all">
              <span className="material-symbols-outlined text-white/90 text-[20px]">share</span>
            </div>
          </button>
        </div>
      </article>
    );
  }

  // ── QUOTE CARD (gradient background for no-image products) ──
  return (
    <article
      className="relative overflow-hidden cursor-pointer rounded-2xl bg-gray-900"
      style={{ minHeight: '70vh' }}
      onClick={handleCardClick}
    >
      {/* Status badge */}
      {product.status === "sold" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur-md border border-red-400/30">
          <span className="text-white text-xs font-bold uppercase tracking-wider">Sold</span>
        </div>
      )}

      {/* Content centered */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6" style={{ minHeight: '70vh' }}>
        {/* Category tag */}
        {product.category && (
          <div className="inline-block px-3 py-1.5 rounded-full bg-green-500/20 backdrop-blur-sm border border-green-400/30 mb-4">
            <span className="text-green-300 text-sm font-semibold">{product.category}</span>
          </div>
        )}

        {/* Title */}
        <h2 className="text-white text-4xl font-bold mb-6 max-w-lg leading-tight" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
          {product.title}
        </h2>

        {/* Price */}
        <div className="text-5xl font-bold text-green-400 mb-3" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
          {formattedPrice}
        </div>

        {product.negotiable && (
          <p className="text-white/80 text-lg mb-4">Price Negotiable</p>
        )}

        {/* Description preview */}
        {product.description && (
          <p className="text-white/70 text-base max-w-md line-clamp-3 mb-6">
            {product.description}
          </p>
        )}

        {/* Condition */}
        {product.condition && (
          <div className="px-4 py-2 rounded-full bg-black/20 backdrop-blur-sm border border-white/10">
            <span className="text-white text-sm capitalize">Condition: {product.condition.replace(/_/g, " ")}</span>
          </div>
        )}

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          {/* Seller */}
          <div className="flex items-center gap-2">
            <MapPinAvatar src={sellerAvatar} fallbackInitial={sellerName[0]} alt={sellerName} size="sm" />
            <span className="text-white/80 text-sm font-medium">{sellerName}</span>
          </div>

          {/* Time & Location */}
          <div className="text-right text-white/60 text-xs">
            {distanceLabel && <p>{distanceLabel} away</p>}
            <p>{formatTimeAgo(product.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* ── RIGHT SIDE: Vertical action rail ── */}
      <div className="absolute right-3 top-2/3 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
        {/* Like */}
        <button onClick={handleLike} disabled={toggleLike.isPending} className="flex flex-col items-center gap-0.5 group">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLiked ? 'bg-red-500/90' : 'bg-white/10 backdrop-blur-md group-hover:bg-white/20'}`}>
            <span className={`material-symbols-outlined text-[20px] ${isLiked ? 'text-white' : 'text-white/90'}`}>
              {isLiked ? 'favorite' : 'favorite_border'}
            </span>
          </div>
          {likesCount > 0 && <span className="text-white text-xs font-bold">{likesCount}</span>}
        </button>

        {/* Comments */}
        <button className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all">
            <span className="material-symbols-outlined text-white/90 text-[20px]">chat_bubble</span>
          </div>
          {commentsCount > 0 && <span className="text-white text-xs font-bold">{commentsCount}</span>}
        </button>

        {/* Share */}
        <button className="flex flex-col items-center gap-0.5">
          <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all">
            <span className="material-symbols-outlined text-white/90 text-[20px]">share</span>
          </div>
        </button>
      </div>
    </article>
  );
}
