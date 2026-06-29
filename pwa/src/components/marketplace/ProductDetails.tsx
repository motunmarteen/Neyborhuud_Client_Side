/**
 * ProductDetails Component
 * Full product detail view with images, seller info, engagement, and comments
 */

import { useProduct } from "@/hooks/useMarketplace";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatTimeAgo } from "@/utils/timeAgo";
import { formatDistance, haversineDistance } from "@/utils/distance";
import { ProductEngagement } from "./ProductEngagement";
import { ProductComments } from "./ProductComments";
import { BuyerIntentActions } from "./BuyerIntentActions";

interface ProductDetailsProps {
  productId: string;
  currentUserId?: string;
  /** Session loading — avoid flashing guest CTAs */
  authPending?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string) => void;
}

export function ProductDetails({
  productId,
  currentUserId,
  authPending = false,
  userLocation,
  onEdit,
  onDelete,
}: ProductDetailsProps) {
  const router = useRouter();
  const { data: product, isLoading, error } = useProduct(productId);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-black text-white p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="aspect-square bg-brand-black rounded-xl mb-6" />
            <div className="h-8 bg-brand-black rounded w-3/4 mb-4" />
            <div className="h-6 bg-brand-black rounded w-1/4 mb-6" />
            <div className="h-32 bg-brand-black rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-brand-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="text-[var(--neu-text-muted)] mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push("/marketplace")}
            className="px-6 py-3 bg-primary hover:bg-brand-green-dark rounded-lg font-semibold transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUserId && product.sellerId === currentUserId;

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

  return (
    <div className="min-h-screen bg-brand-black text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header with back button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[var(--neu-text-muted)] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {isOwner && (
            <div className="flex gap-2">
              <button
                onClick={() => onEdit?.(productId)}
                className="px-4 py-2 bg-brand-blue hover:bg-brand-blue rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete?.(productId)}
                className="px-4 py-2 bg-brand-red hover:bg-brand-red/85 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-brand-black rounded-xl overflow-hidden">
              <img
                src={product.images?.[selectedImageIndex] || "/placeholder-product.png"}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? "border-primary scale-95"
                        : "border-transparent hover:border-black/[0.08]"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Status Badge */}
            {product.status === "sold" && (
              <div className="inline-block px-4 py-2 bg-brand-red text-white font-semibold rounded-lg">
                SOLD
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl font-bold">{product.title}</h1>

            {/* Price */}
            <div className="text-4xl font-bold text-primary">
              {formattedPrice}
              {product.negotiable && (
                <span className="text-base text-[var(--neu-text-muted)] ml-3 font-normal">
                  negotiable
                </span>
              )}
            </div>

            {/* Condition & Category */}
            <div className="flex gap-3">
              {product.condition && (
                <span className="px-3 py-1 bg-brand-black rounded-lg text-sm capitalize">
                  Condition: <span className="text-primary">{product.condition.replace(/_/g, " ")}</span>
                </span>
              )}
              {product.category && (
                <span className="px-3 py-1 bg-brand-black rounded-lg text-sm">
                  {product.category}
                </span>
              )}
            </div>

            {/* Location & Time */}
            <div className="flex items-center gap-4 text-sm text-[var(--neu-text-muted)] border-t border-black/[0.08] pt-4">
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {distanceLabel || (product.location as any)?.formattedAddress || (product.location as any)?.address || "Location unavailable"}
              </div>
              <span>•</span>
              <span>Posted {formatTimeAgo(product.createdAt)}</span>
            </div>

            {/* Description */}
            <div className="border-t border-black/[0.08] pt-6">
              <h3 className="text-lg font-semibold mb-3">Description</h3>
              <p className="text-[var(--neu-text-muted)] whitespace-pre-wrap">{product.description}</p>
            </div>

            {/* Seller Info */}
            {product.seller && (
              <div className="border-t border-black/[0.08] pt-6">
                <h3 className="text-lg font-semibold mb-3">Seller</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-brand-blue flex items-center justify-center text-lg font-bold">
                    {(product.seller.username || product.seller.firstName || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {product.seller.username ||
                        `${product.seller.firstName || ""} ${product.seller.lastName || ""}`.trim() ||
                        "Seller"}
                    </p>
                    {product.seller.location && (
                      <p className="text-sm text-[var(--neu-text-muted)]">
                        {(product.seller.location as any).city ||
                          (product.seller.location as any).state ||
                          "Location"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Buyer Intent Actions (Make Offer / Request to Buy) */}
                <BuyerIntentActions
                  product={product}
                  currentUserId={currentUserId}
                  isOwner={!!isOwner}
                  authPending={authPending}
                />
              </div>
            )}

            {/* Engagement */}
            <div className="border-t border-black/[0.08] pt-6">
              <ProductEngagement
                product={product}
                currentUserId={currentUserId}
                onCommentClick={() => setShowComments(!showComments)}
              />
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-12 border-t border-black/[0.08] pt-8">
            <ProductComments productId={productId} currentUserId={currentUserId} />
          </div>
        )}
      </div>
    </div>
  );
}
