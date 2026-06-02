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
 * Segmented tab strip — single opaque card, horizontal scroll, wallet/actions pinned right.
 */
export function BrowseTabStrip({
  tabs,
  activeId,
  onChange,
  trailing,
  className = '',
}: BrowseTabStripProps) {
  return (
    <div
      className={`mod-card w-full overflow-hidden rounded-2xl p-1 ${className}`.trim()}
      role="tablist"
      aria-label="Sections"
    >
      <div className="mod-inset flex min-h-[2.75rem] items-stretch overflow-hidden rounded-xl">
        <div className="flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto overflow-y-hidden py-0.5 pl-0.5 no-scrollbar">
          {tabs.map((tab) => {
            const active = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={tab.label}
                title={tab.label}
                onClick={() => onChange(tab.id)}
                className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-semibold transition-colors touch-manipulation ${
                  active
                    ? 'bg-white font-bold text-[#006F35] shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:bg-white/15 dark:text-primary'
                    : 'text-[var(--neu-text-muted)] hover:text-[var(--neu-text)]'
                }`}
              >
                {tab.icon ? (
                  <span className="material-symbols-outlined text-[18px] leading-none" aria-hidden>
                    {tab.icon}
                  </span>
                ) : null}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {trailing ? (
          <div
            className="flex shrink-0 items-center self-stretch border-l px-2 py-1"
            style={{ borderColor: 'rgba(0, 0, 0, 0.06)' }}
          >
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
