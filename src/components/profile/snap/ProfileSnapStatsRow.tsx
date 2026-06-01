'use client';

import Link from 'next/link';
import { formatProfileBirthday, getZodiacFromBirthday } from '@/lib/profileSnapHelpers';

type ProfileSnapStatsRowProps = {
  username: string;
  isOwnProfile?: boolean;
  dateOfBirth?: string | null;
  huudCoins: number;
  followerCount: number;
  followingCount: number;
};

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <div className="mod-card flex items-center gap-3 rounded-xl p-3">
      <div className="mod-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
        <span className="text-lg leading-none">{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-extrabold tabular-nums" style={{ color: 'var(--neu-text)' }}>
          {value}
        </p>
        <p className="text-xs text-[var(--neu-text-muted)]">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline transition-opacity hover:opacity-90">
        {inner}
      </Link>
    );
  }

  return inner;
}

export function ProfileSnapStatsRow({
  username,
  isOwnProfile = false,
  dateOfBirth,
  huudCoins,
  followerCount,
  followingCount,
}: ProfileSnapStatsRowProps) {
  const birthday = isOwnProfile ? formatProfileBirthday(dateOfBirth) : null;
  const zodiac = isOwnProfile ? getZodiacFromBirthday(dateOfBirth) : null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {birthday ? <StatCard icon="🎈" label="Birthday" value={birthday} /> : null}
      <StatCard
        icon="🪙"
        label="HuudCoins"
        value={huudCoins.toLocaleString()}
        href={isOwnProfile ? '/gamification/wallet' : undefined}
      />
      {zodiac ? <StatCard icon={zodiac.emoji} label="Sign" value={zodiac.sign} /> : null}
      <StatCard
        icon="👥"
        label="Followers"
        value={followerCount.toLocaleString()}
        href={`/profile/${username}/followers`}
      />
      <StatCard
        icon="↔"
        label="Following"
        value={followingCount.toLocaleString()}
        href={`/profile/${username}/following`}
      />
    </div>
  );
}
