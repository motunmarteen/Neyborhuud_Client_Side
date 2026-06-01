'use client';

import { useState } from 'react';
import { LiveTrackingRequirementsCard } from '@/components/sentinel/tracking/LiveTrackingRequirementsCard';
import { BrowseSelect } from '@/components/ui/BrowseSelect';
import type { SafetyEligibilityIssue } from '@/lib/safetyEligibility';
import type { KidnappingEmergencyType } from '@/services/safety.service';

const EMERGENCY_OPTIONS = [
  { value: 'kidnapping', label: 'Kidnapping' },
  { value: 'armed_robbery', label: 'Armed robbery' },
  { value: 'other_critical', label: 'Other critical' },
] as const;

const INTERVAL_OPTIONS = [
  { value: '15', label: 'Every 15 seconds' },
  { value: '30', label: 'Every 30 seconds (recommended)' },
  { value: '45', label: 'Every 45 seconds' },
  { value: '60', label: 'Every 60 seconds' },
];

type LiveTrackingStartPanelProps = {
  onStart: (opts: { emergencyType: KidnappingEmergencyType; intervalSeconds: number }) => Promise<void>;
  busy: boolean;
  error: string | null;
  eligibilityIssues: SafetyEligibilityIssue[];
};

export function LiveTrackingStartPanel({ onStart, busy, error, eligibilityIssues }: LiveTrackingStartPanelProps) {
  const blocked = eligibilityIssues.length > 0;
  const [emergencyType, setEmergencyType] = useState<KidnappingEmergencyType>('kidnapping');
  const [intervalSeconds, setIntervalSeconds] = useState('30');

  return (
    <div className="mod-card relative z-10 space-y-4 overflow-visible rounded-2xl p-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-red">Start live tracking</p>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
        Begins continuous location pings, notifies your guardians, and can alert security agencies. Allow location
        access when prompted.
      </p>

      <LiveTrackingRequirementsCard issues={eligibilityIssues} />

      {error ? (
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      <div className="grid min-w-0 grid-cols-1 gap-3">
        <div>
          <label className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
            Emergency type
          </label>
          <div className="mt-1">
            <BrowseSelect
              ariaLabel="Emergency type"
              value={emergencyType}
              options={[...EMERGENCY_OPTIONS]}
              onChange={(v) => setEmergencyType(v as KidnappingEmergencyType)}
              disabled={busy}
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>
            Ping interval
          </label>
          <div className="mt-1">
            <BrowseSelect
              ariaLabel="Ping interval"
              value={intervalSeconds}
              options={INTERVAL_OPTIONS}
              onChange={setIntervalSeconds}
              disabled={busy}
            />
          </div>
          <p className="mt-1 text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
            Shorter intervals use more battery but give guardians a tighter trail.
          </p>
        </div>
      </div>

      <button
        type="button"
        disabled={busy || blocked}
        onClick={() =>
          void onStart({
            emergencyType,
            intervalSeconds: Number(intervalSeconds) || 30,
          })
        }
        className="w-full rounded-full bg-brand-red py-3 text-sm font-bold text-white disabled:opacity-50"
      >
        {busy ? 'Starting…' : 'Start live tracking'}
      </button>
    </div>
  );
}
