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
    <div className="mx-auto w-[calc(100%-1.5rem)] max-w-[600px] py-1">
      <Link
        href={href}
        className="flex items-center gap-4 bg-gradient-to-r from-blue-50/65 via-indigo-50/40 to-slate-50 border border-blue-100/50 rounded-2xl p-4 no-underline transition-all hover:shadow-[0_4px_20px_rgba(59,130,246,0.06)] hover:scale-[1.005]"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm border border-blue-100/40">
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            military_tech
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">{eyebrow}</p>
          <p className="text-sm font-extrabold text-gray-800 mt-0.5">
            {title}
          </p>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            Level {level} · {trustLabel} · Score {trustScore}
          </p>
        </div>
        <span className="material-symbols-outlined shrink-0 text-gray-400">chevron_right</span>
      </Link>
    </div>
  );
}
