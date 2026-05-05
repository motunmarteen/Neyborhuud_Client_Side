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
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`material-symbols-outlined text-[18px] ${
                achievement.completed ? "text-yellow-400" : "text-gray-600"
              }`}
              style={{ fontVariationSettings: achievement.completed ? "'FILL' 1" : "'FILL' 0" }}
            >
              {achievement.completed ? "emoji_events" : "radio_button_unchecked"}
            </span>
            <p className="text-sm font-semibold text-white truncate">{achievement.name}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 ml-6">{achievement.description}</p>
        </div>

        {/* Reward label */}
        <span className="shrink-0 text-xs font-bold text-green-400 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
          +{achievement.reward?.points ?? 0} pts
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>{achievement.progress} / {achievement.goal}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
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
          className="mt-3 w-full py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-bold transition-colors disabled:opacity-50"
        >
          {claim.isPending ? "Claiming…" : "Claim Reward 🎉"}
        </button>
      )}

      {(achievement as any).claimedAt && (
        <p className="mt-2 text-center text-[11px] text-green-400">✓ Reward claimed</p>
      )}
    </div>
  );
}
