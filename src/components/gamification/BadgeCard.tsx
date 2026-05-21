"use client";

import { Badge } from "@/types/api";

const RARITY_STYLES: Record<Badge["rarity"], { chip: string; glow: string; label: string }> = {
  common: {
    chip: "bg-brand-black text-[var(--neu-text-muted)]",
    glow: "",
    label: "Common",
  },
  uncommon: {
    chip: "bg-primary/20 text-primary border border-primary/30",
    glow: "",
    label: "Uncommon",
  },
  rare: {
    chip: "bg-brand-blue/20 text-brand-blue border border-brand-blue/30",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]",
    label: "Rare",
  },
  epic: {
    chip: "bg-brand-blue/20 text-brand-blue border border-purple-500/30",
    glow: "shadow-[0_0_14px_rgba(168,85,247,0.3)]",
    label: "Epic",
  },
  legendary: {
    chip: "bg-primary/20 text-primary400 border border-yellow-500/30",
    glow: "shadow-[0_0_18px_rgba(234,179,8,0.35)]",
    label: "Legendary",
  },
};

interface Props {
  badge: Badge;
  earned?: boolean;
}

export default function BadgeCard({ badge, earned = false }: Props) {
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common;

  return (
    <div
      className={`relative bg-brand-black border rounded-xl p-4 flex flex-col items-center text-center transition-all ${
        earned
          ? `border-black/[0.08] ${style.glow}`
          : "border-black/[0.08] opacity-50 grayscale"
      } ${badge.rarity === "legendary" && earned ? "animate-pulse-slow" : ""}`}
    >
      {/* Lock overlay if not earned */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
          <span className="material-symbols-outlined text-[var(--neu-text-muted)] text-[28px]">lock</span>
        </div>
      )}

      {/* Icon */}
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-brand-black text-3xl">
        {badge.icon?.startsWith("http") || badge.icon?.startsWith("/") ? (
          <img src={badge.icon} alt={badge.name} className="w-10 h-10 object-contain" />
        ) : (
          <span>{badge.icon || "🏅"}</span>
        )}
      </div>

      {/* Name */}
      <p className="text-sm font-bold text-white mb-1 leading-tight">{badge.name}</p>

      {/* Rarity chip */}
      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mb-2 ${style.chip}`}>
        {style.label}
      </span>

      {/* Description */}
      <p className="text-[11px] text-[var(--neu-text-muted)] leading-snug line-clamp-2">{badge.description}</p>

      {/* Earned date */}
      {earned && badge.earnedAt && (
        <p className="text-[10px] text-primary mt-2">
          Earned{" "}
          {new Date(badge.earnedAt).toLocaleDateString("en-NG", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      )}
    </div>
  );
}
