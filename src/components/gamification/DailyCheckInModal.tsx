"use client";

import { useState, useEffect } from "react";
import { useCheckIn, useMyStreak } from "@/hooks/useGamification";

const SESSION_KEY = "neyborhuud_checkin_shown";

export default function DailyCheckInModal() {
  const [open, setOpen] = useState(false);
  const [rewardData, setRewardData] = useState<{
    coins?: number;
    streak?: number;
  } | null>(null);

  const { data: streakData } = useMyStreak();
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
    if (streakData && !(streakData as any).checkedInToday) {
      setOpen(true);
    }
  }, [streakData]);

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
  const currentStreak = rewardData?.streak ?? (streakData?.streak ?? 0);
  const coins = rewardData?.coins ?? 10;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-[#1a1a2e] border border-gray-700 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        {/* Coin animation */}
        <div className="text-5xl mb-3 animate-bounce">
          {claimed ? "🎉" : "🪙"}
        </div>

        {claimed ? (
          <>
            <h2 className="text-xl font-extrabold text-white mb-1">
              Day {currentStreak} Check-In!
            </h2>
            <p className="text-yellow-400 text-2xl font-bold mb-2">+{coins} HuudCoins</p>
            <div className="flex items-center justify-center gap-2 text-orange-400 text-lg font-semibold mb-5">
              🔥 {currentStreak}-day streak!
            </div>
            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-bold text-sm transition-colors"
            >
              Awesome! 🎊
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-extrabold text-white mb-1">Daily Check-In</h2>
            <p className="text-gray-400 text-sm mb-3">
              You haven&apos;t checked in today yet!
            </p>
            <div className="flex items-center justify-center gap-2 text-orange-400 text-lg font-semibold mb-1">
              🔥 {streakData?.streak ?? 0}-day streak
            </div>
            <p className="text-xs text-gray-500 mb-5">
              Keep your streak alive and earn HuudCoins
            </p>
            <button
              onClick={handleClaim}
              disabled={checkIn.isPending}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-sm transition-colors mb-2"
            >
              {checkIn.isPending ? "Claiming…" : "Claim Daily Bonus 🔥"}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
            >
              Remind me later
            </button>
          </>
        )}
      </div>
    </div>
  );
}
