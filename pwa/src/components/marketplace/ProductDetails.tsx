/**
 * ProductDetails Component
 * Full product detail view with images, seller info, engagement, and comments
 */

import { useProduct } from "@/hooks/useMarketplace";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { marketplaceService } from "@/services/marketplace.service";
import { formatTimeAgo } from "@/utils/timeAgo";
import { formatDistance, haversineDistance } from "@/utils/distance";
import { ProductEngagement } from "./ProductEngagement";
import { ProductComments } from "./ProductComments";
import { BuyerIntentActions } from "./BuyerIntentActions";
import { SellerBadge } from "./SellerBadge";
import { fromKobo } from "@/lib/currency";

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
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("Suspected counterfeit or fake");
  const [reportDetails, setReportDetails] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReporting(true);
    try {
      await marketplaceService.reportProduct(productId, reportReason, reportDetails);
      toast.success("Listing reported. Safety moderators and community watch alerted.");
      setShowReportModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit report");
    } finally {
      setIsReporting(false);
    }
  };

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

  // Format price — product.price from the API is integer kobo.
  const formattedPrice = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: product.currency || "NGN",
    minimumFractionDigits: 0,
  }).format(fromKobo(product.price));

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

          <div className="flex gap-2">
            {!isOwner && (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="px-3 py-1.5 border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <span>🚩</span> Report Listing
              </button>
            )}

            {isOwner && (
              <>
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
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-brand-black rounded-xl overflow-hidden">
              <Image
                src={product.images?.[selectedImageIndex] || "/placeholder-product.png"}
                alt={product.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Thumbnail Gallery */}
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx
                        ? "border-primary scale-95"
                        : "border-transparent hover:border-black/[0.08]"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
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

            {/* Zero-Escrow Transparency & NIPOST NDAPS Sovereign Badge */}
            <div className="space-y-2">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-amber-300">
                    🛡️ Zero-Escrow Peer-to-Peer Deal
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowGuidelines(true)}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-200 underline"
                  >
                    Safety Rules →
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-amber-200/80 leading-relaxed">
                  NeyborHuud holds no funds (₦0.00). Transactions and deliveries are handled directly between neighbors. Stalled deals route to the Huud Watch roster for local mediation.
                </p>
              </div>

              {Boolean((product.location as any)?.maskedPostcode || (product.seller as any)?.maskedPostcode) && (
                <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  <span>📍</span> NIPOST NDAPS: {(product.location as any)?.maskedPostcode || (product.seller as any)?.maskedPostcode}
                </div>
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
                    <SellerBadge
                      sellerId={
                        (product.seller as any)?.id ??
                        (product.seller as any)?._id ??
                        (typeof product.sellerId === "string" ? product.sellerId : undefined)
                      }
                      showProgress
                      className="mt-1"
                    />
                    {product.seller.location && (
                      <p className="mt-1 text-sm text-[var(--neu-text-muted)]">
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

        {/* Safe Meetup Guidelines Modal */}
        {showGuidelines && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-800 p-6 text-white shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold flex items-center gap-2 text-amber-400">
                  <span>🛡️</span> Zero-Escrow Safe Meetup Rules
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGuidelines(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                  <p className="font-bold text-white mb-1">1. Zero Platform Escrow (₦0.00)</p>
                  <p className="text-slate-400">
                    NeyborHuud is NOT a payment intermediary and never holds your funds. All payments occur directly between participants (cash or direct bank transfer) at your own discretion.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                  <p className="font-bold text-white mb-1">2. Meet in Public Spaces</p>
                  <p className="text-slate-400">
                    Always arrange pickups at estate gates, security posts, verified building lobbies, or busy commercial centers during daylight hours.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                  <p className="font-bold text-white mb-1">3. Inspect Before Payment</p>
                  <p className="text-slate-400">
                    Physically test or examine the product before completing direct bank transfers or handing over cash.
                  </p>
                </div>

                <div className="rounded-xl bg-slate-900 p-3 border border-slate-800">
                  <p className="font-bold text-white mb-1">4. Community Mediation Layer</p>
                  <p className="text-slate-400">
                    In case of a contested deal or non-delivery, tap "Dispute" in the deal chat to escalate to the local Huud Watch / Elders roster for community reputation arbitration.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuidelines(false)}
                className="w-full rounded-xl bg-amber-500 py-2.5 text-xs font-bold text-black hover:bg-amber-400 transition"
              >
                I Understand & Agree
              </button>
            </div>
          </div>
        )}

        {/* Report Listing / Scam Modal */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-800 p-6 text-white shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold flex items-center gap-2 text-rose-400">
                  <span>🚩</span> Report Suspicious Listing
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 mb-4">
                Help protect our neighborhood. Reports are immediately flagged to community safety moderators and the Huud Watch roster.
              </p>

              <form onSubmit={handleReportSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Reason
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Suspected counterfeit or fake">Suspected counterfeit or fake</option>
                    <option value="Prohibited or dangerous item">Prohibited or dangerous item</option>
                    <option value="Scam / Advance-fee fraud">Scam / Advance-fee fraud</option>
                    <option value="Misleading price or condition">Misleading price or condition</option>
                    <option value="Harassment or inappropriate content">Harassment or inappropriate content</option>
                    <option value="Other security concern">Other security concern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Additional Details
                  </label>
                  <textarea
                    rows={3}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Describe what looks suspicious or unsafe..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    disabled={isReporting}
                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReporting}
                    className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50"
                  >
                    {isReporting ? "Reporting…" : "Submit Report"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
