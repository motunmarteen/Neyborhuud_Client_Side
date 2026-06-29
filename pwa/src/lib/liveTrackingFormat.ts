import type { KidnappingTrackingSession } from '@/services/safety.service';

export function formatTrackingDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
}

export function formatTrackingDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatTrackingTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function emergencyTypeLabel(type: string): string {
  return type.replace(/_/g, ' ');
}

export function isSessionLive(session: KidnappingTrackingSession | null): boolean {
  return session?.status === 'active' || session?.status === 'lost_signal';
}
