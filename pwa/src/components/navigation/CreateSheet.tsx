'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { QUICK_SIGNALS, useQuickSignal } from '@/hooks/useQuickSignal';

/**
 * ➕ "Wetin you wan share?" — the bottom bar's create sheet (home mockup).
 * Quick signals send in one tap; "Or create" opens the full form for that type.
 * Poll and Lost & Found join this list with their new screens (tracker F-13d).
 */

const CREATE_OPTIONS: { type: string; icon: string; label: string }[] = [
  { type: 'emergency', icon: '🚨', label: 'Safety report' },
  { type: 'post', icon: '✏️', label: 'Post' },
  { type: 'fyi', icon: '📢', label: 'FYI alert' },
  { type: 'marketplace', icon: '🛒', label: 'Sell something' },
  { type: 'event', icon: '🎉', label: 'Event' },
  { type: 'help_request', icon: '🙋🏾', label: 'Ask for help' },
  { type: 'job', icon: '💼', label: 'Post a job' },
  { type: 'services', icon: '🔧', label: 'Offer a service' },
];

export function CreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { send, submittingId } = useQuickSignal();

  const openCreate = (type: string) => {
    onClose();
    if (pathname === '/feed') {
      window.dispatchEvent(new CustomEvent('open-create-post', { detail: { contentType: type } }));
    } else {
      router.push(`/feed?compose=${encodeURIComponent(type)}`);
    }
  };

  return (
    <AppBottomSheet open={open} onClose={onClose} title="Wetin you wan share?" panelStyle={{ maxHeight: '88svh' }}>
      <div className="flex flex-col gap-4 pb-2">
        <section aria-labelledby="quick-signal-title">
          <p id="quick-signal-title" className="mb-2 text-[11px] font-black uppercase tracking-wider text-faint">
            Quick signal · one tap, no typing
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SIGNALS.map((s) => {
              const busy = submittingId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={submittingId !== null}
                  onClick={async () => {
                    if (await send(s)) onClose();
                  }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-bold text-navy transition-colors hover:bg-background disabled:opacity-60"
                >
                  {busy ? <Loader2 size={16} className="motion-safe:animate-spin" aria-hidden /> : <span aria-hidden>{s.emoji}</span>}
                  {s.short}
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="create-title">
          <p id="create-title" className="mb-2 text-[11px] font-black uppercase tracking-wider text-faint">
            Or create
          </p>
          <div className="grid grid-cols-2 gap-2">
            {CREATE_OPTIONS.map((c) => (
              <button
                key={c.type}
                type="button"
                onClick={() => openCreate(c.type)}
                className={`flex min-h-14 items-center gap-2.5 rounded-2xl px-3.5 text-left text-[15px] font-bold transition-colors ${
                  c.type === 'emergency' ? 'bg-red-soft text-[#C2353A] hover:bg-[#F9DCDD]' : 'bg-background text-navy hover:bg-[#E6EAF0]'
                }`}
              >
                <span className="text-xl" aria-hidden>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppBottomSheet>
  );
}
