/**
 * Map sound (owner, 2026-10-15: "5D experience"): made in the browser with Web Audio, so no
 * audio files to download. Off until the person turns it on (🔊 on the map).
 *
 * - Street: a soft low hum, louder by day, quiet at night; now and then a distant horn by day.
 * - Rain: only when it is really raining where the map is; heavier in a storm, with far thunder.
 */
import type { MapWeather } from '@/lib/mapWeather';

const PREF_KEY = 'nh_map_sound';

export function soundPreferred(): boolean {
  try {
    return window.localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSoundPreferred(on: boolean): void {
  try {
    window.localStorage.setItem(PREF_KEY, on ? '1' : '0');
  } catch {
    /* storage blocked: this visit only */
  }
}

function noiseBuffer(ctx: AudioContext, brown: boolean): AudioBuffer {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

function loop(ctx: AudioContext, buf: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  src.start();
  return src;
}

export class AmbientSound {
  private ctx: AudioContext | null = null;
  private street: GainNode | null = null;
  private rain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private timers: number[] = [];
  private dark = 0;
  private wx: MapWeather | null = null;

  /** Must be called from a tap (browsers only allow sound after the person acts). */
  start() {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    this.ctx = ctx;

    // Street hum: brown noise through a low-pass filter.
    const hum = loop(ctx, noiseBuffer(ctx, true));
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    this.street = ctx.createGain();
    this.street.gain.value = 0;
    hum.connect(lp).connect(this.street).connect(ctx.destination);

    // Rain: white noise through a band-pass filter.
    const hiss = loop(ctx, noiseBuffer(ctx, false));
    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = 'bandpass';
    this.rainFilter.frequency.value = 2400;
    this.rainFilter.Q.value = 0.6;
    this.rain = ctx.createGain();
    this.rain.gain.value = 0;
    hiss.connect(this.rainFilter).connect(this.rain).connect(ctx.destination);

    this.apply();
    this.schedule();
  }

  stop() {
    for (const t of this.timers) window.clearTimeout(t);
    this.timers = [];
    void this.ctx?.close();
    this.ctx = null;
    this.street = this.rain = null;
    this.rainFilter = null;
  }

  /** dark: 0 day .. 1 night (from the sky); wx: the real weather or null. */
  update(dark: number, wx: MapWeather | null) {
    this.dark = dark;
    this.wx = wx;
    this.apply();
  }

  private apply() {
    const ctx = this.ctx;
    if (!ctx || !this.street || !this.rain || !this.rainFilter) return;
    const t = ctx.currentTime;
    const day = 1 - this.dark;
    this.street.gain.setTargetAtTime(0.035 + 0.09 * day, t, 1.5);
    const rainLevel = this.wx === 'storm' ? 0.22 : this.wx === 'rain' ? 0.14 : this.wx === 'drizzle' ? 0.06 : 0;
    this.rain.gain.setTargetAtTime(rainLevel, t, 2);
    this.rainFilter.frequency.setTargetAtTime(this.wx === 'drizzle' ? 3600 : 2200, t, 2);
  }

  /** Occasional horns by day and thunder in a storm. */
  private schedule() {
    const next = () => {
      if (!this.ctx) return;
      const ctx = this.ctx;
      if (this.wx === 'storm' && Math.random() < 0.35) this.thunder(ctx);
      else if (this.dark < 0.5 && Math.random() < 0.6) this.horn(ctx);
      this.timers.push(window.setTimeout(next, 6000 + Math.random() * 14000));
    };
    this.timers.push(window.setTimeout(next, 4000));
  }

  private horn(ctx: AudioContext) {
    const t = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1200; // far away
    const beeps = Math.random() < 0.5 ? 1 : 2;
    for (let i = 0; i < beeps; i++) {
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = 410 + Math.random() * 60;
      const start = t + i * 0.32;
      g.gain.setTargetAtTime(0.018, start, 0.01);
      g.gain.setTargetAtTime(0, start + 0.22, 0.03);
      o.connect(lp);
      o.start(start);
      o.stop(start + 0.3);
    }
    lp.connect(g).connect(ctx.destination);
  }

  private thunder(ctx: AudioContext) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx, true);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 160;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, t + 3.5);
    src.connect(lp).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + 3.6);
  }
}

/** Short buzz for a new nearby safety alert (phones that support it; Android, not iPhone). */
export function buzzForAlert() {
  try {
    navigator.vibrate?.([90, 60, 90]);
  } catch {
    /* not supported */
  }
}
