'use client';

/**
 * Offline SOS queue — the panic button must not fail silently just because
 * the device has no signal at the exact moment someone needs it. This
 * persists a pending SOS trigger to IndexedDB, retries it as soon as
 * connectivity returns (the 'online' event, for as long as the app is open),
 * and additionally registers a Background Sync request so the service
 * worker can retry it even if the tab/app gets closed before connectivity
 * comes back — see service_worker/index.js's 'sync' handler, which reads
 * from the same IndexedDB store (src/lib/sosOfflineDb.ts).
 *
 * IndexedDB (not localStorage) because the service worker's execution
 * context can't read localStorage — Background Sync requires storage both
 * contexts can see.
 *
 * Deliberately separate from useOfflineQueue (trip check-ins/location) —
 * safety-critical retry behavior shouldn't share a queue/staleness policy
 * with a lower-stakes feature. In particular: an SOS trigger never expires
 * from this queue on its own (trip check-ins do, after 30 min) — if it's
 * still queued, it still gets sent, because "help is late" beats "help
 * silently never arrives."
 *
 * Every queued trigger carries a client-generated clientId (see
 * lib/idempotency.ts) so a retry that races with a response the client
 * never actually received doesn't create a duplicate SosEvent server-side
 * — see safetyService.triggerSOS's idempotency guard on the backend.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { safetyService } from '@/services/safety.service';
import { newIdempotencyKey } from '@/lib/idempotency';
import apiClient, { getApiBaseUrl } from '@/lib/api-client';
import {
  addQueuedSos,
  getQueuedSos,
  removeQueuedSos,
  requestBackgroundSync,
  type QueuedSosRecord,
} from '@/lib/sosOfflineDb';

export type SosQueueStatus = 'idle' | 'queued' | 'sending' | 'sent' | 'failed';

/** True if there's currently a queued, not-yet-sent SOS trigger. Async — IndexedDB has no synchronous read. */
export async function hasQueuedSos(): Promise<boolean> {
  try {
    return (await getQueuedSos()).length > 0;
  } catch {
    return false;
  }
}

export function useSosOfflineQueue(onSent?: (clientId: string) => void) {
  const [status, setStatus] = useState<SosQueueStatus>('idle');
  const flushingRef = useRef(false);
  const onSentRef = useRef(onSent);
  useEffect(() => {
    onSentRef.current = onSent;
  }, [onSent]);

  // IndexedDB reads are async, so the initial "is anything already queued
  // from a previous session" check happens on mount rather than in useState's
  // lazy initializer.
  useEffect(() => {
    let cancelled = false;
    void hasQueuedSos().then((queued) => {
      if (!cancelled && queued) setStatus('queued');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const flush = useCallback(async () => {
    if (flushingRef.current) return;
    const queue = await getQueuedSos().catch(() => [] as QueuedSosRecord[]);
    if (queue.length === 0) return;

    flushingRef.current = true;
    setStatus('sending');

    // SOS triggers are per-user, not per-device-session — sending them in
    // order (oldest first) matters if more than one ever queues up, though
    // in practice this list is almost always length 1.
    let anySent = false;
    let anyRemaining = false;

    for (const entry of queue.sort((a, b) => a.queuedAt - b.queuedAt)) {
      try {
        await safetyService.triggerSos({ ...(entry.payload as any), clientId: entry.clientId });
        anySent = true;
        await removeQueuedSos(entry.clientId);
        onSentRef.current?.(entry.clientId);
      } catch (err: any) {
        const httpStatus = err?.response?.status ?? 0;
        // 4xx (other than a network/timeout failure, which reports as 0)
        // means the server rejected the request outright — retrying the
        // exact same payload won't help, so don't keep it queued forever.
        if (httpStatus >= 400 && httpStatus < 500) {
          console.error('[SosOfflineQueue] Dropping unsendable SOS trigger:', httpStatus, err);
          await removeQueuedSos(entry.clientId);
          continue;
        }
        // Network error or 5xx — keep it queued, try again next time.
        anyRemaining = true;
      }
    }

    flushingRef.current = false;
    setStatus(anyRemaining ? 'failed' : anySent ? 'sent' : 'idle');
  }, []);

  // Flush on mount (catches a trigger queued in a previous session) and
  // whenever the browser reports connectivity restored.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (navigator.onLine) void flush();

    const onOnline = () => void flush();
    window.addEventListener('online', onOnline);

    // The service worker retries via Background Sync even with the tab
    // closed; when it succeeds it posts a message back so any open tab
    // updates its status immediately instead of waiting for its own poll.
    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type === 'sos-sync-complete') void flush();
    };
    navigator.serviceWorker?.addEventListener?.('message', onSwMessage);

    return () => {
      window.removeEventListener('online', onOnline);
      navigator.serviceWorker?.removeEventListener?.('message', onSwMessage);
    };
  }, [flush]);

  /**
   * Queues an SOS trigger for retry and returns the clientId it was queued
   * under (also included in the returned payload so the caller can surface
   * it immediately, e.g. in the UI, without waiting for a server response
   * that may not come for a while).
   */
  const enqueue = useCallback(
    async (payload: Parameters<typeof safetyService.triggerSos>[0]): Promise<string> => {
      const clientId = newIdempotencyKey();
      await addQueuedSos({
        clientId,
        queuedAt: Date.now(),
        payload: payload as Record<string, unknown>,
        authToken: apiClient.getToken() ?? '',
        apiUrl: `${getApiBaseUrl()}/safety/sos/trigger`,
      });
      setStatus('queued');
      void requestBackgroundSync('sos-retry');
      return clientId;
    },
    [],
  );

  const clear = useCallback(async () => {
    const queue = await getQueuedSos().catch(() => [] as QueuedSosRecord[]);
    await Promise.all(queue.map((e) => removeQueuedSos(e.clientId)));
    setStatus('idle');
  }, []);

  return { status, enqueue, flush, clear, hasQueued: hasQueuedSos };
}
