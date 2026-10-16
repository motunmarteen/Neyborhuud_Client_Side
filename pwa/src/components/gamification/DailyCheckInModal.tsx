"use client";

import { useState, useEffect } from "react";
import { useCheckIn, useMyStreak } from "@/hooks/useGamification";
import { localDayKey } from "@/lib/gamification-events";

const DISMISS_KEY = "neyborhuud_checkin_dismissed_day";

type StreakData = {
  checkedInToday?: boolean;
  streak?: number;
  effectiveStreak?: number;
  streakBroken?: boolean;
  nextMilestone?: number;
  nextMilestoneReward?: number;
  /** What checking in right now pays (base + any bonus due today). */
  todayCoins?: number;
};

export default function DailyCheckInModal() {
  const [open, setOpen] = useState(false);
  const [rewardData, setRewardData] = useState<{
    coins: number;
    bonus: number;
    streak?: number;
    totalHuudCoins?: number;
    nextMilestone?: number;
    nextMilestoneReward?: number;
  } | null>(null);

  const { data: streakData, isSuccess } = useMyStreak();
  const streak = streakData as StreakData | undefined;
  const checkedInToday = streak?.checkedInToday;
  const streakBroken = streak?.streakBroken;
  const streakCount = streak?.effectiveStreak ?? streak?.streak ?? 0;
  const nextMilestone = streak?.nextMilestone;
  const nextMilestoneReward = streak?.nextMilestoneReward ?? 0;
  const todayCoins = streak?.todayCoins;

  // This pop-up is the celebration, so no extra toast.
  const checkIn = useCheckIn((data) => {
    if (data?.alreadyCheckedIn) {
      // Checked in on another screen or phone: nothing to claim here.
      setOpen(false);
      return;
    }
    setRewardData({
      coins: data?.coinsEarned ?? 0,
      bonus: data?.bonusCoins ?? 0,
      streak: data?.effectiveStreak ?? data?.streak ?? streakCount + 1,
      totalHuudCoins: data?.totalHuudCoins,
      nextMilestone: data?.nextMilestone,
      nextMilestoneReward: data?.nextMilestoneReward,
    });
  }, { showToast: false });

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
  const coins = rewardData?.coins ?? 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm"
      style={{ background: "rgba(15, 23, 42, 0.35)" }}
    >
      <div
        className="mod-modal relative w-full max-w-sm overflow-hidden rounded-2xl p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
        style={{
          background: "var(--neu-bg, #ffffff)",
          color: "var(--neu-text, #1D2433)",
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
              🔥 Day {currentStreak} done!
            </h2>
            <p className="mb-1 text-2xl font-bold text-status-warning">+{coins.toLocaleString()} HuudCredit</p>
            {rewardData && rewardData.bonus > 0 ? (
              <p className="mb-1 text-xs font-semibold text-brand-red">
                Includes +{rewardData.bonus} streak bonus
              </p>
            ) : null}
            {rewardData?.totalHuudCoins != null && (
              <p className="mb-2 text-xs" style={{ color: "var(--neu-text-muted)" }}>
                You now have {rewardData.totalHuudCoins.toLocaleString()} HuudCredit
              </p>
            )}
            {rewardData?.nextMilestone && rewardData.nextMilestoneReward ? (
              <p className="mb-5 text-xs" style={{ color: "var(--neu-text-muted)" }}>
                Check in every day: day {rewardData.nextMilestone} pays +{rewardData.nextMilestoneReward} extra.
              </p>
            ) : (
              <div className="mb-5" />
            )}
            <button
              onClick={handleDismiss}
              className="w-full rounded-full bg-primary py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 min-h-12"
            >
              See you tomorrow
            </button>
          </>
        ) : (
          <>
            <h2 className="mb-1 text-xl font-extrabold" style={{ color: "var(--neu-text)" }}>
              Daily Check-In
            </h2>
            <p className="mb-3 text-sm" style={{ color: "var(--neu-text-secondary)" }}>
              {streakBroken
                ? "You missed a day, so your streak starts again at day 1."
                : streakCount > 0
                  ? `Check in to make it day ${streakCount + 1}.`
                  : "Check in every day to build a streak."}
            </p>
            <div className="mb-1 flex items-center justify-center gap-2 text-lg font-semibold text-brand-red">
              🔥 {streakBroken ? 0 : streakCount}-day streak
            </div>
            <p className="mb-5 text-xs" style={{ color: "var(--neu-text-muted)" }}>
              {todayCoins ? `Check in now: +${todayCoins} HuudCredit. ` : ""}
              {nextMilestone && nextMilestoneReward > 0
                ? `Day ${nextMilestone} pays +${nextMilestoneReward} extra.`
                : ""}
            </p>
            <button
              onClick={handleClaim}
              disabled={checkIn.isPending}
              className="mb-2 w-full rounded-full bg-brand-red py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red disabled:opacity-50 min-h-12"
            >
              {checkIn.isPending ? "Checking in…" : todayCoins ? `Check in · +${todayCoins} 🪙` : "Check in 🔥"}
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
