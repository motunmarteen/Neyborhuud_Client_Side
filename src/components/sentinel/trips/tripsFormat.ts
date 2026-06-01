import type { Trip } from '@/services/trip.service';

export function fmtTripDate(iso?: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function fmtCountdown(secs: number | null): string {
  if (secs === null) return '—';
  if (secs <= 0) return 'Due now';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function tripDuration(start?: string, end?: string): string {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return '—';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function tripStatusLabel(status: Trip['status']): string {
  const map: Record<Trip['status'], string> = {
    planned: 'Planned',
    active: 'Active',
    completed: 'Completed',
    cancelled: 'Cancelled',
    escalated: 'Escalated',
    panic: 'Panic / SOS',
  };
  return map[status] ?? status;
}

export function isLiveTripStatus(status: Trip['status'] | undefined): boolean {
  return (
    status === 'active' ||
    status === 'planned' ||
    status === 'escalated' ||
    status === 'panic'
  );
}
