'use client';

import type { ReactNode } from 'react';

/**
 * Design foundation F-04: chips.
 *
 * <Chip>       — a small label that is not pressed (status, category, "2 mins ago").
 * <FilterChip> — a toggle in a row of filters, styled like the map-layer chips:
 *                white with navy text, navy with white text when on.
 */

export type ChipTone = 'neutral' | 'green' | 'red' | 'amber' | 'purple' | 'blue';

// Soft tint background + a text colour dark enough to read on it (WCAG AA for small bold text).
const TONE_CLASSES: Record<ChipTone, string> = {
  neutral: 'bg-background text-muted',
  green: 'bg-green-soft text-brand-green-dark',
  red: 'bg-red-soft text-[#C2353A]',
  amber: 'bg-amber-soft text-amber-ink',
  purple: 'bg-purple-soft text-[#5E3BB8]',
  blue: 'bg-blue-soft text-[#2B6AA6]',
};

type ChipProps = {
  tone?: ChipTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function Chip({ tone = 'neutral', icon, children, className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-bold ${TONE_CLASSES[tone]} ${className}`.trim()}
    >
      {icon ? <span className="shrink-0 leading-none" aria-hidden>{icon}</span> : null}
      {children}
    </span>
  );
}

type FilterChipProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  /** Emoji or small icon shown before the label. */
  icon?: ReactNode;
  /** Optional count shown after the label, e.g. "3" new items. */
  count?: number;
  disabled?: boolean;
  className?: string;
};

export function FilterChip({ active, onClick, children, icon, count, disabled, className = '' }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={[
        'tap-target inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-xs font-extrabold',
        'shadow-[0_2px_6px_rgba(29,36,51,0.12)] transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        active ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-[#F6F8FB]',
        className,
      ].join(' ')}
    >
      {icon ? <span className="shrink-0 leading-none" aria-hidden>{icon}</span> : null}
      {children}
      {typeof count === 'number' && count > 0 ? (
        <span
          className={`ml-0.5 rounded-full px-1.5 text-[11px] leading-[18px] ${active ? 'bg-white/20 text-white' : 'bg-green-soft text-brand-green-dark'}`}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}
