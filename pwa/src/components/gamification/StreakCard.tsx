"use client";

interface Props {
  streak: number;
  lastCheckIn?: string;
  nextReward?: number;
  onCheckIn: () => void;
  checkInPending?: boolean;
  checkedInToday?: boolean;
  streakBroken?: boolean;
}

function getNextMilestone(streak: number): { target: number; coins: number } {
  const milestones = [
    { target: 7, coins: 50 },
    { target: 14, coins: 100 },
    { target: 30, coins: 200 },
    { target: 60, coins: 200 },
    { target: 100, coins: 0 },
    { target: 365, coins: 0 },
  ];
  return milestones.find((m) => m.target > streak) ?? { target: streak + 7, coins: 50 };
}

export default function StreakCard({
  streak,
  lastCheckIn,
  nextReward,
  onCheckIn,
  checkInPending,
  checkedInToday,
  streakBroken,
}: Props) {
  const milestone = getNextMilestone(streak);
  const daysLeft = Math.max(0, milestone.target - streak);
  const coins = nextReward ?? milestone.coins;
  const progressPct =
    milestone.target > 0 ? Math.min(100, Math.round((streak / milestone.target) * 100)) : 0;

  return (
    <div className="mod-card rounded-2xl bg-gradient-to-br from-brand-red/10 via-[var(--neu-bg)] to-primary/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="mod-inset flex h-12 w-12 items-center justify-center rounded-full text-2xl">
            🔥
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums" style={{ color: "var(--neu-text)" }}>
              {streak}
              <span className="ml-1 text-base font-semibold text-brand-red">
                day{streak !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="text-xs text-[var(--neu-text-muted)]">
              {streakBroken ? "Streak broken — check in to restart" : "Current streak"}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-xs text-[var(--neu-text-muted)]">Next bonus</p>
          <p className="text-sm font-bold text-primary">+{coins} 🪙</p>
          <p className="text-[11px] text-[var(--neu-text-muted)]">
            {daysLeft} day{daysLeft !== 1 ? "s" : ""} away
          </p>
        </div>
      </div>

      <div className="mb-4">
        <div className="mb-1 flex justify-between text-[10px] text-[var(--neu-text-muted)]">
          <span>Day {streak}</span>
          <span>Day {milestone.target}</span>
        </div>
        <div className="mod-inset h-2 overflow-hidden rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-red to-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {lastCheckIn && (
        <p className="mb-3 text-[11px] text-[var(--neu-text-muted)]">
          Last check-in:{" "}
          {new Date(lastCheckIn).toLocaleDateString("en-NG", {
            weekday: "short",
            day: "numeric",
            month: "short",
            timeZone: "Africa/Lagos",
          })}
        </p>
      )}

      <button
        type="button"
        onClick={onCheckIn}
        disabled={checkInPending || checkedInToday}
        className={`w-full rounded-xl py-2.5 text-sm font-bold transition-colors ${
          checkedInToday
            ? "mod-chip mod-chip-active cursor-default text-primary"
            : "bg-brand-red text-white hover:bg-brand-red disabled:opacity-50"
        }`}
      >
        {checkedInToday
          ? "✓ Checked In Today"
          : checkInPending
            ? "Checking in…"
            : streakBroken
              ? "🔥 Restart Streak"
              : "🔥 Check In Today"}
      </button>
    </div>
  );
}
