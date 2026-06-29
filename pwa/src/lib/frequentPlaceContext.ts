import type { FeedPlaceContext } from "@/types/api";
import { kindMeta } from "@/lib/frequentPlaces";

/** Human-readable feed context line, e.g. "Near Work · Idimu" */
export function formatPlaceContextLine(ctx: FeedPlaceContext): string {
  const kind = ctx.kindLabel || kindMeta(ctx.kind).label;
  const area =
    ctx.neighborhood ||
    ctx.lga ||
    ctx.formattedAddress?.split(",")[0]?.trim() ||
    "your area";
  return `Near ${kind} · ${area}`;
}

export function formatPlaceContextSubtitle(ctx: FeedPlaceContext): string {
  const label = ctx.label !== ctx.kindLabel ? ctx.label : null;
  const parts = [label, ctx.lga, ctx.state].filter(Boolean);
  return parts.length > 0
    ? `Showing local updates around ${parts.join(" · ")}`
    : "Feed prioritized for this saved place";
}
