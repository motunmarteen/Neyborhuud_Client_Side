'use client';

import Link from 'next/link';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { LOCAL_HUUD_LINKS, LOCAL_HUUD_MENU } from '@/lib/localHuudLinks';

type LocalHuudBottomSheetProps = {
  open: boolean;
  onClose: () => void;
};

const SHEET_LINKS = [
  ...['marketplace', 'services', 'job', 'event'].map((type) =>
    LOCAL_HUUD_LINKS.find((item) => item.type === type),
  ),
  ...LOCAL_HUUD_LINKS.filter((item) => !['marketplace', 'services', 'job', 'event'].includes(item.type)),
].filter((item): item is (typeof LOCAL_HUUD_LINKS)[number] => Boolean(item));

export function LocalHuudBottomSheet({ open, onClose }: LocalHuudBottomSheetProps) {
  return (
    <AppBottomSheet
      open={open}
      onClose={onClose}
      ariaLabel={`${LOCAL_HUUD_MENU.label} services`}
      panelClassName="max-w-md"
      panelStyle={{
        maxHeight: 'min(82vh, 34rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1rem)',
      }}
    >
      <header className="shrink-0 px-4 pb-3 text-center">
        <p className="m-0 text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">
          Local Huud
        </p>
        <h2 className="m-0 mt-1 text-lg font-extrabold tracking-tight text-[var(--neu-text)]">
          Community services
        </h2>
        <p className="m-0 mt-1 text-xs leading-snug text-[var(--neu-text-muted)]">
          Tap a service in your neighbourhood
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0">
          {SHEET_LINKS.map((item) => (
            <li key={item.type} className="min-w-0">
              <Link
                href={item.href}
                onClick={onClose}
                className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border border-primary/15 bg-primary/[0.06] px-2 py-2.5 text-center no-underline transition-colors hover:border-primary/25 hover:bg-primary/10 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-2xl text-primary" aria-hidden>
                  {item.icon}
                </span>
                <span className="text-[11px] font-bold leading-tight tracking-tight text-[#1A1A1A] dark:text-[var(--neu-text)]">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </AppBottomSheet>
  );
}
