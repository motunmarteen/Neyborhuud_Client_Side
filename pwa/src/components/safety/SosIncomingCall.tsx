'use client';

/**
 * The SOS call (owner 2026-11-27): when someone you protect presses SOS and you have NeyborHuud
 * open, your screen rings like an incoming call. Answer opens "Help them"; there's also Call 112.
 *
 * It's fed by the live socket ('safety:sos_alert', sent at each step until a guardian answers) and
 * by the push service worker (it posts every push it shows to open tabs). With the app closed, the
 * push notification itself rings and vibrates (service_worker/index.js).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import socketService from '@/lib/socket';
import { EMERGENCY_TEL } from '@/lib/emergency';

type Ring = { sosEventId: string; name: string; silent: boolean; message?: string };

const RING_FOR_MS = 40_000;
const VIBRATION = [900, 400, 900, 400, 900, 400, 900, 400, 900];

/** Two-tone ring made on the phone (no sound file), repeated every 2 s until stopped. */
function startRingtone(): () => void {
  let stopped = false;
  let ctx: AudioContext | null = null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  } catch {
    ctx = null;
  }
  const burst = () => {
    if (stopped || !ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime;
    [0, 0.45].forEach((offset) => {
      [880, 1175].forEach((freq) => {
        const osc = ctx!.createOscillator();
        const gain = ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, t0 + offset);
        gain.gain.exponentialRampToValueAtTime(0.18, t0 + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.38);
        osc.connect(gain).connect(ctx!.destination);
        osc.start(t0 + offset);
        osc.stop(t0 + offset + 0.4);
      });
    });
  };
  const vibrate = () => {
    try {
      navigator.vibrate?.(VIBRATION);
    } catch {
      /* not allowed before the user has touched the page */
    }
  };
  burst();
  vibrate();
  const a = window.setInterval(burst, 2000);
  const v = window.setInterval(vibrate, 6000);
  return () => {
    stopped = true;
    window.clearInterval(a);
    window.clearInterval(v);
    try {
      navigator.vibrate?.(0);
    } catch {
      /* ignore */
    }
    void ctx?.close().catch(() => undefined);
  };
}

export function SosIncomingCall() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';
  const [ring, setRing] = useState<Ring | null>(null);
  const stopRef = useRef<(() => void) | null>(null);
  const lastRef = useRef<Record<string, number>>({});
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setRing(null);
  }, []);

  const show = useCallback((r: Ring) => {
    if (!r.sosEventId) return;
    // Already on their Help page: no need to cover it.
    if (pathRef.current.startsWith(`/safety/help/${r.sosEventId}`)) return;
    // The socket and the push often arrive together for the same step.
    const now = Date.now();
    if (now - (lastRef.current[r.sosEventId] ?? 0) < 15_000) return;
    lastRef.current[r.sosEventId] = now;
    stopRef.current?.();
    stopRef.current = startRingtone();
    setRing(r);
  }, []);

  // Live socket.
  useEffect(() => {
    if (!user?.id) return;
    const onAlert = (p: Record<string, unknown>) => {
      if (String(p?.userId ?? '') === String(user.id)) return; // never ring the person in danger
      show({
        sosEventId: String(p?.sosEventId ?? ''),
        name: String(p?.userName ?? 'Someone you protect'),
        silent: p?.visibilityMode === 'silent',
        message: typeof p?.message === 'string' ? p.message : undefined,
      });
    };
    const bind = () => socketService.getSocket()?.on('safety:sos_alert', onAlert);
    bind();
    const socket = socketService.getSocket();
    socket?.on('connect', bind);
    return () => {
      socketService.getSocket()?.off('safety:sos_alert', onAlert);
      socket?.off('connect', bind);
    };
  }, [user?.id, show]);

  // Pushes the service worker showed while a tab is open.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    const onMsg = (e: MessageEvent) => {
      const m = e.data as { kind?: string; type?: string; data?: Record<string, unknown>; title?: string } | null;
      if (m?.kind !== 'nh-push' || !m.data?.sosEventId) return;
      if (!['sos', 'sos_alert', 'sos_escalated', 'sos_ring'].includes(String(m.type))) return;
      show({
        sosEventId: String(m.data.sosEventId),
        name: typeof m.data.userName === 'string' && m.data.userName ? m.data.userName : 'Someone you protect',
        silent: m.data.visibilityMode === 'silent',
        message: m.type === 'sos_ring' ? 'Still no answer' : undefined,
      });
    };
    navigator.serviceWorker.addEventListener('message', onMsg);
    return () => navigator.serviceWorker.removeEventListener('message', onMsg);
  }, [show]);

  // Stop ringing after a while; the alert stays in Sentinel > SOS > Circle.
  useEffect(() => {
    if (!ring) return;
    const t = window.setTimeout(stop, RING_FOR_MS);
    return () => window.clearTimeout(t);
  }, [ring, stop]);

  useEffect(() => () => stopRef.current?.(), []);

  if (!ring) return null;
  const first = ring.name.split(' ')[0];

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-call-title"
      className="fixed inset-0 z-[120] flex flex-col items-center justify-between bg-[#B3261E] px-6 text-white"
      style={{ paddingTop: 'calc(var(--safe-top, 0px) + 56px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}
    >
      <div className="flex flex-col items-center text-center">
        <p className="text-[14px] font-bold uppercase tracking-[0.12em] text-white/80">SOS call</p>
        <div className="relative mt-8 grid h-32 w-32 place-items-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-white/25 motion-reduce:animate-none" aria-hidden />
          <span className="absolute inset-3 rounded-full bg-white/20" aria-hidden />
          <span className="material-symbols-outlined relative text-[64px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>
            sos
          </span>
        </div>
        <h2 id="sos-call-title" className="mt-8 font-heading text-[28px] font-extrabold leading-tight">
          {ring.name} needs help
        </h2>
        <p className="mt-2 max-w-xs text-[15px] text-white/90">
          {ring.message && /Still no answer/i.test(ring.message) ? 'Nobody has answered yet. ' : ''}
          {ring.silent ? 'Silent SOS: don’t call them.' : 'They pressed SOS just now.'}
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            const id = ring.sosEventId;
            stop();
            router.push(`/safety/help/${id}?respond=1`);
          }}
          className="flex min-h-[60px] items-center justify-center gap-2 rounded-full bg-white text-[18px] font-extrabold text-[#B3261E] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden>call</span>
          Answer: help {first}
        </button>
        <a
          href={EMERGENCY_TEL}
          onClick={stop}
          className="flex min-h-12 items-center justify-center rounded-full bg-white/15 text-[16px] font-bold text-white ring-1 ring-inset ring-white/40"
        >
          Call 112
        </a>
        <button type="button" onClick={stop} className="min-h-11 text-[15px] font-semibold text-white/80">
          Can&apos;t answer now
        </button>
      </div>
    </div>
  );
}
