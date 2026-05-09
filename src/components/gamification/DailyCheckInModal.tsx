"use client";

import { useState, useEffect } from "react";
import { useCheckIn, useMyStreak } from "@/hooks/useGamification";

const SESSION_KEY = "neyborhuud_checkin_shown";

type StreakData = {
  checkedInToday?: boolean;
  streak?: number;
};

export default function DailyCheckInModal() {
  const [open, setOpen] = useState(false);
  const [rewardData, setRewardData] = useState<{
    coins?: number;
    streak?: number;
  } | null>(null);

  const { data: streakData } = useMyStreak();
  const streak = streakData as StreakData | undefined;
  const hasStreakData = !!streak;
  const checkedInToday = streak?.checkedInToday;
  const streakCount = streak?.streak ?? 0;
  const checkIn = useCheckIn((data) => {
    setRewardData({
      coins: data?.coinsEarned ?? data?.coins ?? data?.reward?.coins ?? 10,
      streak: data?.streak ?? (streakData?.streak ?? 0) + 1,
    });
  });

  useEffect(() => {
    // Only show once per browser session
    if (typeof window === "undefined") return;
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (alreadyShown) return;

    // Show if user hasn't checked in today
    if (!hasStreakData || checkedInToday) return;

    const timer = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [checkedInToday, hasStreakData]);

  function handleClaim() {
    checkIn.mutate(undefined, {
      onSuccess: () => {
        sessionStorage.setItem(SESSION_KEY, "1");
      },
    });
  }

  function handleDismiss() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  const claimed = !!rewardData;
  const currentStreak = rewardData?.streak ?? streakCount;
  const coins = rewardData?.coins ?? 10;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm dark:bg-black/60">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/80 bg-white p-6 text-center shadow-[0_28px_80px_rgba(15,23,42,0.22)] dark:border-slate-700 dark:bg-[#1a1a2e] dark:shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-primary via-brand-amber to-brand-blue" aria-hidden />
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-white"
          aria-label="Close check-in"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Coin animation */}
        <div className="text-5xl mb-3 animate-bounce">
          {claimed ? "🎉" : "🪙"}
        </div>

        {claimed ? (
          <>
            <h2 className="mb-1 text-xl font-extrabold text-slate-950 dark:text-white">
              Day {currentStreak} Check-In!
            </h2>
            <p className="mb-2 text-2xl font-bold text-brand-amber">+{coins} HuudCoins</p>
            <div className="mb-5 flex items-center justify-center gap-2 text-lg font-semibold text-orange-500 dark:text-orange-400">
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
            <h2 className="mb-1 text-xl font-extrabold text-slate-950 dark:text-white">Daily Check-In</h2>
            <p className="mb-3 text-sm text-slate-600 dark:text-gray-400">
              You haven&apos;t checked in today yet!
            </p>
            <div className="mb-1 flex items-center justify-center gap-2 text-lg font-semibold text-orange-500 dark:text-orange-400">
              🔥 {streakCount}-day streak
            </div>
            <p className="mb-5 text-xs text-slate-500 dark:text-gray-500">
              Keep your streak alive and earn HuudCoins
            </p>
            <button
              onClick={handleClaim}
              disabled={checkIn.isPending}
              className="mb-2 w-full rounded-xl bg-orange-500 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-400 disabled:opacity-50"
            >
              {checkIn.isPending ? "Claiming…" : "Claim Daily Bonus 🔥"}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-xs text-slate-500 transition-colors hover:text-slate-900 dark:text-gray-500 dark:hover:text-gray-400"
            >
              Remind me later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
