'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type BrowseSelectOption = {
  value: string;
  label: string;
};

type BrowseSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: BrowseSelectOption[];
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
};

/**
 * Full-width select; menu renders in a portal so it is not clipped by card overflow.
 */
export function BrowseSelect({
  value,
  onChange,
  options,
  ariaLabel,
  className = '',
  disabled,
}: BrowseSelectProps) {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const updateMenuPosition = () => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        const menu = document.getElementById(listId);
        if (menu && menu.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    // Defer so the opening click does not immediately close the menu
    const timer = window.setTimeout(() => {
      document.addEventListener('click', onDoc, true);
    }, 0);
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('click', onDoc, true);
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [open, listId]);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const menu =
    open && !disabled && menuRect && typeof document !== 'undefined'
      ? createPortal(
          <ul
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className="fixed z-[200] max-h-48 overflow-x-hidden overflow-y-auto rounded-xl border border-primary/20 bg-[var(--neu-bg)] py-1 shadow-lg mod-card-elevated"
            style={{
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
            }}
          >
            {options.map((opt) => (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={opt.value === value}
                  className={`flex w-full min-w-0 px-3 py-2.5 text-left text-sm ${
                    opt.value === value ? 'bg-primary/15 font-bold text-primary' : ''
                  }`}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={`relative w-full min-w-0 max-w-full ${className}`.trim()}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => {
          setOpen((p) => {
            const next = !p;
            if (!p) {
              requestAnimationFrame(updateMenuPosition);
            }
            return next;
          });
        }}
        className="mod-inset flex w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm disabled:opacity-50"
      >
        <span className="min-w-0 truncate">{selected?.label ?? '—'}</span>
        <span className="material-symbols-outlined shrink-0 text-[20px] text-primary" aria-hidden>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>
      {menu}
    </div>
  );
}
