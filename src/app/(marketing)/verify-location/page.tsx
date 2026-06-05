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
import { getPostSetupRoute, hasCompletedProductTour } from '@/lib/onboarding';
import { getAuthSetupProgress } from '@/lib/authSetupFlow';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthSheetStageHeader } from '@/components/auth/AuthSheetStageHeader';

export default function VerifyLocationPage() {
  const router = useRouter();
  const setupProgress = getAuthSetupProgress('verify');
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
        router.replace(hasCompletedProductTour() ? '/feed' : getPostSetupRoute());
        return;
      }
      if (!getCommunityIdForApi()) {
        setError('No assigned Huud found. Pick your area first.');
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
        setError('Location permission is required to verify you are in your Huud.');
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
        router.replace(getPostSetupRoute());
        return;
      }
      clearGpsVerificationGate();
      await authService.syncCommunityFromProfile();
      router.replace(getPostSetupRoute());
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
      <div className="auth-signup-page fixed-app flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue/30 border-t-brand-blue" />
      </div>
    );
  }

  const communityName = comm?.name || 'Your Huud';

  return (
    <AuthFlowPage
      ariaLabel="Verify location"
      stageKey="verify-location"
      progress={setupProgress}
      onBackClick={() => router.back()}
      backLabel="Go back"
      peek={
        <div className="auth-signup-location-peek">
          <span className="auth-signup-location-peek__icon" aria-hidden>
            <span className="material-symbols-outlined" aria-hidden="true">my_location</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="auth-signup-location-peek__label">Verify location</p>
            <p className="auth-signup-location-peek__name truncate">{communityName}</p>
          </div>
          <span className="auth-signup-location-peek__chevron" aria-hidden>
            <span className="material-symbols-outlined" aria-hidden="true">expand_less</span>
          </span>
        </div>
      }
      footer={
        <div className="auth-signup-actions">
          <button
            type="button"
            disabled={submitting || !communityId}
            onClick={() => void handleVerify()}
            className="auth-btn auth-btn-primary"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                <span>Checking location…</span>
              </>
            ) : (
              <>
                <span>Use my current location</span>
                <span className="material-symbols-outlined shrink-0" aria-hidden="true">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <AuthSheetStageHeader
        icon="my_location"
        eyebrow="Almost there"
        title="Confirm your area"
        meta={communityName}
        signal="GPS check required"
        error={error ?? undefined}
      />

      <div className="auth-signup-sheet-fields flex flex-col gap-3">
        <div className="auth-flow-notice auth-flow-notice--info">
          <span className="material-symbols-outlined shrink-0" aria-hidden="true">info</span>
          <span>
            Your device location is compared to a reference point for{' '}
            <strong className="text-brand-black">{communityName}</strong> (LGA centroid or map center), within a
            generous radius. No location data is stored.
          </span>
        </div>

        <div className="auth-flow-notice auth-flow-notice--info">
          <span className="material-symbols-outlined shrink-0 text-status-warning" aria-hidden="true">lightbulb</span>
          <span>
            Seeing &ldquo;too far&rdquo;? Try moving near a window or stepping outside. Admins can adjust area
            boundaries after running{' '}
            <code className="rounded bg-black/5 px-1 text-[10px]">seed:communities</code>.
          </span>
        </div>

        {!error ? (
          <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
            A quick GPS check anchors your account to your Huud
          </p>
        ) : null}
      </div>
    </AuthFlowPage>
  );
}
