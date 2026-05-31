'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { BRAND_MARK_SRC } from '@/lib/brand-assets';
import { resolveMediaUrl } from '@/lib/userAvatar';

/** Pin asset aspect (w / h) — from `neyborhuud-mark-light.png` (326×402) */
const MARK_ASPECT = 326 / 402;

/**
 * Blue disc on the brand mark (measured from PNG pixel bounds).
 * Avatar circle is centered on the disc and sized to fully cover the H/house artwork.
 */
const AVATAR = {
  centerX: 49.85,
  centerY: 40.42,
  /** Diameter as % of mark height */
  size: 52,
} as const;

type BrandPinSize = 'hero' | 'lg' | 'md' | 'marker' | 'sm' | 'xs';

const SIZE_HEIGHT: Record<BrandPinSize, number> = {
  hero: 116,
  lg: 90,
  md: 72,
  /** Map marker — matches prior MapPinAvatar `marker` tier */
  marker: 90,
  /** Compact pin for tight rows (composer, chips) */
  sm: 56,
  /** Bottom nav profile tab */
  xs: 36,
};

type BrandPinAvatarProps = {
  src?: string | null;
  alt?: string;
  fallbackInitial?: string;
  size?: BrandPinSize;
  className?: string;
  priority?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
};

/**
 * Official neyborhuud pin mark with user photo (or initial) in the logo disc —
 * same lockup as `/` landing, personalized for sidebar/profile.
 */
export function BrandPinAvatar({
  src,
  alt = 'Profile',
  fallbackInitial,
  size = 'hero',
  className = '',
  priority = false,
  onClick,
}: BrandPinAvatarProps) {
  const markHeight = SIZE_HEIGHT[size];
  const markWidth = Math.round(markHeight * MARK_ASPECT);
  const [imgError, setImgError] = useState(false);

  const resolvedSrc = src?.trim() ? resolveMediaUrl(src.trim()) : null;
  const showPhoto = !!(resolvedSrc && !imgError);
  const showInitial = !showPhoto && !!fallbackInitial;

  useEffect(() => {
    setImgError(false);
  }, [resolvedSrc]);

  const avatarSize = (AVATAR.size / 100) * markHeight;
  const shellClass = `relative inline-flex shrink-0 ${className}`;
  const shellStyle = { width: markWidth, height: markHeight };

  const markContent = (
    <>
      <Image
        src={BRAND_MARK_SRC}
        alt=""
        width={markWidth}
        height={markHeight}
        priority={priority}
        aria-hidden
        className="block h-full w-full object-contain drop-shadow-[0_4px_16px_rgba(0,111,53,0.28)]"
      />
      <div
        className="absolute z-10 overflow-hidden rounded-full bg-[#0000FF] ring-[3px] ring-white"
        style={{
          left: `${AVATAR.centerX}%`,
          top: `${AVATAR.centerY}%`,
          width: avatarSize,
          height: avatarSize,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {showPhoto ? (
          <img
            key={resolvedSrc}
            src={resolvedSrc!}
            alt={alt}
            className="h-full w-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : showInitial ? (
          <span
            className="flex h-full w-full items-center justify-center font-display text-white"
            style={{ fontSize: Math.round(avatarSize * 0.42), fontWeight: 800 }}
            aria-hidden
          >
            {fallbackInitial}
          </span>
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={`${shellClass} cursor-pointer border-0 bg-transparent p-0`}
        style={shellStyle}
        onClick={onClick}
        aria-label={`Change ${alt}`}
      >
        {markContent}
      </button>
    );
  }

  return (
    <div className={shellClass} style={shellStyle}>
      {markContent}
    </div>
  );
}
