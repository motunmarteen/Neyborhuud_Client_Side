'use client';

import type { ReactNode } from 'react';
import { FilterChip } from '@/components/ui/Chip';

type BrowseFilterChipProps = {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
};

/** Filter chip for browse screens — the shared F-04 FilterChip (map-layer style). */
export function BrowseFilterChip({ active, onClick, children, className = '' }: BrowseFilterChipProps) {
  return (
    <FilterChip active={active} onClick={onClick} className={className}>
      {children}
    </FilterChip>
  );
}
