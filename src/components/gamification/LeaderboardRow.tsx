"use client";

import Link from "next/link";
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
  "bg-brand-black text-[var(--neu-text-muted)]",     // 1–4
  "bg-primary/20 text-primary", // 5–9
  "bg-brand-blue/20 text-brand-blue",   // 10–19
  "bg-brand-blue/20 text-brand-blue", // 20–29
  "bg-primary/20 text-primary400", // 30+
];
function levelColor(level: number) {
  if (level >= 30) return LEVEL_COLORS[4];
  if (level >= 20) return LEVEL_COLORS[3];
  if (level >= 10) return LEVEL_COLORS[2];
  if (level >= 5)  return LEVEL_COLORS[1];
  return LEVEL_COLORS[0];
}

export default function LeaderboardRow({ entry, currentUserId }: Props) {
  const isMe = entry.userId === currentUserId;
  const displayName = entry.user
    ? [entry.user.firstName, entry.user.lastName].filter(Boolean).join(" ") || entry.user.username
    : "Unknown";

  return (
    <div
      className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-colors ${
        isMe
          ? "bg-brand-blue/10 border border-brand-blue/30"
          : "hover:bg-brand-black/50"
      }`}
    >
      {/* Rank */}
      <div className="w-8 flex justify-center shrink-0">
        <RankDisplay rank={entry.rank} />
      </div>

      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-brand-black overflow-hidden shrink-0 flex items-center justify-center text-sm font-bold text-white">
        {(entry.user?.avatarUrl ?? entry.user?.profilePicture) ? (
          <img src={entry.user.avatarUrl ?? entry.user.profilePicture} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          displayName[0]?.toUpperCase() || "?"
        )}
      </div>

      {/* Name + handle */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/profile/${entry.user?.username ?? ""}`}
          className="text-sm font-semibold text-white hover:text-brand-blue transition-colors truncate block"
        >
          {displayName}
          {isMe && <span className="ml-1 text-xs text-brand-blue">(You)</span>}
        </Link>
        <p className="text-xs text-[var(--neu-text-muted)] truncate">@{entry.user?.username ?? "—"}</p>
      </div>

      {/* Points + level */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${levelColor(entry.level)}`}>
          Lv {entry.level}
        </span>
        <span className="text-sm font-bold text-white tabular-nums">
          {(entry.points ?? 0).toLocaleString()}
        </span>
        <span className="text-xs text-[var(--neu-text-muted)]">pts</span>
      </div>
    </div>
  );
}
