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
 * Section tabs for list pages (Phase 4 restyle, 2026-10-18): the approved chip row from the
 * Feed and the design kit (F-04): white chips, the chosen one navy; scrolls sideways; an
 * optional action (e.g. Refresh) stays pinned on the right. Replaces the old grey segmented box.
 */
export function BrowseTabStrip({ tabs, activeId, onChange, trailing, className = '' }: BrowseTabStripProps) {
  return (
    <div className={`flex w-full items-center gap-2 ${className}`.trim()}>
      <div role="tablist" aria-label="Sections" className="no-scrollbar -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-1">
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
                'tap-target inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-extrabold',
                'shadow-[0_2px_6px_rgba(29,36,51,0.12)] transition-colors duration-150',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                active ? 'bg-navy text-white' : 'bg-white text-navy hover:bg-[#F6F8FB]',
              ].join(' ')}
            >
              {tab.icon ? (
                <span className="material-symbols-outlined text-[17px] leading-none" aria-hidden>
                  {tab.icon}
                </span>
              ) : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      {trailing ? <div className="flex shrink-0 items-center">{trailing}</div> : null}
    </div>
  );
}
