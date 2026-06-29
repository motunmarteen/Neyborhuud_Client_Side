"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCheckIn, useMyStreak } from "@/hooks/useGamification";
import { emitCoinsUpdated, localDayKey } from "@/lib/gamification-events";

const DISMISS_KEY = "neyborhuud_checkin_dismissed_day";

type StreakData = {
  checkedInToday?: boolean;
  streak?: number;
  effectiveStreak?: number;
  streakBroken?: boolean;
  nextMilestone?: number;
  nextMilestoneReward?: number;
};

export default function DailyCheckInModal() {
  const [open, setOpen] = useState(false);
  const [rewardData, setRewardData] = useState<{
    coins?: number;
    streak?: number;
    totalHuudCoins?: number;
  } | null>(null);

  const { data: streakData, isSuccess } = useMyStreak();
  const streak = streakData as StreakData | undefined;
  const checkedInToday = streak?.checkedInToday;
  const streakBroken = streak?.streakBroken;
  const streakCount = streak?.effectiveStreak ?? streak?.streak ?? 0;
  const nextMilestone = streak?.nextMilestone;
  const nextMilestoneReward = streak?.nextMilestoneReward ?? 0;

  const checkIn = useCheckIn((data) => {
    setRewardData({
      coins: data?.coinsEarned ?? data?.coins ?? 10,
      streak: data?.effectiveStreak ?? data?.streak ?? streakCount + 1,
      totalHuudCoins: data?.totalHuudCoins,
    });
    if (data?.coinsEarned) {
      emitCoinsUpdated({ totalHuudCoins: data?.totalHuudCoins });
      toast.success(`+${data.coinsEarned} HuudCoins added to your wallet`);
    }
  });

  useEffect(() => {
    if (typeof window === "undefined" || !isSuccess) return;

    const dismissedDay = sessionStorage.getItem(DISMISS_KEY) ?? localStorage.getItem(DISMISS_KEY);
    if (dismissedDay === localDayKey()) return;

    if (checkedInToday) return;

    const timer = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(timer);
  }, [checkedInToday, isSuccess]);

  function markDismissed() {
    const day = localDayKey();
    sessionStorage.setItem(DISMISS_KEY, day);
    localStorage.setItem(DISMISS_KEY, day);
  }

  function handleClaim() {
    checkIn.mutate(undefined, {
      onSuccess: () => markDismissed(),
    });
  }

  function handleDismiss() {
    markDismissed();
    setOpen(false);
  }

  if (!open) return null;

  const claimed = !!rewardData;
  const currentStreak = rewardData?.streak ?? (streakBroken ? 0 : streakCount);
  const coins = rewardData?.coins ?? 10 + nextMilestoneReward;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(15, 23, 42, 0.35)" }}
    >
      <div
        className="mod-modal relative w-full max-w-sm overflow-hidden rounded-2xl p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
        style={{
          background: "var(--neu-bg, #ffffff)",
          color: "var(--neu-text, #1A1A1A)",
          border: "1px solid var(--neu-border, rgba(0,0,0,0.08))",
        }}
      >
        <div
          className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-status-warning to-brand-blue"
          aria-hidden
        />

        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 transition-colors hover:bg-brand-surface"
          style={{ color: "var(--neu-text-muted)" }}
          aria-label="Close check-in"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <div className="mb-3 text-5xl animate-bounce">{claimed ? "🎉" : "🪙"}</div>

        {claimed ? (
          <>
            <h2 className="mb-1 text-xl font-extrabold" style={{ color: "var(--neu-text)" }}>
              Day {currentStreak} Check-In!
            </h2>
            <p className="mb-1 text-2xl font-bold text-status-warning">+{coins} HuudCoins</p>
            {rewardData?.totalHuudCoins != null && (
              <p className="mb-2 text-xs" style={{ color: "var(--neu-text-muted)" }}>
                Wallet balance: {rewardData.totalHuudCoins.toLocaleString()} coins
              </p>
            )}
            <div className="mb-5 flex items-center justify-center gap-2 text-lg font-semibold text-brand-red">
              🔥 {currentStreak}-day streak!
            </div>
            <button
              onClick={handleDismiss}
              className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
            >
              Awesome! 🎊
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-xl font-extrabold" style={{ color: "var(--neu-text)" }}>
              Daily Check-In
            </h2>
            <p className="mb-3 text-sm" style={{ color: "var(--neu-text-secondary)" }}>
              {streakBroken
                ? "Your streak reset — check in today to start fresh at day 1!"
                : "You haven't checked in today yet!"}
            </p>
            <div className="mb-1 flex items-center justify-center gap-2 text-lg font-semibold text-brand-red">
              🔥 {streakBroken ? 0 : streakCount}-day streak
            </div>
            <p className="mb-5 text-xs" style={{ color: "var(--neu-text-muted)" }}>
              {nextMilestone && nextMilestoneReward > 0
                ? `Day ${nextMilestone} milestone: +${nextMilestoneReward} bonus HuudCoins`
                : "Keep your streak alive and earn HuudCoins"}
            </p>
            <button
              onClick={handleClaim}
              disabled={checkIn.isPending}
              className="mb-2 w-full rounded-xl bg-brand-red py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red disabled:opacity-50"
            >
              {checkIn.isPending ? "Claiming…" : "Claim Daily Bonus 🔥"}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-xs transition-colors hover:opacity-80"
              style={{ color: "var(--neu-text-muted)" }}
            >
              Remind me later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
