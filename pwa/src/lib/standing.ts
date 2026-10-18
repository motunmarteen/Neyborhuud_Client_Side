/**
 * Phase 7 (owner go-ahead 2026-10-18): the level is the ⭐ Impact ladder, 6 levels.
 *
 * Impact grows only when neighbours confirm something useful (a report, help, a deal, a
 * return). HuudCredit is separate: it is what you spend. The server works the level out
 * (GET /gamification/stats `standing`); this list only names the rungs for the screens and
 * must match the server's LADDER (modules/gamification/impact.ts).
 */

export type Standing = {
  impact: number;
  level: number;
  name: string;
  emoji: string;
  unlock: string;
  next: { level: number; name: string; emoji: string; needs: number; unlock: string } | null;
  /** 0..1 towards the next level. */
  progress: number;
};

export const LADDER = [
  { level: 1, name: 'New Neighbour', emoji: '🌱', minImpact: 0, unlock: 'See your area and post' },
  { level: 2, name: 'Neighbour', emoji: '🌿', minImpact: 20, unlock: 'Sell in the market and vote in polls' },
  { level: 3, name: 'Helper', emoji: '🤝', minImpact: 100, unlock: 'Your confirmations of reports count more' },
  { level: 4, name: 'Trusted Neighbour', emoji: '🏅', minImpact: 300, unlock: 'Create events and get the trusted seller badge' },
  { level: 5, name: 'Area Champion', emoji: '🌳', minImpact: 800, unlock: 'Help review local reports and start community challenges' },
  { level: 6, name: 'Huud Elder', emoji: '🌲', minImpact: 2000, unlock: 'A special map marker and the Elder badge' },
] as const;

/** Ways Impact grows today (server IMPACT table). */
export const IMPACT_WAYS: { icon: string; title: string; amount: number }[] = [
  { icon: '🚨', title: 'Your report is confirmed by neighbours', amount: 30 },
  { icon: '🙋🏾', title: 'You help a neighbour who asked', amount: 25 },
  { icon: '🔎', title: 'You return a lost item', amount: 25 },
  { icon: '🤝🏾', title: 'You finish a marketplace deal', amount: 15 },
  { icon: '✅', title: 'You confirmed a report that turned out true', amount: 5 },
  { icon: '🙌🏾', title: 'Your tip helps return an item', amount: 5 },
];

export function rungFor(level: number | null | undefined) {
  const l = Math.min(6, Math.max(1, Math.round(Number(level) || 1)));
  return LADDER[l - 1];
}

/** "🌿 Neighbour" from whatever the server sent (standing or a bare level). */
export function levelLabel(s: { level?: number; name?: string; emoji?: string } | null | undefined): string {
  const r = rungFor(s?.level);
  return `${s?.emoji ?? r.emoji} ${s?.name ?? r.name}`;
}
