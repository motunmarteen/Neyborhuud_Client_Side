'use client';

import Image from 'next/image';
import { isBadgeImageIcon, resolveBadgeSymbol } from '@/lib/badgeIcon';

type BadgeIconProps = {
  icon?: string;
  earned?: boolean;
  size?: 'sm' | 'md';
  className?: string;
};

export function BadgeIcon({ icon, earned = true, size = 'md', className = '' }: BadgeIconProps) {
  const dim = size === 'sm' ? 'text-[20px]' : 'text-[22px]';
  const shell = size === 'sm' ? 'h-10 w-10 rounded-xl' : 'h-11 w-11 rounded-xl';

  if (isBadgeImageIcon(icon)) {
    return (
      <div
        className={`mod-inset flex shrink-0 items-center justify-center overflow-hidden ${shell} ${!earned ? 'opacity-40 grayscale' : ''} ${className}`.trim()}
      >
        <Image src={icon!} alt="" width={28} height={28} className="h-7 w-7 object-contain" />
      </div>
    );
  }

  return (
    <div
      className={`mod-inset flex shrink-0 items-center justify-center ${shell} ${!earned ? 'opacity-40 grayscale' : ''} ${className}`.trim()}
    >
      <span
        className={`material-symbols-outlined ${dim} text-primary`}
        style={{ fontVariationSettings: earned ? "'FILL' 1" : "'FILL' 0" }}
        aria-hidden
      >
        {resolveBadgeSymbol(icon)}
      </span>
    </div>
  );
}
