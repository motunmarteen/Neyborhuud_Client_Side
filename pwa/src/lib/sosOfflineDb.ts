/**
 * IndexedDB store for queued offline SOS triggers.
 *
 * Unlike localStorage, IndexedDB is readable from the service worker's
 * execution context — required for Background Sync, since a 'sync' event
 * can fire after the page/tab that queued the SOS has been closed. This
 * module is imported by both the React app (src/hooks/useSosOfflineQueue.ts)
 * and the service worker (service_worker/index.js, via importScripts-free
 * inlined logic — SW can't use ES module imports from app code in the
 * next-pwa custom worker, so the SW has its own copy of the read/write
 * logic against the same DB/store/key names defined here).
 *
 * Keep DB_NAME / STORE_NAME / the record shape in sync with
 * service_worker/index.js if either changes.
 */

export const SOS_DB_NAME = 'neyborhuud-sos';
export const SOS_DB_VERSION = 1;
export const SOS_STORE_NAME = 'pending-triggers';

export interface QueuedSosRecord {
  clientId: string;
  queuedAt: number;
  /** POST body for /safety/sos/trigger */
  payload: Record<string, unknown>;
  /** Bearer token captured at enqueue time, needed for SW-side replay. */
  authToken: string;
  /** Absolute API URL to POST to, captured at enqueue time. */
  apiUrl: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SOS_DB_NAME, SOS_DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SOS_STORE_NAME)) {
        db.createObjectStore(SOS_STORE_NAME, { keyPath: 'clientId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addQueuedSos(record: QueuedSosRecord): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SOS_STORE_NAME, 'readwrite');
      tx.objectStore(SOS_STORE_NAME).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function getQueuedSos(): Promise<QueuedSosRecord[]> {
  const db = await openDb();
  try {
    return await new Promise<QueuedSosRecord[]>((resolve, reject) => {
      const tx = db.transaction(SOS_STORE_NAME, 'readonly');
      const req = tx.objectStore(SOS_STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result as QueuedSosRecord[]);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function removeQueuedSos(clientId: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SOS_STORE_NAME, 'readwrite');
      tx.objectStore(SOS_STORE_NAME).delete(clientId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function clearQueuedSos(): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(SOS_STORE_NAME, 'readwrite');
      tx.objectStore(SOS_STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/** Registers a Background Sync request so the SW retries even if the tab closes. Best-effort — silently no-ops where unsupported (Safari, Capacitor WebView). */
export async function requestBackgroundSync(tag = 'sos-retry'): Promise<void> {
  try {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    const syncReg = (registration as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } }).sync;
    if (!syncReg) return;
    await syncReg.register(tag);
  } catch {
    // Background Sync isn't supported everywhere (Safari, some WebViews) and
    // registration can fail (e.g. permissions). The 'online' event listener
    // in useSosOfflineQueue is the guaranteed fallback, so this is best-effort.
  }
}
