import type { SosHelpView } from '@/services/sosHelp.service';

const time = (iso: string) => new Date(iso).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' });

/**
 * What a guardian reads out to the 112 operator (owner 2026-11-27). Plain sentences, in the order
 * operators ask: what, who, where, when, how to reach them.
 */
export function sosHelpScript(v: Pick<SosHelpView, 'person' | 'location' | 'startedAt' | 'silent'>): string {
  const where = v.location
    ? [v.location.address, v.location.lga, v.location.state].filter(Boolean).join(', ') || 'the location on my phone'
    : 'an unknown location';
  return [
    `This is an emergency. ${v.person.name} needs help.`,
    `They are at ${where}.`,
    v.location ? `Map location: ${v.location.lat.toFixed(5)}, ${v.location.lng.toFixed(5)}.` : null,
    `They pressed SOS at ${time(v.startedAt)}.`,
    v.person.phone ? `Their phone number is ${v.person.phone}.` : null,
    v.silent ? 'They used a silent SOS, so they may not be able to talk. Please do not call them.' : null,
  ]
    .filter(Boolean)
    .join(' ');
}
