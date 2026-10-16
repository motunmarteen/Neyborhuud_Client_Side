"use client";

interface Props {
  /** The streak the person really has today (0 after a missed day). */
  streak: number;
  lastCheckIn?: string;
  /** Next day that pays a streak bonus, from GET /gamification/streak. */
  nextMilestone?: number;
  /** That day's bonus, from the server. */
  nextReward?: number;
  onCheckIn: () => void;
  checkInPending?: boolean;
  checkedInToday?: boolean;
  streakBroken?: boolean;
}

/**
 * Daily check-in streak. Every number comes from the server: the card once
 * kept its own milestone list and promised "+0" on days 100 and 365.
 */
export default function StreakCard({
  streak,
  lastCheckIn,
  nextMilestone,
  nextReward,
  onCheckIn,
  checkInPending,
  checkedInToday,
  streakBroken,
}: Props) {
  const hasNext = typeof nextMilestone === "number" && nextMilestone > streak && (nextReward ?? 0) > 0;
  const daysLeft = hasNext ? nextMilestone - streak : 0;
  const progressPct = hasNext ? Math.min(100, Math.round((streak / nextMilestone) * 100)) : 0;

  const status = streakBroken
    ? "You missed a day. Check in to start again"
    : checkedInToday
      ? `Come back tomorrow for day ${streak + 1}`
      : streak > 0
        ? `Check in today for day ${streak + 1}`
        : "Check in every day to build a streak";

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
                day{streak !== 1 ? "s" : ""} in a row
              </span>
            </p>
            <p className="text-xs text-[var(--neu-text-muted)]">{status}</p>
          </div>
        </div>

        {hasNext ? (
          <div className="text-right">
            <p className="text-xs text-[var(--neu-text-muted)]">Day {nextMilestone} bonus</p>
            <p className="text-sm font-bold text-primary">+{nextReward} 🪙</p>
            <p className="text-[11px] text-[var(--neu-text-muted)]">
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} away
            </p>
          </div>
        ) : null}
      </div>

      {hasNext ? (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-[10px] text-[var(--neu-text-muted)]">
            <span>Day {streak}</span>
            <span>Day {nextMilestone}</span>
          </div>
          <div className="mod-inset h-2 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-red to-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <p className="mb-3 text-[11px] text-[var(--neu-text-muted)]">
        Every check-in pays 10 HuudCredit. Days 7, 14, 21… and every 30th day pay extra.
        {lastCheckIn ? (
          <>
            {" "}Last check-in:{" "}
            {new Date(lastCheckIn).toLocaleDateString("en-NG", {
              weekday: "short",
              day: "numeric",
              month: "short",
              timeZone: "Africa/Lagos",
            })}
            .
          </>
        ) : null}
      </p>

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
          ? "✓ Checked in today"
          : checkInPending
            ? "Checking in…"
            : streakBroken
              ? "🔥 Start a new streak"
              : "🔥 Check in today"}
      </button>
    </div>
  );
}
