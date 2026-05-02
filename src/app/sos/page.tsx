'use client';

/**
 * /sos — Dedicated SOS command center.
 *
 * This page is the action surface for emergency response. Distinct from
 * `/safety` (the discovery hub of safety features), this page is laser-
 * focused on what to do when something is wrong RIGHT NOW.
 *
 * Sections:
 *   1. Big armed SOS button — visibility mode, countdown, emergency services
 *   2. Active SOS panel — cancel / resolve / view incident
 *   3. Drill mode — practice without alerting anyone (frontend-only)
 *   4. Quick safety actions — Trusted Contacts, Panic PIN, Trips, Fake Call
 *   5. Recent SOS history (last 5)
 *   6. Guardians' status feed
 *
 * Interaction model wired by `BottomNav`:
 *   • Tap SOS in BottomNav    →  navigates here (/sos)
 *   • Long-press SOS in BottomNav  →  fires silent SOS instantly
 */

import Link from 'next/link';
import { useEffect, useState } from 'react';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';
import SosCountdownOverlay from '@/components/safety/SosCountdownOverlay';
import { useSos } from '@/hooks/useSos';
import { safetyService, type SosEvent, type UserStatus } from '@/services/safety.service';

export const dynamic = 'force-dynamic';

// ─── Drill mode (purely client-side — never hits the backend) ─────────────
function useDrill() {
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds]);

  const start = (count = 5) => {
    setSeconds(count);
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    setSeconds(0);
  };
  return { running, seconds, start, stop };
}

// ─── Active SOS control panel ─────────────────────────────────────────────
function ActiveSosPanel() {
  const sos = useSos();
  if (sos.phase === 'idle') return null;

  if (sos.phase === 'pending') {
    return (
      <div className="rounded-2xl border-2 border-yellow-500/50 bg-yellow-950/30 p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="material-symbols-outlined text-yellow-400 text-3xl animate-pulse">
            timer
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-yellow-100">SOS arming…</h2>
            <p className="text-sm text-yellow-300/80">
              {sos.secondsRemaining}s before guardians are alerted
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void sos.cancelSos('Cancelled from /sos page')}
          className="w-full py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-base transition-colors"
        >
          Cancel SOS
        </button>
      </div>
    );
  }

  if (sos.phase === 'active') {
    return (
      <div className="rounded-2xl border-2 border-red-500/60 bg-red-950/40 p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="material-symbols-outlined text-red-400 text-3xl animate-pulse">
            emergency_home
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-red-100">SOS ACTIVE</h2>
            <p className="text-sm text-red-300/80">
              Guardians notified · Escalation level {sos.activeSos?.escalationLevel ?? 0}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {sos.activeSos?._id && (
            <Link
              href={`/safety/incident/${sos.activeSos._id}`}
              className="py-3 rounded-xl bg-red-700 hover:bg-red-600 text-white font-semibold text-sm text-center transition-colors"
            >
              View incident
            </Link>
          )}
          <button
            type="button"
            onClick={() => void sos.resolveSos()}
            className="py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm transition-colors"
          >
            I&apos;m safe now
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── The big armed button (only when idle) ───────────────────────────────
function ArmedSosButton() {
  const sos = useSos();
  const drill = useDrill();
  const [silent, setSilent] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [emergencyServices, setEmergencyServices] = useState(false);

  const disabled = sos.phase !== 'idle' || sos.loading || drill.running;

  const handleTrigger = async () => {
    if (disabled) return;
    await sos.triggerSos({
      silent,
      countdownSeconds: silent ? 0 : countdown,
      emergencyServicesEnabled: emergencyServices,
    });
  };

  if (sos.phase !== 'idle') return null;

  return (
    <div className="rounded-2xl neu-card p-6 mb-6">
      {/* Drill mode countdown overlay (purely visual, no API call) */}
      {drill.running && (
        <div className="mb-4 p-4 rounded-xl border border-blue-500/40 bg-blue-950/30 text-center">
          <div className="text-xs uppercase tracking-widest text-blue-300 mb-1">
            DRILL MODE — no real alert
          </div>
          <div className="text-5xl font-black tabular-nums text-blue-200 my-2">
            {drill.seconds}
          </div>
          <button
            type="button"
            onClick={drill.stop}
            className="mt-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
          >
            Stop drill
          </button>
        </div>
      )}

      {/* The button */}
      <button
        type="button"
        onClick={handleTrigger}
        disabled={disabled}
        className="relative w-full aspect-square max-w-[260px] mx-auto rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-xl shadow-red-900/40 flex flex-col items-center justify-center text-white font-black uppercase tracking-widest transition-transform active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label="Trigger SOS"
      >
        <span className="absolute inset-0 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
        <span className="material-symbols-outlined text-7xl mb-1 relative">
          sos
        </span>
        <span className="text-xl relative">
          {silent ? 'Silent SOS' : 'Trigger SOS'}
        </span>
        {!silent && (
          <span className="text-[11px] mt-1 opacity-80 relative">
            {countdown}s countdown
          </span>
        )}
      </button>

      {/* Options */}
      <div className="mt-6 space-y-4">
        {/* Silent mode toggle */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={silent}
            onChange={(e) => setSilent(e.target.checked)}
            className="mt-1 w-4 h-4 accent-red-500"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">visibility_off</span>
              Silent mode
            </div>
            <div className="text-xs text-white/60 mt-0.5">
              No on-screen feedback. Fires immediately. Use under duress.
            </div>
          </div>
        </label>

        {/* Countdown slider — hidden when silent */}
        {!silent && (
          <div className="p-3 rounded-xl bg-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Countdown</span>
              <span className="text-sm tabular-nums text-white/80">{countdown}s</span>
            </div>
            <input
              type="range"
              min={0}
              max={30}
              value={countdown}
              onChange={(e) => setCountdown(Number(e.target.value))}
              aria-label="Countdown seconds"
              title="Countdown seconds"
              className="w-full accent-red-500"
            />
            <div className="text-xs text-white/50 mt-1">
              Time to cancel before guardians are alerted (0 = instant).
            </div>
          </div>
        )}

        {/* Emergency services toggle */}
        <label className="flex items-start gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={emergencyServices}
            onChange={(e) => setEmergencyServices(e.target.checked)}
            className="mt-1 w-4 h-4 accent-red-500"
          />
          <div className="flex-1">
            <div className="text-sm font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-base">local_police</span>
              Notify emergency services
            </div>
            <div className="text-xs text-white/60 mt-0.5">
              Auto-dispatch to police / medical when SOS activates.
            </div>
          </div>
        </label>

        {/* Drill mode */}
        <button
          type="button"
          onClick={() => drill.start(5)}
          disabled={drill.running}
          className="w-full p-3 rounded-xl border border-blue-500/30 bg-blue-950/10 hover:bg-blue-950/30 text-left transition-colors disabled:opacity-60"
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-400">
              fitness_center
            </span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-blue-200">
                Run a drill
              </div>
              <div className="text-xs text-blue-300/70 mt-0.5">
                Practice the countdown without alerting anyone.
              </div>
            </div>
          </div>
        </button>

        {/* Error */}
        {sos.error && (
          <div className="p-3 rounded-xl border border-red-500/40 bg-red-950/30 text-sm text-red-200 flex items-start justify-between gap-2">
            <span>{sos.error}</span>
            <button
              type="button"
              onClick={sos.clearError}
              className="text-red-300 hover:text-red-100 text-xs underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Quick action tiles ──────────────────────────────────────────────────
const QUICK_ACTIONS: Array<{
  icon: string;
  label: string;
  href: string;
  iconClass: string;
  description: string;
}> = [
  {
    icon: 'shield_person',
    label: 'Trusted contacts',
    href: '/safety/manage#guardians',
    iconClass: 'text-blue-400',
    description: 'Manage your guardians',
  },
  {
    icon: 'pin',
    label: 'Panic PIN',
    href: '/safety/panic-pin',
    iconClass: 'text-red-400',
    description: 'Duress code setup',
  },
  {
    icon: 'route',
    label: 'Trips & check-ins',
    href: '/safety/trips',
    iconClass: 'text-emerald-400',
    description: 'Plan & monitor journeys',
  },
  {
    icon: 'phone_in_talk',
    label: 'Fake call',
    href: '/safety/fake-call',
    iconClass: 'text-green-400',
    description: 'Stage an exit excuse',
  },
];

function QuickActions() {
  return (
    <section className="mb-6">
      <h3 className="text-base font-semibold mb-3">Quick actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-xl neu-card p-4 hover:bg-white/5 transition-colors flex flex-col gap-1.5"
          >
            <span className={`material-symbols-outlined text-2xl ${a.iconClass}`}>
              {a.icon}
            </span>
            <div className="text-sm font-semibold leading-tight">{a.label}</div>
            <div className="text-[11px] text-white/55 leading-snug">{a.description}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Panic PIN status pill ───────────────────────────────────────────────
function PanicPinStatus() {
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  useEffect(() => {
    let cancelled = false;
    void safetyService
      .getPanicPinStatus()
      .then((res) => {
        if (!cancelled) setPinSet(Boolean(res?.data?.panicPinSet));
      })
      .catch(() => {
        if (!cancelled) setPinSet(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (pinSet === null) return null;
  if (pinSet) {
    return (
      <Link
        href="/safety/panic-pin"
        className="block rounded-xl border border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 p-3 mb-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-400 text-2xl">
            verified_user
          </span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-emerald-200">Panic PIN active</div>
            <div className="text-xs text-emerald-300/70">Tap to manage your duress code.</div>
          </div>
          <span className="material-symbols-outlined text-emerald-300">chevron_right</span>
        </div>
      </Link>
    );
  }
  return (
    <Link
      href="/safety/panic-pin"
      className="block rounded-xl border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 p-3 mb-4 transition-colors"
    >
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-red-400 text-2xl">pin</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-200">Set up your Panic PIN</div>
          <div className="text-xs text-red-300/80">A duress code that silently triggers SOS.</div>
        </div>
        <span className="material-symbols-outlined text-red-300">chevron_right</span>
      </div>
    </Link>
  );
}

// ─── Recent SOS history ───────────────────────────────────────────────────
function RecentHistory() {
  const [events, setEvents] = useState<SosEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void safetyService
      .getSosHistory(5, 1)
      .then((res) => {
        if (!cancelled) setEvents(res?.data?.events ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load history';
          setError(msg);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Recent incidents</h3>
        <Link
          href="/safety/manage#history"
          className="text-xs text-white/60 hover:text-white"
        >
          View all →
        </Link>
      </div>

      {error && (
        <div className="text-xs text-red-300 p-3 rounded-xl bg-red-950/20 border border-red-500/30">
          {error}
        </div>
      )}

      {events && events.length === 0 && !error && (
        <div className="rounded-xl neu-card p-4 text-sm text-white/60 text-center">
          No SOS history yet — stay safe.
        </div>
      )}

      {events && events.length > 0 && (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e._id}>
              <Link
                href={`/safety/incident/${e._id}`}
                className="block rounded-xl neu-card p-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-2xl ${
                      e.status === 'resolved'
                        ? 'text-green-400'
                        : e.status === 'cancelled'
                        ? 'text-slate-400'
                        : 'text-red-400'
                    }`}
                  >
                    {e.status === 'resolved'
                      ? 'task_alt'
                      : e.status === 'cancelled'
                      ? 'cancel'
                      : 'emergency'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium capitalize">
                      {e.status} · {e.visibilityMode}
                    </div>
                    <div className="text-[11px] text-white/55">
                      {new Date(e.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-white/40">
                    chevron_right
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!events && !error && (
        <div className="rounded-xl neu-card p-4 text-sm text-white/40 text-center">
          Loading…
        </div>
      )}
    </section>
  );
}

// ─── Guardians' status feed ──────────────────────────────────────────────
function GuardiansFeed() {
  const [feed, setFeed] = useState<UserStatus[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void safetyService
      .getGuardiansFeed()
      .then((res) => {
        if (!cancelled) setFeed(res?.data?.feed ?? []);
      })
      .catch(() => {
        if (!cancelled) setFeed([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!feed || feed.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Your circle</h3>
        <Link
          href="/safety/manage#status"
          className="text-xs text-white/60 hover:text-white"
        >
          Open feed →
        </Link>
      </div>
      <ul className="space-y-2">
        {feed.slice(0, 4).map((s, idx) => (
          <li
            key={`${s.userId ?? idx}-${s.lastUpdatedAt ?? idx}`}
            className="rounded-xl neu-card p-3 flex items-center gap-3"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                s.currentStatus === 'safe' || s.currentStatus === 'arrived'
                  ? 'bg-emerald-400'
                  : s.currentStatus === 'unsafe' || s.currentStatus === 'need_attention'
                  ? 'bg-red-400'
                  : 'bg-amber-400'
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium capitalize">
                {String(s.currentStatus).replace(/_/g, ' ')}
              </div>
              {s.customMessage && (
                <div className="text-[11px] text-white/55 truncate">{s.customMessage}</div>
              )}
            </div>
            {s.lastUpdatedAt && (
              <div className="text-[10px] text-white/40 tabular-nums shrink-0">
                {new Date(s.lastUpdatedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────
export default function SosPage() {
  const sos = useSos();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <SosCountdownOverlay
        phase={sos.phase}
        secondsRemaining={sos.secondsRemaining}
        visibilityMode={sos.activeSos?.visibilityMode ?? 'normal'}
        onCancel={() => void sos.cancelSos('User cancelled countdown')}
      />
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-6 pt-4 pb-24">
        <aside className="hidden lg:block sticky top-20 self-start">
          <LeftSidebar />
        </aside>

        <main className="min-w-0">
          <header className="mb-5">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500 text-4xl">
                sos
              </span>
              <div>
                <h1 className="text-2xl font-bold">SOS</h1>
                <p className="text-sm text-white/60">
                  Emergency command center · long-press the SOS tab anywhere for an instant silent alert
                </p>
              </div>
            </div>
          </header>

          <PanicPinStatus />
          <ActiveSosPanel />
          <ArmedSosButton />
          <QuickActions />
          <RecentHistory />
          <GuardiansFeed />

          <div className="mt-8 text-center">
            <Link
              href="/safety"
              className="text-sm text-white/60 hover:text-white underline"
            >
              ← Back to Safety hub
            </Link>
          </div>
        </main>

        <aside className="hidden lg:block sticky top-20 self-start">
          <RightSidebar />
        </aside>
      </div>
      <BottomNav />
    </div>
  );
}
