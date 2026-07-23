'use client';

import { useEffect, useState, useId } from 'react';
import Image from 'next/image';
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
  const [imgError, setImgError] = useState(false);

  const resolvedSrc = src?.trim() ? resolveMediaUrl(src.trim()) : null;
  const showPhoto = !!(resolvedSrc && !imgError);
  const showInitial = !showPhoto && !!fallbackInitial;

  useEffect(() => {
    setImgError(false);
  }, [resolvedSrc]);

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
        <foreignObject x="0" y="0" width="100" height="115">
          {showPhoto ? (
            <div className="relative w-full h-full">
              <Image
                src={resolvedSrc!}
                alt={alt}
                fill
                priority={priority}
                sizes={`${s.w}px`}
                className="object-cover object-center"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full bg-brand-blue flex items-center justify-center pt-2 text-white">
              {showInitial ? (
                <span className="font-black" style={{ fontSize: '36px' }}>{fallbackInitial}</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '44px' }}>person</span>
              )}
            </div>
          )}
        </foreignObject>
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
