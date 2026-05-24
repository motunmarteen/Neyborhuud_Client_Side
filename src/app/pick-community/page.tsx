'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import {
  getStoredPickerContext,
  getNeedsCommunitySelection,
} from '@/lib/communityContext';
import { getPostSetupRoute } from '@/lib/onboarding';
import { getAuthSetupProgress } from '@/lib/authSetupFlow';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthSheetStageHeader } from '@/components/auth/AuthSheetStageHeader';

type PickerOption = {
  id: string;
  name: string;
  state: string;
  lga: string;
  kind: 'ward' | 'lga_general' | 'lcda';
};

function PickCommunityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isChangingCommunity = searchParams.get('change') === 'true';
  const setupProgress = getAuthSetupProgress('pick');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<PickerOption[]>([]);
  const [seedRequired, setSeedRequired] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ state: string; lga: string } | null>(null);
  const comboRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [ctx, setCtx] = useState<ReturnType<typeof getStoredPickerContext>>(null);

  useEffect(() => {
    setCtx(getStoredPickerContext());
  }, []);

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

    if (!isChangingCommunity && !getNeedsCommunitySelection()) {
      router.replace('/feed');
      return;
    }

    let locationState = ctx?.state;
    let locationLga = ctx?.lga;

    if (isChangingCommunity && (!locationState || !locationLga)) {
      const userData = localStorage.getItem('neyborhuud_user');
      if (userData) {
        const user = JSON.parse(userData) as {
          location?: { state?: string; lga?: string };
        };
        const st = user.location?.state;
        const lg = user.location?.lga;
        if (st && lg) {
          locationState = st;
          locationLga = lg;
          setUserLocation({ state: st, lga: lg });
        }
      }
    }

    if (!locationState || !locationLga) {
      setError(
        'We could not load your detected area. Go back to sign up or update location in settings.',
      );
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const stateParam = userLocation?.state || ctx?.state || locationState;
        const lgaParam = userLocation?.lga || ctx?.lga || locationLga;

        const res = await apiClient.get<{
          options?: PickerOption[];
          seedRequired?: boolean;
        }>(
          `/geo/community-picker-options?state=${encodeURIComponent(stateParam)}&lga=${encodeURIComponent(lgaParam)}`,
        );
        if (!res.success || !res.data) {
          setError(res.message || 'Could not load areas.');
          setOptions([]);
          return;
        }
        if (res.data.seedRequired) {
          setSeedRequired(true);
          setOptions([]);
          return;
        }
        setOptions(res.data.options || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load list.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router, ctx?.state, ctx?.lga, userLocation, isChangingCommunity]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, search]);

  const getLocationParams = () => {
    if (userLocation?.state && userLocation?.lga) {
      return { state: userLocation.state, lga: userLocation.lga };
    }
    return { state: ctx?.state || '', lga: ctx?.lga || '' };
  };

  const handleConfirm = async () => {
    const locationParams = getLocationParams();
    if (!selectedId || (!locationParams.state && !locationParams.lga)) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await authService.confirmCommunity({
        communityId: selectedId,
        state: locationParams.state,
        lga: locationParams.lga,
      });
      if (!res.success) {
        setError(res.message || 'Could not save your area.');
        return;
      }

      if (isChangingCommunity) {
        const userData = localStorage.getItem('neyborhuud_user');
        if (userData && res.data?.community) {
          const user = JSON.parse(userData);
          user.assignedCommunity = res.data.community;
          const comm = res.data.community as { id?: string; _id?: string };
          user.assignedCommunityId =
            comm.id ?? comm._id ?? user.assignedCommunityId;
          localStorage.setItem('neyborhuud_user', JSON.stringify(user));
        }
        router.replace('/settings');
        return;
      }

      const needsGps = res.data?.needsGpsLocationVerification === true;
      router.replace(needsGps ? '/verify-location' : getPostSetupRoute());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayLocation = userLocation || ctx;
  const selectedOption = options.find((o) => o.id === selectedId);
  const locationTitle =
    displayLocation?.lga && displayLocation?.state
      ? `${displayLocation.lga}, ${displayLocation.state}`
      : 'Loading area…';
  const locationMeta = ctx?.formattedAddress || locationTitle;
  const locationSignal =
    ctx?.resolutionSource && ctx.resolutionSource !== 'centroid' && !isChangingCommunity
      ? `Via ${
          ctx.resolutionSource === 'google'
            ? 'Google Maps'
            : ctx.resolutionSource === 'mapbox'
              ? 'Mapbox'
              : ctx.resolutionSource === 'openstreetmap'
                ? 'OpenStreetMap'
                : ctx.resolutionSource
        }${ctx.geocoderDisagreement ? ' (refined)' : ''}`
      : isChangingCommunity
        ? 'Select your new ward or area'
        : 'Area detected from signup';

  return (
    <AuthFlowPage
      ariaLabel={isChangingCommunity ? 'Change neyborhuud' : 'Pick neyborhuud'}
      stageKey={`pick-${isChangingCommunity ? 'change' : 'setup'}-${loading ? 'loading' : 'ready'}`}
      stepLabel={isChangingCommunity ? 'Change area' : setupProgress.stepLabel}
      progress={isChangingCommunity ? undefined : setupProgress}
      backHref={isChangingCommunity ? '/settings' : undefined}
      backLabel={isChangingCommunity ? 'Back to settings' : undefined}
      peek={
        <div className="auth-signup-location-peek">
          <span className="auth-signup-location-peek__icon" aria-hidden>
            <i className="bi bi-house-heart-fill" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="auth-signup-location-peek__label">
              {isChangingCommunity ? 'Change area' : 'Pick your Huud'}
            </p>
            <p className="auth-signup-location-peek__name truncate">
              {selectedOption?.name || locationTitle}
            </p>
          </div>
          <span className="auth-signup-location-peek__chevron" aria-hidden>
            <i className="bi bi-chevron-up" />
          </span>
        </div>
      }
      footer={
        <div className="auth-signup-actions">
          <button
            type="button"
            disabled={!selectedId || submitting || loading}
            onClick={() => void handleConfirm()}
            className="auth-btn auth-btn-primary"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-[#0a1a0f]/30 border-t-[#0a1a0f] animate-spin" aria-hidden />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <span>{isChangingCommunity ? 'Update area' : 'Confirm area'}</span>
                <i className="bi bi-arrow-right shrink-0" aria-hidden />
              </>
            )}
          </button>
          <Link
            href={isChangingCommunity ? '/settings' : '/feed'}
            className="auth-btn auth-btn-secondary no-underline"
          >
            <i className={`bi ${isChangingCommunity ? 'bi-x-lg' : 'bi-skip-forward'} shrink-0`} aria-hidden />
            <span>{isChangingCommunity ? 'Cancel' : 'Skip for now'}</span>
          </Link>
        </div>
      }
      footerLink={
        <>
          <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
            {isChangingCommunity ? (
              <>
                Need help?{' '}
                <Link href="/settings">Back to settings</Link>
              </>
            ) : (
              <>
                Wrong location?{' '}
                <Link href="/signup">Start over with signup</Link>
              </>
            )}
          </p>
          <p className="mt-2 text-center text-[10px] leading-relaxed text-[var(--neu-text-muted)]">
            Data sourced from public Nigerian administrative ward listings.{' '}
            <Link
              href="/info/nigeria-postal-codes"
              className="font-semibold text-[var(--landing-green-deep,#006f35)] underline-offset-2 hover:underline"
            >
              Nigeria postal codes &amp; myths
            </Link>
          </p>
        </>
      }
    >
      <AuthSheetStageHeader
        icon="bi-house-heart-fill"
        eyebrow={isChangingCommunity ? 'Select new area' : 'Confirm your area'}
        title={selectedOption?.name || (isChangingCommunity ? 'Change neyborhuud' : 'Choose neyborhuud')}
        meta={locationMeta}
        signal={locationSignal}
        error={error && !loading && !selectedId ? error : undefined}
      />

      <div className="auth-signup-sheet-fields flex flex-col gap-3">
        {loading ? (
          <div className="auth-flow-notice auth-flow-notice--info" role="status">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" aria-hidden />
            <span>Loading areas for your location…</span>
          </div>
        ) : (
          <>
            <div ref={comboRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label={selectedOption ? `Selected area: ${selectedOption.name}` : 'Select your area'}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 transition-all outline-none focus:outline-none ${
                  selectedId
                    ? 'border-primary/30 bg-primary/5 shadow-[0_0_0_1px_rgba(0,111,53,0.12)]'
                    : 'border-charcoal/5 bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                    selectedId ? 'bg-primary text-white' : 'bg-[#F1F5F9] text-[var(--neu-text-muted)]'
                  }`}
                >
                  <i className={`bi ${selectedId ? 'bi-check-lg' : 'bi-geo'} text-sm`} aria-hidden />
                </div>
                {selectedId ? (
                  <span className="flex-1 truncate text-left text-sm font-semibold text-primary">
                    {selectedOption?.name}
                  </span>
                ) : (
                  <span className="flex-1 text-left text-sm text-[var(--neu-text-muted)]">
                    Select your area
                  </span>
                )}
                <i
                  className={`bi bi-chevron-down shrink-0 text-xs text-[var(--neu-text-muted)] transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden
                />
              </button>

              {dropdownOpen ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-charcoal/5 bg-white shadow-[0_8px_24px_rgba(26,26,46,0.12)]">
                  <div className="border-b border-charcoal/5 px-3 pb-2 pt-3">
                    <div className="flex items-center gap-2 rounded-xl border border-charcoal/5 bg-brand-surface px-3 py-2">
                      <i className="bi bi-search text-xs text-[var(--neu-text-muted)]" aria-hidden />
                      <input
                        type="text"
                        placeholder="Search areas…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                        className="w-full border-0 bg-transparent text-sm text-brand-black outline-none placeholder:text-[var(--neu-text-muted)] focus:outline-none"
                      />
                      {search ? (
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          className="text-[var(--neu-text-muted)] transition-colors hover:text-brand-black"
                          aria-label="Clear search"
                        >
                          <i className="bi bi-x-lg text-xs" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <ul className="max-h-48 overflow-y-auto py-1 sm:max-h-56">
                    {filtered.length === 0 ? (
                      <li className="px-4 py-5 text-center text-sm text-[var(--neu-text-muted)]">
                        No areas match &ldquo;{search}&rdquo;
                      </li>
                    ) : (
                      filtered.map((o) => {
                        const isSelected = selectedId === o.id;
                        return (
                          <li key={o.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(o.id);
                                setSearch('');
                                setDropdownOpen(false);
                              }}
                              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                                isSelected
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-brand-black hover:bg-brand-surface'
                              }`}
                            >
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                                  isSelected ? 'bg-primary' : 'border border-charcoal/15'
                                }`}
                              >
                                {isSelected ? (
                                  <i className="bi bi-check text-[10px] text-white" />
                                ) : null}
                              </div>
                              <span className="flex-1 truncate text-sm font-medium">{o.name}</span>
                              <span className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--neu-text-muted)]">
                                {o.kind === 'ward' ? 'Ward' : o.kind === 'lcda' ? 'LCDA' : 'LGA'}
                              </span>
                            </button>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              ) : null}
            </div>

            {seedRequired ? (
              <div className="auth-flow-notice auth-flow-notice--info">
                <i className="bi bi-exclamation-triangle-fill shrink-0" aria-hidden />
                <span>
                  Areas not seeded yet. Ask your backend admin to run{' '}
                  <code className="rounded bg-black/5 px-1 text-[10px]">pnpm run seed:communities</code>, then retry.
                </span>
              </div>
            ) : null}

            {error && selectedId ? (
              <div className="auth-flow-notice auth-flow-notice--error" role="alert">
                <i className="bi bi-exclamation-circle-fill shrink-0" aria-hidden />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-center text-[10px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                {isChangingCommunity
                  ? 'Select a different ward or area after moving.'
                  : 'Your Huud is tied to the area you choose'}
              </p>
            )}
          </>
        )}
      </div>
    </AuthFlowPage>
  );
}

export default function PickCommunityPage() {
  return (
    <Suspense fallback={<AuthFlowLoading />}>
      <PickCommunityContent />
    </Suspense>
  );
}
