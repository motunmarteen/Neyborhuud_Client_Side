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
import { STATIC_BADGES, STATIC_ACHIEVEMENTS } from "@/lib/gamification-catalogue";
import {
  buildTrustEconomyModel,
  normalizeTrustScore,
} from "@/lib/trust-economy";
import { useMyTrustProfile, useTrustPrivileges, useVouches, TRUST_EVENT_META } from "@/hooks/useTrust";
import { useMyMilestoneStatus, type MilestoneInfo } from "@/hooks/useFollow";
import { formatTimeAgo } from "@/utils/timeAgo";

type Tab = "overview" | "badges" | "achievements" | "leaderboard" | "trustos";
type BadgeFilter = "all" | "earned" | "not-earned";
type Timeframe = "daily" | "weekly" | "monthly" | "all-time";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "trustos", label: "TrustOS", icon: "verified_user" },
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
    <div className="bg-brand-black border border-black/[0.08] rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-lg font-extrabold text-white tabular-nums">{value}</p>
        <p className="text-xs text-[var(--neu-text-muted)]">{label}</p>
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
  const trustProfile = useMyTrustProfile();
  const myVouches = useVouches(user?.id);
  const milestoneStatus = useMyMilestoneStatus();

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
  // If the API is not yet live (returns empty), fall back to the full static catalogue
  // so users always see all available badges and achievements.
  const allBadgeList: Badge[] = toArray(allBadges.data).length > 0
    ? toArray(allBadges.data)
    : STATIC_BADGES;
  const myBadgeList: Badge[] = toArray(myBadges.data);
  // Merge static achievements with real progress when available
  const rawAchievements = toArray(achievements.data);
  const achievementList = rawAchievements.length > 0
    ? rawAchievements
    : STATIC_ACHIEVEMENTS;
  const leaderboardList = toArray(leaderboard.data);
  const completedAchievements = achievementList.filter((a: any) => !!a.completed).length;

  const trustInput = normalizeTrustScore(Number(statsData?.trustScore ?? 0));
  const trustEconomy = buildTrustEconomyModel({
    trustScoreRaw: trustInput.score1000,
    streakDays: Number(streakData?.effectiveStreak ?? streakData?.streak ?? 0),
    badgesCount: earnedBadgeIds.size,
    completedAchievements,
    vouchCount: Number((statsData as any)?.vouchCount ?? 0),
    profileCompleted: Boolean((statsData as any)?.profileCompleted),
    identityVerified: Boolean((statsData as any)?.identityVerified),
  });

  // Tier privileges (pure derivation from score, no network call)
  const privileges = useTrustPrivileges(trustEconomy.score1000);

  // Trust activity events from server (gracefully empty until backend logs fire)
  const trustEvents = (trustProfile.data?.recentEvents ?? []) as import("@/services/trust.service").TrustActivityEntry[];

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
        <div className="flex-1 overflow-y-auto bg-brand-black text-white">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-brand-black border-b border-black/[0.08] backdrop-blur-md bg-opacity-95">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-bold flex items-center gap-2">
                    <span>🏆</span> Gamification
                  </h1>
                  {statsData && (
                    <p className="text-xs text-[var(--neu-text-muted)] mt-0.5">
                      Level {statsData.level ?? 1} · {(statsData.points ?? 0).toLocaleString()} pts
                    </p>
                  )}
                </div>
                <Link
                  href="/gamification/wallet"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-primary/15 border border-yellow-500/30 text-primary400 rounded-lg font-semibold hover:bg-primary/25 transition-colors"
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
                          : "text-[var(--neu-text-muted)] hover:text-white hover:bg-brand-black"
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
                  <div className="animate-pulse bg-brand-black border border-black/[0.08] rounded-2xl h-40" />
                ) : (
                  <StreakCard
                    streak={streakData?.effectiveStreak ?? streakData?.streak ?? 0}
                    lastCheckIn={streakData?.lastCheckIn}
                    checkedInToday={(streakData as any)?.checkedInToday}
                    streakBroken={(streakData as any)?.streakBroken}
                    nextReward={(streakData as any)?.nextMilestoneReward ?? 0}
                    onCheckIn={() => checkIn.mutate()}
                    checkInPending={checkIn.isPending}
                  />
                )}

                {/* Stats grid */}
                {stats.isLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse bg-brand-black border border-black/[0.08] rounded-xl h-20" />
                    ))}
                  </div>
                ) : statsData ? (
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      icon="military_tech"
                      label="Level"
                      value={statsData.level ?? 1}
                      color="bg-brand-blue/20 text-brand-blue"
                    />
                    <StatCard
                      icon="stars"
                      label="Total Points"
                      value={(statsData.points ?? 0).toLocaleString()}
                      color="bg-brand-blue/20 text-brand-blue"
                    />
                    <StatCard
                      icon="verified_user"
                      label="Trust Score"
                      value={`${trustEconomy.communityTrustPercent}%`}
                      color="bg-primary/20 text-primary"
                    />
                    <StatCard
                      icon="token"
                      label="HuudCoins"
                      value={(statsData.huudCoins ?? statsData.totalHuudCoins ?? 0).toLocaleString()}
                      color="bg-primary/20 text-primary400"
                    />
                  </div>
                ) : null}

                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">TrustOS Signal</p>
                      <p className="mt-1 text-2xl font-black text-white tabular-nums">{trustEconomy.score1000.toLocaleString()}</p>
                      <p className="text-xs text-white/90/90">
                        {trustEconomy.trustTier.icon} {trustEconomy.trustTier.label} tier · {trustEconomy.communityTrustPercent}% community trust
                      </p>
                    </div>
                    {trustEconomy.nextTier ? (
                      <div className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--neu-text-muted)]">Next Tier</p>
                        <p className="text-sm font-bold text-white">{trustEconomy.nextTier.icon} {trustEconomy.nextTier.label}</p>
                        <p className="text-xs text-[var(--neu-text-muted)]">{trustEconomy.nextTierDelta} pts to unlock</p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-lime-300/35 bg-primary400/10 px-3 py-2 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary200">Top Tier</p>
                        <p className="text-sm font-bold text-primary100">Baobab unlocked</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 transition-all duration-500"
                      style={{ width: `${trustEconomy.communityTrustPercent}%` }}
                    />
                  </div>
                  <button
                    onClick={() => setTab("trustos")}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-primary/30/40 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-primary/10"
                  >
                    Open TrustOS Details
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>

                {/* Recent badges */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-white">Recent Badges</h2>
                    <button
                      onClick={() => setTab("badges")}
                      className="text-xs text-brand-blue hover:underline"
                    >
                      View all →
                    </button>
                  </div>
                  {myBadges.isLoading ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse bg-brand-black border border-black/[0.08] rounded-xl h-32" />
                      ))}
                    </div>
                  ) : myBadgeList.length === 0 ? (
                    <div className="text-center py-8 bg-brand-black border border-black/[0.08] rounded-xl">
                      <span className="text-3xl">🏅</span>
                      <p className="text-sm text-[var(--neu-text-muted)] mt-2">No badges earned yet</p>
                      <p className="text-xs text-[var(--neu-text-secondary)] mt-1">Complete achievements to earn badges</p>
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
                <div className="bg-brand-black border border-black/[0.08] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-bold text-white">Leaderboard</h2>
                    <button
                      onClick={() => setTab("leaderboard")}
                      className="text-xs text-brand-blue hover:underline"
                    >
                      Full board →
                    </button>
                  </div>
                  {leaderboard.isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse h-12 bg-brand-black rounded-lg" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {leaderboardList.slice(0, 3).map((entry: any, i: number) => (
                        <LeaderboardRow
                          key={entry.userId ?? entry.id ?? i}
                          entry={entry}
                          currentUserId={user?.id ?? ""}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── TRUSTOS TAB ── */}
            {tab === "trustos" && (
              <>
                {/* ── Core metrics ── */}
                <section className="rounded-2xl border border-emerald-500/20 bg-[#0f172a] p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">TrustOS Core</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--neu-text-muted)]">Trust Score</p>
                      <p className="mt-2 text-3xl font-black text-white tabular-nums">{trustEconomy.score1000.toLocaleString()}</p>
                      <p className="text-xs text-[var(--neu-text-muted)]">Scale: 0 to 1,000</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--neu-text-muted)]">Community Trust</p>
                      <p className="mt-2 text-3xl font-black text-primary tabular-nums">{trustEconomy.communityTrustPercent}%</p>
                      <p className="text-xs text-[var(--neu-text-muted)]">Public trust perception index</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--neu-text-muted)]">Current Tier</p>
                      <p className="mt-2 text-2xl font-black text-white">{trustEconomy.trustTier.icon} {trustEconomy.trustTier.label}</p>
                      <p className="text-xs text-[var(--neu-text-muted)]">{trustEconomy.trustTier.description}</p>
                    </div>
                  </div>
                  {trustEconomy.nextTier && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-[11px] font-bold text-primary mb-1.5">
                        <span>Progress to {trustEconomy.nextTier.icon} {trustEconomy.nextTier.label}</span>
                        <span>{trustEconomy.score1000} / {trustEconomy.nextTier.minScore}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${Math.min(100, Math.round((trustEconomy.score1000 / trustEconomy.nextTier.minScore) * 100))}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-[var(--neu-text-muted)]">{trustEconomy.nextTierDelta} more points to unlock {trustEconomy.nextTier.label}</p>
                    </div>
                  )}
                  {!trustEconomy.nextTier && (
                    <p className="mt-4 text-xs font-bold text-primary300">🌴 You have reached the highest trust tier — Community Elder</p>
                  )}
                </section>

                {/* ── Tier Privileges ── */}
                <section className="rounded-2xl border border-indigo-500/20 bg-brand-black p-5">
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">Tier Privileges</h2>
                    <span className="rounded-full border border-indigo-500/30 bg-brand-blue500/10 px-2 py-0.5 text-[11px] font-bold text-brand-blue300">
                      {trustEconomy.trustTier.icon} {trustEconomy.trustTier.label}
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-[var(--neu-text-muted)]">{privileges.summary}</p>
                  <div className="space-y-2">
                    {privileges.privilegeList.map((p) => (
                      <div
                        key={p.label}
                        className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${
                          p.unlocked
                            ? "border-emerald-500/20 bg-primary/5"
                            : "border-black/[0.08] bg-brand-black/50 opacity-50"
                        }`}
                      >
                        <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${p.unlocked ? "bg-primary/20" : "bg-brand-black"}`}>
                          <span className={`material-symbols-outlined text-[15px] ${p.unlocked ? "text-primary" : "text-[var(--neu-text-muted)]"}`}
                            style={{ fontVariationSettings: "'FILL' 1" }}>
                            {p.unlocked ? p.icon : "lock"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${p.unlocked ? "text-white" : "text-[var(--neu-text-muted)]"}`}>{p.label}</p>
                          <p className="text-xs text-[var(--neu-text-muted)]">{p.description}</p>
                        </div>
                        {p.unlocked && (
                          <span className="ml-auto shrink-0 text-primary">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* Marketplace badge preview */}
                  {privileges.marketplaceBadge && (
                    <div className="mt-4 rounded-xl border border-emerald-500/20 bg-primary/5 px-3 py-2.5">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Your Marketplace Badge</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${privileges.marketplaceBadgeColor}`}>
                          {trustEconomy.trustTier.icon} {privileges.marketplaceBadge}
                        </span>
                        <p className="text-xs text-[var(--neu-text-muted)]">Shown on all your marketplace listings</p>
                      </div>
                    </div>
                  )}
                  {!privileges.marketplaceBadge && (
                    <div className="mt-4 rounded-xl border border-black/[0.08] bg-brand-black/50 px-3 py-2.5">
                      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--neu-text-muted)]">Marketplace Badge</p>
                      <p className="mt-1 text-xs text-[var(--neu-text-secondary)]">Reach 🌳 Tree tier (300 pts) to earn the Trusted Seller badge on your listings</p>
                    </div>
                  )}
                </section>

                {/* ── Follower Milestones ── */}
                <section className="rounded-2xl border border-pink-500/20 bg-brand-black p-5">
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">Follower Milestones</h2>
                    <span className="rounded-full border border-pink-500/30 bg-brand-blue/10 px-2 py-0.5 text-[11px] font-bold text-brand-blue">
                      {milestoneStatus.data?.followerCount?.toLocaleString() ?? 0} followers
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-[var(--neu-text-muted)]">
                    Hit follower milestones to earn HuudCoins and unlock celebrations.
                  </p>

                  {/* Next milestone progress bar */}
                  {milestoneStatus.data?.nextMilestone && (
                    <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <div className="flex items-center justify-between text-[11px] font-bold text-brand-blue mb-1.5">
                        <span>Next: {milestoneStatus.data.nextMilestone.emoji} {milestoneStatus.data.nextMilestone.label}</span>
                        <span>{milestoneStatus.data.followerCount?.toLocaleString()} / {milestoneStatus.data.nextMilestone.count.toLocaleString()}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-pink-400 transition-all duration-700"
                          style={{ width: `${milestoneStatus.data.nextMilestone.progressPercent}%` }}
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-[var(--neu-text-muted)]">
                        Earn <span className="font-bold text-primary">+{milestoneStatus.data.nextMilestone.hcReward.toLocaleString()} HC</span> when you reach this milestone
                      </p>
                    </div>
                  )}

                  {/* Milestone grid */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {(milestoneStatus.data?.milestones ?? []).map((m: MilestoneInfo) => (
                      <div
                        key={m.count}
                        className={`rounded-xl border p-3 transition-all ${
                          m.rewarded
                            ? "border-yellow-500/40 bg-primary/10"
                            : m.achieved
                            ? "border-pink-500/40 bg-brand-blue/10"
                            : "border-white/10 bg-white/5 opacity-50"
                        }`}
                      >
                        <div className="text-xl mb-1">{m.emoji}</div>
                        <p className="text-[11px] font-bold text-white">{m.label}</p>
                        <p className="text-[10px] text-primary font-semibold">+{m.hcReward.toLocaleString()} HC</p>
                        {m.rewarded && (
                          <span className="mt-1 inline-block rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">CLAIMED</span>
                        )}
                        {m.achieved && !m.rewarded && (
                          <span className="mt-1 inline-block rounded-full bg-brand-blue/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-blue">ACHIEVED</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {!milestoneStatus.data?.nextMilestone && (milestoneStatus.data?.milestones?.length ?? 0) > 0 && (
                    <p className="mt-4 text-xs font-bold text-primary">👑 All milestones reached — you are a NeyborHuud Legend!</p>
                  )}
                </section>

                {/* ── Community Vouches ── */}
                <section className="rounded-2xl border border-violet-500/20 bg-brand-black p-5">
                  <div className="mb-1 flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">Community Vouches</h2>
                    <span className="rounded-full border border-violet-500/30 bg-brand-blue500/10 px-2 py-0.5 text-[11px] font-bold text-brand-blue300">
                      {myVouches.data?.length ?? 0} received
                    </span>
                  </div>
                  <p className="mb-4 text-xs text-[var(--neu-text-muted)]">
                    Verified neighbours who have staked their reputation on you.
                  </p>

                  {myVouches.isLoading ? (
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse w-10 h-10 rounded-full bg-white/10" />
                      ))}
                    </div>
                  ) : (myVouches.data?.length ?? 0) > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {myVouches.data!.map((v) => (
                        <a
                          key={v.id}
                          href={`/profile/${v.voucherUsername}`}
                          className="group flex items-center gap-2 rounded-xl border border-violet-500/20 bg-brand-blue500/5 px-2 py-1.5 hover:bg-brand-blue500/10 transition-colors"
                        >
                          {v.voucherAvatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={v.voucherAvatar} alt={v.voucherUsername} className="w-7 h-7 rounded-full object-cover border border-violet-400/30" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-brand-blue500/20 flex items-center justify-center">
                              <span className="text-brand-blue300 font-bold text-xs">{v.voucherUsername.charAt(0).toUpperCase()}</span>
                            </div>
                          )}
                          <span className="text-xs font-semibold text-brand-blue200 group-hover:text-white">@{v.voucherUsername}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-black/[0.08] bg-brand-black py-8 text-center">
                      <span className="material-symbols-outlined text-3xl text-[var(--neu-text-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>handshake</span>
                      <p className="mt-2 text-sm font-semibold text-[var(--neu-text-muted)]">No vouches yet</p>
                      <p className="mt-1 text-xs text-[var(--neu-text-secondary)]">Build connections and earn trust — neighbours at Tree tier can vouch for you.</p>
                    </div>
                  )}

                  {/* Vouch eligibility notice */}
                  <div className={`mt-4 rounded-xl border px-3 py-2.5 ${privileges.canVouch ? "border-emerald-500/20 bg-primary/5" : "border-black/[0.08] bg-brand-black/50"}`}>
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-[16px] ${privileges.canVouch ? "text-primary" : "text-[var(--neu-text-muted)]"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {privileges.canVouch ? "check_circle" : "lock"}
                      </span>
                      <p className={`text-xs font-semibold ${privileges.canVouch ? "text-primary" : "text-[var(--neu-text-muted)]"}`}>
                        {privileges.canVouch
                          ? `You can vouch for up to ${privileges.maxOutgoingVouches} neighbours`
                          : "Reach 🌳 Tree tier (300 pts) to vouch for others"}
                      </p>
                    </div>
                    {privileges.canVouch && (
                      <p className="mt-1 text-xs text-[var(--neu-text-muted)]">Visit a neighbour&apos;s profile to vouch for them.</p>
                    )}
                  </div>
                </section>

                {/* ── Trust Activity Feed ── */}
                <section className="rounded-2xl border border-black/[0.08] bg-brand-black p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">Trust Activity Log</h2>
                    <span className="text-xs text-[var(--neu-text-muted)]">Why your score changed</span>
                  </div>

                  {trustProfile.isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse h-14 rounded-xl bg-white/5" />
                      ))}
                    </div>
                  ) : trustEvents.length > 0 ? (
                    <div className="space-y-2">
                      {trustEvents.map((event) => {
                        const meta = TRUST_EVENT_META[event.eventType as keyof typeof TRUST_EVENT_META] ?? {
                          label: event.eventType,
                          icon: "info",
                          positive: event.pointsChange >= 0,
                        };
                        const isPositive = meta.positive && event.pointsChange >= 0;
                        return (
                          <div key={event.id} className="flex items-start gap-3 rounded-xl border border-black/[0.08] bg-brand-black px-3 py-2.5">
                            <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isPositive ? "bg-primary/15" : "bg-brand-red500/15"}`}>
                              <span className={`material-symbols-outlined text-[16px] ${isPositive ? "text-primary" : "text-brand-red400"}`}
                                style={{ fontVariationSettings: "'FILL' 1" }}>
                                {meta.icon}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-white">{meta.label}</p>
                              {event.reason && <p className="text-xs text-[var(--neu-text-muted)]">{event.reason}</p>}
                              <p className="text-[11px] text-[var(--neu-text-secondary)]">{formatTimeAgo(event.createdAt)}</p>
                            </div>
                            <span className={`shrink-0 text-sm font-black tabular-nums ${isPositive ? "text-primary" : "text-brand-red400"}`}>
                              {isPositive ? "+" : ""}{event.pointsChange}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-black/[0.08] bg-brand-black py-10 text-center">
                      <span className="material-symbols-outlined text-4xl text-[var(--neu-text-secondary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        history
                      </span>
                      <p className="mt-2 text-sm font-semibold text-[var(--neu-text-muted)]">No activity recorded yet</p>
                      <p className="mt-1 text-xs text-[var(--neu-text-secondary)]">Completing jobs, selling products, getting vouched, and verifying your identity will all appear here.</p>
                    </div>
                  )}
                </section>

                {/* ── Trust Breakdown ── */}
                <section className="rounded-2xl border border-black/[0.08] bg-brand-black p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold text-white">Trust Breakdown</h2>
                    <span className="text-xs text-[var(--neu-text-muted)]">Pillars that drive TrustOS</span>
                  </div>
                  <div className="space-y-3">
                    {trustEconomy.breakdown.map((item) => {
                      const pct = Math.round((item.current / item.max) * 100);
                      return (
                        <div key={item.id} className="rounded-xl border border-black/[0.08] bg-brand-black p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-white">{item.label}</p>
                            <p className="text-xs font-bold text-[var(--neu-text-muted)] tabular-nums">{item.current} / {item.max}</p>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-brand-black">
                            <div className={`h-full rounded-full ${item.colorClass}`} style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                          <p className="mt-2 text-xs text-[var(--neu-text-muted)]">{item.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* ── How Trust Is Earned ── */}
                <section className="rounded-2xl border border-black/[0.08] bg-brand-black p-5">
                  <h2 className="text-base font-bold text-white">How Trust Is Earned</h2>
                  <p className="mt-1 text-xs text-[var(--neu-text-muted)]">Actions are rewarded with caps to protect the economy from farming.</p>
                  <div className="mt-4 space-y-2">
                    {trustEconomy.topActions.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between rounded-xl border border-black/[0.08] bg-brand-black px-3 py-2">
                        <div>
                          <p className="text-sm font-semibold text-white">{rule.title}</p>
                          <p className="text-xs text-[var(--neu-text-muted)]">{rule.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-primary">+{rule.pointsPerAction}</p>
                          <p className="text-[11px] text-[var(--neu-text-muted)]">cap {rule.dailyCap}/day</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── Guardrails ── */}
                <section className="rounded-2xl border border-rose-500/20 bg-brand-red500/5 p-5">
                  <h2 className="text-base font-bold text-white">Trust Economy Guardrails</h2>
                  <div className="mt-3 space-y-2">
                    {trustEconomy.riskControls.map((control) => (
                      <div key={control} className="rounded-xl border border-rose-300/15 bg-black/15 px-3 py-2 text-sm text-brand-red100">
                        {control}
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* ── BADGES TAB ── */}
            {tab === "badges" && (
              <>
                {/* Summary row */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--neu-text-muted)]">
                    <span className="font-bold text-white">{earnedBadgeIds.size}</span>
                    {" / "}{allBadgeList.length} earned
                  </span>
                  <span className="text-xs text-[var(--neu-text-secondary)]">
                    {allBadgeList.length - earnedBadgeIds.size} still locked
                  </span>
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  {(["all", "earned", "not-earned"] as BadgeFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setBadgeFilter(f)}
                      className={`text-sm px-4 py-1.5 rounded-full font-semibold transition-colors ${
                        badgeFilter === f
                          ? "bg-purple-600 text-white"
                          : "bg-brand-black text-[var(--neu-text-muted)] hover:bg-brand-black"
                      }`}
                    >
                      {f === "all" ? "All" : f === "earned" ? "Earned" : "Not Earned"}
                    </button>
                  ))}
                </div>

                {allBadges.isLoading ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="animate-pulse bg-brand-black border border-black/[0.08] rounded-xl h-44" />
                    ))}
                  </div>
                ) : filteredBadges.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">🏅</span>
                    <p className="text-[var(--neu-text-muted)] mt-3">No badges match this filter</p>
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
                {/* Summary row */}
                {!achievements.isLoading && achievementList.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--neu-text-muted)]">
                      <span className="font-bold text-white">
                        {achievementList.filter((a: any) => a.completed).length}
                      </span>
                      {" / "}{achievementList.length} completed
                    </span>
                    <span className="text-xs text-[var(--neu-text-secondary)]">
                      {achievementList.reduce((s: number, a: any) => s + (a.reward?.points ?? 0), 0).toLocaleString()} pts total available
                    </span>
                  </div>
                )}

                {achievements.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-brand-black border border-black/[0.08] rounded-xl h-28" />
                    ))}
                  </div>
                ) : achievementList.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">🏆</span>
                    <p className="text-[var(--neu-text-muted)] mt-3">No achievements found</p>
                    <p className="text-xs text-[var(--neu-text-secondary)] mt-1">Keep using the app to unlock achievements</p>
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
                          : "bg-brand-black text-[var(--neu-text-muted)] hover:bg-brand-black"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {leaderboard.isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse h-14 bg-brand-black border border-black/[0.08] rounded-xl" />
                    ))}
                  </div>
                ) : leaderboardList.length === 0 ? (
                  <div className="text-center py-12">
                    <span className="text-4xl">📊</span>
                    <p className="text-[var(--neu-text-muted)] mt-3">No leaderboard data yet</p>
                  </div>
                ) : (
                  <div className="bg-brand-black border border-black/[0.08] rounded-xl divide-y divide-gray-800/50 overflow-hidden">
                    {leaderboardList.map((entry: any, i: number) => (
                      <LeaderboardRow
                        key={entry.userId ?? entry.id ?? i}
                        entry={entry}
                        currentUserId={user?.id ?? ""}
                      />
                    ))}
                  </div>
                )}

                {/* Sticky your rank */}
                {myRankEntry && (
                  <div className="sticky bottom-16 md:bottom-4 bg-brand-black border border-brand-blue/40 rounded-xl shadow-xl">
                    <p className="text-[10px] text-brand-blue font-semibold uppercase px-4 pt-2 tracking-wider">
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
