'use client';

import React, { useId, useState } from 'react';

/**
 * MapPinAvatar — User avatar rendered inside a map-pin / teardrop shape.
 * Uses a single hardcoded SVG path in a 100×128 viewBox so the shape is
 * always pixel-perfect.  The photo is clipped to the inner circle.
 *
 * Reference shape: classic Google-Maps-style pin — large circle on top
 * (with thick colored border, white ring, then the user photo) tapering
 * to a sharp point at the bottom.
 */

type PinSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

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
 * width × height in CSS for each size tier.
 * The aspect ratio is always ~100:128 (≈ 0.78).
 */
const SIZE_MAP: Record<PinSize, { w: number; h: number; initialFontSize: number }> = {
  xs:  { w: 24,  h: 31,  initialFontSize: 9 },
  sm:  { w: 34,  h: 44,  initialFontSize: 12 },
  md:  { w: 44,  h: 56,  initialFontSize: 16 },
  lg:  { w: 52,  h: 67,  initialFontSize: 18 },
  xl:  { w: 60,  h: 77,  initialFontSize: 22 },
  '2xl': { w: 120, h: 154, initialFontSize: 40 },
};

/*
 * The pin outline lives in a 100 × 128 viewBox.
 * Circle center = (50, 42), radius = 40.
 * The point tip is at (50, 122).
 * Two quadratic bezier curves connect the circle tangents to the tip.
 */
const VB_W = 100;
const VB_H = 128;
const CX = 50;               // circle center X
const CY = 42;               // circle center Y
const R = 40;                 // outer circle radius
const INNER_R = R * 0.82;    // white-ring circle radius
const PHOTO_R = R * 0.72;    // photo clip radius
const TIP_Y = 122;           // bottom point Y

// Pin outline path — circle on top, two quadratic curves meeting at the tip
const PIN_PATH = `
  M ${CX - R} ${CY}
  A ${R} ${R} 0 1 1 ${CX + R} ${CY}
  Q ${CX + R} ${TIP_Y * 0.72} ${CX} ${TIP_Y}
  Q ${CX - R} ${TIP_Y * 0.72} ${CX - R} ${CY}
  Z
`;

const DEFAULT_AVATAR = 'https://i.pravatar.cc/100?u=user';

export default function MapPinAvatar({
  src,
  alt = 'User',
  fallbackInitial,
  size = 'md',
  className = '',
  onClick,
  onError,
}: MapPinAvatarProps) {
  const uid = useId();                       // guaranteed unique per instance
  const clipIdPhoto = `pin-photo-${uid}`;
  const s = SIZE_MAP[size];
  const [imgError, setImgError] = useState(false);

  const showImage = (src && !imgError) || (!src && !fallbackInitial);
  const imgSrc = src && !imgError ? src : DEFAULT_AVATAR;

  return (
    <div
      className={`inline-flex flex-shrink-0 ${className}`}
      style={{ width: s.w, height: s.h }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        width={s.w}
        height={s.h}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={alt}
        style={{ display: 'block', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}
      >
        <defs>
          <clipPath id={clipIdPhoto}>
            <circle cx={CX} cy={CY} r={PHOTO_R} />
          </clipPath>
        </defs>

        {/* 1. Colored pin body */}
        <path d={PIN_PATH} fill="var(--pin-color, #11d473)" />

        {/* 2. White ring inside pin */}
        <circle cx={CX} cy={CY} r={INNER_R} fill="white" />

        {/* 3. Photo or initial clipped to inner circle */}
        {showImage ? (
          <image
            href={imgSrc}
            x={CX - PHOTO_R}
            y={CY - PHOTO_R}
            width={PHOTO_R * 2}
            height={PHOTO_R * 2}
            clipPath={`url(#${clipIdPhoto})`}
            preserveAspectRatio="xMidYMid slice"
            onError={(e) => {
              setImgError(true);
              onError?.(e as unknown as React.SyntheticEvent<HTMLImageElement>);
            }}
          />
        ) : (
          <>
            {/* Colored background circle for initial */}
            <circle cx={CX} cy={CY} r={PHOTO_R} fill="var(--pin-color, #11d473)" opacity={0.15} />
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
          </>
        )}
      </svg>
    </div>
  );
}
