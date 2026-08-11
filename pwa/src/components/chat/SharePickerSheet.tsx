'use client';

/**
 * SharePickerSheet
 * A generic, reusable "pick one of my things and share it into this chat"
 * bottom sheet — backs the product/event/job/post share entry points in
 * ChatActionMenu. Rather than building four near-identical picker sheets,
 * this single component is parameterized by the list of items + how to
 * render a row, and reuses the existing per-domain "my X" hooks
 * (useUserMarketplace/useUserJobs/useUserEvents/useUserPosts) so it needs no
 * new backend endpoints.
 *
 * Follows the same BottomSheetOverlay-wrapper convention already used by
 * ChatActionMenu's own Modal() and by EventShareSheet.
 */

import { useState, type ReactNode } from 'react';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';

export interface SharePickerItem {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string | null;
  icon?: string; // emoji fallback when no thumbnail
}

interface SharePickerSheetProps {
  title: string;
  emptyLabel: string;
  loading: boolean;
  items: SharePickerItem[];
  onPick: (item: SharePickerItem) => void;
  onClose: () => void;
  /** Optional search input or filter controls rendered above the list. */
  children?: ReactNode;
}

export function SharePickerSheet({
  title,
  emptyLabel,
  loading,
  items,
  onPick,
  onClose,
  children,
}: SharePickerSheetProps) {
  return (
    <BottomSheetOverlay
      open
      onClose={onClose}
      ariaLabel={title}
      zIndexClass="z-[200]"
      alignClass="items-end justify-center sm:items-center"
      backdropClassName="bg-black/60"
      panelClassName="w-full max-w-sm rounded-t-2xl bg-brand-black p-5 shadow-2xl sm:rounded-2xl max-h-[75vh] flex flex-col"
      handleClassName="pt-2 pb-0"
    >
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <p className="font-semibold text-[var(--neu-text-muted)]">{title}</p>
        <button type="button" onClick={onClose} className="text-[var(--neu-text-muted)] text-xl leading-none">×</button>
      </div>
      {children}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="py-8 text-center text-sm text-[var(--neu-text-muted)]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--neu-text-muted)]">{emptyLabel}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {/* Index-suffixed key: a caller passing records without an id would
                otherwise collide on key={undefined} for every row. The real fix
                belongs upstream (see extractPageItems in ChatActionMenu), but a
                picker should never be able to break the list on bad input. */}
            {items.filter((item) => item && item.title).map((item, i) => (
              <button
                key={item.id ?? `item-${i}`}
                type="button"
                onClick={() => onPick(item)}
                className="flex items-center gap-3 rounded-xl bg-brand-black px-2.5 py-2 text-left hover:bg-white/5 mod-inset"
              >
                {item.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xl">
                    {item.icon ?? '📦'}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--neu-text-muted)]">{item.title}</p>
                  {item.subtitle ? (
                    <p className="truncate text-xs text-[var(--neu-text-muted)] opacity-70">{item.subtitle}</p>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </BottomSheetOverlay>
  );
}

/** Small debounced search input, reused by the user-search contact picker. */
export function SharePickerSearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [local, setLocal] = useState(value);
  return (
    <input
      className="mb-3 w-full shrink-0 rounded-xl bg-brand-black px-3 py-2 text-sm text-[var(--neu-text-muted)] placeholder:text-[var(--neu-text-muted)] focus:outline-none mod-inset"
      placeholder={placeholder}
      value={local}
      onChange={(e) => {
        setLocal(e.target.value);
        onChange(e.target.value);
      }}
    />
  );
}
