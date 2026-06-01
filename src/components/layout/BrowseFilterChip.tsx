'use client';

import type { ReactNode } from 'react';

type BrowseFilterChipProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

export function BrowseFilterChip({
  active,
  onClick,
  children,
  className = '',
}: BrowseFilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        active ? 'mod-chip mod-chip-active text-primary' : 'mod-chip'
      } ${className}`.trim()}
      style={active ? undefined : { color: 'var(--neu-text-muted)' }}
    >
      {children}
    </button>
  );
}
