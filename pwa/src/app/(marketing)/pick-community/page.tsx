'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import {
  getStoredPickerContext,
  getNeedsCommunitySelection,
} from '@/lib/communityContext';
import { AuthFlowLoading } from '@/components/auth/AuthFlowLoading';
import { AuthFlowPage } from '@/components/auth/AuthFlowPage';
import { AuthSheetStageHeader } from '@/components/auth/AuthSheetStageHeader';
import { PremiumInput } from '@/components/ui/PremiumInput';
import { Eli5Tooltip } from '@/components/ui/Eli5Tooltip';
import { getCurrentLocation } from '@/lib/geolocation';
import { reverseGeocode } from '@/lib/reverseGeocode';
import { toast } from 'sonner';
import {
  Home,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  X,
  SkipForward,
  AlertCircle,
  MapPin,
  Search,
  Check,
  AlertTriangle,
  Compass,
} from 'lucide-react';

type PickerOption = {
  id: string;
  name: string;
  state: string;
  lga: string;
  kind: 'ward' | 'lga_general' | 'lcda';
};

function PickCommunityContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isChangingCommunity = searchParams.get('change') === 'true';

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

  // GPS & Manual fallback states
  const [detectingLoc, setDetectingLoc] = useState(false);
  const [manualState, setManualState] = useState('');
  const [manualLga, setManualLga] = useState('');
  const hasAttemptedDetect = useRef(false);

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

  const handleDetectLocation = async () => {
    setDetectingLoc(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      if (!loc) {
        throw new Error(t('auth.loc.permission'));
      }
      const addr = await reverseGeocode(loc.lat, loc.lng);
      if (!addr || !addr.state || !addr.lga) {
        throw new Error(t('auth.pick.noResolve'));
      }
      
      const pickerCtx = {
        state: addr.state,
        lga: addr.lga,
        formattedAddress: addr.formatted || `${addr.lga}, ${addr.state}`,
        resolutionSource: addr.source || 'gps',
      };
      localStorage.setItem('neyborhuud_picker_context', JSON.stringify(pickerCtx));
      setCtx(pickerCtx);
      toast.success(t('auth.pick.detected', { place: `${addr.lga}, ${addr.state}` }));
    } catch (err: any) {
      setError(err.message || t('auth.pick.detectFailed'));
    } finally {
      setDetectingLoc(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualState.trim() || !manualLga.trim()) return;
    
    const pickerCtx = {
      state: manualState.trim(),
      lga: manualLga.trim(),
      formattedAddress: `${manualLga.trim()}, ${manualState.trim()}`,
      resolutionSource: 'manual',
    };
    
    localStorage.setItem('neyborhuud_picker_context', JSON.stringify(pickerCtx));
    setCtx(pickerCtx);
    toast.success(t('auth.pick.setTo', { place: `${pickerCtx.lga}, ${pickerCtx.state}` }));
  };

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

    if (!isChangingCommunity && !getNeedsCommunitySelection()) {
      router.replace('/huud');
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
      if (!hasAttemptedDetect.current) {
        hasAttemptedDetect.current = true;
        void handleDetectLocation();
      } else {
        setLoading(false);
      }
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
          setError(res.message || t('auth.pick.loadFailed'));
          setOptions([]);
          return;
        }
        if (res.data.seedRequired) {
          setSeedRequired(true);
          setOptions([]);
          return;
        }
        if (res.data.options?.length === 0) {
          setError(t('auth.pick.none'));
          setOptions([]);
          return;
        }
        setOptions(res.data.options || []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : t('auth.pick.loadFailed'));
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
        setError(res.message || t('auth.pick.saveFailed'));
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

      router.replace('/huud');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('auth.error.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const displayLocation = userLocation || ctx;
  const selectedOption = options.find((o) => o.id === selectedId);
  const locationTitle =
    displayLocation?.lga && displayLocation?.state
      ? `${displayLocation.lga}, ${displayLocation.state}`
      : t('auth.pick.loading');
  const locationMeta = ctx?.formattedAddress || locationTitle;
  const showManualForm = !displayLocation?.state || !displayLocation?.lga;

  return (
    <AuthFlowPage
      ariaLabel={isChangingCommunity ? t('auth.pick.changeTitle') : t('auth.pick.title')}
      stageKey={`pick-${isChangingCommunity ? 'change' : 'setup'}-${loading ? 'loading' : 'ready'}`}
      stepLabel={isChangingCommunity ? t('auth.pick.change') : t('auth.pick.title')}
      backHref={isChangingCommunity ? '/settings' : undefined}
      backLabel={isChangingCommunity ? t('auth.pick.backSettings') : undefined}
      peek={
        <div className="auth-signup-location-peek">
          <span className="auth-signup-location-peek__icon" aria-hidden>
            <Home size={18} strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="auth-signup-location-peek__label">
              {isChangingCommunity ? t('auth.pick.change') : t('auth.pick.title')}
            </p>
            <p className="auth-signup-location-peek__name truncate">
              {selectedOption?.name || locationTitle}
            </p>
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
            disabled={!selectedId || submitting || loading || detectingLoc}
            onClick={() => void handleConfirm()}
            className="auth-btn auth-btn-primary flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 shrink-0 rounded-full border-2 border-black/30 border-t-black animate-spin" aria-hidden />
                <span>{t('auth.reset.busy')}</span>
              </>
            ) : (
              <>
                <span>{isChangingCommunity ? t('auth.pick.update') : t('auth.pick.confirm')}</span>
                <ArrowRight size={17} strokeWidth={2.4} className="shrink-0" />
              </>
            )}
          </button>
          <Link
            href={isChangingCommunity ? '/settings' : '/huud'}
            className="auth-btn auth-btn-secondary no-underline flex items-center justify-center gap-1.5"
          >
            {isChangingCommunity ? (
              <X size={16} strokeWidth={2} className="shrink-0" />
            ) : (
              <SkipForward size={16} strokeWidth={2} className="shrink-0" />
            )}
            <span>{isChangingCommunity ? t('common.cancel') : t('auth.pick.skip')}</span>
          </Link>
        </div>
      }
      footerLink={
        <>
          <p className="auth-signin-link auth-signin-link--sheet mt-3 border-t border-charcoal/8 pt-3">
            {isChangingCommunity ? (
              <>
                {t('auth.pick.needHelp')}{' '}
                <Link href="/settings">{t('auth.pick.backSettings')}</Link>
              </>
            ) : (
              <>
                {t('auth.pick.wrong')}{' '}
                <Link href="/huud?join=1">{t('auth.pick.startOver')}</Link>
              </>
            )}
          </p>
        </>
      }
    >
      <AuthSheetStageHeader
        icon="home"
        eyebrow={isChangingCommunity ? t('auth.pick.changeSignal') : t('auth.pick.fromSignup')}
        title={selectedOption?.name || (isChangingCommunity ? t('auth.pick.changeTitle') : t('auth.pick.title'))}
        meta={locationMeta}
        signal=""
        error={error && !loading && !selectedId ? error : undefined}
      />

      <div className="auth-signup-sheet-fields flex flex-col gap-3">
        {detectingLoc ? (
          <div className="auth-flow-notice auth-flow-notice--info" role="status">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" aria-hidden />
            <span>{t('auth.pick.detecting')}</span>
          </div>
        ) : loading ? (
          <div className="auth-flow-notice auth-flow-notice--info" role="status">
            <span className="h-4 w-4 shrink-0 rounded-full border-2 border-brand-blue/30 border-t-brand-blue animate-spin" aria-hidden />
            <span>{t('auth.pick.loadingAreas')}</span>
          </div>
        ) : showManualForm ? (
          <div className="flex flex-col gap-3">
            {error && (
              <div className="auth-flow-notice auth-flow-notice--error" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            
            <button
              type="button"
              onClick={handleDetectLocation}
              className="auth-btn auth-btn-secondary w-full py-3 flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{t('auth.pick.useLocation')}</span>
            </button>

            <div className="flex items-center gap-3 my-2 text-charcoal/50 " aria-hidden="true">
              <span className="flex-1 h-[1px] bg-charcoal/10 " />
              <span className="text-[10px] font-bold tracking-widest uppercase">or enter manually</span>
              <span className="flex-1 h-[1px] bg-charcoal/10 " />
            </div>

            <PremiumInput
              label={t('auth.pick.state')}
              placeholder="e.g. Kano"
              value={manualState}
              onChange={(e) => setManualState(e.target.value)}
            />

            <PremiumInput
              label={t('auth.pick.lga')}
              placeholder="e.g. Nassarawa"
              value={manualLga}
              onChange={(e) => setManualLga(e.target.value)}
            />

            <button
              type="button"
              disabled={!manualState.trim() || !manualLga.trim()}
              onClick={handleManualSubmit}
              className="auth-btn auth-btn-primary w-full py-3 mt-2 flex items-center justify-center gap-2"
            >
              <span>{t('auth.pick.find')}</span>
              <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs font-semibold text-charcoal/70 ">{t('auth.pick.yourHuud')}</span>
              <Eli5Tooltip 
                term={t('auth.pick.whatTerm')}
                explanation={t('auth.pick.whatBody')}
              />
            </div>
            <div ref={comboRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label={selectedOption ? t('auth.pick.selected', { name: selectedOption.name }) : t('auth.pick.select')}
                className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 transition-all outline-none focus:outline-none ${
                  selectedId
                    ? 'border-primary/40 bg-primary/10 shadow-[0_0_0_1px_rgba(0,184,46,0.2)]'
                    : 'border-charcoal/10  bg-white  shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${
                    selectedId ? 'bg-primary text-black font-bold' : 'bg-charcoal/5  text-[var(--neu-text-muted)]'
                  }`}
                >
                  {selectedId ? <Check className="w-4 h-4" aria-hidden="true" /> : <MapPin className="w-4 h-4" aria-hidden="true" />}
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
                <ChevronDown
                  className={`w-4 h-4 shrink-0 text-[var(--neu-text-muted)] transition-transform duration-200 ${
                    dropdownOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {dropdownOpen ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-charcoal/10  bg-white  shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                  <div className="border-b border-charcoal/10  px-3 pb-2 pt-3">
                    <div className="flex items-center gap-2 rounded-xl border border-charcoal/10  bg-brand-surface  px-3 py-2">
                      <Search className="w-4 h-4 text-[var(--neu-text-muted)] shrink-0" aria-hidden="true" />
                      <input
                        type="text"
                        placeholder={t('auth.pick.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                        className="w-full border-0 bg-transparent text-sm text-brand-black  outline-none placeholder:text-[var(--neu-text-muted)] focus:outline-none"
                      />
                      {search ? (
                        <button
                          type="button"
                          onClick={() => setSearch('')}
                          className="text-[var(--neu-text-muted)] hover:text-brand-black  transition-colors"
                          aria-label={t('auth.pick.clear')}
                        >
                          <X className="w-4 h-4" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <ul className="max-h-48 overflow-y-auto py-1 sm:max-h-56 divide-y divide-charcoal/5 ">
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
                                  ? 'bg-primary/10 text-primary font-semibold'
                                  : 'text-brand-black  hover:bg-black/5 '
                              }`}
                            >
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                                  isSelected ? 'bg-primary text-black' : 'border border-charcoal/20 '
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-3 h-3 stroke-[3]" aria-hidden="true" />
                                ) : null}
                              </div>
                              <span className="flex-1 truncate text-sm">{o.name}</span>
                              <span className="shrink-0 text-[10px] uppercase font-bold tracking-wide px-1.5 py-0.5 rounded bg-black/5  text-[var(--neu-text-muted)]">
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
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" aria-hidden="true" />
                <span>
                  Areas not seeded yet. Ask your backend admin to run{' '}
                  <code className="rounded bg-black/10  px-1 text-[10px]">pnpm run seed:communities</code>, then retry.
                </span>
              </div>
            ) : null}

            {error && selectedId ? (
              <div className="auth-flow-notice auth-flow-notice--error" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" aria-hidden="true" />
                <span>{error}</span>
              </div>
            ) : (
              <p className="text-center text-[11px] font-medium leading-relaxed text-[var(--neu-text-muted)]">
                {isChangingCommunity
                  ? t('auth.pick.movedHint')
                  : t('auth.pick.hint')}
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
