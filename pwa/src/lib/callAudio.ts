/**
 * Web Audio API synthesizer for zero-dependency call ringtones & dialtones.
 * Works offline, no external MP3 dependencies, never fails on 404s.
 */

class CallAudioManager {
  private ctx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private isRinging: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Plays a repeating pleasant telephone incoming ringtone.
   */
  public startIncomingRingtone(): void {
    if (this.isRinging) return;
    this.isRinging = true;

    // Trigger device vibration pattern if supported
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate([800, 400, 800, 400, 1000]);
      } catch (_) {}
    }

    const playChimeBurst = () => {
      const ctx = this.getAudioContext();
      if (!ctx || !this.isRinging) return;

      const now = ctx.currentTime;
      // Play a twin melodic chord: 440Hz (A4) and 480Hz (high B4)
      [440, 480].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.2);
      });
    };

    playChimeBurst();
    this.ringtoneInterval = setInterval(() => {
      if (!this.isRinging) {
        clearInterval(this.ringtoneInterval);
        return;
      }
      playChimeBurst();
    }, 2500);
  }

  /**
   * Plays a repeating outgoing telephone dial ringtone.
   */
  public startOutgoingDialtone(): void {
    if (this.isRinging) return;
    this.isRinging = true;

    const playDialTone = () => {
      const ctx = this.getAudioContext();
      if (!ctx || !this.isRinging) return;

      const now = ctx.currentTime;
      // Standard telephone dial ringtone pair: 440Hz & 480Hz
      [440, 480].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.setValueAtTime(0.12, now + 0.8);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.9);
      });
    };

    playDialTone();
    this.ringtoneInterval = setInterval(() => {
      if (!this.isRinging) {
        clearInterval(this.ringtoneInterval);
        return;
      }
      playDialTone();
    }, 3000);
  }

  /**
   * Stops all active ringtones and vibrations.
   */
  public stop(): void {
    this.isRinging = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(0);
      } catch (_) {}
    }
  }

  /**
   * Plays a quick descending call-ended tone.
   */
  public playCallEndedTone(): void {
    this.stop();
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }
}

export const callAudio = new CallAudioManager();
