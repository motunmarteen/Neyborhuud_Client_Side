import React, { useId, useState } from 'react';

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

  const [imgError, setImgError] = useState(false);

  const resolvedSrc = src && src.trim() !== '' ? src.trim() : null;
  const showImage = !!(resolvedSrc && !imgError);
  const showInitial = !showImage && !!fallbackInitial;

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ width: s.w, height: s.h }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <svg viewBox="0 0 100 115" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
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
        <g clipPath={`url(#teardrop-clip-${uid})`}>
          <foreignObject x="0" y="0" width="100" height="115">
            {showImage ? (
              <img 
                src={resolvedSrc!} 
                alt={alt} 
                className="w-full h-full object-cover object-center" 
                onError={() => setImgError(true)}
              />
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
    </div>
  );
}
