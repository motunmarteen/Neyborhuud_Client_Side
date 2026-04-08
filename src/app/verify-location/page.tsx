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
        setError('No assigned neighborhood found. Pick your area first.');
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
        setError('Location permission is required to verify you are in your neighborhood.');
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
      <div className="h-[100dvh] neu-base flex items-center justify-center px-6">
        <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] neu-base overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 py-8 pb-28">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2"
          style={{ color: 'var(--neu-text-muted)' }}
        >
          Step 3 of 3
        </p>
        <h1
          className="text-2xl font-semibold tracking-tight mb-2"
          style={{ color: 'var(--neu-text)' }}
        >
          Confirm you&apos;re in your area
        </h1>
        <p
          className="text-sm mb-6 leading-relaxed"
          style={{ color: 'var(--neu-text-secondary)' }}
        >
          We use a quick GPS check so your account matches the neighborhood you chose
          {comm?.name ? (
            <>
              : <strong style={{ color: 'var(--neu-text)' }}>{comm.name}</strong>
            </>
          ) : (
            '.'
          )}{' '}
          Your device location is compared to a reference point for that area (LGA centroid or map
          center), within a generous radius.
        </p>

        {error && (
          <div
            className="rounded-2xl p-4 mb-4 text-sm"
            style={{
              border: '1px solid rgba(255,107,107,0.35)',
              color: 'var(--neu-text)',
            }}
          >
            {error}
          </div>
        )}

        <p className="text-xs mb-6 leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          If you are home but see “too far,” try moving near a window or outdoors. Admins can adjust
          area data after <code className="text-[10px]">pnpm run seed:communities</code> on the server.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 neu-base border-t border-black/5">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            disabled={submitting || !communityId}
            onClick={() => void handleVerify()}
            className="neu-btn w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-40"
            style={{ color: 'var(--neu-text)' }}
          >
            {submitting ? 'Checking location…' : 'Use my current location'}
          </button>
        </div>
      </div>
    </div>
  );
}
