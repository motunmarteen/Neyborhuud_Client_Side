'use client';

/**
 * Live Sentinel red-zone banner — shown at the top of the feed while an
 * unresolved geo-scoped safety alert exists for this user's home LGA or
 * saved work area. Backed by RedZoneAlertsContext (socket + notification
 * history), not the feed API — so it's independent of feed pagination/filters.
 */

import { useRedZoneAlerts } from '@/contexts/RedZoneAlertsContext';

const SEVERITY_STYLE: Record<string, { bg: string; border: string; shadow: string; text: string }> = {
  critical: {
    bg: 'linear-gradient(135deg, rgba(255,0,0,0.08), rgba(255,255,255,0.9))',
    border: 'rgba(255,0,0,0.18)',
    shadow: '0 4px 16px rgba(255,0,0,0.08)',
    text: 'text-brand-red',
  },
  high: {
    bg: 'linear-gradient(135deg, rgba(255,0,0,0.06), rgba(255,255,255,0.9))',
    border: 'rgba(255,0,0,0.16)',
    shadow: '0 4px 16px rgba(255,0,0,0.06)',
    text: 'text-brand-red',
  },
  warning: {
    bg: 'linear-gradient(135deg, rgba(255,170,0,0.08), rgba(255,255,255,0.9))',
    border: 'rgba(255,170,0,0.18)',
    shadow: '0 4px 16px rgba(255,170,0,0.06)',
    text: 'text-amber-600',
  },
};

export function RedZoneBanner() {
  const { alerts, dismissAlert } = useRedZoneAlerts();
  const top = alerts[0];
  if (!top) return null;

  const style = SEVERITY_STYLE[top.severity] ?? SEVERITY_STYLE.warning;
  const areaLabel = top.reason === 'work' ? 'your work area' : 'your area';
  const extraCount = alerts.length - 1;

  return (
    <div className="w-full">
      <div
        className="px-5 py-3.5 animate-fade-in"
        style={{ background: style.bg, borderBottom: `1px solid ${style.border}`, boxShadow: style.shadow }}
      >
        <div className="flex items-start gap-3">
          <div
            className={`rounded-xl size-10 shrink-0 flex items-center justify-center ${style.text}`}
            style={{ background: 'rgba(255,0,0,0.1)' }}
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
              shield
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold" style={{ color: 'var(--neu-text)' }}>
              {top.title}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--neu-text-muted)' }}>
              Near {areaLabel} · Sentinel threat score {top.threatScore}/10
              {extraCount > 0 ? ` · ${extraCount} more alert${extraCount === 1 ? '' : 's'}` : ''}
            </p>
            <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--neu-text-muted)' }}>
              {top.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dismissAlert(top.id)}
            className="shrink-0 rounded-lg p-1.5 opacity-60 hover:opacity-100"
            aria-label="Dismiss alert"
          >
            <span className="material-symbols-outlined text-lg" style={{ color: 'var(--neu-text-muted)' }}>
              close
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
