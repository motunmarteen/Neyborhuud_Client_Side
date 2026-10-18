'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n';
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
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthSheetStageHeader } from '@/components/auth/AuthSheetStageHeader';
import { MapPin, ChevronUp, ArrowRight, Info, Lightbulb, Loader2 } from 'lucide-react';

export default function VerifyLocationPage() {
  const { t } = useTranslation();
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
      router.replace('/huud?login=1');
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
        router.replace('/huud');
        return;
      }
      if (!getCommunityIdForApi()) {
        setError(t('auth.loc.noArea'));
        setLoading(false);
        return;
      }
      setLoading(false);
    })();
  }, [router]);

  const handleVerify = async () => {
    const id = getCommunityIdForApi();
    if (!id) {
      setError(t('auth.loc.noArea'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      if (!loc) {
        setError(t('auth.loc.permission'));
        return;
      }
      if (
        loc.accuracy == null ||
        !Number.isFinite(loc.accuracy) ||
        loc.accuracy < 0
      ) {
        setError(
          t('auth.loc.noAccuracy'),
        );
        return;
      }
      const res = await geoService.verifyAssignedCommunityLocation(id, {
        lat: loc.lat,
        lng: loc.lng,
        accuracyMeters: loc.accuracy,
      });
      if (!res.success) {
        setError(res.message || t('auth.loc.failed'));
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
        toast.success(t('auth.loc.done'));
        router.replace('/huud');
        return;
      }
      clearGpsVerificationGate();
      await authService.syncCommunityFromProfile();
      toast.success(t('auth.loc.done'));
      router.replace('/huud');
    } catch (e: unknown) {
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : t('auth.error.generic');
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

  const communityName = comm?.name || t('auth.loc.yourArea');

  return (
    <AuthFlowPage
      ariaLabel={t('auth.loc.step')}
      stageKey="verify-location"
      stepLabel={t('auth.loc.step')}
      onBackClick={() => router.back()}
      backLabel={t('common.back')}
      peek={
        <div className="auth-signup-location-peek">
          <span className="auth-signup-location-peek__icon" aria-hidden>
            <MapPin size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="auth-signup-location-peek__label">{t('auth.loc.step')}</p>
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
                <span>{t('auth.loc.busy')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.loc.submit')}</span>
                <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
              </>
            )}
          </button>
        </div>
      }
    >
      <AuthSheetStageHeader
        icon={MapPin}
        eyebrow={t('auth.loc.kicker')}
        title={t('auth.loc.title')}
        meta={communityName}
        signal={t('auth.loc.signal')}
        error={error ?? undefined}
      />

      <div className="auth-signup-sheet-fields flex flex-col gap-3">
        <div className="auth-flow-notice auth-flow-notice--info flex items-start gap-2">
          <Info size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-blue-500" />
          <span>{t('auth.loc.privacy', { area: communityName })}</span>
        </div>

        <div className="auth-flow-notice auth-flow-notice--info flex items-start gap-2">
          <Lightbulb size={16} strokeWidth={2} className="shrink-0 mt-0.5 text-amber-500" />
          <span>{t('auth.loc.tooFar')}</span>
        </div>

        {!error ? (
          <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
            {t('auth.loc.hint')}
          </p>
        ) : null}
      </div>
    </AuthFlowPage>
  );
}
