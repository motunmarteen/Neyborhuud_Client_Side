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

export type SignalCategory = 'power' | 'fuel' | 'water_waste' | 'traffic' | 'safety' | 'essentials';

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
  // 1. POWER & LIGHT
  { id: 'p_restored', group: 'power', emoji: '💡', label: 'Light Don Come!', short: 'Light don come!', sub: 'Grid power restored to our street', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'Power Restored (Light is Back)' },
  { id: 'p_outage', group: 'power', emoji: '🔌', label: 'No Light (Outage)', short: 'No light', sub: 'DisCo power is off in the area', severity: 'medium', type: 'fyi', category: 'infrastructure', defaultTitle: 'Power Outage (Light Off)' },
  { id: 'p_voltage', group: 'power', emoji: '⚡', label: 'Low / Unstable Voltage', short: 'Low voltage', sub: 'Dangerous power fluctuation, protect appliances', severity: 'high', type: 'fyi', category: 'infrastructure', defaultTitle: 'Low Voltage / Power Fluctuation' },
  { id: 'p_fault', group: 'power', emoji: '💥', label: 'Transformer / Cable Fault', short: 'Transformer fault', sub: 'Sparking wire, blown fuse or fallen pole', severity: 'high', type: 'incident', category: 'infrastructure', defaultTitle: 'Transformer / Electrical Fault' },

  // 2. FUEL & GAS RADAR
  { id: 'f_selling', group: 'fuel', emoji: '⛽', label: 'Fuel Selling (Normal Queue)', short: 'Fuel selling', sub: 'Station selling smoothly with short queue', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'Fuel Available (Short Queue)' },
  { id: 'f_queue', group: 'fuel', emoji: '🚗', label: 'Heavy Fuel Queue (1hr+)', short: 'Long queue', sub: 'Extensive line spilling onto the road', severity: 'medium', type: 'fyi', category: 'infrastructure', defaultTitle: 'Heavy Fuel Station Queue' },
  { id: 'f_nofuel', group: 'fuel', emoji: '🚫', label: 'No Fuel / Gate Locked', short: 'No fuel', sub: 'Pumps dry, gates locked, avoid the trip', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'Fuel Out of Stock (Gates Closed)' },
  { id: 'f_gas', group: 'fuel', emoji: '🔥', label: 'Cooking Gas Depot Open', short: 'Cooking gas', sub: 'LPG refilling station active and open', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'Cooking Gas Available' },

  // 3. WASTE & WATER PULSE
  { id: 'w_lawma', group: 'water_waste', emoji: '🚚', label: 'LAWMA / PSP Truck Arrived!', short: 'LAWMA truck', sub: 'Bring out your waste bins now before they leave', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'LAWMA / PSP Waste Truck Arrived' },
  { id: 'w_running', group: 'water_waste', emoji: '💧', label: 'Borehole / Public Water Running', short: 'Water running', sub: 'Estate water is pumping, open your intake valves', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'Borehole / Water Supply Active' },
  { id: 'w_tanker', group: 'water_waste', emoji: '🚛', label: 'Water Tanker Supply Available', short: 'Water tanker', sub: 'Clean water delivery truck available in neighborhood', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'Water Tanker In Area' },

  // 4. ROADS & TRAFFIC
  { id: 't_clear', group: 'traffic', emoji: '🟢', label: 'Road Clear (Free Flow)', short: 'Road clear', sub: 'Smooth transit with zero hold-up', severity: 'low', type: 'fyi', category: 'traffic', defaultTitle: 'Road Clear / Traffic Moving' },
  { id: 't_gridlock', group: 'traffic', emoji: '🚗', label: 'Heavy Gridlock', short: 'Heavy go-slow', sub: 'Stationary or moving very slowly', severity: 'medium', type: 'fyi', category: 'traffic', defaultTitle: 'Heavy Traffic Gridlock' },
  { id: 't_flood', group: 'traffic', emoji: '🌊', label: 'Street Flooded', short: 'Street flooded', sub: 'High standing water, risky for low cars', severity: 'high', type: 'incident', category: 'traffic', defaultTitle: 'Road Flooded / High Water' },
  { id: 't_checkpoint', group: 'traffic', emoji: '👮🏾', label: 'Taskforce / Stop & Search', short: 'Checkpoint', sub: 'Law enforcement / taskforce stop causing delay', severity: 'low', type: 'fyi', category: 'traffic', defaultTitle: 'Security Checkpoint Active' },

  // 5. SAFETY & ESTATE GATE
  { id: 's_gate', group: 'safety', emoji: '🚧', label: 'Estate Gate Locked / Curfew', short: 'Gate locked', sub: 'Estate gate restricted or closed early', severity: 'medium', type: 'fyi', category: 'safety', defaultTitle: 'Estate Gate Access Locked' },
  { id: 's_patrol', group: 'safety', emoji: '🛡️', label: 'Huud Watch Patrol Active', short: 'Watch patrol', sub: 'Vetted neighborhood security actively on duty', severity: 'low', type: 'fyi', category: 'safety', defaultTitle: 'Huud Watch Patrol Active' },
  { id: 's_suspicious', group: 'safety', emoji: '👀', label: 'Suspicious Movement', short: 'Suspicious movement', sub: 'Unidentified prowler or loitering vehicle', severity: 'high', type: 'incident', category: 'safety', defaultTitle: 'Suspicious Activity Reported' },
  { id: 's_disturbance', group: 'safety', emoji: '⚠️', label: 'Security Disturbance', short: 'Wahala / disturbance', sub: 'Urgent dispute or threat requiring watch', severity: 'critical', type: 'incident', category: 'safety', defaultTitle: 'Urgent Security Incident' },
  { id: 's_hazard', group: 'safety', emoji: '🔥', label: 'Fire / Hazard Threat', short: 'Fire or hazard', sub: 'Open fire, fallen pole, or road hazard', severity: 'critical', type: 'incident', category: 'safety', defaultTitle: 'Fire / Physical Hazard Alert' },

  // 6. CASH & ESSENTIALS
  { id: 'm_pos', group: 'essentials', emoji: '💵', label: 'POS Cash Available (Normal Rate)', short: 'POS cash', sub: 'Point-of-sale point has cash at standard rate', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'POS Cash Available' },
  { id: 'm_market', group: 'essentials', emoji: '🥬', label: 'Fresh Market Goods Arrived', short: 'Fresh market', sub: 'Farm produce or fresh food vendor is here', severity: 'low', type: 'fyi', category: 'infrastructure', defaultTitle: 'Fresh Market Produce Arrived' },
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
        nhToast.signal({ emoji: preset.emoji, title: 'Well done! Your neighbours go see am', signalLabel: preset.label, locationName, coinsEarned: 0 });
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
