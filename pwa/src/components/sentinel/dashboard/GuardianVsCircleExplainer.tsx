'use client';

/**
 * Plain-language, side-by-side comparison of Guardian vs Safety Circle.
 * Reachable from both the Guardians tab and the Circle tab in the Safety
 * Dashboard — the two are easy to confuse (same mutual-follow invite flow)
 * but have very different real-world consequences.
 */

import { useState } from 'react';

export function GuardianVsCircleExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mod-card rounded-2xl p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
          <span className="material-symbols-outlined text-[18px] text-primary">help</span>
          What&apos;s the difference between Guardian and Circle?
        </span>
        <span
          className="material-symbols-outlined text-lg transition-transform"
          style={{ color: 'var(--neu-text-muted)', transform: open ? 'rotate(180deg)' : undefined }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="mod-inset rounded-xl p-3">
            <p className="text-xs font-black uppercase tracking-wide text-brand-red">Guardian</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
              Emergency alerts + your exact location
            </p>
            <ul className="mt-2 space-y-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              <li>• Notified immediately if you trigger SOS</li>
              <li>• Sees your exact GPS location during emergencies, trips, and live tracking</li>
              <li>• Notified if you miss a wellness check-in</li>
              <li>• Gets your live status updates, including location</li>
            </ul>
          </div>

          <div className="mod-inset rounded-xl p-3">
            <p className="text-xs font-black uppercase tracking-wide text-primary">Safety Circle</p>
            <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>
              General status only — no location, no emergency alerts
            </p>
            <ul className="mt-2 space-y-1 text-xs" style={{ color: 'var(--neu-text-muted)' }}>
              <li>• Sees your live status (safe / on the move / etc.) — never your GPS coordinates</li>
              <li>• Does NOT get told if you trigger SOS</li>
              <li>• Does NOT get told about trips, live tracking, or missed check-ins</li>
              <li>• A lighter, casual layer for people who don&apos;t need emergency responsibility</li>
            </ul>
          </div>

          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
            Both require a mutual follow first. If someone needs to actually respond in an emergency, add them
            as a <strong>Guardian</strong>. If you just want a broader group to have a general sense you&apos;re okay,
            use <strong>Circle</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
