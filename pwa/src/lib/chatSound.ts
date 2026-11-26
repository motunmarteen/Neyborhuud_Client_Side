/**
 * The soft "pop" when a message lands in an open chat (owner 2026-11-26). Made on the phone
 * (no sound file to download). On by default; Settings → Notifications → Chat sounds turns it off.
 */

const KEY = 'nh_chat_sound';
let ctx: AudioContext | null = null;

export function chatSoundOn(): boolean {
  try {
    return window.localStorage.getItem(KEY) !== '0';
  } catch {
    return true;
  }
}

export function setChatSound(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* private mode: stays on for this visit */
  }
}

/** Two quick soft notes, rising: a bubble landing. `mine` is lower and shorter. */
export function playChatPop(mine = false) {
  if (typeof window === 'undefined' || !chatSoundOn()) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const now = ctx.currentTime;
    const notes = mine ? [520, 700] : [660, 990];
    notes.forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      const t = now + i * 0.07;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(mine ? 0.035 : 0.06, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  } catch {
    /* no sound: never block a message for it */
  }
}
