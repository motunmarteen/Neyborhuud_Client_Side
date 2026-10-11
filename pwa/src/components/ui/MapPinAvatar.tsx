import React, { useId } from 'react';
import { useImageOk } from '@/hooks/useImageOk';

type PinSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'marker' | '2xl';

interface MapPinAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackInitial?: string;
  size?: PinSize;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const SIZE_MAP: Record<PinSize, { w: number; h: number }> = {
  xs:     { w: 24,  h: 28 },
  sm:     { w: 34,  h: 39 },
  md:     { w: 44,  h: 51 },
  lg:     { w: 52,  h: 60 },
  xl:     { w: 60,  h: 69 },
  marker: { w: 90,  h: 104 },
  '2xl':  { w: 120, h: 138 },
};

export default function MapPinAvatar({
  src,
  alt = 'Profile',
  fallbackInitial,
  size = 'md',
  className = '',
  onClick,
}: MapPinAvatarProps) {
  const uid = useId();
  const s = SIZE_MAP[size];

  const resolvedSrc = src && src.trim() !== '' ? src.trim() : null;
  // Show the photo only once it has really loaded; otherwise the initial (or person icon).
  const showImage = useImageOk(resolvedSrc);
  const showInitial = !showImage && !!fallbackInitial;

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: s.w, height: s.h }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <svg viewBox="0 0 100 115" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={alt} overflow="hidden">
        <defs>
          <filter id={`shadow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity={0.15} />
          </filter>
          <clipPath id={`teardrop-clip-${uid}`}>
            <path d="M50 6 C25.6 6 6 25.6 6 50 C6 81.5 50 109 50 109 C50 109 94 81.5 94 50 C94 25.6 74.4 6 50 6 Z" />
          </clipPath>
        </defs>
        
        {/* Background / Shadow / White Pin Base */}
        <path 
          d="M50 6 C25.6 6 6 25.6 6 50 C6 81.5 50 109 50 109 C50 109 94 81.5 94 50 C94 25.6 74.4 6 50 6 Z" 
          fill="#ffffff" 
          filter={`url(#shadow-${uid})`}
        />
        
        {/* Image / Fallback Masked into Inset Teardrop */}
        {/*
          Native SVG drawing only. The photo used to sit in a <foreignObject> with an
          absolutely positioned <img>; Safari (iPhone) ignores the clip there and paints
          the photo full size over the page. <image> + clipPath clips correctly everywhere.
        */}
        <g clipPath={`url(#teardrop-clip-${uid})`}>
          {showImage ? (
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
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}
