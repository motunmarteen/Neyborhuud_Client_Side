"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import StarRating from "@/components/services/StarRating";
import ReviewCard from "@/components/services/ReviewCard";
import BookModal from "@/components/services/BookModal";
import RateServiceModal from "@/components/services/RateServiceModal";
import { useService, useServiceReviews, useFavoriteService } from "@/hooks/useServices";
import { useAuth } from "@/hooks/useAuth";

export default function ServiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [showBook, setShowBook] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);

  const { data, isLoading, error } = useService(id);
  const reviews = useServiceReviews(id);
  const favoriteService = useFavoriteService();

  const service = (data as any)?.data ?? data;
  const reviewList = reviews.data?.pages.flatMap((page) => (page as any).data ?? []) ?? [];

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto bg-[#0f0f1e] animate-pulse">
            <div className="h-56 bg-gray-800" />
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
              <div className="h-7 bg-gray-800 rounded w-2/3" />
              <div className="h-4 bg-gray-800 rounded w-1/3" />
              <div className="h-32 bg-gray-800 rounded-xl" />
            </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar />
          <div className="flex-1 overflow-y-auto bg-[#0f0f1e] flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-400 mb-4">Service not found</p>
              <button
                onClick={() => router.back()}
                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
          <RightSidebar />
        </div>
        <BottomNav />
      </div>
    );
  }

  const isOwner = user?.id === service.providerId;
  const providerName = service.provider
    ? [service.provider.firstName, service.provider.lastName].filter(Boolean).join(" ") ||
      service.provider.username
    : "Provider";

  function formatPrice() {
    if (!service.pricing?.amount) return "Price on request";
    const symbol = service.pricing.currency === "NGN" ? "₦" : service.pricing.currency;
    const amount = `${symbol}${service.pricing.amount.toLocaleString()}`;
    if (service.pricing.type === "hourly") return `${amount}/hr`;
    return amount;
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Image gallery */}
          {service.images?.length > 0 && (
            <div className="relative">
              <div className="h-56 overflow-hidden">
                <img
                  src={service.images[imgIndex]}
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0f0f1e]/80" />
              </div>
              {service.images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {service.images.map((_: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setImgIndex(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === imgIndex ? "bg-white" : "bg-white/40"
                      }`}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 p-2 bg-black/50 rounded-full backdrop-blur-sm text-white"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            </div>
          )}

          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {/* Back (no cover) */}
            {(!service.images || service.images.length === 0) && (
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Services
              </button>
            )}

            {/* Main card */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      {service.category}
                    </span>
                    {service.isVerified && (
                      <span className="flex items-center gap-1 text-xs text-green-400">
                        <span
                          className="material-symbols-outlined text-[14px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          verified
                        </span>
                        Verified
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white">{service.title}</h1>
                </div>
                <button
                  onClick={() =>
                    favoriteService.mutate({
                      serviceId: service.id,
                      favorited: !!service.isFavorited,
                    })
                  }
                  disabled={favoriteService.isPending}
                  className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                >
                  <span
                    className={`material-symbols-outlined text-[22px] ${
                      service.isFavorited ? "text-red-400" : "text-gray-500"
                    }`}
                    style={{
                      fontVariationSettings: service.isFavorited ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    favorite
                  </span>
                </button>
              </div>

              <p className="text-gray-400 text-sm">
                by{" "}
                {service.provider?.username ? (
                  <Link
                    href={`/profile/${service.provider.username}`}
                    className="text-blue-400 hover:underline"
                  >
                    {providerName}
                  </Link>
                ) : (
                  providerName
                )}
              </p>

              {/* Rating row */}
              <div className="flex items-center gap-2 mt-3">
                <StarRating value={service.rating} size="md" />
                <span className="text-sm text-gray-400">
                  {(service.rating ?? 0).toFixed(1)} · {service.reviews ?? 0} reviews ·{" "}
                  {service.completedJobs ?? 0} jobs done
                </span>
              </div>

              {/* Meta */}
              <div className="grid sm:grid-cols-2 gap-4 mt-5 p-4 bg-gray-800/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-green-400 text-[18px] mt-0.5">payments</span>
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="text-sm text-white font-semibold">{formatPrice()}</p>
                  </div>
                </div>
                {service.availability && (
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-blue-400 text-[18px] mt-0.5">schedule</span>
                    <div>
                      <p className="text-xs text-gray-500">Availability</p>
                      <p className="text-sm text-white">{service.availability.hours}</p>
                      <p className="text-xs text-gray-400">
                        {service.availability.days?.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-gray-400 text-[18px] mt-0.5">location_on</span>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm text-white">
                      {[service.location?.lga, service.location?.state]
                        .filter(Boolean)
                        .join(", ") || "Nigeria"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {!isOwner && service.status === "active" && (
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => setShowBook(true)}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white transition-colors"
                  >
                    Book Now
                  </button>
                  <button
                    onClick={() => setShowRate(true)}
                    className="px-4 py-3 border border-gray-700 hover:border-gray-500 rounded-xl text-gray-300 transition-colors text-sm"
                  >
                    Rate
                  </button>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-3">About</h2>
              <p className="text-gray-300 whitespace-pre-line leading-relaxed text-sm">
                {service.description}
              </p>
            </div>

            {/* Reviews */}
            <div className="bg-[#1a1a2e] border border-gray-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-1">
                Reviews ({service.reviews ?? 0})
              </h2>
              {reviews.isLoading && (
                <div className="space-y-3 mt-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse flex gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-800 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-800 rounded w-1/3" />
                        <div className="h-3 bg-gray-800 rounded w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!reviews.isLoading && reviewList.length === 0 && (
                <p className="text-gray-500 text-sm mt-3">No reviews yet. Be the first!</p>
              )}
              {reviewList.map((rev: any) => (
                <ReviewCard key={rev.id} review={rev} />
              ))}
              {reviews.hasNextPage && (
                <button
                  onClick={() => reviews.fetchNextPage()}
                  disabled={reviews.isFetchingNextPage}
                  className="mt-3 text-sm text-blue-400 hover:underline disabled:opacity-50"
                >
                  {reviews.isFetchingNextPage ? "Loading…" : "Load more reviews"}
                </button>
              )}
            </div>
          </div>
        </div>
        <RightSidebar />
      </div>
      <BottomNav />

      {showBook && (
        <BookModal
          serviceId={service.id}
          serviceTitle={service.title}
          onClose={() => setShowBook(false)}
        />
      )}
      {showRate && (
        <RateServiceModal
          serviceId={service.id}
          serviceTitle={service.title}
          onClose={() => setShowRate(false)}
        />
      )}
    </div>
  );
}
