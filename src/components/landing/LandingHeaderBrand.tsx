import Image from 'next/image';
import { BRAND_MARK_SRC } from '@/lib/brand-assets';
import { NeyborHuudLogo } from '@/components/brand/NeyborHuudLogo';

/** Pin asset aspect (w / h) — from `neyborhuud-mark-light.png` */
const MARK_ASPECT = 326 / 402;
/** Intrinsic size for Next/Image (renders at CSS clamp below) */
const LANDING_MARK_HEIGHT = 168;

/**
 * Landing `/` hero lockup — map pin mark over the aerial video + text wordmark.
 * Platform chrome elsewhere stays text-only (`NeyborHuudLogo` wordmark).
 */
export function LandingHeaderBrand() {
  const markHeight = LANDING_MARK_HEIGHT;
  const markWidth = Math.round(markHeight * MARK_ASPECT);

  return (
    <div className="landing-page-header-brand">
      <div className="landing-logo-halo pointer-events-none" aria-hidden />
      <div className="landing-page-header-mark-wrap">
        <Image
          src={BRAND_MARK_SRC}
          alt=""
          width={markWidth}
          height={markHeight}
          priority
          className="landing-page-header-mark brand-mark-hero"
        />
      </div>
      <div className="landing-page-header-wordmark">
        <NeyborHuudLogo layout="wordmark" size="hero" tone="hero" presentation="lockup" priority />
      </div>
    </div>
  );
}
