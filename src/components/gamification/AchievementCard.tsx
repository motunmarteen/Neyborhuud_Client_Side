"use client";

import { Achievement } from "@/types/api";
import { useClaimAchievement } from "@/hooks/useGamification";

interface Props {
  achievement: Achievement;
}

export default function AchievementCard({ achievement }: Props) {
  const claim = useClaimAchievement();
  const pct = achievement.goal > 0
    ? Math.min(100, Math.round((achievement.progress / achievement.goal) * 100))
    : 0;
  const canClaim = achievement.completed && !(achievement as any).claimedAt;

  return (
    <div className="bg-brand-black border border-black/[0.08] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-[18px] ${
                achievement.completed ? "text-primary400" : "text-[var(--neu-text-secondary)]"
              }`}
              style={{ fontVariationSettings: achievement.completed ? "'FILL' 1" : "'FILL' 0" }}
            >
              {achievement.completed ? "emoji_events" : "radio_button_unchecked"}
            </span>
            <p className="text-sm font-semibold text-white truncate">{achievement.name}</p>
          </div>
          <p className="text-xs text-[var(--neu-text-muted)] mt-1 ml-6">{achievement.description}</p>
        </div>

        {/* Reward label */}
        <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 border border-primary/20 rounded-full px-2 py-0.5">
          +{achievement.reward?.points ?? 0} pts
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-[var(--neu-text-muted)] mb-1">
          <span>{achievement.progress} / {achievement.goal}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-brand-black rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              achievement.completed
                ? "bg-gradient-to-r from-yellow-500 to-green-400"
                : "bg-blue-600"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Claim button */}
      {canClaim && (
        <button
          onClick={() => claim.mutate(achievement.id)}
          disabled={claim.isPending}
          className="mt-3 w-full py-2 rounded-lg bg-primary hover:bg-primary400 text-black text-sm font-bold transition-colors disabled:opacity-50"
        >
          {claim.isPending ? "Claiming…" : "Claim Reward 🎉"}
        </button>
      )}

      {(achievement as any).claimedAt && (
        <p className="mt-2 text-center text-[11px] text-primary">✓ Reward claimed</p>
      )}
    </div>
  );
}
