"use client";

import { Badge } from "@/types/api";

const RARITY_STYLES: Record<Badge["rarity"], { chip: string; glow: string; label: string }> = {
  common: {
    chip: "bg-slate-100 text-slate-600",
    glow: "",
    label: "Common",
  },
  uncommon: {
    chip: "bg-primary/15 text-[#006F35] border border-primary/25",
    glow: "",
    label: "Uncommon",
  },
  rare: {
    chip: "bg-brand-blue/10 text-brand-blue border border-brand-blue/25",
    glow: "shadow-[0_0_12px_rgba(0,0,255,0.12)]",
    label: "Rare",
  },
  epic: {
    chip: "bg-purple-50 text-purple-700 border border-purple-200",
    glow: "shadow-[0_0_14px_rgba(168,85,247,0.2)]",
    label: "Epic",
  },
  legendary: {
    chip: "bg-amber-50 text-amber-800 border border-amber-200",
    glow: "shadow-[0_0_18px_rgba(234,179,8,0.25)]",
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
      className={`relative rounded-xl border bg-white p-4 flex flex-col items-center text-center transition-all shadow-sm ${
        earned
          ? `border-gray-100 ${style.glow}`
          : "border-gray-100 opacity-50 grayscale"
      } ${badge.rarity === "legendary" && earned ? "animate-pulse-slow" : ""}`}
    >
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10 bg-white/60">
          <span className="material-symbols-outlined text-[var(--neu-text-muted)] text-[28px]">lock</span>
        </div>
      )}

      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-brand-surface text-3xl">
        {badge.icon?.startsWith("http") || badge.icon?.startsWith("/") ? (
          <img src={badge.icon} alt={badge.name} className="w-10 h-10 object-contain" />
        ) : (
          <span>{badge.icon || "🏅"}</span>
        )}
      </div>

      <p className="text-sm font-bold text-slate-900 mb-1 leading-tight">{badge.name}</p>

      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold mb-2 ${style.chip}`}>
        {style.label}
      </span>

      <p className="text-[11px] text-[var(--neu-text-muted)] leading-snug line-clamp-2">{badge.description}</p>

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
