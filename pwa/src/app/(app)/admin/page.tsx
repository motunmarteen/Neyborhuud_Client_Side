'use client';

import { useDashboardStats } from '@/hooks/useAdmin';

// ── SVG Sparkline ─────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: { date: string; value: number }[] }) {
  if (!data || data.length < 2) {
    return <div className="h-16 rounded-xl bg-white/5" />;
  }
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 300;
  const H = 64;
  const step = W / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="rgb(52 211 153)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color = 'text-primary',
}: {
  label: string;
  value: number | string;
  icon: string;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] ${color} opacity-70`}>
        <span className="material-symbols-outlined text-[15px]">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-3xl font-black tabular-nums text-white">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <div>
          <span className="material-symbols-outlined text-[48px] text-brand-red">error</span>
          <p className="mt-3 text-white/70">Could not load dashboard stats.</p>
          <p className="text-xs text-white/40">Make sure the admin API is reachable.</p>
        </div>
      </div>
    );
  }

  const stats = data as any;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Dashboard</h1>
        <p className="mt-0.5 text-sm text-white/50">Platform overview — live data</p>
      </div>

      {/* Primary stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Users"      value={stats.totalUsers ?? 0}            icon="group"         color="text-sky-400" />
        <StatCard label="Active (24h)"     value={stats.activeUsers ?? 0}           icon="person_check"  color="text-primary" />
        <StatCard label="Total Posts"      value={stats.totalPosts ?? 0}            icon="article"       color="text-brand-blue" />
        <StatCard label="Events"           value={stats.totalEvents ?? 0}           icon="event"         color="text-primary" />
        <StatCard label="Jobs"             value={stats.totalJobs ?? 0}             icon="work"          color="text-brand-red400" />
        <StatCard label="Listings"         value={stats.totalMarketplaceItems ?? 0} icon="storefront"    color="text-brand-green-dark" />
      </div>

      {/* Engagement row */}
      <div>
        <h2 className="mb-3 text-[11px] font-black uppercase tracking-widest text-white/40">Engagement</h2>
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Likes"    value={stats.engagement?.likes ?? 0}    icon="thumb_up"  color="text-pink-400" />
          <StatCard label="Comments" value={stats.engagement?.comments ?? 0} icon="comment"   color="text-brand-blue" />
          <StatCard label="Shares"   value={stats.engagement?.shares ?? 0}   icon="share"     color="text-brand-blue400" />
        </div>
      </div>

      {/* Trend sparkline */}
      {Array.isArray(stats.trends) && stats.trends.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-4 text-[11px] font-black uppercase tracking-widest text-white/40">Activity Trend</p>
          <Sparkline data={stats.trends} />
          <div className="mt-2 flex justify-between text-[10px] text-white/30">
            <span>{stats.trends[0]?.date}</span>
            <span>{stats.trends[stats.trends.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
}
