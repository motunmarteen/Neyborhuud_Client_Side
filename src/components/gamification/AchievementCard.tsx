"use client";

import { Achievement } from "@/types/api";
import { useClaimAchievement } from "@/hooks/useGamification";

interface Props {
  achievement: Achievement;
}

export default function AchievementCard({ achievement }: Props) {
  const claim = useClaimAchievement();
  const pct =
    achievement.goal > 0
      ? Math.min(100, Math.round((achievement.progress / achievement.goal) * 100))
      : 0;
  const canClaim = achievement.completed && !(achievement as { claimedAt?: string }).claimedAt;

  return (
    <div className="mod-card rounded-xl p-4">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-[18px] ${
                achievement.completed ? "text-primary" : "text-[var(--neu-text-secondary)]"
              }`}
              style={{ fontVariationSettings: achievement.completed ? "'FILL' 1" : "'FILL' 0" }}
            >
              {achievement.completed ? "emoji_events" : "radio_button_unchecked"}
            </span>
            <p className="truncate text-sm font-semibold" style={{ color: "var(--neu-text)" }}>
              {achievement.name}
            </p>
          </div>
          <p className="ml-6 mt-1 text-xs text-[var(--neu-text-muted)]">{achievement.description}</p>
        </div>

        <span className="mod-chip mod-chip-active shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-primary">
          +{achievement.reward?.points ?? 0} pts
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-[10px] text-[var(--neu-text-muted)]">
          <span>
            {achievement.progress} / {achievement.goal}
          </span>
          <span>{pct}%</span>
        </div>
        <div className="mod-inset h-2 overflow-hidden rounded-full">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              achievement.completed
                ? "bg-gradient-to-r from-primary to-[#006F35]"
                : "bg-brand-blue"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {canClaim && (
        <button
          type="button"
          onClick={() => claim.mutate(achievement.id)}
          disabled={claim.isPending}
          className="mod-chip mod-chip-active mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-primary transition-colors disabled:opacity-50"
        >
          {claim.isPending ? "Claiming…" : "Claim Reward 🎉"}
        </button>
      )}

      {(achievement as { claimedAt?: string }).claimedAt && (
        <p className="mt-2 text-center text-[11px] text-primary">✓ Reward claimed</p>
      )}
    </div>
  );
}
