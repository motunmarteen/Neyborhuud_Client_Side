"use client";

import { useState } from "react";
import Link from "next/link";
import TopNav from "@/components/navigation/TopNav";
import LeftSidebar from "@/components/navigation/LeftSidebar";
import RightSidebar from "@/components/navigation/RightSidebar";
import { BottomNav } from "@/components/feed/BottomNav";
import BadgeCard from "@/components/gamification/BadgeCard";
import AchievementCard from "@/components/gamification/AchievementCard";
import LeaderboardRow from "@/components/gamification/LeaderboardRow";
import StreakCard from "@/components/gamification/StreakCard";
import {
  useMyGamificationStats,
  useMyBadges,
  useAllBadges,
  useMyAchievements,
  useLeaderboard,
  useMyStreak,
  useCheckIn,
} from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/types/api";

type Tab = "overview" | "badges" | "achievements" | "leaderboard";
type BadgeFilter = "all" | "earned" | "not-earned";
type Timeframe = "daily" | "weekly" | "monthly" | "all-time";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "badges", label: "Badges", icon: "military_tech" },
  { id: "achievements", label: "Achievements", icon: "emoji_events" },
  { id: "leaderboard", label: "Leaderboard", icon: "leaderboard" },
];

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: "daily", label: "Today" },
  { id: "weekly", label: "This Week" },
  { id: "monthly", label: "This Month" },
  { id: "all-time", label: "All Time" },
];

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-lg font-extrabold text-white tabular-nums">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function GamificationPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>("all");
  const [timeframe, setTimeframe] = useState<Timeframe>("weekly");

  const { user } = useAuth();
  const stats = useMyGamificationStats();
  const myBadges = useMyBadges();
  const allBadges = useAllBadges();
  const achievements = useMyAchievements();
  const leaderboard = useLeaderboard(timeframe);
  const streak = useMyStreak();
  const checkIn = useCheckIn();

  // Safely extract an array from any API response shape:
  // raw array, { data: [] }, { data: { items: [] } }, { leaderboard: [] }, etc.
  function toArray(val: unknown): any[] {
    if (Array.isArray(val)) return val;
    if (val && typeof val === "object") {
      const v = val as Record<string, unknown>;
      // common envelope keys
      for (const key of ["data", "items", "results", "leaderboard", "badges", "achievements", "entries"]) {
        if (Array.isArray(v[key])) return v[key] as any[];
      }
      // one more level deep: { data: { leaderboard: [] } }
      if (v.data && typeof v.data === "object") {
        const inner = v.data as Record<string, unknown>;
        for (const key of ["items", "results", "leaderboard", "badges", "achievements", "entries"]) {
          if (Array.isArray(inner[key])) return inner[key] as any[];
        }
      }
    }
    return [];
  }

  const statsData = (stats.data as any)?.data ?? stats.data as any;
  const streakData = (streak.data as any)?.data ?? streak.data as any;
  const earnedBadgeIds = new Set<string>(
    toArray(myBadges.data).map((b: Badge) => b.id)
  );
  const allBadgeList: Badge[] = toArray(allBadges.data);
  const myBadgeList: Badge[] = toArray(myBadges.data);
  const achievementList = toArray(achievements.data);
  const leaderboardList = toArray(leaderboard.data);

  const filteredBadges =
    badgeFilter === "earned"
      ? allBadgeList.filter((b) => earnedBadgeIds.has(b.id))
      : badgeFilter === "not-earned"
      ? allBadgeList.filter((b) => !earnedBadgeIds.has(b.id))
      : allBadgeList;

  const myRankEntry = leaderboardList.find(
    (e: any) => e.userId === user?.id
  );

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <div className="flex-1 overflow-y-auto bg-[#0f0f1e] text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-gray-800 backdrop-blur-md bg-opacity-95">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <span>🏆</span> Gamification
                  </h1>
                  {statsData && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Level {statsData.level ?? 1} · {(statsData.points ?? 0).toLocaleString()} pts
                    </p>
                  )}
                </div>
                <Link
                  href="/gamification/wallet"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 rounded-lg font-semibold hover:bg-yellow-500/25 transition-colors"
                >
                  <span>🪙</span>
                  {statsData?.huudCoins != null
                    ? `${(statsData.huudCoins as number).toLocaleString()} coins`
                    : "Wallet"}
                </Link>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 overflow-x-auto scrollbar-none">
                {TABS.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`shrink-0 flex items-center gap-1.5 text-sm px-4 py-2 rounded-full font-semibold transition-colors ${
                        active
                          ? "bg-purple-600 text-white"
                          : "text-gray-400 hover:text-white hover:bg-gray-800"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
            {/* ── OVERVIEW TAB ── */}
            {tab === "overview" && (
              <>
                {/* Streak card */}
                {streak.isLoading ? (
                  <div className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-2xl h-40" />
                ) : (
                  <StreakCard
                    streak={streakData?.streak ?? 0}
                    lastCheckIn={streakData?.lastCheckIn}
                    checkedInToday={(streakData as any)?.checkedInToday}
                    onCheckIn={() => checkIn.mutate()}
                    checkInPending={checkIn.isPending}
                  />
                )}

                {/* Stats grid */}
                {stats.isLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl h-20" />
                    ))}
                  </div>
                ) : statsData ? (
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon="military_tech"
                      label="Level"
                      value={statsData.level ?? 1}
                      color="bg-purple-500/20 text-purple-400"
                    />
                    <StatCard
                      icon="stars"
                      label="Total Points"
                      value={(statsData.points ?? 0).toLocaleString()}
                      color="bg-blue-500/20 text-blue-400"
                    />
                    <StatCard
                      icon="verified_user"
                      label="Trust Score"
                      value={`${statsData.trustScore ?? 0}%`}
                      color="bg-green-500/20 text-green-400"
                    />
                    <StatCard
                      icon="token"
                      label="HuudCoins"
                      value={(statsData.huudCoins ?? statsData.totalHuudCoins ?? 0).toLocaleString()}
                      color="bg-yellow-500/20 text-yellow-400"
                    />
                  </div>
                ) : null}

                {/* Recent badges */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-white">Recent Badges</h2>
                    <button
                      onClick={() => setTab("badges")}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  {myBadges.isLoading ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl h-32" />
                      ))}
                    </div>
                  ) : myBadgeList.length === 0 ? (
                    <div className="text-center py-8 bg-[#1a1a2e] border border-gray-800 rounded-xl">
                      <span className="text-3xl">🏅</span>
                      <p className="text-sm text-gray-400 mt-2">No badges earned yet</p>
                      <p className="text-xs text-gray-600 mt-1">Complete achievements to earn badges</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {myBadgeList.slice(0, 3).map((badge: Badge) => (
                        <BadgeCard key={badge.id} badge={badge} earned />
                      ))}
                    </div>
                  )}
                </div>

                {/* Leaderboard teaser */}
                <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-white">Leaderboard</h2>
                    <button
                      onClick={() => setTab("leaderboard")}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Full board →
                    </button>
                  </div>
                  {leaderboard.isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse h-12 bg-gray-800 rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {leaderboardList.slice(0, 3).map((entry: any) => (
                        <LeaderboardRow
                          key={entry.userId}
                          entry={entry}
                          currentUserId={user?.id ?? ""}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── BADGES TAB ── */}
            {tab === "badges" && (
              <>
                {/* Filter */}
                <div className="flex gap-2">
                  {(["all", "earned", "not-earned"] as BadgeFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setBadgeFilter(f)}
                      className={`text-sm px-4 py-1.5 rounded-full font-semibold transition-colors ${
                        badgeFilter === f
                          ? "bg-purple-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {f === "all" ? "All" : f === "earned" ? "Earned" : "Not Earned"}
                    </button>
                  ))}
                </div>

                {allBadges.isLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl h-44" />
                    ))}
                  </div>
                ) : filteredBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">🏅</span>
                    <p className="text-gray-400 mt-3">No badges to show</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredBadges.map((badge: Badge) => (
                      <BadgeCard
                        key={badge.id}
                        badge={badge}
                        earned={earnedBadgeIds.has(badge.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── ACHIEVEMENTS TAB ── */}
            {tab === "achievements" && (
              <>
                {achievements.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-[#1a1a2e] border border-gray-800 rounded-xl h-28" />
                    ))}
                  </div>
                ) : achievementList.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">🏆</span>
                    <p className="text-gray-400 mt-3">No achievements yet</p>
                    <p className="text-xs text-gray-600 mt-1">Keep using the app to unlock achievements</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {achievementList.map((a: any) => (
                      <AchievementCard key={a.id} achievement={a} />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* ── LEADERBOARD TAB ── */}
            {tab === "leaderboard" && (
              <>
                {/* Timeframe toggle */}
                <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                  {TIMEFRAMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeframe(t.id)}
                      className={`shrink-0 text-sm px-4 py-1.5 rounded-full font-semibold transition-colors ${
                        timeframe === t.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {leaderboard.isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse h-14 bg-[#1a1a2e] border border-gray-800 rounded-xl" />
                    ))}
                  </div>
                ) : leaderboardList.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">📊</span>
                    <p className="text-gray-400 mt-3">No leaderboard data yet</p>
                  </div>
                ) : (
                  <div className="bg-[#1a1a2e] border border-gray-800 rounded-xl divide-y divide-gray-800/50 overflow-hidden">
                    {leaderboardList.map((entry: any) => (
                      <LeaderboardRow
                        key={entry.userId}
                        entry={entry}
                        currentUserId={user?.id ?? ""}
                      />
                    ))}
                  </div>
                )}

                {/* Sticky your rank */}
                {myRankEntry && (
                  <div className="sticky bottom-16 md:bottom-4 bg-[#0f0f1e] border border-blue-500/40 rounded-xl shadow-xl">
                    <p className="text-[10px] text-blue-400 font-semibold uppercase px-4 pt-2 tracking-wider">
                      Your Rank
                    </p>
                    <LeaderboardRow
                      entry={myRankEntry}
                      currentUserId={user?.id ?? ""}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          <div className="h-20 md:hidden" />
        </div>
        <RightSidebar />
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
