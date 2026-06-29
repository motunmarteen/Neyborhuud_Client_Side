import Image from 'next/image';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

/** Intrinsic size for Next/Image (renders at CSS clamp below) */
const LANDING_MARK_HEIGHT = 168;

/**
 * Landing `/` hero lockup — map pin mark over the aerial video + text wordmark.
 * Platform chrome elsewhere stays text-only (`NeyborHuudLogo` wordmark).
 */
export function LandingHeaderBrand() {
  return (
    <div className="landing-page-header-brand">
      <div className="landing-logo-halo pointer-events-none" aria-hidden />
      <div className="landing-page-header-mark-wrap">
        <Image
          src="/brand/neyborhuud-mark-light.png"
          alt="NeyborHuud Pin"
          width={320}
          height={320}
          priority
          className="landing-page-header-mark brand-mark-hero object-contain"
          style={{ width: 'auto', height: 'var(--landing-mark-height, 200px)', maxHeight: '35vh' }}
        />
      </div>
      <div className="landing-page-header-wordmark">
        <NeyborHuudLogo tone="hero" presentation="name" size="hero" />
      </div>
    </div>
  );
}
