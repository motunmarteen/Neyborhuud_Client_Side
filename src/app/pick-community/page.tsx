'use client';

import React, { useEffect, useMemo, useState } from 'react';
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

export default function PickCommunityPage() {
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
  const [userLocation, setUserLocation] = useState<{ state: string; lga: string } | null>(null);

  const ctx = useMemo(() => getStoredPickerContext(), []);

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
        // Use userLocation for change mode, otherwise use ctx
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
        // Update local storage with new community info
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

  // Get display location (from userLocation or ctx)
  const displayLocation = userLocation || ctx;

  return (
    <div className="h-[100dvh] neu-base overflow-y-auto">
      <div className="max-w-lg mx-auto px-5 py-8 pb-24">
        {/* Back button for change mode */}
        {isChangingCommunity && (
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 mb-4 text-sm font-medium"
            style={{ color: 'var(--neu-text-muted)' }}
          >
            <i className="bi bi-arrow-left"></i>
            Back to Settings
          </button>
        )}
        
        {!isChangingCommunity && (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2" style={{ color: 'var(--neu-text-muted)' }}>
            Step 2 of 2
          </p>
        )}
        <h1 className="text-2xl font-semibold tracking-tight mb-2" style={{ color: 'var(--neu-text)' }}>
          {isChangingCommunity ? 'Change your community' : 'Choose your neighborhood'}
        </h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--neu-text-secondary)' }}>
          {isChangingCommunity ? (
            <>
              You are currently in{' '}
              <strong style={{ color: 'var(--neu-text)' }}>
                {displayLocation?.lga || '…'}, {displayLocation?.state || '…'}
              </strong>
              . Select a different ward or area if you've moved or picked the wrong one.
            </>
          ) : (
            <>
              We placed you in{' '}
              <strong style={{ color: 'var(--neu-text)' }}>
                {displayLocation?.lga || '…'}, {displayLocation?.state || '…'}
              </strong>
              . Pick the ward, LCDA, or area that matches where you live (similar to how shopping apps ask you to
              confirm your area within your LGA).
            </>
          )}
        </p>
        {ctx?.resolutionSource && ctx.resolutionSource !== 'centroid' && !isChangingCommunity && (
          <p className="text-xs mb-4 leading-relaxed rounded-xl px-3 py-2" style={{ background: 'var(--neu-card-bg, rgba(0,0,0,0.04))', color: 'var(--neu-text-muted)' }}>
            Area detected via {ctx.resolutionSource === 'google' ? 'Google Maps' : ctx.resolutionSource === 'mapbox' ? 'Mapbox' : ctx.resolutionSource === 'openstreetmap' ? 'OpenStreetMap' : ctx.resolutionSource}
            {ctx.formattedAddress ? ` — ${ctx.formattedAddress}` : ''}
            {ctx.geocoderDisagreement ? ' (refined to match Nigerian LGA boundaries)' : ''}
          </p>
        )}

        <div className="neu-card-sm rounded-2xl p-3 mb-4">
          <input
            type="search"
            placeholder="Search this list…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-0 outline-none text-sm px-2 py-2"
            style={{ color: 'var(--neu-text)' }}
          />
        </div>

        {loading && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--neu-text-muted)' }}>
            Loading areas…
          </p>
        )}

        {seedRequired && !loading && (
          <div className="neu-socket rounded-2xl p-4 text-sm" style={{ color: 'var(--neu-text-secondary)' }}>
            <p className="font-semibold mb-2" style={{ color: 'var(--neu-text)' }}>
              Area list not loaded on the server yet
            </p>
            <p className="mb-2">
              Ask your backend admin to run{' '}
              <code className="text-xs bg-black/5 px-1 rounded">pnpm run seed:communities</code> once
              against production MongoDB, then redeploy or retry.
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl p-4 mb-4 text-sm" style={{ border: '1px solid rgba(255,107,107,0.35)', color: 'var(--neu-text)' }}>
            {error}
          </div>
        )}

        {!loading && !seedRequired && (
          <ul className="flex flex-col gap-2">
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(o.id)}
                  className={`w-full text-left neu-card-sm rounded-2xl px-4 py-3 transition-all ${
                    selectedId === o.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <span className="text-sm font-medium block" style={{ color: 'var(--neu-text)' }}>
                    {o.name}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest mt-1 block" style={{ color: 'var(--neu-text-muted)' }}>
                    {o.kind === 'lga_general'
                      ? 'Whole LGA'
                      : o.kind === 'lcda'
                        ? 'Lagos LCDA'
                        : 'Ward / area'}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && !seedRequired && filtered.length === 0 && !error && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--neu-text-muted)' }}>
            No matches. Try clearing the search or contact support if your LGA looks wrong.
          </p>
        )}

        <p className="text-xs mt-8 leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          Data is sourced from public Nigerian administrative ward listings. Lagos also includes official-style
          LCDA rows where seeded.{' '}
          <Link href="/info/nigeria-postal-codes" className="text-brand-blue font-semibold underline-offset-2 hover:underline">
            Nigeria postal codes & myths
          </Link>
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 neu-base border-t border-black/5">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            disabled={!selectedId || submitting}
            onClick={() => void handleConfirm()}
            className="neu-btn w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs disabled:opacity-40"
            style={{ color: 'var(--neu-text)' }}
          >
            {submitting ? 'Saving…' : isChangingCommunity ? 'Update my community' : 'Confirm my area'}
          </button>
        </div>
      </div>
    </div>
  );
}
