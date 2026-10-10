'use client';

import { useState } from 'react';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

const REASONS = ['Road blocked', 'No light', 'Flooding', 'Suspicious movement', 'Market price', 'Something else'];

export function SheetDemo() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <Button variant="secondary" fullWidth onClick={() => setOpen(true)}>
        Open a sample sheet
      </Button>
      <p className="text-xs text-muted">Drag the handle down, flick it, tap outside, or press Esc to close.</p>

      <AppBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Wetin dey happen?"
        description="Pick what you want to tell your neighbours about."
        footer={
          <Button fullWidth disabled={!reason} onClick={() => setOpen(false)}>
            {reason ? `Post: ${reason}` : 'Pick one to continue'}
          </Button>
        }
      >
        <div className="flex flex-col gap-2 pb-2">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              aria-pressed={reason === r}
              className={`flex min-h-12 items-center justify-between rounded-2xl border px-4 text-left text-[15px] font-semibold transition-colors ${
                reason === r ? 'border-primary bg-green-soft text-brand-green-dark' : 'border-line bg-white text-navy hover:bg-[#F6F8FB]'
              }`}
            >
              {r}
              {reason === r ? <Chip tone="green">Selected</Chip> : null}
            </button>
          ))}
        </div>
      </AppBottomSheet>
    </div>
  );
}
