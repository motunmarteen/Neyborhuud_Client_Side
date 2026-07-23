"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Service } from "@/types/api";
import StarRating from "./StarRating";
import { fromKobo } from "@/lib/currency";

interface Props {
  service: Service;
  onFavorite?: (serviceId: string, favorited: boolean) => void;
  favoriting?: boolean;
}

function formatPrice(service: Service) {
  if (!service.pricing?.amount) return "Price on request";
  const symbol = service.pricing.currency === "NGN" ? "₦" : service.pricing.currency;
  // pricing.amount from the API is integer kobo.
  const amount = `${symbol}${fromKobo(service.pricing.amount).toLocaleString()}`;
  if (service.pricing.type === "hourly") return `${amount}/hr`;
  if (service.pricing.type === "fixed") return amount;
  return amount;
}

export default function ServiceCard({ service, onFavorite, favoriting }: Props) {
  const [imgErr, setImgErr] = useState(false);
  const hasImage = service.images?.[0] && !imgErr;
  const providerName = service.provider?.username
    ? [service.provider.firstName, service.provider.lastName].filter(Boolean).join(" ") || service.provider.username
    : "Provider";

  return (
    <div className="group/card relative overflow-hidden rounded-2xl transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]">
      {/* Full-bleed image area */}
      <div className="relative w-full aspect-[4/5] overflow-hidden rounded-2xl">
        {hasImage ? (
          <Image
            src={service.images![0]}
            alt={service.title}
            fill
            sizes="(max-width: 640px) 50vw, 320px"
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover/card:scale-[1.05]"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "linear-gradient(135deg, #0e2a18 0%, #1a4a2a 100%)" }}
          >
            <span className="material-symbols-outlined text-5xl text-white/15">handyman</span>
          </div>
        )}

        {/* Dark gradient overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/30" />

        {/* Top badges */}
        <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
          {service.category && (
            <span className="rounded-full bg-primary/25 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-100 backdrop-blur-sm border border-primary/20">
              {service.category}
            </span>
          )}
          {service.isVerified && (
            <span className="flex items-center gap-0.5 rounded-full bg-primary/80 px-2 py-0.5 text-[8px] font-black text-white backdrop-blur-sm">
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              Verified
            </span>
          )}
          {(service as any).isBoosted && (
            <span className="flex items-center gap-0.5 rounded-full bg-primary/90 px-2 py-0.5 text-[8px] font-black text-slate-900">
              🚀 Boosted
            </span>
          )}
        </div>

        {/* Favorite button — top right */}
        {onFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onFavorite(service.id, !!service.isFavorited); }}
            disabled={favoriting}
            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/15 transition-all hover:scale-110 active:scale-90"
            aria-label="Favorite"
          >
            <span
              className="material-symbols-outlined text-[17px]"
              style={{
                color: service.isFavorited ? "#ff4757" : "white",
                fontVariationSettings: service.isFavorited ? "'FILL' 1" : "'FILL' 0",
                filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))",
              }}
            >
              favorite
            </span>
          </button>
        )}

        {/* Price badge — bottom right */}
        <div className="absolute bottom-2 right-2 z-10">
          <span className="rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-black text-black shadow-lg">
            {formatPrice(service)}
          </span>
        </div>

        {/* Bottom overlaid content — Stake-style */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-3 pr-[90px] space-y-0.5">
          <Link
            href={`/services/${service.id}`}
            className="block text-[13px] font-extrabold text-white leading-tight line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] hover:underline"
          >
            {service.title}
          </Link>
          <p className="text-[10px] font-semibold text-white/60 uppercase tracking-wide truncate">
            by {providerName}
          </p>

          {/* Stat row */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex items-center gap-1">
              <span className="inline-block w-[5px] h-[5px] rounded-full bg-primary" />
              <span className="text-[10px] font-medium text-white/55">
                {(service.rating ?? 0).toFixed(1)} ★ · {service.reviews ?? 0} reviews
              </span>
            </div>
            {typeof service.completedJobs === "number" && service.completedJobs > 0 && (
              <span className="text-[10px] text-white/40">
                {service.completedJobs} jobs
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View button bar below card */}
      <div className="pt-2 px-1">
        <Link
          href={`/services/${service.id}`}
          className="block w-full py-2 rounded-xl bg-primary/10 border border-primary/15 text-center text-[11px] font-bold text-primary transition-all hover:bg-primary/20"
        >
          View Service
        </Link>
      </div>
    </div>
  );
}
