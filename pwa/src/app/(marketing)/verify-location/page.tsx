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
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';
import { MapPin, ChevronUp, ArrowRight, Info, Lightbulb, Loader2 } from 'lucide-react';

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

      // NIPOST NDAPS: Automatically resolve physical building and verify address
      try {
        const nipostRes = await geoService.resolveNipostBuilding(loc.lat, loc.lng);
        if (nipostRes.success && nipostRes.data?.building) {
          await geoService.verifyUserBuilding({
            postcode: nipostRes.data.building.digitalPostcode,
            latitude: loc.lat,
            longitude: loc.lng,
          });
        }
      } catch {
        // Non-blocking: community GPS verification still succeeds
      }

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
            <MapPin size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="auth-signup-location-peek__label">Verify location</p>
            <p className="auth-signup-location-peek__name truncate">{communityName}</p>
          </div>
          <span className="auth-signup-location-peek__chevron" aria-hidden>
            <ChevronUp size={16} strokeWidth={2} />
          </span>
        </div>
      }
      footer={
        <div className="auth-signup-actions">
          <button
            type="button"
            disabled={submitting || !communityId}
            onClick={() => void handleVerify()}
            className="auth-btn auth-btn-primary flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 size={16} strokeWidth={2} className="shrink-0 animate-spin" />
                <span>Checking location…</span>
              </>
            ) : (
              <>
                <span>Use my current location</span>
                <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
              </>
            )}
          </button>
        </div>
      }
    >
      <AuthSheetStageHeader
        icon={MapPin}
        eyebrow="Almost there"
        title="Confirm your area"
        meta={communityName}
        signal="GPS check required"
        error={error ?? undefined}
      />

      <div className="auth-signup-sheet-fields flex flex-col gap-3">
        <div className="auth-flow-notice auth-flow-notice--info flex items-start gap-2">
          <Info size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-blue-500" />
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-bold text-xs">Privacy Guaranteed</span>
              <Eli5Tooltip
                title="GPS Verification"
                explanation="We only compare your phone's general area to the estate gate once to make sure you belong here. We do not store or track your exact home address."
              />
            </div>
            <span>
              Your device location is compared to a reference point for{' '}
              <strong className="text-brand-black ">{communityName}</strong> (LGA centroid or map center), within a
              generous radius. No location data is stored.
            </span>
          </div>
        </div>

        <div className="auth-flow-notice auth-flow-notice--info flex items-start gap-2">
          <Lightbulb size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-amber-500" />
          <span>
            Seeing &ldquo;too far&rdquo;? Try moving near a window or stepping outside. Admins can adjust area
            boundaries after running{' '}
            <code className="rounded bg-black/5  px-1 text-[10px]">seed:communities</code>.
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
