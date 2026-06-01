import type { Emergency, EmergencySource } from '@/services/safety.service';

/** Payload from `safety:emergency_alert` socket event (guardian-facing). */
export type GuardianEmergencyAlert = {
  emergencyId: string;
  sosEventId?: string;
  userId: string;
  type: string;
  severity: string;
  source?: EmergencySource;
  status: string;
  assignedAgency?: string;
  location: { lat: number; lng: number; address?: string };
  locationStr: string;
  title: string;
  body: string;
  timestamp: string;
};

export function resolveSosEventId(
  alert: Pick<GuardianEmergencyAlert, 'sosEventId' | 'emergencyId'> & {
    escalationDetails?: Record<string, unknown>;
    linkedSosEventId?: string;
  },
): string | undefined {
  if (alert.sosEventId) return alert.sosEventId;
  const details = alert.escalationDetails;
  if (details && typeof details.sosEventId === 'string') return details.sosEventId;
  if (typeof alert.linkedSosEventId === 'string') return alert.linkedSosEventId;
  return undefined;
}

export function emergencyToGuardianAlert(em: Emergency): GuardianEmergencyAlert {
  const lat = em.location?.lat ?? 0;
  const lng = em.location?.lng ?? 0;
  const address = em.location?.address;
  const sosEventId = resolveSosEventId({
    emergencyId: em._id,
    escalationDetails: em.escalationDetails,
    linkedSosEventId: (em as Emergency & { linkedSosEventId?: string }).linkedSosEventId,
  });

  return {
    emergencyId: em._id,
    sosEventId,
    userId: em.userId,
    type: em.type,
    severity: em.severity ?? em.priority ?? 'high',
    source: em.source,
    status: em.status,
    assignedAgency: em.assignedAgency,
    location: { lat, lng, address },
    locationStr: address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    title: em.type === 'sos' || em.source === 'manual_sos' ? 'SOS — help needed' : `Emergency: ${em.type}`,
    body: em.description || 'A person you protect needs help. Open location and respond.',
    timestamp: em.createdAt,
  };
}

export function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function dedupeAlerts(alerts: GuardianEmergencyAlert[]): GuardianEmergencyAlert[] {
  const seen = new Set<string>();
  return alerts.filter((a) => {
    const key = a.emergencyId || a.sosEventId || `${a.userId}-${a.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
