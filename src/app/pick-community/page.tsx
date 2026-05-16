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

  // Close dropdown when clicking outside
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

  // Defer localStorage read to after hydration to avoid SSR mismatch
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

    // If user is changing community (not first-time setup), allow access
    if (!isChangingCommunity && !getNeedsCommunitySelection()) {
      router.replace('/feed');
      return;
    }

    // For community change, try to get location from stored user data
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

  // Get the correct state/lga for submission
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

      // If changing community, go back to settings; otherwise follow normal flow
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
      router.replace(needsGps ? '/verify-location' : '/feed');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const displayLocation = userLocation || ctx;
  const selectedOption = options.find((o) => o.id === selectedId);

  return (
    <div className="fixed inset-0 h-[100dvh] w-[100vw] neu-base overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-5 pb-4 pt-4 sm:px-6">

        {/* ── Top Chrome Bar ── */}
        <div className="grid shrink-0 grid-cols-[1fr_auto] gap-2 rounded-[1.15rem] bg-white/70 p-1.5 shadow-[0_14px_40px_rgba(26,26,46,0.08)] backdrop-blur-xl">
          <div className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-white shadow-[0_12px_24px_rgba(0,135,81,0.24)]">
            <i className="bi bi-geo-alt-fill text-lg" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isChangingCommunity ? 'Change Area' : 'Pick Neyborhuud'}
            </span>
          </div>
          {isChangingCommunity ? (
            <button
              onClick={() => router.back()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl text-charcoal/45 transition-colors hover:text-brand-blue"
              aria-label="Back to Settings"
            >
              <i className="bi bi-arrow-left text-lg" aria-hidden />
            </button>
          ) : (
            <div className="flex h-11 items-center justify-center rounded-2xl border border-charcoal/5 bg-white/50 px-3">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-charcoal/40">
                Step 2 of 2
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto py-3">

          {/* ── Location Detection Hero ── */}
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
                      <i className="bi bi-map-fill text-sm" aria-hidden />
                    </div>
                    <div className="rounded-full border border-charcoal/5 bg-[#F8FAFC] px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-primary">
                      {isChangingCommunity ? 'Your Location' : 'Area Detected'}
                    </div>
                  </div>
                  <p className="mb-0.5 text-[9px] font-black uppercase tracking-[0.24em] text-primary">
                    {isChangingCommunity ? 'Current location' : 'Detected location'}
                  </p>
                  <h2 className="truncate text-xl font-black tracking-tighter text-[#1A1A2E]">
                    {displayLocation?.lga || '…'}, {displayLocation?.state || '…'}
                  </h2>
                  {ctx?.formattedAddress && !isChangingCommunity && (
                    <p className="mt-1 truncate text-[10px] font-medium text-[#64748B]">
                      {ctx.formattedAddress}
                    </p>
                  )}
                  {ctx?.resolutionSource && ctx.resolutionSource !== 'centroid' && !isChangingCommunity && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-[#475569]">
                      <i className="bi bi-broadcast-pin text-brand-blue" aria-hidden />
                      <span className="truncate">
                        Via{' '}
                        {ctx.resolutionSource === 'google'
                          ? 'Google Maps'
                          : ctx.resolutionSource === 'mapbox'
                          ? 'Mapbox'
                          : ctx.resolutionSource === 'openstreetmap'
                          ? 'OpenStreetMap'
                          : ctx.resolutionSource}
                        {ctx.geocoderDisagreement ? ' (refined)' : ''}
                      </span>
                    </div>
                  )}
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
                  <i className="bi bi-house-heart-fill text-xl" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.24em] text-primary">
                    {isChangingCommunity ? 'Select new area' : 'Confirm your area'}
                  </p>
                  <h1 className="truncate text-[1.3rem] font-black tracking-tighter text-[#1A1A2E]">
                    {isChangingCommunity ? 'Change neyborhuud' : 'Choose neyborhuud'}
                  </h1>
                  <p className="truncate text-[11px] font-medium text-[#6B7280]">
                    {isChangingCommunity
                      ? 'Select a different ward or area after moving.'
                      : 'Pick the ward, LCDA, or area matching where you live.'}
                  </p>
                </div>
              </div>

              {/* ── Combobox ── */}
              <div ref={comboRef} className="relative">
                <button
                  type="button"
                  onClick={() => { if (!loading) setDropdownOpen((v) => !v); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer outline-none focus:outline-none ${
                    selectedId
                      ? 'border-primary/30 bg-primary/5 shadow-[0_0_0_1px_rgba(0,135,81,0.12)]'
                      : 'border-charcoal/5 bg-white shadow-[0_4px_16px_rgba(26,26,46,0.06)]'
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all ${selectedId ? 'bg-primary text-white' : 'bg-[#F1F5F9] text-[#94A3B8]'}`}>
                    <i className={`bi ${selectedId ? 'bi-check-lg' : 'bi-geo'} text-sm`} aria-hidden />
                  </div>
                  {selectedId ? (
                    <span className="flex-1 text-sm font-semibold text-left truncate text-primary">
                      {selectedOption?.name}
                    </span>
                  ) : (
                    <span className="flex-1 text-sm text-left text-[#94A3B8]">
                      {loading ? 'Loading areas…' : 'Select your area'}
                    </span>
                  )}
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary shrink-0" aria-hidden />
                  ) : (
                    <i
                      className={`bi bi-chevron-down text-[#94A3B8] text-xs transition-transform duration-200 shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`}
                      aria-hidden
                    />
                  )}
                </button>

                {dropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-2 rounded-2xl overflow-hidden border border-charcoal/5 bg-white shadow-[0_20px_60px_rgba(26,26,46,0.22)]">
                    {/* Search input */}
                    <div className="px-3 pt-3 pb-2 border-b border-charcoal/5">
                      <div className="flex items-center gap-2 rounded-xl border border-charcoal/5 bg-[#F8FAFC] px-3 py-2">
                        <i className="bi bi-search text-xs text-[#94A3B8]" aria-hidden />
                        <input
                          type="text"
                          placeholder="Search areas…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          autoFocus
                          className="w-full bg-transparent border-0 outline-none focus:outline-none text-sm text-[#1A1A2E] placeholder:text-[#94A3B8]"
                        />
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="text-[#94A3B8] hover:text-[#1A1A2E] transition-colors"
                          >
                            <i className="bi bi-x-lg text-xs" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options list */}
                    <ul className="max-h-56 overflow-y-auto py-1">
                      {filtered.length === 0 ? (
                        <li className="px-4 py-5 text-center text-sm text-[#94A3B8]">
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
                                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                                  isSelected
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-[#1A1A2E] hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <div
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all ${
                                    isSelected ? 'bg-primary' : 'border border-charcoal/15'
                                  }`}
                                >
                                  {isSelected && (
                                    <i className="bi bi-check text-white text-[10px]" />
                                  )}
                                </div>
                                <span className="text-sm font-medium flex-1 truncate">{o.name}</span>
                                <span className="text-[10px] text-[#94A3B8] uppercase tracking-wide shrink-0">
                                  {o.kind === 'ward' ? 'Ward' : o.kind === 'lcda' ? 'LCDA' : 'LGA'}
                                </span>
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* Seed required warning */}
              {seedRequired && !loading && (
                <div className="rounded-2xl border border-brand-amber/25 bg-brand-amber/10 px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-wide text-brand-amber mb-1">
                    Areas not seeded yet
                  </p>
                  <p className="text-[11px] font-medium leading-relaxed text-[#92400E]">
                    Ask your backend admin to run{' '}
                    <code className="text-[10px] bg-black/5 px-1 rounded">pnpm run seed:communities</code>{' '}
                    against production MongoDB, then retry.
                  </p>
                </div>
              )}

              {/* Error alert */}
              {error && (
                <div
                  role="alert"
                  className="rounded-2xl border border-brand-red/25 bg-brand-red/10 px-4 py-3 text-[11px] font-semibold leading-relaxed text-[#991B1B]"
                >
                  {error}
                </div>
              )}

              {/* Submit button */}
              <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
                <button
                  type="button"
                  disabled={!selectedId || submitting}
                  onClick={() => void handleConfirm()}
                  className={`flex h-[50px] items-center justify-center gap-2 rounded-2xl px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedId && !submitting
                      ? 'bg-primary text-white shadow-[0_18px_34px_rgba(0,135,81,0.34)] active:scale-[0.98]'
                      : 'border border-charcoal/5 bg-white text-[#94A3B8] shadow-[0_12px_30px_rgba(26,26,46,0.08)]'
                  }`}
                >
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
                      Saving
                    </>
                  ) : (
                    <>
                      {isChangingCommunity ? 'Update area' : 'Confirm area'}
                      <i className="bi bi-arrow-right" aria-hidden />
                    </>
                  )}
                </button>
                <Link
                  href={isChangingCommunity ? '/settings' : '/feed'}
                  className="flex h-[50px] items-center justify-center gap-2 rounded-2xl border border-charcoal/5 bg-white px-3 text-[10px] font-black uppercase tracking-widest text-[#1A1A2E] shadow-[0_12px_30px_rgba(26,26,46,0.1)] transition-all"
                >
                  {isChangingCommunity ? 'Cancel' : 'Skip'}
                  <i className="bi bi-x" aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <p className="shrink-0 px-1 pb-2 text-[10px] leading-relaxed text-[#94A3B8]">
            Data sourced from public Nigerian administrative ward listings. Lagos includes official LCDA rows where seeded.{' '}
            <Link
              href="/info/nigeria-postal-codes"
              className="text-brand-blue font-semibold underline-offset-2 hover:underline"
            >
              Nigeria postal codes &amp; myths
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PickCommunityPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[100dvh] neu-base flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-blue/30 border-t-brand-blue" />
        </div>
      }
    >
      <PickCommunityContent />
    </Suspense>
  );
}
