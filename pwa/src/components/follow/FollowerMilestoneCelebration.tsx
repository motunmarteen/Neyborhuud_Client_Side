'use client';

/**
 * FollowerMilestoneCelebration
 *
 * Full-screen overlay that plays a tier-appropriate confetti/fireworks animation
 * and shows the milestone card with HC reward.
 *
 * Tier 1 (≤100)   – soft confetti shower
 * Tier 2 (≤1k)    – big burst + side cannons
 * Tier 3 (≤10k)   – cannon burst + gold stars
 * Tier 4 (≤100k)  – mega fireworks (multiple bursts)
 * Tier 5 (1M+)    – legendary full-screen explosion
 */

import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

export interface MilestonePayload {
  count: number;
  label: string;
  emoji: string;
  hcAwarded: number;
  celebrationTier: 1 | 2 | 3 | 4 | 5;
}

interface Props {
  milestone: MilestonePayload;
  onDismiss: () => void;
}

// ─── Tier Colour Palettes ───────────────────────────────────────────────────

const TIER_COLORS: Record<number, string[][]> = {
  1: [['#a8edea', '#fed6e3', '#ffffff']],
  2: [['#f9d423', '#ff4e50', '#ffffff', '#43e97b']],
  3: [['#ffd700', '#ff6b35', '#ffffff', '#00d2ff']],
  4: [['#ffd700', '#ff0080', '#7928ca', '#ffffff', '#00d2ff']],
  5: [['#ffd700', '#ff0080', '#7928ca', '#ff6600', '#00ff88', '#ffffff']],
};

// ─── Firework helper ────────────────────────────────────────────────────────

function fireFirework(colors: string[]) {
  const origin = {
    x: Math.random() * 0.6 + 0.2,
    y: Math.random() * 0.4 + 0.1,
  };
  confetti({
    particleCount: 80,
    spread: 360,
    startVelocity: 35,
    gravity: 0.5,
    ticks: 200,
    origin,
    colors,
    shapes: ['star', 'circle'],
  });
}

function launchTier(tier: 1 | 2 | 3 | 4 | 5) {
  const colors = TIER_COLORS[tier][0];

  if (tier === 1) {
    // Gentle shower from top
    confetti({
      particleCount: 60,
      angle: 90,
      spread: 80,
      origin: { x: 0.5, y: 0 },
      colors,
      gravity: 0.6,
      ticks: 180,
    });
    return;
  }

  if (tier === 2) {
    // Burst + side cannons
    confetti({ particleCount: 100, angle: 60,  spread: 55, origin: { x: 0, y: 0.65 }, colors });
    confetti({ particleCount: 100, angle: 120, spread: 55, origin: { x: 1, y: 0.65 }, colors });
    setTimeout(() => confetti({ particleCount: 80, spread: 360, origin: { x: 0.5, y: 0.5 }, colors, shapes: ['star'] }), 300);
    return;
  }

  if (tier === 3) {
    // 3-wave cannon + gold stars
    confetti({ particleCount: 120, angle: 60,  spread: 60, startVelocity: 55, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 120, angle: 120, spread: 60, startVelocity: 55, origin: { x: 1, y: 0.7 }, colors });
    setTimeout(() => {
      confetti({ particleCount: 60, spread: 360, origin: { x: 0.5, y: 0.4 }, colors, shapes: ['star'] });
      confetti({ particleCount: 60, spread: 360, origin: { x: 0.3, y: 0.3 }, colors, shapes: ['star'] });
      confetti({ particleCount: 60, spread: 360, origin: { x: 0.7, y: 0.3 }, colors, shapes: ['star'] });
    }, 400);
    return;
  }

  if (tier === 4) {
    // Mega fireworks — 5 explosions in sequence
    for (let i = 0; i < 5; i++) {
      setTimeout(() => fireFirework(colors), i * 350);
    }
    setTimeout(() => {
      confetti({ particleCount: 200, spread: 160, angle: 90, origin: { x: 0.5, y: 0.4 }, colors, gravity: 0.4 });
    }, 1800);
    return;
  }

  // Tier 5 — legendary: 10 fireworks + full rain
  for (let i = 0; i < 10; i++) {
    setTimeout(() => fireFirework(colors), i * 250);
  }
  setTimeout(() => {
    confetti({ particleCount: 300, spread: 200, angle: 90, origin: { x: 0.5, y: 0 }, colors, gravity: 0.3, ticks: 400 });
    confetti({ particleCount: 300, spread: 200, angle: 90, origin: { x: 0.2, y: 0 }, colors, gravity: 0.3, ticks: 400 });
    confetti({ particleCount: 300, spread: 200, angle: 90, origin: { x: 0.8, y: 0 }, colors, gravity: 0.3, ticks: 400 });
  }, 2600);
}

// ─── Tier UI ─────────────────────────────────────────────────────────────────

const TIER_STYLES: Record<number, { bg: string; border: string; title: string; sub: string }> = {
  1: { bg: 'bg-gradient-to-br from-emerald-400 to-teal-500',    border: 'border-primary/30', title: 'text-white', sub: 'text-white/70' },
  2: { bg: 'bg-gradient-to-br from-yellow-400 to-orange-500',  border: 'border-status-warning/60', title: 'text-white', sub: 'text-white/70' },
  3: { bg: 'bg-gradient-to-br from-brand-blue to-purple-600',  border: 'border-brand-blue/40',    title: 'text-white', sub: 'text-white/70' },
  4: { bg: 'bg-gradient-to-br from-purple-600 to-pink-600',    border: 'border-white/30',         title: 'text-white', sub: 'text-white/70' },
  5: { bg: 'bg-gradient-to-br from-yellow-400 via-pink-500 to-purple-700', border: 'border-white/40', title: 'text-white', sub: 'text-white/70' },
};

const TIER_LABELS: Record<number, string> = {
  1: 'Growing!',
  2: 'Buzzing!',
  3: 'You\'re Famous!',
  4: 'NeyborHuud Legend!',
  5: '🌟 ONE IN A MILLION 🌟',
};

export default function FollowerMilestoneCelebration({ milestone, onDismiss }: Props) {
  const hasLaunched = useRef(false);
  const style = TIER_STYLES[milestone.celebrationTier];

  useEffect(() => {
    if (hasLaunched.current) return;
    hasLaunched.current = true;
    launchTier(milestone.celebrationTier);

    // Auto-dismiss after 8s for tier 1-2, 12s for tier 3+
    const delay = milestone.celebrationTier <= 2 ? 8000 : 12000;
    const timer = setTimeout(onDismiss, delay);
    return () => clearTimeout(timer);
  }, [milestone.celebrationTier, onDismiss]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <div
        className={`relative mx-4 max-w-sm w-full rounded-3xl border-2 ${style.border} ${style.bg} p-8 text-center shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Emoji */}
        <div className="text-7xl mb-3 animate-bounce">{milestone.emoji}</div>

        {/* Tier label */}
        <p className={`text-sm font-semibold uppercase tracking-widest mb-1 ${style.sub}`}>
          {TIER_LABELS[milestone.celebrationTier]}
        </p>

        {/* Main title */}
        <h2 className={`text-3xl font-extrabold mb-2 ${style.title}`}>
          {milestone.label}
        </h2>

        {/* HC reward */}
        <div className="flex items-center justify-center gap-2 my-4">
          <span className="text-2xl">🪙</span>
          <span className={`text-2xl font-bold ${style.title}`}>
            +{milestone.hcAwarded.toLocaleString()} HC
          </span>
        </div>

        <p className={`text-sm ${style.sub} mb-6`}>
          HuudCoins have been added to your wallet!
        </p>

        <button
          onClick={onDismiss}
          className="w-full rounded-2xl bg-white/20 hover:bg-white/30 transition-colors py-3 font-semibold text-white text-base"
        >
          Celebrate! 🎉
        </button>
      </div>
    </div>
  );
}
