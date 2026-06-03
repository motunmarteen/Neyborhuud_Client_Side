'use client';

import Link from 'next/link';

type ProfileSnapPlusCardProps = {
  username: string;
  isOwnProfile: boolean;
  trustScore: number;
  trustLabel: string;
  level: number;
};

export function ProfileSnapPlusCard({
  username,
  isOwnProfile,
  trustScore,
  trustLabel,
  level,
}: ProfileSnapPlusCardProps) {
  const href = isOwnProfile ? '/huud-economy' : `/profile/${username}?tab=trust`;
  const eyebrow = isOwnProfile ? 'My Huud Score' : 'Huud Score';
  const title = isOwnProfile ? 'Trust, badges & HuudCoins' : `${trustLabel} · NeyborHuud credibility`;

  return (
    <Link
      href={href}
      className="mod-card flex items-center gap-3 rounded-2xl p-4 no-underline transition-opacity hover:opacity-95"
    >
      <div className="mod-inset flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          military_tech
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
          {title}
        </p>
        <p className="text-xs text-[var(--neu-text-muted)]">
          Level {level} · {trustLabel} · Score {trustScore}
        </p>
      </div>
      <span className="material-symbols-outlined shrink-0 text-[var(--neu-text-muted)]">chevron_right</span>
    </Link>
  );
}
