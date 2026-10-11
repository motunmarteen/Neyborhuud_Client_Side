'use client';

import type { ReactNode } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';

type BrowseEmptyStateProps = {
  /** Material Symbols icon name. */
  icon: string;
  title: string;
  description?: string;
  filledIcon?: boolean;
  action?: ReactNode;
  /** Callers pass a className when the state sits inside another card: shown without its own card. */
  className?: string;
};

// Pages pass their own link or button as the action; give a single one the F-03 pill look
// so every empty state matches (screens get their own restyle in Phase 4).
const ACTION_WRAP =
  '[&>a]:!inline-flex [&>a]:!min-h-12 [&>a]:!items-center [&>a]:!justify-center [&>a]:!rounded-full [&>a]:!border-0 [&>a]:!bg-primary [&>a]:!px-6 [&>a]:!text-[15px] [&>a]:!font-bold [&>a]:!text-white [&>a]:!no-underline ' +
  '[&>button]:!inline-flex [&>button]:!min-h-12 [&>button]:!items-center [&>button]:!justify-center [&>button]:!rounded-full [&>button]:!border-0 [&>button]:!bg-primary [&>button]:!px-6 [&>button]:!text-[15px] [&>button]:!font-bold [&>button]:!text-white';

/** F-09: the browse pages' empty state, drawn by the shared EmptyState. */
export function BrowseEmptyState({ icon, title, description, filledIcon, action, className }: BrowseEmptyStateProps) {
  return (
    <EmptyState
      icon={<span className={`material-symbols-outlined text-[32px]${filledIcon ? ' fill-1' : ''}`}>{icon}</span>}
      title={title}
      description={description}
      action={action ? <div className={ACTION_WRAP}>{action}</div> : undefined}
      compact={!!className}
    />
  );
}
