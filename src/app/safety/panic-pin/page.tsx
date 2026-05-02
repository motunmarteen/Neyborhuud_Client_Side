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
import { useRouter } from 'next/navigation';
import TopNav from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/feed/BottomNav';
import { safetyService } from '@/services/safety.service';

export const dynamic = 'force-dynamic';

type Mode = 'set' | 'rotate' | 'remove';

const PIN_REGEX = /^\d{4,6}$/;

export default function PanicPinPage() {
  const router = useRouter();
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
    <div className="min-h-screen bg-background text-foreground">
      <TopNav />
      <main className="max-w-md mx-auto px-4 pt-4 pb-20">
        <button
          type="button"
          onClick={() => router.push('/safety')}
          className="text-sm text-white/60 hover:text-white mb-4 flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span> Sentinel
        </button>

        <header className="mb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400 text-4xl">pin</span>
            <div>
              <h1 className="text-2xl font-bold">Panic PIN</h1>
              <p className="text-sm text-white/60">A duress code that silently triggers SOS.</p>
            </div>
          </div>
        </header>

        <div className="rounded-xl bg-amber-950/30 border border-amber-700/50 p-4 mb-6 text-sm text-amber-200">
          <strong className="block mb-1">How it works</strong>
          When you (or someone forcing you) enter this PIN on the lock screen, the app
          unlocks normally — but a silent SOS fires in the background and your guardians
          are notified. <span className="text-amber-300/80">Use a PIN you'll remember even under stress, but DIFFERENT from your everyday unlock PIN.</span>
        </div>

        {loading ? (
          <div className="text-center text-white/60 py-12">Loading…</div>
        ) : (
          <>
            <div className="rounded-xl neu-card p-4 mb-4 flex items-center gap-3">
              <span
                className={`w-2.5 h-2.5 rounded-full ${pinSet ? 'bg-green-500' : 'bg-white/30'}`}
                aria-hidden
              />
              <div className="flex-1">
                <div className="text-sm font-semibold">
                  {pinSet ? 'Panic PIN is active' : 'No Panic PIN set'}
                </div>
                {pinSet && pinUpdatedAt && (
                  <div className="text-xs text-white/50">
                    Last updated {new Date(pinUpdatedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {pinSet && (
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => { setMode('rotate'); resetForm(); setSuccess(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    mode === 'rotate' ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/70'
                  }`}
                >
                  Change PIN
                </button>
                <button
                  type="button"
                  onClick={() => { setMode('remove'); resetForm(); setSuccess(null); }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    mode === 'remove' ? 'bg-red-600 text-white' : 'bg-white/5 text-white/70'
                  }`}
                >
                  Remove PIN
                </button>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-3">
              {(mode === 'rotate' || mode === 'remove') && (
                <label className="block">
                  <span className="text-xs text-white/60">Current PIN</span>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="\d*"
                    autoComplete="off"
                    maxLength={6}
                    value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                    className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-base tracking-widest focus:outline-none focus:border-red-500"
                  />
                </label>
              )}

              {mode !== 'remove' && (
                <>
                  <label className="block">
                    <span className="text-xs text-white/60">New PIN (4–6 digits)</span>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d*"
                      autoComplete="off"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-base tracking-widest focus:outline-none focus:border-red-500"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-white/60">Confirm new PIN</span>
                    <input
                      type="password"
                      inputMode="numeric"
                      pattern="\d*"
                      autoComplete="off"
                      maxLength={6}
                      value={pinConfirm}
                      onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                      className="mt-1 w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-base tracking-widest focus:outline-none focus:border-red-500"
                    />
                  </label>
                </>
              )}

              {error && (
                <div className="rounded-lg bg-red-950/40 border border-red-700/50 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-green-950/40 border border-green-700/50 px-3 py-2 text-sm text-green-200">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className={`w-full rounded-xl font-semibold py-3 text-base text-white disabled:opacity-50 ${
                  mode === 'remove' ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}
              >
                {busy ? 'Working…' : mode === 'set' ? 'Set Panic PIN' : mode === 'rotate' ? 'Update PIN' : 'Remove PIN'}
              </button>
            </form>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
