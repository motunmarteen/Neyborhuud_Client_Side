'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { nhToast } from '@/lib/toast';
import { contentService } from '@/services/content.service';
import { incidentService } from '@/services/incident.service';
import { useHuudDisplayName, HUUD_NAME_FALLBACK } from '@/hooks/useHuudDisplayName';
import { getCurrentLocation } from '@/lib/geolocation';

/**
 * One-tap quick signals ("No light", "Heavy go-slow", ...). Shared by the feed's
 * signal bar and the ➕ "Wetin you wan share?" sheet so both send the same way.
 */

export type SignalCategory = 'power' | 'traffic' | 'safety';

export interface SignalPreset {
  id: string;
  group: SignalCategory;
  emoji: string;
  label: string;
  /** Short label for chips in the ➕ sheet. */
  short: string;
  sub: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'fyi' | 'incident';
  category: 'infrastructure' | 'traffic' | 'safety';
  defaultTitle: string;
}

export const QUICK_SIGNALS: SignalPreset[] = [
  { id: 'p_outage', group: 'power', emoji: '🔌', label: 'No Light (Outage)', short: 'No light', sub: 'DisCo power is off in the area', severity: 'medium', type: 'fyi', category: 'infrastructure', defaultTitle: 'Power Outage (Light Off)' },
  { id: 'p_restored', group: 'power', emoji: '💡', label: 'Light Don Come!', short: 'Light don come!', sub: 'Grid power restored to our street', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'Power Restored (Light is Back)' },
  { id: 'p_fault', group: 'power', emoji: '⚡', label: 'Transformer / Cable Fault', short: 'Transformer fault', sub: 'Sparking wire, blown fuse or pole issue', severity: 'high', type: 'incident', category: 'infrastructure', defaultTitle: 'Transformer / Electrical Fault' },
  { id: 't_gridlock', group: 'traffic', emoji: '🚗', label: 'Heavy Gridlock', short: 'Heavy go-slow', sub: 'Stationary or moving very slowly', severity: 'medium', type: 'fyi', category: 'traffic', defaultTitle: 'Heavy Traffic Gridlock' },
  { id: 't_flood', group: 'traffic', emoji: '🌊', label: 'Street Flooded', short: 'Street flooded', sub: 'High standing water, risky for small cars', severity: 'high', type: 'incident', category: 'traffic', defaultTitle: 'Road Flooded / High Water' },
  { id: 't_gate', group: 'traffic', emoji: '🚧', label: 'Gate Locked / Blocked', short: 'Gate locked', sub: 'Estate gate restricted or closed early', severity: 'medium', type: 'fyi', category: 'traffic', defaultTitle: 'Estate Gate Access Locked' },
  { id: 't_checkpoint', group: 'traffic', emoji: '👮🏾', label: 'Security Checkpoint', short: 'Checkpoint', sub: 'Stop-and-search causing delay', severity: 'low', type: 'fyi', category: 'traffic', defaultTitle: 'Security Checkpoint Active' },
  { id: 's_suspicious', group: 'safety', emoji: '👀', label: 'Suspicious Movement', short: 'Suspicious movement', sub: 'Unidentified prowler or loitering vehicle', severity: 'high', type: 'incident', category: 'safety', defaultTitle: 'Suspicious Activity Reported' },
  { id: 's_disturbance', group: 'safety', emoji: '⚠️', label: 'Security Disturbance', short: 'Wahala / disturbance', sub: 'Urgent dispute or threat requiring watch', severity: 'critical', type: 'incident', category: 'safety', defaultTitle: 'Urgent Security Incident' },
  { id: 's_hazard', group: 'safety', emoji: '🔥', label: 'Fire / Hazard Threat', short: 'Fire or hazard', sub: 'Open fire, fallen pole, or hazard', severity: 'critical', type: 'incident', category: 'safety', defaultTitle: 'Fire / Physical Hazard Alert' },
];

export const signalsIn = (group: SignalCategory) => QUICK_SIGNALS.filter((s) => s.group === group);

export function useQuickSignal() {
  const huudName = useHuudDisplayName();
  const queryClient = useQueryClient();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  /** The area name for messages, or null when we only know the fallback. */
  const areaName = huudName && huudName !== HUUD_NAME_FALLBACK ? huudName : null;

  /** Sends a signal. Resolves true only when the server accepted it. */
  const send = useCallback(
    async (preset: SignalPreset): Promise<boolean> => {
      setSubmittingId(preset.id);
      try {
        // Real GPS only: a safety signal pinned to a made-up location would send neighbours to the wrong place.
        let lat: number | null = null;
        let lng: number | null = null;
        try {
          const coords = await getCurrentLocation();
          if (coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng)) {
            lat = coords.lat;
            lng = coords.lng;
          }
        } catch {
          // handled below
        }
        if (lat === null || lng === null) {
          nhToast.error('Location needed', 'Turn on location so neighbours know where this is happening.');
          return false;
        }

        const locationName = areaName ?? 'your area';
        try {
          if (preset.type === 'incident') {
            await incidentService.create({
              title: `${preset.defaultTitle} — ${locationName}`,
              description: `${preset.sub}. Reported via 1-Tap Quick Signal near ${locationName}.`,
              category: (preset.category === 'traffic' ? 'traffic_accident' : preset.category === 'safety' ? 'other' : 'utility_outage') as any,
              severity: preset.severity as any,
              incidentDate: new Date().toISOString(),
              location: { latitude: lat, longitude: lng, landmark: locationName },
            });
          } else {
            // POST /content/posts contract (createPostApiSchema)
            await contentService.createPost({
              type: 'text',
              content: `${preset.defaultTitle} — ${locationName}\n${preset.sub}. Reported via 1-Tap Quick Signal.`,
              contentType: 'fyi',
              visibility: 'neighborhood',
              location: { latitude: lat, longitude: lng },
            });
          }
        } catch (networkErr: any) {
          nhToast.error('Signal not sent', networkErr?.message || 'Please check your connection and try again.');
          return false;
        }

        // Confirm only what the server accepted.
        nhToast.signal({ emoji: preset.emoji, title: 'Signal sent!', signalLabel: preset.label, locationName, coinsEarned: 0 });
        queryClient.invalidateQueries({ queryKey: ['feed'] });
        queryClient.invalidateQueries({ queryKey: ['radar'] });
        queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
        queryClient.invalidateQueries({ queryKey: ['gamification', 'wallet'] });
        return true;
      } catch (err) {
        console.error('Signal logging error:', err);
        nhToast.error('Could not send signal', 'Please check your connection and try again.');
        return false;
      } finally {
        setSubmittingId(null);
      }
    },
    [areaName, queryClient],
  );

  return { send, submittingId, areaName };
}
