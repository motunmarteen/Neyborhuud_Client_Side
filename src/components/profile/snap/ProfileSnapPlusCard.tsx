'use client';

import Link from 'next/link';

type ProfileSnapPlusCardProps = {
  isOwnProfile: boolean;
  trustScore: number;
  trustLabel: string;
  level: number;
};

export function ProfileSnapPlusCard({
  isOwnProfile,
  trustScore,
  trustLabel,
  level,
}: ProfileSnapPlusCardProps) {
  return (
    <Link
      href={isOwnProfile ? '/gamification/wallet' : '/gamification'}
      className="auth-flow-hero-card no-underline transition-opacity hover:opacity-95"
    >
      <span className="auth-flow-hero-card__icon" aria-hidden>
        <i className="bi bi-stars" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="auth-flow-hero-card__eyebrow">Huud+</p>
        <p className="auth-flow-hero-card__title">
          {isOwnProfile ? 'Your Trust & Rewards hub' : 'NeyborHuud credibility'}
        </p>
        <p className="auth-flow-hero-card__meta">
          Level {level} · {trustLabel} · Score {trustScore} — HuudCoins, badges & neighbour trust
        </p>
      </div>
      <span className="material-symbols-outlined text-[var(--neu-text-muted)]">chevron_right</span>
    </Link>
  );
}
