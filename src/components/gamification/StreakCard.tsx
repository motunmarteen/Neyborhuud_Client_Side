"use client";

interface Props {
  streak: number;
  lastCheckIn?: string;
  nextReward?: number;
  onCheckIn: () => void;
  checkInPending?: boolean;
  checkedInToday?: boolean;
}

function getNextMilestone(streak: number): { target: number; coins: number } {
  const milestones = [
    { target: 3, coins: 15 },
    { target: 7, coins: 50 },
    { target: 14, coins: 100 },
    { target: 30, coins: 250 },
    { target: 60, coins: 500 },
    { target: 100, coins: 1000 },
  ];
  return milestones.find((m) => m.target > streak) ?? { target: streak + 10, coins: 500 };
}

export default function StreakCard({
  streak,
  lastCheckIn,
  nextReward,
  onCheckIn,
  checkInPending,
  checkedInToday,
}: Props) {
  const milestone = getNextMilestone(streak);
  const daysLeft = milestone.target - streak;
  const coins = nextReward ?? milestone.coins;

  return (
    <div className="bg-gradient-to-br from-orange-500/15 via-[#1a1a2e] to-[#1a1a2e] border border-orange-500/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        {/* Streak count */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl">
            🔥
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white tabular-nums">
              {streak}
              <span className="text-base font-semibold text-orange-400 ml-1">
                day{streak !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-xs text-gray-400">Current streak</p>
          </div>
        </div>

        {/* Next milestone */}
        <div className="text-right">
          <p className="text-xs text-gray-500">Next bonus</p>
          <p className="text-sm font-bold text-yellow-400">+{coins} 🪙</p>
          <p className="text-[11px] text-gray-500">{daysLeft} day{daysLeft !== 1 ? "s" : ""} away</p>
        </div>
      </div>

      {/* Progress bar to next milestone */}
      <div className="mb-4">
        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
          <span>Day {streak}</span>
          <span>Day {milestone.target}</span>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(
                100,
                ((streak - (milestone.target - (milestone.target - getNextMilestone(streak - 1 < 0 ? 0 : streak - 1).target + milestone.target))) /
                  (milestone.target - (milestone.target - (milestone.target - getNextMilestone(streak === 0 ? 0 : streak - 1).target + milestone.target)))) *
                  100,
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Last check-in note */}
      {lastCheckIn && (
        <p className="text-[11px] text-gray-500 mb-3">
          Last check-in:{" "}
          {new Date(lastCheckIn).toLocaleDateString("en-NG", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </p>
      )}

      {/* Check-in button */}
      <button
        onClick={onCheckIn}
        disabled={checkInPending || checkedInToday}
        className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
          checkedInToday
            ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default"
            : "bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-50"
        }`}
      >
        {checkedInToday ? "✓ Checked In Today" : checkInPending ? "Checking in…" : "🔥 Check In Today"}
      </button>
    </div>
  );
}
