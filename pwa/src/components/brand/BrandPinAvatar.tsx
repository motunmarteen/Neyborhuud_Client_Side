'use client';

import { useId } from 'react';
import { useImageOk } from '@/hooks/useImageOk';
import { resolveMediaUrl } from '@/lib/userAvatar';

type BrandPinSize = 'hero' | 'lg' | 'md' | 'marker' | 'sm' | 'xs';

const SIZE_MAP: Record<BrandPinSize, { w: number; h: number }> = {
  hero:   { w: 94,  h: 116 },
  lg:     { w: 73,  h: 90  },
  md:     { w: 58,  h: 72  },
  marker: { w: 73,  h: 90  },
  sm:     { w: 45,  h: 56  },
  xs:     { w: 29,  h: 36  },
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

export function BrandPinAvatar({
  src,
  alt = 'Profile',
  fallbackInitial,
  size = 'hero',
  className = '',
  priority = false,
  onClick,
}: BrandPinAvatarProps) {
  const uid = useId();
  const s = SIZE_MAP[size];
  const resolvedSrc = src?.trim() ? resolveMediaUrl(src.trim()) : null;
  // Show the photo only once it has really loaded; otherwise the initial (or person icon).
  const showPhoto = useImageOk(resolvedSrc);
  const showInitial = !showPhoto && !!fallbackInitial;

  const shellClass = `relative inline-flex shrink-0 ${className}`;
  const shellStyle = { width: s.w, height: s.h };

  const markContent = (
    <svg viewBox="0 0 100 115" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id={`brand-shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity={0.15} />
        </filter>
        <clipPath id={`brand-clip-${uid}`}>
          <path d="M50 6 C25.6 6 6 25.6 6 50 C6 81.5 50 109 50 109 C50 109 94 81.5 94 50 C94 25.6 74.4 6 50 6 Z" />
        </clipPath>
      </defs>
      
      {/* Background / Shadow / White Pin Base */}
      <path 
        d="M50 6 C25.6 6 6 25.6 6 50 C6 81.5 50 109 50 109 C50 109 94 81.5 94 50 C94 25.6 74.4 6 50 6 Z" 
        fill="#ffffff" 
        filter={`url(#brand-shadow-${uid})`}
      />
      
      {/* Image / Fallback Masked into Inset Teardrop */}
      <g clipPath={`url(#brand-clip-${uid})`}>
        {/* Native SVG only: Safari (iPhone) does not clip a positioned <img> inside <foreignObject>. */}
        {showPhoto ? (
          <image
            href={resolvedSrc!}
            x="0"
            y="0"
            width="100"
            height="115"
            preserveAspectRatio="xMidYMid slice"
          >
            <title>{alt}</title>
          </image>
        ) : (
          <>
            <rect x="0" y="0" width="100" height="115" fill="#3B82C4" />
            {showInitial ? (
              <text x="50" y="58" textAnchor="middle" dominantBaseline="middle" fill="#ffffff" fontSize="40" fontWeight="900" fontFamily="var(--font-head)">
                {fallbackInitial}
              </text>
            ) : (
              <path d="M50 30a13 13 0 1 1 0 26a13 13 0 1 1 0-26Zm-24 52c2-13 12-20 24-20s22 7 24 20" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
            )}
          </>
        )}
      </g>
      
      {/* Crisp White Outer Border Ring */}
      <path 
        d="M50 6 C25.6 6 6 25.6 6 50 C6 81.5 50 109 50 109 C50 109 94 81.5 94 50 C94 25.6 74.4 6 50 6 Z" 
        fill="none" 
        stroke="#ffffff"
        strokeWidth="8" 
      />
    </svg>
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
