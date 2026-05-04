'use client';

import React, { useId, useState } from 'react';

/**
 * MapPinAvatar — User avatar rendered inside a map-pin / teardrop shape.
 *
 * Architecture:
 *  - SVG handles the pin shape, colored border, white ring, and initial-letter fallback.
 *  - A regular HTML <img> is positioned absolutely over the circle area.
 *    This avoids all SVG <image> limitations (CORS, unreliable onError, caching,
 *    relative URL resolution issues).
 */

type PinSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'marker' | '2xl';

interface MapPinAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackInitial?: string;
  size?: PinSize;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/*
 * width × height in CSS pixels for each size tier.
 * Aspect ratio is always 100:128.
 */
const SIZE_MAP: Record<PinSize, { w: number; h: number; initialFontSize: number }> = {
  xs:     { w: 24,  h: 31,  initialFontSize: 9  },
  sm:     { w: 34,  h: 44,  initialFontSize: 12 },
  md:     { w: 44,  h: 56,  initialFontSize: 16 },
  lg:     { w: 52,  h: 67,  initialFontSize: 18 },
  xl:     { w: 60,  h: 77,  initialFontSize: 22 },
  marker: { w: 90,  h: 116, initialFontSize: 32 },
  '2xl':  { w: 120, h: 154, initialFontSize: 40 },
};

/* SVG viewBox constants — do not change, they define the pin geometry */
const VB_W   = 100;
const VB_H   = 128;
const CX     = 50;        // circle centre X in viewBox units
const CY     = 42;        // circle centre Y in viewBox units
const R      = 40;        // outer circle radius
const INNER_R = R * 0.82; // white-ring radius
const PHOTO_R = R * 0.72; // photo circle radius  (28.8 vu)
const TIP_Y  = 122;       // pin-tip Y

const PIN_PATH = `
  M ${CX - R} ${CY}
  A ${R} ${R} 0 1 1 ${CX + R} ${CY}
  Q ${CX + R} ${TIP_Y * 0.72} ${CX} ${TIP_Y}
  Q ${CX - R} ${TIP_Y * 0.72} ${CX - R} ${CY}
  Z
`;

export default function MapPinAvatar({
  src,
  alt = 'User',
  fallbackInitial,
  size = 'md',
  className = '',
  onClick,
  onError,
}: MapPinAvatarProps) {
  const uid = useId();
  const s = SIZE_MAP[size];
  const [imgError, setImgError] = useState(false);

  // Resolve a clean, non-empty src string
  const resolvedSrc = src && src.trim() !== '' ? src.trim() : null;
  const showImage   = !!(resolvedSrc && !imgError);
  const showInitial = !showImage && !!fallbackInitial;

  /*
   * Map SVG viewBox coords → CSS pixel coords for the HTML <img>.
   * SVG scales uniformly: scaleX = s.w / VB_W, scaleY = s.h / VB_H.
   */
  const scaleX  = s.w / VB_W;
  const scaleY  = s.h / VB_H;
  const imgSize = Math.round(PHOTO_R * 2 * scaleX);   // diameter in px
  const imgLeft = Math.round((CX - PHOTO_R) * scaleX); // left offset in px
  const imgTop  = Math.round((CY - PHOTO_R) * scaleY); // top offset in px

  return (
    <div
      className={`relative inline-flex flex-shrink-0 ${className}`}
      style={{ width: s.w, height: s.h }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* ── SVG layer: pin shape + white ring + initial fallback ── */}
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width={s.w}
        height={s.h}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden={showImage ? true : undefined}
        aria-label={!showImage ? alt : undefined}
        style={{ display: 'block', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.30))' }}
      >
        {/* 1. Coloured pin body */}
        <path d={PIN_PATH} fill="var(--pin-color, #11d473)" />

        {/* 2. White ring */}
        <circle cx={CX} cy={CY} r={INNER_R} fill="white" />

        {/* 3. Tinted circle + initial letter (shown only when no photo) */}
        {!showImage && (
          <>
            <circle cx={CX} cy={CY} r={PHOTO_R} fill="var(--pin-color, #11d473)" opacity={0.12} />
            {showInitial && (
              <text
                x={CX}
                y={CY}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={s.initialFontSize}
                fontWeight="bold"
                fill="var(--pin-color, #11d473)"
              >
                {fallbackInitial}
              </text>
            )}
          </>
        )}
      </svg>

      {/* ── HTML <img> layer: positioned exactly over the SVG circle ──
           Using a real <img> instead of SVG <image> gives us:
           • Proper CORS handling (same pipeline as any page image)
           • Reliable onError that fires in all browsers (Chrome/Firefox/Safari)
           • Browser image cache reuse
           • Correct relative-URL resolution                            */}
      {showImage && (
        <img
          src={resolvedSrc!}
          alt={alt}
          style={{
            position:     'absolute',
            left:         imgLeft,
            top:          imgTop,
            width:        imgSize,
            height:       imgSize,
            borderRadius: '50%',
            objectFit:    'cover',
            display:      'block',
            pointerEvents: 'none',
          }}
          onError={(e) => {
            setImgError(true);
            onError?.(e);
          }}
        />
      )}
    </div>
  );
}
