"use client";

import { getPasswordStrengthSummary } from "@/lib/passwordPolicy";

type Props = {
  password: string;
  email?: string;
  username?: string;
  /** Optional extra classes on the outer wrapper (e.g. neu styling). */
  className?: string;
  /**
   * Full rule-by-rule checklist (verbose). Default off — bar only under the field.
   */
  showChecklist?: boolean;
};

function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function PasswordStrengthMeter({
  password,
  email = "",
  username = "",
  className,
  showChecklist = false,
}: Props) {
  const summary = getPasswordStrengthSummary(password, { email, username });
  const { tier, scorePercent, label, checklist, meetsPolicy } = summary;

  const barClass =
    meetsPolicy || tier === "strong"
      ? "bg-emerald-500 dark:bg-emerald-500"
      : tier === "good"
        ? "bg-emerald-400/90 dark:bg-emerald-400/80"
        : tier === "fair"
          ? "bg-amber-400 dark:bg-amber-500/90"
          : tier === "weak"
            ? "bg-amber-600/85 dark:bg-amber-600/80"
            : "bg-zinc-300 dark:bg-zinc-600";

  if (!showChecklist) {
    return (
      <div className={cx("mt-1.5 w-full", className)}>
        <p className="sr-only" aria-live="polite">
          Password strength: {label}
        </p>
        <div
          className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700"
          aria-hidden
        >
          <div
            className={cx("h-full rounded-full transition-all duration-300 ease-out", barClass)}
            style={{ width: `${scorePercent}%` }}
          />
        </div>
      </div>
    );
  }

  const labelClass =
    meetsPolicy || tier === "strong"
      ? "text-emerald-800 dark:text-emerald-200"
      : tier === "empty"
        ? "text-zinc-500 dark:text-zinc-400"
        : "text-zinc-700 dark:text-zinc-300";

  return (
    <div
      className={cx(
        "mt-2 space-y-3 rounded-xl border border-zinc-200/80 bg-zinc-50/50 px-3 py-3 dark:border-zinc-700/60 dark:bg-zinc-900/30",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Password strength
          </p>
          <p className={cx("mt-0.5 text-sm font-medium", labelClass)} aria-live="polite">
            {label}
          </p>
        </div>
        {meetsPolicy ? (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <i className="bi bi-check-lg text-base" aria-hidden />
          </span>
        ) : null}
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className={cx("h-full rounded-full transition-all duration-300 ease-out", barClass)}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-0.5 text-left text-[0.75rem] leading-snug text-zinc-600 dark:text-zinc-400">
        {checklist
          .filter((item) => !item.skipped)
          .map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <span
                className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500"
                aria-hidden
              >
                {item.pending ? (
                  <i className="bi bi-circle text-[0.65rem]" />
                ) : item.ok ? (
                  <i className="bi bi-check-circle-fill text-emerald-600 dark:text-emerald-400 text-sm" />
                ) : (
                  <i className="bi bi-dash-circle text-amber-600 dark:text-amber-400 text-sm" />
                )}
              </span>
              <span
                className={cx(
                  item.pending && "text-zinc-400 dark:text-zinc-500",
                  !item.pending && !item.ok && "font-medium text-amber-900 dark:text-amber-200",
                )}
              >
                {item.label}
                {!item.pending && !item.ok ? (
                  <span className="mt-0.5 block font-normal text-amber-800/90 dark:text-amber-200/85">
                    {item.failMessage}
                  </span>
                ) : null}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}
