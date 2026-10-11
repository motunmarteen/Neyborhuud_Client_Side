"use client";

import { Service } from "@/types/api";
import { fromKobo } from "@/lib/currency";
import { BrowseTile } from "@/components/feed/BrowseTile";
import { Chip } from "@/components/ui/Chip";

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
  const serviceId = service.id ?? (service as any)._id;
  const providerName = service.provider?.username
    ? [service.provider.firstName, service.provider.lastName].filter(Boolean).join(" ") || service.provider.username
    : "Provider";
  const reviews = service.reviews ?? 0;
  const meta = [
    reviews > 0 ? `★ ${(service.rating ?? 0).toFixed(1)} · ${reviews} review${reviews === 1 ? "" : "s"}` : "No reviews yet",
    typeof service.completedJobs === "number" && service.completedJobs > 0 ? `${service.completedJobs} jobs done` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <BrowseTile
      href={`/services/${serviceId}`}
      kind="services"
      title={service.title}
      images={service.images ?? []}
      highlight={
        service.pricing?.amount ? (
          <span className="text-brand-green-dark">{formatPrice(service)}</span>
        ) : (
          <span className="font-body text-xs font-bold text-muted">Price on request</span>
        )
      }
      byline={`by ${providerName}`}
      chips={
        <>
          {service.isVerified ? <Chip tone="green" icon="✓">Verified</Chip> : null}
          {(service as any).isBoosted ? <Chip tone="amber" icon="🚀">Boosted</Chip> : null}
          {service.category ? <Chip>{service.category}</Chip> : null}
        </>
      }
      meta={meta}
      action={
        onFavorite
          ? {
              icon: "heart",
              label: service.isFavorited ? "Remove from favourites" : "Add to favourites",
              on: !!service.isFavorited,
              disabled: favoriting,
              onPress: () => onFavorite(serviceId, !!service.isFavorited),
            }
          : undefined
      }
    />
  );
}
