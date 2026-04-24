'use client';

import { useCallback, useEffect, useRef } from 'react';
import apiClient from '@/lib/api-client';

const QUEUE_KEY = 'neyborhuud_trip_offline_queue';
const MAX_QUEUE_AGE_MS = 30 * 60 * 1000; // discard queued items older than 30 min

export type OfflineQueueEntry =
  | {
      type: 'checkin';
      tripId: string;
      location?: { latitude: number; longitude: number };
      queuedAt: number;
    }
  | {
      type: 'location';
      tripId: string;
      latitude: number;
      longitude: number;
      queuedAt: number;
    };

type OfflineQueueInput =
  | { type: 'checkin'; tripId: string; location?: { latitude: number; longitude: number } }
  | { type: 'location'; tripId: string; latitude: number; longitude: number };

function readQueue(): OfflineQueueEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: OfflineQueueEntry[] = JSON.parse(raw);
    // Filter out stale entries to avoid replaying very old data
    const cutoff = Date.now() - MAX_QUEUE_AGE_MS;
    return parsed.filter((e) => e.queuedAt > cutoff);
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineQueueEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // localStorage quota exceeded — discard oldest half
    try {
      const half = queue.slice(Math.floor(queue.length / 2));
      localStorage.setItem(QUEUE_KEY, JSON.stringify(half));
    } catch {}
  }
}

function clearQueue(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(QUEUE_KEY);
  } catch {}
}

async function flushQueue(): Promise<void> {
  const queue = readQueue();
  if (queue.length === 0) return;

  const remaining: OfflineQueueEntry[] = [];

  for (const entry of queue) {
    try {
      if (entry.type === 'checkin') {
        await apiClient.post(`/safety/trips/${entry.tripId}/checkin`, {
          location: entry.location,
        });
      } else if (entry.type === 'location') {
        await apiClient.post(`/safety/trips/${entry.tripId}/location`, {
          latitude: entry.latitude,
          longitude: entry.longitude,
        });
      }
    } catch (err: any) {
      // 4xx errors mean the trip no longer exists / completed — drop the entry
      const status = err?.response?.status ?? 0;
      if (status >= 400 && status < 500) {
        console.warn('[OfflineQueue] Dropping entry (client error):', entry.type, status);
        continue;
      }
      // 5xx or network error — keep for next retry
      remaining.push(entry);
    }
  }

  if (remaining.length === 0) {
    clearQueue();
  } else {
    writeQueue(remaining);
  }
}

/**
 * useOfflineQueue
 *
 * Provides `enqueue` to safely queue trip check-ins and location updates
 * when offline, and automatically flushes the queue when connectivity
 * is restored.
 *
 * Usage:
 *   const { enqueue } = useOfflineQueue();
 *   // In a check-in handler:
 *   if (!navigator.onLine) {
 *     enqueue({ type: 'checkin', tripId, location });
 *     return;
 *   }
 */
export function useOfflineQueue() {
  const flushingRef = useRef(false);

  // Flush queue on mount (catches items from previous page load)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (navigator.onLine) {
      void flushQueue();
    }
  }, []);

  // Re-flush whenever network comes back online
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onOnline = async () => {
      if (flushingRef.current) return;
      flushingRef.current = true;
      try {
        await flushQueue();
      } finally {
        flushingRef.current = false;
      }
    };

    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const enqueue = useCallback((entry: OfflineQueueInput) => {
    const queue = readQueue();
    queue.push({ ...entry, queuedAt: Date.now() } as OfflineQueueEntry);
    writeQueue(queue);
  }, []);

  return { enqueue };
}
