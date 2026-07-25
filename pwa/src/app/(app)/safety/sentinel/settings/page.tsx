'use client';

/**
 * Manage Sentinel Settings — a real, distinct destination for the toolkit's
 * "Manage Sentinel Settings" button and the Threat Scanning tile's "tune
 * what gets flagged" promise.
 *
 * Both the severity filter below and the sensitivity dial are DELIVERY-only
 * controls — detection itself (the deterministic keyword-tier threat score
 * and the platform-wide red-zone trigger threshold) stays exactly the same
 * for every user in an LGA. A real threat is never hidden from some
 * neighbors and shown to others depending on a personal setting. What these
 * controls change is only which of those already-triggered, identically-
 * scored advisories actually get delivered to YOU.
 *
 * "High and above" and "Critical only" now genuinely filter delivery
 * server-side (see sentinel.service.ts's _fanOutToLga) — this used to be a
 * placeholder with no effect; it has been reversed per explicit product
 * decision. The sensitivity dial (redZoneMinThreatScore) is new: a personal
 * numeric floor on the underlying 0-10 threat score, for users who find
 * Sentinel too noisy or too quiet and want a lever beyond the coarse
 * severity tiers.
 */

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SentinelHowItWorks } from '@/components/sentinel/SentinelHowItWorks';
import { SentinelSubpageLayout } from '@/components/sentinel/SentinelSubpageLayout';
import { safetyService } from '@/services/safety.service';

export const dynamic = 'force-dynamic';

const SEVERITY_OPTIONS: Array<{
  value: 'all' | 'high' | 'critical';
  label: string;
  description: string;
}> = [
  {
    value: 'all',
    label: 'All advisories',
    description: 'Every red-zone alert Sentinel triggers for your area — warning, high, and critical.',
  },
  {
    value: 'high',
    label: 'High and above',
    description: 'Only advisories rated "high" or "critical" reach you. Lower-severity warnings are held back.',
  },
  {
    value: 'critical',
    label: 'Critical only',
    description: 'Only the most severe, verified advisories reach you.',
  },
];

export default function SentinelSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minSeverity, setMinSeverity] = useState<'all' | 'high' | 'critical'>('all');
  const [workAreaEnabled, setWorkAreaEnabled] = useState(true);
  const [emergencyServicesEnabled, setEmergencyServicesEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await safetyService.getSafetySettings();
        const s = res.data?.safetySettings;
        if (s) {
          setMinSeverity(s.redZoneMinSeverity ?? 'all');
          setWorkAreaEnabled(s.redZoneWorkAreaEnabled ?? true);
          setEmergencyServicesEnabled(!!s.emergencyServicesEnabled);
          setSensitivity(s.redZoneMinThreatScore ?? 0);
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Could not load settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (
    patch: Partial<{
      redZoneMinSeverity: 'all' | 'high' | 'critical';
      redZoneWorkAreaEnabled: boolean;
      redZoneMinThreatScore: number;
    }>,
  ) => {
    setSaving(true);
    setError(null);
    try {
      await safetyService.updateSafetySettings(patch);
      toast.success('Sentinel settings saved.');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Could not save settings.');
      toast.error('Could not save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SentinelSubpageLayout
      pageTitle="Sentinel settings"
      pageSubtitle="Choose which advisories reach you — detection itself stays the same for everyone."
      icon="tune"
      iconAccent="blue"
    >
      <SentinelHowItWorks>
        Sentinel scores every post the same way for everyone in your area — that consistency is
        what makes a red-zone advisory trustworthy. These settings only control which of those
        already-triggered advisories get delivered to you.
      </SentinelHowItWorks>

      {loading ? (
        <div className="mod-card animate-pulse rounded-2xl py-12 text-center text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          Loading…
        </div>
      ) : (
        <>
          {error && (
            <div className="mod-card rounded-2xl border border-brand-red/25 bg-brand-red/10 p-3 text-sm text-brand-red">
              {error}
            </div>
          )}

          <section className="mod-card space-y-3 rounded-2xl p-4">
            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-blue">
              Alert threshold
            </p>
            <div className="space-y-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setMinSeverity(opt.value);
                    void save({ redZoneMinSeverity: opt.value });
                  }}
                  className={`w-full rounded-xl p-3 text-left transition mod-inset ${
                    minSeverity === opt.value ? 'ring-2 ring-brand-blue' : ''
                  }`}
                >
                  <p className="text-sm font-semibold" style={{ color: 'var(--neu-text)' }}>{opt.label}</p>
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--neu-text-muted)' }}>{opt.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="mod-card space-y-3 rounded-2xl p-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-blue">
                Sensitivity
              </p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                A personal floor on the underlying 0-10 threat score. Raise it if Sentinel feels too noisy for your
                area; leave it at 0 to see every advisory that clears the severity filter above. This does not change
                how anything is scored — it only changes what reaches you.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={sensitivity}
                disabled={saving}
                onChange={(e) => setSensitivity(Number(e.target.value))}
                onMouseUp={() => void save({ redZoneMinThreatScore: sensitivity })}
                onTouchEnd={() => void save({ redZoneMinThreatScore: sensitivity })}
                className="w-full accent-primary"
                aria-label="Sentinel sensitivity threshold"
              />
              <span className="w-10 shrink-0 text-right text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {sensitivity === 0 ? 'All' : sensitivity}
              </span>
            </div>
            <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
              {sensitivity === 0
                ? 'Every advisory that passes the severity filter reaches you.'
                : `Only advisories scoring ${sensitivity}/10 or higher reach you.`}
            </p>
          </section>

          <section className="mod-card flex items-center justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>Include my work area</p>
              <p className="mt-0.5 text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
                Also notify me about advisories in my saved work-area LGA, not just home.
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                const next = !workAreaEnabled;
                setWorkAreaEnabled(next);
                void save({ redZoneWorkAreaEnabled: next });
              }}
              role="switch"
              aria-checked={workAreaEnabled}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                workAreaEnabled ? 'bg-primary' : 'bg-[var(--neu-text-muted)]/30'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  workAreaEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </section>

          <section className="mod-card space-y-1 rounded-2xl p-4">
            <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              Emergency services logging
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
              {emergencyServicesEnabled ? 'Enabled' : 'Disabled'} — this only records which agency an incident
              would be assigned to. <strong>It does not actually notify or dispatch anyone</strong> — automatic
              agency contact isn&apos;t connected yet. Manage this in{' '}
              <a href="/settings" className="font-semibold text-primary">
                Settings
              </a>
              , where it lives alongside your other account preferences.
            </p>
          </section>
        </>
      )}
    </SentinelSubpageLayout>
  );
}
