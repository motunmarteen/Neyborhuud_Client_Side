'use client';

import type { ReactNode } from 'react';

export type BrowseTabItem = {
  id: string;
  label: string;
  icon?: string;
};

type BrowseTabStripProps = {
  tabs: BrowseTabItem[];
  activeId: string;
  onChange: (id: string) => void;
  trailing?: ReactNode;
  className?: string;
};

/**
 * Section tabs for list pages (owner 2026-11-26: simpler): plain words, a green line under the
 * chosen one, like the bottom bar. Scrolls sideways; an optional action stays on the right.
 * Icons in `tabs` are no longer drawn.
 */
export function BrowseTabStrip({ tabs, activeId, onChange, trailing, className = '' }: BrowseTabStripProps) {
  return (
    <div className={`flex w-full items-center gap-2 ${className}`.trim()}>
      <div role="tablist" aria-label="Sections" className="no-scrollbar flex min-w-0 flex-1 overflow-x-auto border-b border-line">
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(tab.id)}
              className={[
                'relative inline-flex h-11 shrink-0 items-center whitespace-nowrap px-3 text-sm transition-colors no-underline',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
                active ? 'font-extrabold text-navy after:absolute after:inset-x-3 after:bottom-0 after:h-[3px] after:rounded-full after:bg-primary' : 'font-semibold text-muted hover:text-navy',
              ].join(' ')}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
    </div>
  );
}
