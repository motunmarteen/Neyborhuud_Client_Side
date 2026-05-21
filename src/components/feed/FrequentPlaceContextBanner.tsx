"use client";

import Link from "next/link";
import type { FeedPlaceContext } from "@/types/api";
import { kindMeta } from "@/lib/frequentPlaces";
import {
  formatPlaceContextLine,
  formatPlaceContextSubtitle,
} from "@/lib/frequentPlaceContext";

type Props = {
  context: FeedPlaceContext;
};

export function FrequentPlaceContextBanner({ context }: Props) {
  const icon = kindMeta(context.kind).icon;

  return (
    <div
      className="mod-card rounded-2xl px-4 py-3 border border-primary/15"
      data-testid="frequent-place-context-banner"
    >
      <div className="flex items-start gap-3">
        <div className="mod-inset rounded-xl size-10 shrink-0 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: "var(--neu-text)" }}>
            {formatPlaceContextLine(context)}
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--neu-text-muted)" }}>
            {formatPlaceContextSubtitle(context)}
          </p>
        </div>
        <Link
          href="/settings/places"
          className="shrink-0 text-[10px] font-semibold text-brand-blue underline"
        >
          Manage
        </Link>
      </div>
    </div>
  );
}
