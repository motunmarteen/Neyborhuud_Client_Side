'use client';

/**
 * Panic PIN settings — set, rotate, or remove the duress code.
 *
 * The PIN is a 4–6 digit code that, when entered anywhere a PIN is required
 * (e.g. a forced unlock by an attacker), triggers a SILENT SOS in the
 * background while looking like a normal unlock to the attacker.
 *
 * Backend: see API_CONTRACT_SAFETY_SENTINEL.json — endpoints under /panic-pin.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { SentinelHowItWorks } from '@/components/sentinel/SentinelHowItWorks';
import { SentinelSubpageLayout } from '@/components/sentinel/SentinelSubpageLayout';
import { safetyService } from '@/services/safety.service';

export const dynamic = 'force-dynamic';

type Mode = 'set' | 'rotate' | 'remove';

const PIN_REGEX = /^\d{4,6}$/;

export default function PanicPinPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pinSet, setPinSet] = useState(false);
  const [pinUpdatedAt, setPinUpdatedAt] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('set');
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const refreshStatus = async () => {
    try {
      const res = await safetyService.getPanicPinStatus();
      const isSet = Boolean(res?.data?.panicPinSet);
      setPinSet(isSet);
      setPinUpdatedAt(res?.data?.panicPinUpdatedAt ?? null);
      setMode(isSet ? 'rotate' : 'set');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load PIN status';
      setError(msg);
    }
  };

  useEffect(() => {
    void (async () => {
      setLoading(true);
      await refreshStatus();
      setLoading(false);
    })();
  }, []);

  const resetForm = () => {
    setPin('');
    setPinConfirm('');
    setCurrentPin('');
    setError(null);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'remove') {
      if (!PIN_REGEX.test(currentPin)) {
        setError('Enter your current 4–6 digit PIN.');
        return;
      }
      setBusy(true);
      try {
        await safetyService.removePanicPin(currentPin);
        setSuccess('Panic PIN removed.');
        resetForm();
        await refreshStatus();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to remove PIN.';
        setError(msg);
      } finally {
        setBusy(false);
      }
      return;
    }

    // set / rotate
    if (!PIN_REGEX.test(pin)) {
      setError('PIN must be 4 to 6 digits.');
      return;
    }
    if (pin !== pinConfirm) {
      setError('PINs do not match.');
      return;
    }
    if (mode === 'rotate' && !PIN_REGEX.test(currentPin)) {
      setError('Enter your current PIN to change it.');
      return;
    }

    setBusy(true);
    try {
      await safetyService.setPanicPin({
        pin,
        ...(mode === 'rotate' ? { currentPin } : {}),
      });
      setSuccess(mode === 'rotate' ? 'Panic PIN updated.' : 'Panic PIN saved.');
      resetForm();
      await refreshStatus();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save PIN.';
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SentinelSubpageLayout
      pageTitle="Panic PIN"
      pageSubtitle="A duress code that silently triggers SOS while appearing normal."
      icon="pin"
      iconAccent="red"
    >
      <SentinelHowItWorks>
        When you (or someone forcing you) enter this PIN where a PIN is required, the app
        behaves normally — but a <strong>silent SOS</strong> fires and your guardians are
        notified. Use a PIN you will remember under stress, but{' '}
        <strong>different from your everyday unlock PIN</strong>.
      </SentinelHowItWorks>

      {loading ? (
        <div className="mod-card animate-pulse rounded-2xl py-12 text-center text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          Loading…
        </div>
      ) : (
        <>
          <div className="mod-card flex items-center gap-3 rounded-2xl p-4">
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${pinSet ? 'bg-primary' : 'bg-[var(--neu-text-muted)]/40'}`}
              aria-hidden
            />
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
                {pinSet ? 'Panic PIN is active' : 'No Panic PIN set'}
              </p>
              {pinSet && pinUpdatedAt ? (
                <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                  Last updated {new Date(pinUpdatedAt).toLocaleString()}
                </p>
              ) : null}
            </div>
          </div>

          {pinSet ? (
            <div className="mod-inset flex gap-1 rounded-xl p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('rotate');
                  resetForm();
                  setSuccess(null);
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                  mode === 'rotate' ? 'mod-chip mod-chip-active text-primary' : 'text-[var(--neu-text-muted)]'
                }`}
              >
                Change PIN
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('remove');
                  resetForm();
                  setSuccess(null);
                }}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold ${
                  mode === 'remove' ? 'bg-brand-red text-white' : 'text-[var(--neu-text-muted)]'
                }`}
              >
                Remove PIN
              </button>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mod-card space-y-3 rounded-2xl p-4">
              {(mode === 'rotate' || mode === 'remove') && (
                <label className="block">
                  <span className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>Current PIN</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d*"
                    autoComplete="off"
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="mod-inset mt-1 w-full rounded-lg border-0 px-3 py-2 text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                  />
                </label>
              )}

              {mode !== 'remove' && (
                <>
                  <label className="block">
                    <span className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>New PIN (4–6 digits)</span>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d*"
                      autoComplete="off"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="mod-inset mt-1 w-full rounded-lg border-0 px-3 py-2 text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-medium" style={{ color: 'var(--neu-text-muted)' }}>Confirm new PIN</span>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d*"
                      autoComplete="off"
                      maxLength={6}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                      className="mod-inset mt-1 w-full rounded-lg border-0 px-3 py-2 text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                    />
                  </label>
                </>
              )}

              {error ? (
                <div className="rounded-lg border border-brand-red/25 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                  {error}
                </div>
              ) : null}
              {success ? (
                <div className="rounded-lg border border-primary/25 bg-primary/10 px-3 py-2 text-sm text-primary">
                  {success}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={busy}
                className={`w-full rounded-xl py-3 text-base font-bold text-white disabled:opacity-50 ${
                  mode === 'remove' ? 'bg-brand-red hover:brightness-105' : 'bg-primary hover:brightness-105'
                }`}
              >
                {busy ? 'Working…' : mode === 'set' ? 'Set Panic PIN' : mode === 'rotate' ? 'Update PIN' : 'Remove PIN'}
              </button>
            </form>
          </>
        )}
    </SentinelSubpageLayout>
  );
}
