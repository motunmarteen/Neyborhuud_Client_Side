/**
 * Call ringtones via the Web Audio API — no audio files needed (works offline,
 * no asset hosting). Two patterns:
 *   - ring()     : incoming-call ringtone (callee) — two-tone, repeating.
 *   - ringback() : outgoing ringback (caller) — single softer tone, repeating.
 * Call stop() to silence either.
 */

type Osc = { ctx: AudioContext; timer: number };

let active: Osc | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  return new Ctor();
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
  // Resume in case the context starts suspended (autoplay policy).
  ctx.resume?.().catch(() => {});
  const periodMs = makePattern(ctx);
  const timer = window.setInterval(() => {
    // Re-schedule the pattern each period.
    if (active) makePattern(active.ctx);
  }, periodMs);
  active = { ctx, timer };
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

/** Stop whatever ringtone is playing. */
export function stop(): void {
  if (!active) return;
  window.clearInterval(active.timer);
  try {
    active.ctx.close();
  } catch {
    /* noop */
  }
  active = null;
}
