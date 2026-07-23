'use client';

import { useCallback, useEffect, useRef } from 'react';
import { marketplaceService } from '@/services/marketplace.service';

const QUEUE_KEY = 'neyborhuud_marketplace_offline_queue';
const MAX_QUEUE_AGE_MS = 30 * 60 * 1000; // discard queued items older than 30 min

export type MarketplaceOfflineEntry =
  | { type: 'like'; productId: string; queuedAt: number }
  | { type: 'save'; productId: string; queuedAt: number }
  | { type: 'unsave'; productId: string; queuedAt: number };

type MarketplaceOfflineInput =
  | { type: 'like'; productId: string }
  | { type: 'save'; productId: string }
  | { type: 'unsave'; productId: string };

function readQueue(): MarketplaceOfflineEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed: MarketplaceOfflineEntry[] = JSON.parse(raw);
    const cutoff = Date.now() - MAX_QUEUE_AGE_MS;
    return parsed.filter((e) => e.queuedAt > cutoff);
  } catch {
    return [];
  }
}

function writeQueue(queue: MarketplaceOfflineEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
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

  const remaining: MarketplaceOfflineEntry[] = [];

  for (const entry of queue) {
    try {
      if (entry.type === 'like') {
        await marketplaceService.toggleLike(entry.productId);
      } else if (entry.type === 'save') {
        await marketplaceService.saveItem(entry.productId);
      } else if (entry.type === 'unsave') {
        await marketplaceService.unsaveItem(entry.productId);
      }
    } catch (err: any) {
      const status = err?.response?.status ?? 0;
      if (status >= 400 && status < 500) {
        // Product gone, already in that state, etc — drop rather than retry forever.
        console.warn('[MarketplaceOfflineQueue] Dropping entry (client error):', entry.type, status);
        continue;
      }
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
 * useMarketplaceOfflineQueue
 *
 * Mirrors useOfflineQueue (trips) for marketplace engagement actions that are
 * safe to replay blind — like/save/unsave are idempotent toggles with no
 * response body the UI depends on, unlike orders/offers which must show the
 * real server result. Queue those elsewhere; don't route them through here.
 */
export function useMarketplaceOfflineQueue() {
  const flushingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (navigator.onLine) {
      void flushQueue();
    }
  }, []);

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

  const enqueue = useCallback((entry: MarketplaceOfflineInput) => {
    const queue = readQueue();
    queue.push({ ...entry, queuedAt: Date.now() } as MarketplaceOfflineEntry);
    writeQueue(queue);
  }, []);

  return { enqueue };
}
