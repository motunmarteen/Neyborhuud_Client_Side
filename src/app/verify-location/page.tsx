'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import { getCurrentLocation } from '@/lib/geolocation';
import {
  getCommunityIdForApi,
  getNeedsCommunitySelection,
  getNeedsGpsLocationVerification,
  clearGpsVerificationGate,
  getStoredCommunity,
} from '@/lib/communityContext';
import { geoService } from '@/services/geo.service';
import { authService } from '@/services/auth.service';

export default function VerifyLocationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const communityId = useMemo(() => getCommunityIdForApi(), []);
  const comm = useMemo(() => getStoredCommunity(), []);

  useEffect(() => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('neyborhuud_access_token')
        : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    apiClient.setToken(token);

    if (getNeedsCommunitySelection()) {
      router.replace('/pick-community');
      return;
    }

    void (async () => {
      try {
        await authService.syncCommunityFromProfile();
      } catch {
        /* ignore */
      }
      if (!getNeedsGpsLocationVerification()) {
        router.replace('/feed');
        return;
      }
      if (!getCommunityIdForApi()) {
        setError('No assigned neyborhuud found. Pick your area first.');
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
  }, [router]);

  const handleVerify = async () => {
    const id = getCommunityIdForApi();
    if (!id) {
      setError('Missing community. Go back and pick your area.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      if (!loc) {
        setError('Location permission is required to verify you are in your neyborhuud.');
        return;
      }
      if (
        loc.accuracy == null ||
        !Number.isFinite(loc.accuracy) ||
        loc.accuracy < 0
      ) {
        setError(
          'Your device did not report GPS accuracy. Try again, enable high accuracy, or use another browser.',
        );
        return;
      }
      const res = await geoService.verifyAssignedCommunityLocation(id, {
        lat: loc.lat,
        lng: loc.lng,
        accuracyMeters: loc.accuracy,
      });
      if (!res.success) {
        setError(res.message || 'Verification failed.');
        return;
      }
      const data = res.data;
      if (data?.alreadyVerified) {
        clearGpsVerificationGate();
        await authService.syncCommunityFromProfile();
        router.replace('/feed');
        return;
      }
      clearGpsVerificationGate();
      await authService.syncCommunityFromProfile();
      router.replace('/feed');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Something went wrong.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-[100vw] neu-base flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue/30 border-t-brand-blue" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-[100vw] neu-base overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-5 pb-4 pt-4 sm:px-6">

        {/* ── Top Chrome Bar ── */}
        <div className="grid shrink-0 grid-cols-[1fr_auto] gap-2 rounded-[1.15rem] bg-white/70 p-1.5 shadow-[0_14px_40px_rgba(26,26,46,0.08)] backdrop-blur-xl">
          <div className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-white shadow-[0_12px_24px_rgba(0,135,81,0.24)]">
            <i className="bi bi-broadcast-pin text-lg" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest">Verify Location</span>
          </div>
          <div className="flex h-11 items-center justify-center rounded-2xl border border-charcoal/5 bg-white/50 px-3">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/40">
              Step 3 of 3
            </span>
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-3">

          {/* ── Community Hero ── */}
          <div className="-mx-5 shrink-0 bg-white/[0.76] shadow-inner sm:-mx-6">
            <div className="relative flex min-h-[110px] items-center justify-center overflow-hidden px-6 py-3">
              <div className="absolute left-4 top-5 h-2 w-32 rotate-12 rounded-full bg-primary/16" aria-hidden />
              <div className="absolute right-4 top-1/2 h-2 w-32 -rotate-12 rounded-full bg-brand-blue/16" aria-hidden />
              <div className="absolute bottom-4 left-10 h-2 w-36 -rotate-6 rounded-full bg-brand-amber/20" aria-hidden />
              <div className="absolute inset-x-10 top-1/2 h-px bg-gradient-to-r from-transparent via-primary/24 to-transparent" aria-hidden />

              <div className="relative w-full max-w-[19rem] overflow-hidden rounded-[1.6rem] border border-white/85 bg-white/[0.92] shadow-[0_26px_64px_rgba(26,26,46,0.16)] backdrop-blur-xl">
                <div className="h-1.5 bg-gradient-to-r from-primary via-brand-blue to-brand-amber" aria-hidden />
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-[0_10px_20px_rgba(0,135,81,0.3)]">
                      <i className="bi bi-pin-map-fill text-sm" aria-hidden />
                    </div>
                    <div className="rounded-full border border-charcoal/5 bg-[#F8FAFC] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                      Assigned Area
                    </div>
                  </div>
                  <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-primary">
                    Your neyborhuud
                  </p>
                  <h2 className="truncate text-xl font-black tracking-tighter text-[#1A1A2E]">
                    {comm?.name || '…'}
                  </h2>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#475569]">
                    <i className="bi bi-shield-check text-brand-blue" aria-hidden />
                    <span className="truncate">GPS check required to verify residency</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Main Form Card ── */}
          <div className="shrink-0 rounded-[1.7rem] border border-white/85 bg-white/[0.94] shadow-[0_28px_70px_rgba(26,26,46,0.18)] backdrop-blur-2xl">
            <div className="h-1.5 rounded-t-[1.7rem] bg-gradient-to-r from-primary via-brand-blue to-brand-amber" aria-hidden />
            <div className="flex flex-col gap-3 p-3.5">

              {/* Card header */}
              <div className="flex items-center gap-3">
                <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[1.25rem] bg-primary text-white shadow-[0_18px_34px_rgba(0,135,81,0.34)]">
                  <i className="bi bi-crosshair text-xl" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">
                    Almost there
                  </p>
                  <h1 className="truncate text-[1.3rem] font-black tracking-tighter text-[#1A1A2E]">
                    Confirm your area
                  </h1>
                  <p className="truncate text-[11px] font-medium text-[#6B7280]">
                    A quick GPS check anchors your account to your neyborhuud.
                  </p>
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 rounded-2xl border border-charcoal/5 bg-white px-4 py-3 shadow-[0_4px_16px_rgba(26,26,46,0.06)]">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10">
                  <i className="bi bi-info-circle text-brand-blue text-sm" aria-hidden />
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-[#475569]">
                  Your device location is compared to a reference point for{' '}
                  <strong className="text-[#1A1A2E]">{comm?.name || 'your area'}</strong>{' '}
                  (LGA centroid or map center), within a generous radius. No location data is stored.
                </p>
              </div>

              {/* Error alert */}
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-brand-red/25 bg-brand-red/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-[#991B1B]"
                >
                  {error}
                </div>
              )}

              {/* GPS tip */}
              <div className="flex items-start gap-3 rounded-2xl border border-brand-amber/20 bg-brand-amber/8 px-4 py-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-brand-amber/15">
                  <i className="bi bi-lightbulb text-brand-amber text-sm" aria-hidden />
                </div>
                <p className="text-[11px] font-medium leading-relaxed text-[#92400E]">
                  Seeing &ldquo;too far&rdquo;? Try moving near a window or stepping outside. Admins can adjust area boundaries after running{' '}
                  <code className="rounded bg-black/5 px-1 text-[10px]">seed:communities</code>.
                </p>
              </div>

              {/* Verify button */}
              <button
                type="button"
                disabled={submitting || !communityId}
                onClick={() => void handleVerify()}
                className={`flex h-[50px] items-center justify-center gap-2 rounded-2xl px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                  !submitting && communityId
                    ? 'bg-primary text-white shadow-[0_18px_34px_rgba(0,135,81,0.34)] active:scale-[0.98]'
                    : 'border border-charcoal/5 bg-white text-[#94A3B8] shadow-[0_12px_30px_rgba(26,26,46,0.08)]'
                }`}
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                    Checking location
                  </>
                ) : (
                  <>
                    Use my current location
                    <i className="bi bi-arrow-right" aria-hidden />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
