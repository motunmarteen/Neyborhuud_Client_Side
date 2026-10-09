'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  SlidersHorizontal,
  Navigation,
  Crosshair,
  MapPin,
  CheckCircle2,
  Shield,
  PhoneCall,
  KeyRound,
  Radio,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { SENTINEL_FEATURES } from '@/lib/sentinel-catalog';
import { SentinelIcon } from '@/components/navigation/AppNavIcon';

const ACCENT: Record<string, string> = {
  primary: '#00D431',
  blue: '#6B9FFF',
  red: '#FF6B6B',
  muted: '#9FBBA0',
};

/**
 * Sentinel Command Bar — a single calm "you're protected" strip that expands
 * into the full safety feature grid. Distinct visual language from the
 * photographic category tiles: structured, dark, trustworthy.
 */
export function FeedSentinelRow() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="sentinel-bar-wrap">
      {/* The command bar */}
      <button
        type="button"
        className={`sentinel-bar${open ? ' sentinel-bar--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open ? 'true' : 'false'}
        aria-controls="sentinel-grid"
      >
        {/* Shield + live pulse — same SentinelIcon as bottom nav & post card */}
        <span className="sentinel-bar__mark">
          <SentinelIcon active className="sentinel-bar__shield" aria-hidden />
          <span className="sentinel-bar__pulse" aria-hidden />
        </span>

        {/* Identity + status */}
        <span className="sentinel-bar__text">
          <span className="sentinel-bar__title">
            Sentinel
            <span className="sentinel-bar__status">
              <span className="sentinel-bar__status-dot" aria-hidden />
              Protected
            </span>
          </span>
          <span className="sentinel-bar__sub">Tap to open your safety toolkit</span>
        </span>

        {/* Chevron */}
        <ChevronDown
          size={18}
          className={`sentinel-bar__chevron${open ? ' sentinel-bar__chevron--open' : ''}`}
        />
      </button>

      {/* Expandable feature grid */}
      <div
        id="sentinel-grid"
        className={`sentinel-grid${open ? ' sentinel-grid--open' : ''}`}
      >
        <div className="sentinel-grid__inner">
          {SENTINEL_FEATURES.map((feature) => (
            <Link
              key={feature.id}
              href={feature.href}
              className="sentinel-grid__item"
              onClick={() => setOpen(false)}
            >
              <span
                className="sentinel-grid__icon"
                style={{ color: ACCENT[feature.accent] ?? ACCENT.muted }}
              >
                <Shield size={20} />
                {feature.badge && (
                  <span className="sentinel-grid__badge">{feature.badge}</span>
                )}
              </span>
              <span className="sentinel-grid__label">{feature.label}</span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="sentinel-grid__manage flex items-center justify-center gap-1.5"
          onClick={() => router.push('/safety/manage')}
        >
          <SlidersHorizontal size={14} />
          <span>Manage Sentinel</span>
        </button>
      </div>
    </div>
  );
}
