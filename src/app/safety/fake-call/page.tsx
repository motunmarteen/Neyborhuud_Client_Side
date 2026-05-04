'use client';

/**
 * Fake Call — stage an incoming call to escape uncomfortable situations.
 *
 * Flow:
 *   1. User picks caller name + delay (5s / 15s / 30s / 1m)
 *   2. Page hides everything, shows full-screen "incoming call" UI after the delay
 *   3. User taps Accept → mock conversation runs (timer ticks); Decline → return to chooser
 *
 * No backend involvement — purely client-side. Audio is a small data-URI tone
 * to avoid bundling a ringtone asset; users with sound off still get the visual.
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import LeftSidebar from '@/components/navigation/LeftSidebar';
import RightSidebar from '@/components/navigation/RightSidebar';
import { BottomNav } from '@/components/feed/BottomNav';

export const dynamic = 'force-dynamic';

type Phase = 'setup' | 'waiting' | 'ringing' | 'in-call';

const PRESET_CALLERS = [
  { name: 'Mum', subtitle: 'Mobile' },
  { name: 'Dad', subtitle: 'Mobile' },
  { name: 'Boss', subtitle: 'Work' },
  { name: 'Spouse', subtitle: 'Mobile' },
  { name: 'Doctor', subtitle: 'Clinic' },
];

const DELAY_OPTIONS = [
  { label: 'Now',  ms: 0 },
  { label: '5s',   ms: 5_000 },
  { label: '15s',  ms: 15_000 },
  { label: '30s',  ms: 30_000 },
  { label: '1m',   ms: 60_000 },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Generate a short ringtone-ish tone using Web Audio API. Returns a stop fn.
 * Looped two-tone pattern to feel like a phone ring.
 */
function startRingtone(): () => void {
  if (typeof window === 'undefined') return () => undefined;
  let ctx: AudioContext | null = null;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();
  } catch {
    return () => undefined;
  }
  const audioCtx = ctx;
  let stopped = false;
  const playBeep = (freq: number, when: number, dur: number) => {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, audioCtx.currentTime + when);
    gain.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + when + 0.02);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + when + dur);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start(audioCtx.currentTime + when);
    osc.stop(audioCtx.currentTime + when + dur + 0.05);
  };
  const cycle = () => {
    if (stopped || !audioCtx) return;
    playBeep(440, 0,    0.35);
    playBeep(480, 0.4,  0.35);
    setTimeout(cycle, 1500);
  };
  cycle();
  return () => {
    stopped = true;
    try { audioCtx?.close(); } catch { /* noop */ }
  };
}

export default function FakeCallPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('setup');
  const [callerName, setCallerName] = useState('Mum');
  const [callerSubtitle, setCallerSubtitle] = useState('Mobile');
  const [customName, setCustomName] = useState('');
  const [delayMs, setDelayMs] = useState<number>(5_000);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [callDurationSec, setCallDurationSec] = useState(0);

  const ringtoneStopRef = useRef<(() => void) | null>(null);
  const waitTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      ringtoneStopRef.current?.();
      if (waitTimerRef.current) clearInterval(waitTimerRef.current);
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, []);

  const startScheduled = () => {
    const finalName = customName.trim() || callerName;
    setCallerName(finalName);

    if (delayMs === 0) {
      beginRinging();
      return;
    }
    setPhase('waiting');
    setSecondsLeft(Math.ceil(delayMs / 1000));
    waitTimerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (waitTimerRef.current) clearInterval(waitTimerRef.current);
          beginRinging();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const beginRinging = () => {
    setPhase('ringing');
    ringtoneStopRef.current = startRingtone();
    // Try to vibrate (mobile only)
    try { navigator.vibrate?.([800, 400, 800, 400, 800]); } catch { /* noop */ }
  };

  const acceptCall = () => {
    ringtoneStopRef.current?.();
    ringtoneStopRef.current = null;
    setPhase('in-call');
    setCallDurationSec(0);
    callTimerRef.current = setInterval(() => {
      setCallDurationSec((s) => s + 1);
    }, 1000);
  };

  const endCall = () => {
    ringtoneStopRef.current?.();
    ringtoneStopRef.current = null;
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    setPhase('setup');
    setSecondsLeft(0);
    setCallDurationSec(0);
  };

  const cancelWait = () => {
    if (waitTimerRef.current) clearInterval(waitTimerRef.current);
    setPhase('setup');
    setSecondsLeft(0);
  };

  // ── Ringing / In-call full-screen overlay ─────────────────────────────────
  if (phase === 'ringing' || phase === 'in-call') {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="text-xs uppercase tracking-widest text-white/50 mb-2">
            {phase === 'ringing' ? 'Incoming call' : 'On call'}
          </div>
          <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-white/80 text-6xl">person</span>
          </div>
          <div className="text-3xl font-semibold">{callerName}</div>
          <div className="text-sm text-white/60 mt-1">{callerSubtitle}</div>
          {phase === 'in-call' && (
            <div className="mt-4 text-base text-green-400 font-mono">{formatDuration(callDurationSec)}</div>
          )}
          {phase === 'ringing' && (
            <div className="mt-6 text-sm text-white/40 animate-pulse">Ringing…</div>
          )}
        </div>

        <div className="pb-12 px-8">
          {phase === 'ringing' ? (
            <div className="flex items-center justify-around">
              <button
                type="button"
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-2xl"
                aria-label="Decline"
              >
                <span className="material-symbols-outlined text-white text-3xl">call_end</span>
              </button>
              <button
                type="button"
                onClick={acceptCall}
                className="w-16 h-16 rounded-full bg-green-600 hover:bg-green-500 flex items-center justify-center shadow-2xl animate-pulse"
                aria-label="Accept"
              >
                <span className="material-symbols-outlined text-white text-3xl">call</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center shadow-2xl"
                aria-label="End call"
              >
                <span className="material-symbols-outlined text-white text-3xl">call_end</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Setup screen ──────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 pt-4 pb-20">
        <button
          type="button"
          onClick={() => router.push('/safety')}
          className="text-sm text-white/60 hover:text-white mb-4 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span> Sentinel
        </button>

        <header className="mb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-green-400 text-4xl">phone_in_talk</span>
            <div>
              <h1 className="text-2xl font-bold">Fake Call</h1>
              <p className="text-sm text-white/60">Stage an incoming call to leave a situation.</p>
            </div>
          </div>
        </header>

        {phase === 'waiting' && (
          <div className="rounded-xl border border-yellow-500/40 bg-yellow-950/40 p-4 mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-yellow-200">Call coming in {secondsLeft}s…</div>
              <div className="text-xs text-yellow-300/80">From {callerName}</div>
            </div>
            <button
              type="button"
              onClick={cancelWait}
              className="px-3 py-1.5 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-white text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-2">Caller</h2>
          <div className="grid grid-cols-2 gap-2">
            {PRESET_CALLERS.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  setCallerName(c.name);
                  setCallerSubtitle(c.subtitle);
                  setCustomName('');
                }}
                className={`rounded-xl neu-card p-3 text-left ${
                  callerName === c.name && !customName ? 'ring-2 ring-green-500' : ''
                }`}
              >
                <div className="text-sm font-medium">{c.name}</div>
                <div className="text-xs text-white/50">{c.subtitle}</div>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Or type a custom name…"
            className="mt-3 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-semibold mb-2">When to ring</h2>
          <div className="flex gap-2 flex-wrap">
            {DELAY_OPTIONS.map((d) => (
              <button
                key={d.ms}
                type="button"
                onClick={() => setDelayMs(d.ms)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  delayMs === d.ms
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </section>

        <button
          type="button"
          onClick={startScheduled}
          disabled={phase === 'waiting'}
          className="w-full rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-3 text-base"
        >
          {delayMs === 0 ? 'Ring now' : `Schedule call`}
        </button>

        <p className="mt-6 text-xs text-white/40 leading-relaxed">
          The fake call runs only on this device. No data is sent. If your phone is on silent,
          the visual call screen still appears.
        </p>
          </div>
        </main>
        <RightSidebar />
      </div>
      <BottomNav />
    </div>
  );
}
