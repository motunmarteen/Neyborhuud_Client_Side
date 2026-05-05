"use client";

import { Badge } from "@/types/api";

const RARITY_STYLES: Record<Badge["rarity"], { chip: string; glow: string; label: string }> = {
  common: {
    chip: "bg-gray-700 text-gray-300",
    glow: "",
    label: "Common",
  },
  uncommon: {
    chip: "bg-green-500/20 text-green-400 border border-green-500/30",
    glow: "",
    label: "Uncommon",
  },
  rare: {
    chip: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.25)]",
    label: "Rare",
  },
  epic: {
    chip: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    glow: "shadow-[0_0_14px_rgba(168,85,247,0.3)]",
    label: "Epic",
  },
  legendary: {
    chip: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
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
      className={`relative bg-[#1a1a2e] border rounded-xl p-4 flex flex-col items-center text-center transition-all ${
        earned
          ? `border-gray-700 ${style.glow}`
          : "border-gray-800 opacity-50 grayscale"
      } ${badge.rarity === "legendary" && earned ? "animate-pulse-slow" : ""}`}
    >
      {/* Lock overlay if not earned */}
      {!earned && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl z-10">
          <span className="material-symbols-outlined text-gray-500 text-[28px]">lock</span>
        </div>
      )}

      {/* Icon */}
      <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 bg-gray-800 text-3xl">
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
      <p className="text-[11px] text-gray-400 leading-snug line-clamp-2">{badge.description}</p>

      {/* Earned date */}
      {earned && badge.earnedAt && (
        <p className="text-[10px] text-green-400 mt-2">
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
