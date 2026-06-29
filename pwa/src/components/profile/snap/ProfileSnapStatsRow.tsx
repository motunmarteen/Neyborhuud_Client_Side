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
  vouchReceived?: number;
  vouchGiven?: number;
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
    <div className="flex items-center gap-3 py-2 px-3 bg-[#F4F5F6] hover:bg-[#EAEBED] rounded-xl transition-colors cursor-pointer group">
      <span className="text-lg filter drop-shadow-sm select-none shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[13px] font-extrabold tracking-tight text-slate-800 leading-none tabular-nums truncate">
          {value}
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
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
  vouchReceived = 0,
  vouchGiven = 0,
}: ProfileSnapStatsRowProps) {
  const birthday = isOwnProfile ? formatProfileBirthday(dateOfBirth) : null;
  const zodiac = isOwnProfile ? getZodiacFromBirthday(dateOfBirth) : null;

  return (
    <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] py-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {birthday ? <StatCard icon="🎈" label="Birthday" value={birthday} /> : null}
        <StatCard
          icon="🪙"
          label="HuudCoins"
          value={huudCoins.toLocaleString()}
          href={isOwnProfile ? '/huud-economy/wallet' : undefined}
        />
        <StatCard
          icon="🤜"
          label="Vouches"
          value={vouchReceived.toLocaleString()}
          href={`/profile/${username}?tab=trust`}
        />
        {isOwnProfile ? (
          <StatCard
            icon="🤝"
            label="Vouches Given"
            value={vouchGiven.toLocaleString()}
            href={`/profile/${username}?tab=trust`}
          />
        ) : null}
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
    </div>
  );
}
