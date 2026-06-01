'use client';

import type { TrackingLocationPoint } from '@/services/safety.service';
import { formatTrackingTime } from '@/lib/liveTrackingFormat';
import { BrowseEmptyState } from '@/components/layout/BrowseEmptyState';

type LiveTrackingTrailPanelProps = {
  points: TrackingLocationPoint[];
  sessionActive: boolean;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
};

export function LiveTrackingTrailPanel({
  points,
  sessionActive,
  loading = false,
  error = null,
  onRefresh,
}: LiveTrackingTrailPanelProps) {
  return (
    <div className="space-y-3 pb-24">
      <div className="mod-card rounded-2xl p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.14em] text-brand-red">Location trail</p>
        <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--neu-text-muted)' }}>
          Every GPS ping from your session — newest first. Guardians use this path to follow your movement. It fills as
          your phone sends locations (about every 30 seconds while tracking is active).
        </p>
        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="mt-3 touch-manipulation rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary disabled:opacity-50"
          >
            {loading ? 'Refreshing trail…' : 'Refresh trail'}
          </button>
        ) : null}
      </div>

      {error ? (
        <div className="mod-card rounded-2xl border border-amber-400/40 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/25">
          {error}
        </div>
      ) : null}

      {loading && points.length === 0 ? (
        <div className="mod-card rounded-2xl py-12 text-center text-sm" style={{ color: 'var(--neu-text-muted)' }}>
          Loading trail…
        </div>
      ) : points.length === 0 ? (
        <BrowseEmptyState
          icon="timeline"
          title={sessionActive ? 'Waiting for pings' : 'No location trail yet'}
          description={
            sessionActive
              ? 'Points appear after each location ping. Check the Live tab — if “Last ping” updates, tap Refresh trail here.'
              : 'Start a live tracking session to build a trail.'
          }
        />
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
            {points.length} point{points.length === 1 ? '' : 's'} (newest first)
          </p>
          <ul className="mod-card max-h-[28rem] space-y-1 overflow-y-auto rounded-2xl p-2">
            {points.map((point, idx) => {
              const lat = point.location?.lat;
              const lng = point.location?.lng;
              const coords =
                lat != null && lng != null
                  ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                  : 'Coordinates unavailable';

              return (
                <li
                  key={point._id || `${point.timestamp}-${idx}`}
                  className="mod-inset flex flex-wrap items-start justify-between gap-2 rounded-xl px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="font-mono" style={{ color: 'var(--neu-text)' }}>
                      {coords}
                    </p>
                    {point.location?.address ? (
                      <p className="truncate" style={{ color: 'var(--neu-text-muted)' }}>
                        {point.location.address}
                      </p>
                    ) : null}
                    <p
                      className="mt-0.5 flex flex-wrap gap-2 capitalize"
                      style={{ color: 'var(--neu-text-muted)' }}
                    >
                      <span>{(point.source ?? 'gps').replace(/_/g, ' ')}</span>
                      {point.accuracy != null ? <span>±{Math.round(point.accuracy)} m</span> : null}
                      {point.speed != null ? <span>{(point.speed * 3.6).toFixed(1)} km/h</span> : null}
                    </p>
                  </div>
                  <span className="shrink-0 tabular-nums" style={{ color: 'var(--neu-text-muted)' }}>
                    {formatTrackingTime(point.timestamp)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
