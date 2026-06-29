'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { SentinelSectionHeader } from '@/components/sentinel/SentinelSectionHeader';
import { BrowseSelect } from '@/components/ui/BrowseSelect';
import { useAuth } from '@/hooks/useAuth';
import {
  extractApiError,
  formatGeolocationFailure,
  resolveSafetyCoords,
} from '@/lib/safetyLocation';
import { extractUserStatus } from '@/lib/safetyStatus';
import { safetyService, type UserStatus } from '@/services/safety.service';

const LIVE_STATUS_OPTIONS: UserStatus['currentStatus'][] = [
  'safe',
  'on_the_move',
  'in_transit',
  'unsafe',
  'heading_home',
  'arrived',
  'need_attention',
];

const STATUS_SELECT_OPTIONS = LIVE_STATUS_OPTIONS.map((s) => ({
  value: s,
  label: s.replace(/_/g, ' '),
}));

type DashboardLiveStatusPanelProps = {
  statusFeed: UserStatus[];
  onRefresh: () => Promise<void>;
  onError: (msg: string) => void;
};

export function DashboardLiveStatusPanel({
  statusFeed,
  onRefresh,
  onError,
}: DashboardLiveStatusPanelProps) {
  const { user } = useAuth();
  const [myStatus, setMyStatus] = useState<UserStatus['currentStatus']>('safe');
  const [myStatusMessage, setMyStatusMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const profileCoords =
    user?.location?.latitude != null && user?.location?.longitude != null
      ? { latitude: user.location.latitude, longitude: user.location.longitude }
      : null;

  const loadMyStatus = useCallback(async () => {
    if (!user?.id) {
      setLoadingStatus(false);
      return;
    }
    setLoadingStatus(true);
    try {
      let res: unknown;
      try {
        res = await safetyService.getMyStatus();
      } catch {
        res = await safetyService.getStatus(user.id);
      }
      const status = extractUserStatus(res);
      if (status) {
        setMyStatus(status.currentStatus);
        setMyStatusMessage(status.customMessage ?? '');
        setLastUpdatedAt(status.lastUpdatedAt);
      }
    } catch {
      /* no prior status — keep defaults */
    } finally {
      setLoadingStatus(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadMyStatus();
  }, [loadMyStatus]);

  const onUpdateStatus = async () => {
    onError('');
    setSuccessMessage(null);
    setLocationHint(null);
    setBusy(true);

    let coords = null as Awaited<ReturnType<typeof resolveSafetyCoords>>;
    try {
      coords = await resolveSafetyCoords(profileCoords);
    } catch (err) {
      setLocationHint(formatGeolocationFailure(err));
    }

    if (!coords && profileCoords) {
      coords = { ...profileCoords, source: 'profile' as const };
      setLocationHint('Using your profile location (GPS unavailable).');
    }

    if (!coords) {
      onError(
        'Could not determine your location. Enable location permissions in the browser, or set location on your profile, then try again.',
      );
      setBusy(false);
      return;
    }

    try {
      const res = await safetyService.updateStatus({
        currentStatus: myStatus,
        customMessage: myStatusMessage.trim() || undefined,
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
        visibility: 'guardians_only',
      });

      const updated = extractUserStatus(res) ?? extractUserStatus({ data: res });
      if (updated?.lastUpdatedAt) {
        setLastUpdatedAt(updated.lastUpdatedAt);
      } else {
        setLastUpdatedAt(new Date().toISOString());
      }

      const sourceLabel =
        coords.source === 'gps'
          ? 'GPS'
          : coords.source === 'cached'
            ? 'recent GPS'
            : 'profile';
      setSuccessMessage(`Status shared with your guardians (${sourceLabel}).`);
      await onRefresh();
      await loadMyStatus();
    } catch (err: unknown) {
      onError(extractApiError(err, 'Failed to update status on the server'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="mod-card relative z-10 min-w-0 max-w-full space-y-3 overflow-visible rounded-2xl p-4">
        <SentinelSectionHeader
          title="Your live status"
          subtitle="Guardians-only — share how you are and where you are"
        />

        {loadingStatus ? (
          <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            Loading your current status…
          </p>
        ) : lastUpdatedAt ? (
          <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            Last updated {new Date(lastUpdatedAt).toLocaleString()}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
            {successMessage}
          </p>
        ) : null}

        {locationHint && !successMessage ? (
          <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
            {locationHint}
          </p>
        ) : null}

        <div className="grid min-w-0 grid-cols-1 gap-2 md:grid-cols-3">
          <BrowseSelect
            ariaLabel="Current status"
            value={myStatus}
            options={STATUS_SELECT_OPTIONS}
            onChange={(v) => setMyStatus(v as UserStatus['currentStatus'])}
            disabled={busy}
          />
          <input
            value={myStatusMessage}
            onChange={(e) => setMyStatusMessage(e.target.value)}
            placeholder="Optional message for guardians"
            className="mod-inset w-full min-w-0 rounded-xl px-3 py-2.5 text-sm md:col-span-2"
            style={{ color: 'var(--neu-text)' }}
            disabled={busy}
            maxLength={280}
          />
        </div>
        <button
          type="button"
          onClick={() => void onUpdateStatus()}
          disabled={busy || loadingStatus}
          className="rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? 'Updating…' : 'Update live status'}
        </button>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          Requires at least one accepted guardian. Location is shared from GPS when available, otherwise from your
          profile.
        </p>
      </section>

      <section className="mod-card relative z-0 space-y-3 rounded-2xl p-4">
        <SentinelSectionHeader
          title="People you protect"
          subtitle="Live status from users who added you as guardian"
        />
        {statusFeed.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--neu-text-muted)' }}>
            No circle updates yet. When someone trusts you as a guardian, their status appears here.
          </p>
        ) : (
          <ul className="space-y-2">
            {statusFeed.map((s, index) => {
              const coords = s.location?.coordinates;
              const isLive = Date.now() - new Date(s.lastUpdatedAt).getTime() < 2 * 60 * 1000;
              return (
                <li
                  key={`${String(s.userId)}-${index}`}
                  className="mod-inset flex flex-wrap items-start justify-between gap-2 rounded-xl p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold capitalize" style={{ color: 'var(--neu-text)' }}>
                      {String(s.currentStatus).replace(/_/g, ' ')}
                      <span
                        className={`ml-2 text-[10px] font-bold uppercase ${isLive ? 'text-primary' : ''}`}
                        style={isLive ? undefined : { color: 'var(--neu-text-muted)' }}
                      >
                        {isLive ? 'live' : 'last seen'}
                      </span>
                    </p>
                    {s.customMessage ? (
                      <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                        {s.customMessage}
                      </p>
                    ) : null}
                    <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>
                      {new Date(s.lastUpdatedAt).toLocaleString()}
                      {coords ? ` · ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}` : ''}
                    </p>
                  </div>
                  <Link
                    href={`/safety/trips/watch/${String(s.userId)}`}
                    className="mod-chip px-2.5 py-1 text-[11px] font-semibold text-primary no-underline"
                  >
                    Trip view
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
