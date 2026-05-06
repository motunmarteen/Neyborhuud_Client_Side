"use client";

import Link from "next/link";
import { Service } from "@/types/api";
import StarRating from "./StarRating";

interface Props {
  service: Service;
  onFavorite?: (serviceId: string, favorited: boolean) => void;
  favoriting?: boolean;
}

function formatPrice(service: Service) {
  if (!service.pricing?.amount) return "Price on request";
  const symbol = service.pricing.currency === "NGN" ? "₦" : service.pricing.currency;
  const amount = `${symbol}${service.pricing.amount.toLocaleString()}`;
  if (service.pricing.type === "hourly") return `${amount}/hr`;
  if (service.pricing.type === "fixed") return amount;
  return amount;
}

export default function ServiceCard({ service, onFavorite, favoriting }: Props) {
  return (
    <div className="mod-card rounded-2xl overflow-hidden">
      {/* Image */}
      {service.images?.[0] && (
        <div className="h-36 overflow-hidden">
          <img
            src={service.images[0]}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-medium mod-inset"
            style={{ color: "var(--primary)" }}
          >
            {service.category}
          </span>
          {service.isVerified && (
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--primary)" }}>
              <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              Verified
            </span>
          )}
        </div>

        {/* Title */}
        <Link
          href={`/services/${service.id}`}
          className="text-base font-semibold line-clamp-1 hover:underline transition-colors"
          style={{ color: "var(--neu-text)" }}
        >
          {service.title}
        </Link>

        {/* Provider */}
        <p className="text-sm mt-0.5" style={{ color: "var(--neu-text-muted)" }}>
          by{" "}
          {service.provider?.username ? (
            <Link
              href={`/profile/${service.provider.username}`}
              className="hover:underline transition-colors"
              style={{ color: "var(--neu-text-muted)" }}
            >
              {[service.provider.firstName, service.provider.lastName]
                .filter(Boolean)
                .join(" ") || service.provider.username}
            </Link>
          ) : (
            "Provider"
          )}
        </p>

        {/* Description */}
        <p className="text-sm mt-2 line-clamp-2" style={{ color: "var(--neu-text-muted)" }}>
          {service.description}
        </p>

        {/* Rating + completed jobs */}
        <div className="flex items-center gap-3 mt-3">
          <StarRating value={service.rating} size="sm" />
          <span className="text-xs" style={{ color: "var(--neu-text-muted)" }}>
            {(service.rating ?? 0).toFixed(1)} · {service.reviews ?? 0} reviews · {service.completedJobs ?? 0} jobs
          </span>
        </div>

        {/* Price + action */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-base font-bold" style={{ color: "var(--primary)" }}>
            {formatPrice(service)}
          </span>
          <div className="flex items-center gap-2">
            {onFavorite && (
              <button
                onClick={() => onFavorite(service.id, !!service.isFavorited)}
                disabled={favoriting}
                className="p-1.5 rounded-full mod-btn transition-all"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{
                    color: service.isFavorited ? "var(--brand-red)" : "var(--neu-text-muted)",
                    fontVariationSettings: service.isFavorited ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  favorite
                </span>
              </button>
            )}
            <Link
              href={`/services/${service.id}`}
              className="px-4 py-1.5 mod-btn-active text-primary rounded-full text-sm font-semibold transition-all"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
