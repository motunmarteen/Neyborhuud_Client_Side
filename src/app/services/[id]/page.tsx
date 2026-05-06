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

const DAY_FULL: Record<string, string> = {
  Mon: "Mon", Tue: "Tue", Wed: "Wed", Thu: "Thu",
  Fri: "Fri", Sat: "Sat", Sun: "Sun",
};

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
  const reviewList = reviews.data?.pages.flatMap((page) => {
    const inner = (page as any)?.data;
    return Array.isArray(inner) ? inner : (inner?.data ?? []);
  }) ?? [];

  if (isLoading) {
    return (
      <div className="relative flex h-screen w-full overflow-hidden neu-base">
        <LeftSidebar />
        <main className="flex flex-col flex-1 overflow-y-auto">
          <TopNav />
          <div className="animate-pulse px-4 pt-5 pb-20 max-w-3xl mx-auto w-full space-y-4">
            <div className="h-56 mod-card rounded-2xl" style={{ background: "var(--neu-shadow-dark)" }} />
            <div className="mod-card rounded-2xl p-5 space-y-3">
              <div className="h-6 rounded w-2/3" style={{ background: "var(--neu-shadow-dark)" }} />
              <div className="h-4 rounded w-1/3" style={{ background: "var(--neu-shadow-dark)" }} />
              <div className="h-24 rounded" style={{ background: "var(--neu-shadow-dark)" }} />
            </div>
          </div>
        </main>
        <RightSidebar />
        <BottomNav />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="relative flex h-screen w-full overflow-hidden neu-base">
        <LeftSidebar />
        <main className="flex flex-col flex-1 overflow-y-auto">
          <TopNav />
          <div className="text-center py-20 px-4">
            <span className="material-symbols-outlined text-6xl mb-4" style={{ color: "var(--neu-text-muted)" }}>error</span>
            <p className="font-semibold mb-4" style={{ color: "var(--neu-text)" }}>Service not found</p>
            <button onClick={() => router.back()} className="px-6 py-3 mod-btn rounded-xl font-semibold" style={{ color: "var(--neu-text)" }}>
              Go Back
            </button>
          </div>
        </main>
        <RightSidebar />
        <BottomNav />
      </div>
    );
  }

  const isOwner = user?.id === service.providerId || user?.id === service.userId;
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
    <>
      <div className="relative flex h-screen w-full overflow-hidden neu-base">
        <LeftSidebar />
        <main className="flex flex-col flex-1 overflow-y-auto">
          <TopNav />
          <div className="flex flex-col pb-24">
            {/* Back nav */}
            <div className="px-4 pt-4 flex items-center gap-2">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full mod-btn transition-all"
                style={{ color: "var(--neu-text-muted)" }}
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <span className="text-sm font-medium" style={{ color: "var(--neu-text-muted)" }}>Services</span>
            </div>

            <div className="px-4 pt-3 max-w-3xl mx-auto w-full space-y-4">
              {/* Image gallery */}
              {service.images?.length > 0 && (
                <div className="mod-card rounded-2xl overflow-hidden">
                  <div className="relative h-56 sm:h-72">
                    <img
                      src={service.images[imgIndex]}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                    {/* Favorite button overlay */}
                    <button
                      onClick={() => favoriteService.mutate({ serviceId: service.id, favorited: !!service.isFavorited })}
                      disabled={favoriteService.isPending}
                      className="absolute top-3 right-3 p-2 rounded-full transition-all"
                      style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                      <span
                        className="material-symbols-outlined text-[22px]"
                        style={{
                          color: service.isFavorited ? "var(--brand-red)" : "white",
                          fontVariationSettings: service.isFavorited ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        favorite
                      </span>
                    </button>
                    {/* Verified badge */}
                    {service.isVerified && (
                      <div
                        className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(0,0,0,0.6)", color: "var(--primary)" }}
                      >
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        Verified
                      </div>
                    )}
                  </div>
                  {/* Thumbnail strip */}
                  {service.images.length > 1 && (
                    <div className="flex gap-2 p-3 overflow-x-auto scrollbar-none">
                      {service.images.map((_: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setImgIndex(i)}
                          className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all ${
                            i === imgIndex ? "ring-2 ring-[color:var(--primary)]" : "opacity-50"
                          }`}
                        >
                          <img src={service.images[i]} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* No image: back + title area */}
              {(!service.images || service.images.length === 0) && null}

              {/* Main info */}
              <div className="mod-card rounded-2xl p-5 space-y-4">
                {/* Category badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2.5 py-0.5 rounded-full mod-inset font-medium capitalize" style={{ color: "var(--primary)" }}>
                    {service.category}
                  </span>
                  {service.subcategory && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full mod-inset" style={{ color: "var(--neu-text-muted)" }}>
                      {service.subcategory}
                    </span>
                  )}
                  {service.isVerified && !service.images?.length && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--primary)" }}>
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      Verified
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold" style={{ color: "var(--neu-text)" }}>{service.title}</h1>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <StarRating value={service.rating ?? 0} size="md" />
                  <span className="text-sm" style={{ color: "var(--neu-text-muted)" }}>
                    {(service.rating ?? 0).toFixed(1)} · {service.reviews ?? 0} reviews · {service.completedJobs ?? 0} jobs
                  </span>
                </div>

                {/* Price + availability grid */}
                <div className="grid sm:grid-cols-2 gap-3 mod-inset rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] mt-0.5" style={{ color: "var(--primary)" }}>payments</span>
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--neu-text-muted)" }}>Price</p>
                      <p className="text-sm font-bold" style={{ color: "var(--primary)" }}>{formatPrice()}</p>
                    </div>
                  </div>
                  {service.availability && (
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] mt-0.5" style={{ color: "var(--neu-text-muted)" }}>schedule</span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--neu-text-muted)" }}>Hours</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--neu-text)" }}>{service.availability.hours}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--neu-text-muted)" }}>
                          {service.availability.days?.map((d: string) => DAY_FULL[d] ?? d).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                  {service.location?.lga && (
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[18px] mt-0.5" style={{ color: "var(--neu-text-muted)" }}>location_on</span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: "var(--neu-text-muted)" }}>Location</p>
                        <p className="text-sm font-semibold" style={{ color: "var(--neu-text)" }}>
                          {[service.location.lga, service.location.state].filter(Boolean).join(", ")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* About */}
                <div>
                  <p className="text-sm font-bold mb-1.5" style={{ color: "var(--neu-text)" }}>About this service</p>
                  <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--neu-text-muted)" }}>
                    {service.description}
                  </p>
                </div>

                {/* CTAs */}
                {!isOwner && service.status === "active" && (
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setShowBook(true)}
                      className="flex-1 py-3.5 mod-btn-active text-primary rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[20px]">calendar_add_on</span>
                      Book Service
                    </button>
                    <button
                      onClick={() => setShowRate(true)}
                      className="py-3.5 px-5 mod-btn rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                      style={{ color: "var(--neu-text)" }}
                    >
                      <span className="material-symbols-outlined text-[20px]">star</span>
                      Rate
                    </button>
                  </div>
                )}
              </div>

              {/* Provider card */}
              <div className="mod-card rounded-2xl p-5">
                <p className="text-sm font-bold mb-3" style={{ color: "var(--neu-text)" }}>Service Provider</p>
                <div className="flex items-center gap-3">
                  {service.provider?.profilePicture ? (
                    <img src={service.provider.profilePicture} alt={providerName} className="w-12 h-12 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-full mod-inset flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]" style={{ color: "var(--neu-text-muted)" }}>person</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/profile/${service.provider?.username}`}
                      className="text-base font-bold hover:underline"
                      style={{ color: "var(--neu-text)" }}
                    >
                      {providerName}
                    </Link>
                    {service.provider?.username && (
                      <p className="text-xs" style={{ color: "var(--neu-text-muted)" }}>@{service.provider.username}</p>
                    )}
                  </div>
                  <Link
                    href={`/profile/${service.provider?.username}`}
                    className="px-3 py-1.5 mod-btn rounded-xl text-xs font-semibold transition-all"
                    style={{ color: "var(--neu-text-muted)" }}
                  >
                    View Profile
                  </Link>
                </div>
              </div>

              {/* Reviews section */}
              <div className="mod-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold" style={{ color: "var(--neu-text)" }}>
                    Reviews <span className="font-normal text-sm" style={{ color: "var(--neu-text-muted)" }}>({service.reviews ?? 0})</span>
                  </h2>
                  {!isOwner && (
                    <button onClick={() => setShowRate(true)} className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                      Write a review
                    </button>
                  )}
                </div>

                {reviews.isLoading && (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full mod-inset shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 rounded w-1/3" style={{ background: "var(--neu-shadow-dark)" }} />
                          <div className="h-3 rounded w-2/3" style={{ background: "var(--neu-shadow-dark)" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!reviews.isLoading && reviewList.length === 0 && (
                  <p className="text-sm text-center py-4" style={{ color: "var(--neu-text-muted)" }}>
                    No reviews yet. Be the first!
                  </p>
                )}

                {reviewList.map((rev: any) => (
                  <ReviewCard key={rev.id ?? rev._id} review={rev} />
                ))}

                {reviews.hasNextPage && (
                  <button
                    onClick={() => reviews.fetchNextPage()}
                    disabled={reviews.isFetchingNextPage}
                    className="mt-3 w-full py-2.5 mod-btn rounded-xl text-sm font-semibold disabled:opacity-50"
                    style={{ color: "var(--neu-text-muted)" }}
                  >
                    {reviews.isFetchingNextPage ? "Loading…" : "Load more reviews"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
        <RightSidebar />
        <BottomNav />
      </div>

      {showBook && (
        <BookModal serviceId={service.id} serviceTitle={service.title} onClose={() => setShowBook(false)} />
      )}
      {showRate && (
        <RateServiceModal serviceId={service.id} serviceTitle={service.title} onClose={() => setShowRate(false)} />
      )}
    </>
  );
}
