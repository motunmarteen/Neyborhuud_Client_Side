'use client';

/**
 * Manage Sentinel Settings — a real, distinct destination for the toolkit's
 * "Manage Sentinel Settings" button and the Threat Scanning tile's "tune
 * what gets flagged" promise.
 *
 * Deliberately does NOT expose a detection-sensitivity dial. Sentinel's
 * keyword-tier threat scoring and the red-zone trigger threshold are global
 * and identical for every user in an LGA — a real threat shouldn't be
 * visible to some neighbors and hidden from others depending on a personal
 * slider. What's genuinely personal, and what this page controls, is
 * DELIVERY: which severities get pushed to you, and whether that includes
 * your saved work-area LGA in addition to home.
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
    description:
      'Every red-zone alert Sentinel triggers for your area. Right now this is the only kind Sentinel sends — advisories are already reserved for the most severe, verified threats, so this and "Critical only" currently behave the same.',
  },
  {
    value: 'high',
    label: 'High and above',
    description: 'Reserved for a future, finer-grained advisory tier — no effect yet.',
  },
  {
    value: 'critical',
    label: 'Critical only',
    description: 'Reserved for a future, finer-grained advisory tier — no effect yet.',
  },
];

export default function SentinelSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [minSeverity, setMinSeverity] = useState<'all' | 'high' | 'critical'>('all');
  const [workAreaEnabled, setWorkAreaEnabled] = useState(true);
  const [emergencyServicesEnabled, setEmergencyServicesEnabled] = useState(false);
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
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Could not load settings.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (patch: Partial<{ redZoneMinSeverity: 'all' | 'high' | 'critical'; redZoneWorkAreaEnabled: boolean }>) => {
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
              Emergency services auto-dispatch
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
              {emergencyServicesEnabled ? 'Enabled' : 'Disabled'} — manage this in{' '}
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
