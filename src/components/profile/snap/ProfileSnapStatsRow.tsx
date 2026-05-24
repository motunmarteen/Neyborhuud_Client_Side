'use client';

import Link from 'next/link';
import { formatProfileBirthday, getZodiacFromBirthday } from '@/lib/profileSnapHelpers';

type ProfileSnapStatsRowProps = {
  username: string;
  dateOfBirth?: string | null;
  huudCoins: number;
  followerCount: number;
  followingCount: number;
};

type StatChip = {
  key: string;
  icon: string;
  label: string;
  value: string;
  href?: string;
};

function StatChipCard({ chip }: { chip: StatChip }) {
  const inner = (
    <>
      <span className="auth-signup-location-peek__icon" aria-hidden>
        {chip.icon.startsWith('bi-') ? <i className={`bi ${chip.icon}`} /> : chip.icon}
      </span>
      <div className="min-w-0">
        <p className="auth-signup-location-peek__label">{chip.label}</p>
        <p className="auth-signup-location-peek__name truncate">{chip.value}</p>
      </div>
      {chip.href ? <span className="auth-signup-location-peek__chevron" aria-hidden>›</span> : null}
    </>
  );

  if (chip.href) {
    return (
      <Link href={chip.href} className="auth-signup-location-peek profile-auth-stat-chip no-underline">
        {inner}
      </Link>
    );
  }

  return <div className="auth-signup-location-peek profile-auth-stat-chip">{inner}</div>;
}

export function ProfileSnapStatsRow({
  username,
  dateOfBirth,
  huudCoins,
  followerCount,
  followingCount,
}: ProfileSnapStatsRowProps) {
  const birthday = formatProfileBirthday(dateOfBirth);
  const zodiac = getZodiacFromBirthday(dateOfBirth);

  const chips: StatChip[] = [
    ...(birthday ? [{ key: 'birthday', icon: '🎈', label: 'Birthday', value: birthday }] : []),
    {
      key: 'coins',
      icon: '🪙',
      label: 'HuudCoins',
      value: huudCoins.toLocaleString(),
      href: '/gamification/wallet',
    },
    ...(zodiac ? [{ key: 'zodiac', icon: zodiac.emoji, label: 'Sign', value: zodiac.sign }] : []),
    {
      key: 'linkers',
      icon: '👥',
      label: 'Linkers',
      value: followerCount.toLocaleString(),
      href: `/profile/${username}/followers`,
    },
    {
      key: 'linking',
      icon: 'bi-share',
      label: 'Linking',
      value: followingCount.toLocaleString(),
      href: `/profile/${username}/following`,
    },
  ];

  return (
    <div className="profile-auth-stat-row">
      {chips.map((chip) => (
        <StatChipCard key={chip.key} chip={chip} />
      ))}
    </div>
  );
}
