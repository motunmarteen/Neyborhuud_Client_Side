'use client';

import { useCallback, useEffect, useState } from 'react';
import { safetyService, type WellnessCheckIn } from '@/services/safety.service';
import socketService from '@/lib/socket';

const INTERVAL_OPTIONS = [
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
  { label: '4 hours', minutes: 240 },
  { label: '8 hours', minutes: 480 },
];

function minsUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'now';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function DashboardCheckInsPanel() {
  const [schedule, setSchedule] = useState<WellnessCheckIn | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intervalMinutes, setIntervalMinutes] = useState(120);

  const load = useCallback(async () => {
    try {
      const res = await safetyService.getActiveWellnessCheckIn();
      setSchedule(res.data?.schedule ?? null);
    } catch {
      setError('Could not load your check-in schedule.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live updates so a missed check-in (flagged by the backend sweep) shows
  // up here without the user needing to reopen the tab.
  useEffect(() => {
    const onUpdate = () => void load();
    const bind = () => {
      const socket = socketService.getSocket();
      socket?.on('checkin:update', onUpdate);
      socket?.on('checkin:missed', onUpdate);
      socket?.on('checkin:started', onUpdate);
      socket?.on('checkin:stopped', onUpdate);
    };
    const unbind = () => {
      const socket = socketService.getSocket();
      socket?.off('checkin:update', onUpdate);
      socket?.off('checkin:missed', onUpdate);
      socket?.off('checkin:started', onUpdate);
      socket?.off('checkin:stopped', onUpdate);
    };
    bind();
    const t = setTimeout(bind, 1000);
    return () => {
      unbind();
      clearTimeout(t);
    };
  }, [load]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="mod-card rounded-2xl p-6 text-center">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>Loading…</p>
      </div>
    );
  }

  const missed = (schedule?.missedCheckIns ?? 0) > 0;

  return (
    <div className="space-y-3">
      <div className="mod-card rounded-2xl p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-primary">Wellness check-ins</p>
        <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          Scheduled wellness pings to your guardians — separate from Safe Trips. Miss one and your
          guardians are notified. Missing <strong>3 in a row</strong> automatically triggers a silent SOS,
          the same as a missed Safe Trip check-in.
        </p>
      </div>

      {error && (
        <div className="mod-card rounded-2xl border border-brand-red/25 bg-brand-red/10 p-3 text-xs text-brand-red">
          {error}
        </div>
      )}

      {!schedule || schedule.status === 'stopped' ? (
        <div className="mod-card space-y-3 rounded-2xl p-4">
          <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Start a schedule</p>
          <div className="flex flex-wrap gap-2">
            {INTERVAL_OPTIONS.map((opt) => (
              <button
                key={opt.minutes}
                type="button"
                onClick={() => setIntervalMinutes(opt.minutes)}
                className={`mod-chip px-4 py-2 text-sm font-semibold ${
                  intervalMinutes === opt.minutes ? 'bg-primary text-white' : ''
                }`}
                style={intervalMinutes === opt.minutes ? undefined : { color: 'var(--neu-text-muted)' }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              // Starting a new schedule silently replaces any existing one
              // server-side (wellnessCheckInService.start() stops any
              // currently-active schedule before creating the new one) — if
              // there's a schedule object already on hand (e.g. a stopped
              // one from before), confirm first rather than silently
              // discarding whatever state it carried.
              if (schedule) {
                const ok = window.confirm(
                  'You already have a check-in schedule on file. Starting a new one will replace it. Continue?',
                );
                if (!ok) return;
              }
              void run(() => safetyService.startWellnessCheckIn(intervalMinutes));
            }}
            className="w-full rounded-2xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Start check-ins'}
          </button>
        </div>
      ) : (
        <div
          className="mod-card space-y-3 rounded-2xl border-2 p-4"
          style={{ borderColor: missed ? '#f97316' : 'transparent' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {schedule.status === 'paused' ? 'Paused' : 'Active'} — every{' '}
                {schedule.intervalMinutes >= 60
                  ? `${Math.round(schedule.intervalMinutes / 60)}h`
                  : `${schedule.intervalMinutes}m`}
              </p>
              {schedule.status === 'active' && (
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: schedule.escalationLevel >= 3 ? '#dc2626' : missed ? '#f97316' : 'var(--neu-text-muted)' }}
                >
                  {schedule.escalationLevel >= 3
                    ? `Missed ${schedule.missedCheckIns} in a row — a silent SOS was sent to your guardians. Check in now if you're okay.`
                    : missed
                    ? `Missed ${schedule.missedCheckIns} — guardians notified`
                    : `Next check-in due in ${minsUntil(schedule.nextCheckInDue)}`}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {schedule.status === 'active' && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => safetyService.submitWellnessCheckIn())}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  I&apos;m okay
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => safetyService.pauseWellnessCheckIn())}
                  className="mod-chip px-4 py-2 text-sm font-semibold"
                  style={{ color: 'var(--neu-text-muted)' }}
                >
                  Pause
                </button>
              </>
            )}
            {schedule.status === 'paused' && (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => safetyService.resumeWellnessCheckIn())}
                className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Resume
              </button>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => safetyService.stopWellnessCheckIn())}
              className="mod-chip px-4 py-2 text-sm font-semibold text-brand-red"
            >
              Stop
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
