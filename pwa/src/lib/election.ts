import { useEffect, useState } from 'react';
import apiClient from '@/lib/api-client';

/**
 * Election mode (owner 2026-11-11, docs/ELECTION-MODE-PLAN.md). Server: /api/v1/election.
 * Neutral by design: nothing here is about parties, candidates or results.
 */

export type ElectionKind = 'presidential' | 'governorship';
export type Election = { id: string; date: string; kind: ElectionKind };
export type PollingUnit = { code: string; name: string | null; state: string | null };
export type ElectionHub = {
  elections: Election[];
  next: Election | null;
  links: { id: 'inec' | 'locator' | 'irev'; url: string }[];
  factCheckers: { id: string; name: string; url: string }[];
  myPollingUnit: PollingUnit | null;
};

/** Used until the server answers (and if it can't): INEC's revised timetable, Feb 2026. */
export const FALLBACK_HUB: ElectionHub = {
  elections: [
    { id: '2027-presidential', date: '2027-01-16', kind: 'presidential' },
    { id: '2027-governorship', date: '2027-02-06', kind: 'governorship' },
  ],
  next: null,
  links: [
    { id: 'inec', url: 'https://inecnigeria.org' },
    { id: 'locator', url: 'https://cvr.inecnigeria.org/pu' },
    { id: 'irev', url: 'https://www.irev.inecnigeria.org' },
  ],
  factCheckers: [
    { id: 'dubawa', name: 'Dubawa', url: 'https://dubawa.org' },
    { id: 'africacheck', name: 'Africa Check', url: 'https://africacheck.org' },
    { id: 'factcheckhub', name: 'FactCheckHub', url: 'https://factcheckhub.com' },
  ],
  myPollingUnit: null,
};

const unwrap = <T,>(res: unknown): T => ((res as { data?: T })?.data ?? res) as T;

export async function getElectionHub(): Promise<ElectionHub> {
  return unwrap<ElectionHub>(await apiClient.get('/election'));
}

export async function savePollingUnit(code: string, name: string): Promise<PollingUnit | null> {
  return unwrap<{ myPollingUnit: PollingUnit | null }>(await apiClient.put('/election/polling-unit', { code, name })).myPollingUnit;
}

export async function forgetPollingUnit(): Promise<void> {
  await apiClient.delete('/election/polling-unit');
}

/** Today's date in Lagos, "YYYY-MM-DD". */
export function lagosToday(now = new Date()): string {
  return new Date(now.getTime() + 3600_000).toISOString().slice(0, 10);
}

/** Whole days from today (Lagos) to the election day: 0 on the day itself. */
export function daysUntil(date: string, now = new Date()): number {
  const a = Date.parse(`${lagosToday(now)}T00:00:00Z`);
  const b = Date.parse(`${date}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function nextOf(elections: Election[], now = new Date()): Election | null {
  const today = lagosToday(now);
  return elections.find((e) => e.date >= today) ?? null;
}

let cached: Promise<ElectionHub> | null = null;

/** The next election (for cards elsewhere in the app); fetched once per visit. */
export function useNextElection(): Election | null {
  const [elections, setElections] = useState<Election[]>(FALLBACK_HUB.elections);
  useEffect(() => {
    cached ??= getElectionHub().catch(() => FALLBACK_HUB);
    let live = true;
    void cached.then((h) => live && setElections(h.elections?.length ? h.elections : FALLBACK_HUB.elections));
    return () => {
      live = false;
    };
  }, []);
  return nextOf(elections);
}

/** "24/01/05/003" → "24-01-05-003" as the person types; the server checks it properly. */
export function tidyPuCode(raw: string): string {
  return raw.replace(/[^\d\s\-/.]/g, '').replace(/[\s/.]+/g, '-').slice(0, 14);
}
