"use client";

import Link from "next/link";
import Image from "next/image";
import { LeaderboardEntry } from "@/types/api";

interface Props {
  entry: LeaderboardEntry;
  currentUserId: string;
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="w-8 text-center text-sm font-bold text-[var(--neu-text-muted)]">#{rank}</span>
  );
}

const LEVEL_COLORS = [
  "mod-chip text-[var(--neu-text-muted)]",
  "mod-chip mod-chip-active text-primary",
  "mod-chip text-brand-blue",
  "mod-chip text-brand-blue",
  "mod-chip text-amber-800",
];

function levelColor(level: number) {
  if (level >= 30) return LEVEL_COLORS[4];
  if (level >= 20) return LEVEL_COLORS[3];
  if (level >= 10) return LEVEL_COLORS[2];
  if (level >= 5) return LEVEL_COLORS[1];
  return LEVEL_COLORS[0];
}

export default function LeaderboardRow({ entry, currentUserId }: Props) {
  const isMe = entry.userId === currentUserId;
  const displayName = entry.user
    ? [entry.user.firstName, entry.user.lastName].filter(Boolean).join(" ") || entry.user.username
    : "Unknown";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
        isMe ? "mod-inset ring-1 ring-primary/25 bg-primary/5" : "hover:bg-black/[0.02]"
      }`}
    >
      <div className="flex w-8 shrink-0 justify-center">
        <RankDisplay rank={entry.rank} />
      </div>

      <div className="mod-inset flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-[var(--neu-text)]">
        {(entry.user?.avatarUrl ?? entry.user?.profilePicture) ? (
          <Image
            src={(entry.user.avatarUrl ?? entry.user.profilePicture)!}
            alt={displayName}
            width={36}
            height={36}
            className="h-full w-full object-cover"
          />
        ) : (
          displayName[0]?.toUpperCase() || "?"
        )}
      </div>

      <div className="min-w-0 flex-1">
        <Link
          href={`/profile/${entry.user?.username ?? ""}`}
          className="block truncate text-sm font-semibold text-[var(--neu-text)] transition-colors hover:text-primary"
        >
          {displayName}
          {isMe && <span className="ml-1 text-xs text-primary">(You)</span>}
        </Link>
        <p className="truncate text-xs text-[var(--neu-text-muted)]">@{entry.user?.username ?? "—"}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${levelColor(entry.level)}`}>
          Lv {entry.level}
        </span>
        <span className="text-sm font-bold tabular-nums" style={{ color: "var(--neu-text)" }}>
          {(entry.points ?? 0).toLocaleString()}
        </span>
        <span className="text-xs text-[var(--neu-text-muted)]">pts</span>
      </div>
    </div>
  );
}
