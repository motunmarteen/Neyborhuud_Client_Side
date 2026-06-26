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
    <div className="flex flex-col justify-between bg-gray-50/50 hover:bg-gray-50/80 border border-gray-100/50 rounded-2xl p-4 transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.02)] min-h-[96px] h-full cursor-pointer group">
      <div className="flex items-center justify-between">
        <span className="text-xl filter drop-shadow-sm select-none">{icon}</span>
        {href && (
          <span className="material-symbols-outlined text-[16px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
            arrow_forward
          </span>
        )}
      </div>
      <div className="mt-2.5">
        <p className="text-lg font-extrabold tracking-tight text-gray-900 leading-tight tabular-nums">
          {value}
        </p>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{label}</p>
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
