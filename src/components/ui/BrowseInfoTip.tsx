'use client';

import { useEffect, useId, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type BrowseInfoTipProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

/**
 * Small info control for browse cards — keeps long copy off the tile.
 */
export function BrowseInfoTip({ label, children, className = '' }: BrowseInfoTipProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const openPanel = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const panelWidth = 260;
    const left = Math.min(Math.max(8, r.right - panelWidth), window.innerWidth - panelWidth - 8);
    setRect({ top: r.bottom + 6, left });
    setOpen((p) => !p);
  };

  const panel =
    open && rect && typeof document !== 'undefined'
      ? createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-[198] cursor-default bg-black/20"
              aria-label="Close"
              onClick={() => setOpen(false)}
            />
            <div
              id={panelId}
              role="tooltip"
              className="fixed z-[199] w-[260px] rounded-xl border border-primary/15 bg-[var(--neu-bg)] p-3 shadow-lg mod-card-elevated"
              style={{ top: rect.top, left: rect.left }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">{label}</p>
              <div className="mt-1.5 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                {children}
              </div>
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openPanel}
        aria-expanded={open}
        aria-controls={panelId}
        className={`mod-inset flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-primary/15 ${className}`.trim()}
        aria-label={`More about ${label}`}
      >
        <span className="material-symbols-outlined text-[16px]" aria-hidden>
          info
        </span>
      </button>
      {panel}
    </>
  );
}
