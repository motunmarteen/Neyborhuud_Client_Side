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
  if (!service.pricing.amount) return "Price on request";
  const symbol = service.pricing.currency === "NGN" ? "₦" : service.pricing.currency;
  const amount = `${symbol}${service.pricing.amount.toLocaleString()}`;
  if (service.pricing.type === "hourly") return `${amount}/hr`;
  if (service.pricing.type === "fixed") return amount;
  return amount;
}

export default function ServiceCard({ service, onFavorite, favoriting }: Props) {
  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl overflow-hidden">
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
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
            {service.category}
          </span>
          {service.isVerified && (
            <span className="flex items-center gap-1 text-xs text-green-400">
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
          className="text-base font-semibold text-white hover:text-blue-400 transition-colors line-clamp-1"
        >
          {service.title}
        </Link>

        {/* Provider */}
        <p className="text-sm text-gray-400 mt-0.5">
          by{" "}
          {service.provider?.username ? (
            <Link href={`/profile/${service.provider.username}`} className="hover:text-blue-400 transition-colors">
              {[service.provider.firstName, service.provider.lastName]
                .filter(Boolean)
                .join(" ") || service.provider.username}
            </Link>
          ) : (
            "Provider"
          )}
        </p>

        {/* Description */}
        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{service.description}</p>

        {/* Rating + completed jobs */}
        <div className="flex items-center gap-3 mt-3">
          <StarRating value={service.rating} size="sm" />
          <span className="text-xs text-gray-500">
            {service.rating.toFixed(1)} · {service.reviews} reviews · {service.completedJobs} jobs
          </span>
        </div>

        {/* Price + action */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-base font-bold text-green-400">{formatPrice(service)}</span>
          <div className="flex items-center gap-2">
            {onFavorite && (
              <button
                onClick={() => onFavorite(service.id, !!service.isFavorited)}
                disabled={favoriting}
                className="p-1.5 rounded-full hover:bg-gray-800 transition-colors"
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    service.isFavorited ? "text-red-400" : "text-gray-500"
                  }`}
                  style={{ fontVariationSettings: service.isFavorited ? "'FILL' 1" : "'FILL' 0" }}
                >
                  favorite
                </span>
              </button>
            )}
            <Link
              href={`/services/${service.id}`}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-semibold transition-colors"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
