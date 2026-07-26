/**
 * Call ringtones via the Web Audio API — no audio files needed (works offline,
 * no asset hosting). Two patterns:
 *   - ring()     : incoming-call ringtone (callee) — two-tone, repeating.
 *   - ringback() : outgoing ringback (caller) — single softer tone, repeating.
 * Call stop() to silence either.
 */

type Osc = { timer: number };

let active: Osc | null = null;

// A single, long-lived AudioContext, created once (see unlockAudio()) at the
// earliest real user gesture in the app — not per-ring. An incoming call's
// "ring" fires from a socket event with no gesture behind it at all, so a
// context created at that moment can be born (and stay) suspended under
// autoplay policy, making the callee's phone silently never ring. Reusing a
// context that was already unlocked by an earlier tap sidesteps that.
let sharedCtx: AudioContext | null = null;

function getCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

/**
 * Call once on the first real user gesture (see providers.tsx) to create and
 * resume the shared AudioContext while we still have gesture privilege, so
 * later ring()/ringback() calls — which may fire with no gesture behind them
 * (an incoming call arrives over a socket event) — can reuse an already-
 * running context instead of trying to start one cold.
 */
export function unlockAudio(): void {
  if (sharedCtx) {
    sharedCtx.resume?.().catch(() => {});
    return;
  }
  const Ctor = getCtor();
  if (!Ctor) return;
  sharedCtx = new Ctor();
  sharedCtx.resume?.().catch(() => {});
}

function getCtx(): AudioContext | null {
  if (sharedCtx) return sharedCtx;
  const Ctor = getCtor();
  if (!Ctor) return null;
  sharedCtx = new Ctor();
  return sharedCtx;
}

/** Play a short tone burst. */
function beep(ctx: AudioContext, freq: number, start: number, duration: number, gain = 0.15) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.value = 0;
  osc.connect(g);
  g.connect(ctx.destination);
  const t0 = ctx.currentTime + start;
  // Soft attack/release to avoid clicks.
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.02);
  g.gain.setValueAtTime(gain, t0 + duration - 0.04);
  g.gain.linearRampToValueAtTime(0, t0 + duration);
  osc.start(t0);
  osc.stop(t0 + duration);
}

function startLoop(makePattern: (ctx: AudioContext) => number) {
  stop();
  const ctx = getCtx();
  if (!ctx) return;
  // Resume in case the context starts suspended (autoplay policy) — a no-op
  // if unlockAudio() already resumed it from a real gesture earlier.
  ctx.resume?.().catch(() => {});
  const periodMs = makePattern(ctx);
  const timer = window.setInterval(() => {
    // Re-schedule the pattern each period. Bail if the shared context has
    // gone away (e.g. closed by something else) rather than throwing.
    if (active && sharedCtx) makePattern(sharedCtx);
  }, periodMs);
  active = { timer };
}

/** Incoming-call ringtone (callee): classic two-tone, repeats every 3s. */
export function ring(): void {
  startLoop((ctx) => {
    beep(ctx, 480, 0, 0.4);
    beep(ctx, 620, 0.5, 0.4);
    return 3000;
  });
}

/** Outgoing ringback (caller): single softer tone, repeats every 3s. */
export function ringback(): void {
  startLoop((ctx) => {
    beep(ctx, 440, 0, 0.8, 0.08);
    return 3000;
  });
}

/**
 * Stop whatever ringtone is playing. Deliberately does NOT close the shared
 * AudioContext — it's reused across calls (see unlockAudio()) so a later
 * ring/ringback doesn't have to cold-start a new context without a gesture.
 */
export function stop(): void {
  if (!active) return;
  window.clearInterval(active.timer);
  active = null;
}
