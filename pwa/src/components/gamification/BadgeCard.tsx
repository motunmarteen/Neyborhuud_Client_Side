"use client";

import { Badge } from "@/types/api";
import { BadgeIcon } from "@/components/gamification/BadgeIcon";

const RARITY_LABEL: Record<Badge["rarity"], string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const RARITY_CHIP: Record<Badge["rarity"], string> = {
  common: "mod-chip text-[var(--neu-text-muted)]",
  uncommon: "mod-chip mod-chip-active text-primary",
  rare: "mod-chip text-brand-blue",
  epic: "mod-chip text-purple-700",
  legendary: "mod-chip text-amber-800",
};

interface Props {
  badge: Badge;
  earned?: boolean;
}

export default function BadgeCard({ badge, earned = false }: Props) {
  const rarity = badge.rarity ?? "common";

  return (
    <div
      className={`flex items-center gap-3 px-3 py-3 transition-colors ${
        earned ? "hover:bg-black/[0.02]" : "opacity-60"
      }`}
    >
      <BadgeIcon icon={badge.icon} earned={earned} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="truncate text-sm font-semibold" style={{ color: "var(--neu-text)" }}>
            {badge.name}
          </p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${RARITY_CHIP[rarity]}`}>
            {RARITY_LABEL[rarity]}
          </span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-[var(--neu-text-muted)]">
          {badge.description}
        </p>
        {earned && badge.earnedAt ? (
          <p className="mt-1 text-[11px] font-medium text-primary">
            Earned{" "}
            {new Date(badge.earnedAt).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        ) : null}
      </div>

      {!earned ? (
        <span className="material-symbols-outlined shrink-0 text-[20px] text-[var(--neu-text-muted)]" aria-hidden>
          lock
        </span>
      ) : (
        <span
          className="material-symbols-outlined shrink-0 text-[20px] text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
          aria-hidden
        >
          check_circle
        </span>
      )}
    </div>
  );
}
