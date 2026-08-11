'use client';

/**
 * ChatActionMenu
 * The "+" button that expands a radial / stacked action sheet for attaching
 * media and sharing contextual data (location, events, SOS, tracking, etc.)
 *
 * UX flow:
 *  1. User taps "+" → full-screen semi-transparent sheet slides up
 *  2. Two sections: MEDIA (top) and CONTEXT ACTIONS (bottom)
 *  3. Tapping a MEDIA item opens OS file picker (strict MIME filter)
 *  4. Tapping a CONTEXT item opens a lightweight inline modal
 *  5. Tapping outside or pressing Escape closes everything
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BottomSheetDragHandle } from '@/components/ui/BottomSheetDragHandle';
import { BottomSheetOverlay } from '@/components/ui/BottomSheetOverlay';
import { useBottomSheetDrag } from '@/hooks/useBottomSheetDrag';
import { toast } from 'sonner';
import { ChatMessage, ChatMessageMeta, ChatMessageType } from '@/types/api';
import VoiceRecorder from './VoiceRecorder';
import { getGeolocation } from '@/lib/nativeGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { useSearch } from '@/hooks/useSearch';
import { useUserMarketplace, useMarketplaceProducts } from '@/hooks/useMarketplace';
import { useUserJobs, useJobs } from '@/hooks/useJobs';
import { useUserEvents, useEvents } from '@/hooks/useEvents';
import { useUserPosts, usePosts } from '@/hooks/usePosts';
import { useTripMonitor } from '@/hooks/useTripMonitor';
import { safetyService } from '@/services/safety.service';
import { formatNaira } from '@/lib/currency';
import { SharePickerSheet, SharePickerSearchInput, type SharePickerItem } from './SharePickerSheet';

// ─── MIME Whitelist (single source of truth for frontend validation) ──────────
// "document" mirrors the backend's DOCUMENT_MIME_PREFIXES (chat.constants.ts)
// — arbitrary files (PDF/Word/Excel/PowerPoint/zip/etc.) up to 50MB, a larger
// cap than image/video/audio's 20MB (see the backend comment for the full
// size-cap reasoning). Sent as `type: "document"`, rendered as a
// filename+size+icon bubble with a tap-to-open/download link.
export const ALLOWED_MIME: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/csv',
  ],
};

function acceptAttr(key: keyof typeof ALLOWED_MIME) {
  return ALLOWED_MIME[key].join(',');
}

/**
 * Pulls the array of records out of one page of a paginated API response.
 *
 * The endpoints are not consistent: /marketplace returns `data` as a plain
 * array, while /jobs and /events return `data` as `{ jobs: [...], pagination }`
 * / `{ events: [...], pagination }`. Reaching for `page.data` first therefore
 * yielded the WRAPPER OBJECT for jobs and events, and flatMap on a non-array
 * spreads it as a single item — so the pickers rendered one bogus entry with no
 * _id, which is what produced React's "unique key" warning.
 *
 * Checking the named array first, then a bare array, then giving up, keeps all
 * three shapes working without guessing.
 */
function extractPageItems(page: any, key: string): any[] {
  if (!page) return [];
  const named = page?.data?.[key] ?? page?.[key];
  if (Array.isArray(named)) return named;
  if (Array.isArray(page?.data)) return page.data;
  if (Array.isArray(page)) return page;
  return [];
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ActionResult {
  type: ChatMessageType;
  content: string;
  mediaUrl?: string;
  mediaFile?: File; // raw file, caller uploads it
  meta?: ChatMessageMeta;
  locationSnapshot?: {
    latitude: number;
    longitude: number;
    address?: string;
    isLive?: boolean;
    durationMinutes?: number;
  };
  emergencyRef?: string;
  trackingSessionRef?: string;
}

interface Props {
  disabled?: boolean;
  onAction: (result: ActionResult) => void;
}

/** Imperative handle so the composer's own mic button can open the voice
 * recorder directly, without needing the "+" attach menu open first. */
export interface ChatActionMenuHandle {
  openVoiceRecorder: () => void;
}

// ─── Small modal wrapper ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <BottomSheetOverlay
      open
      onClose={onClose}
      ariaLabel={title}
      zIndexClass="z-[200]"
      alignClass="items-end justify-center sm:items-center"
      backdropClassName="bg-black/60"
      panelClassName="w-full max-w-sm rounded-t-2xl bg-brand-black p-5 shadow-2xl sm:rounded-2xl"
      handleClassName="pt-2 pb-0"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="font-semibold text-[var(--neu-text-muted)]">{title}</p>
        <button type="button" onClick={onClose} className="text-[var(--neu-text-muted)] hover:text-[var(--neu-text-muted)] text-xl leading-none">×</button>
      </div>
      {children}
    </BottomSheetOverlay>
  );
}

// ─── Location Modal ───────────────────────────────────────────────────────────
// Supports both a one-shot static pin ("Send Location") and a WhatsApp-style
// live location share for a chosen duration (15 min / 1 hour / 8 hours) —
// the message then gets updated in place as the sender's position changes
// (see PageClient.tsx's live-location watcher and the
// updateLiveLocation/stopLiveLocation endpoints).
const LIVE_DURATION_PRESETS = [
  { label: '15 minutes', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '8 hours', minutes: 8 * 60 },
] as const;

function LocationModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loc, setLoc] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [mode, setMode] = useState<'static' | 'live'>('static');
  const [duration, setDuration] = useState<number>(15);

  const detect = () => {
    setLoading(true);
    setError('');
    const geo = getGeolocation();
    if (!geo) {
      setError('Location is not supported on this device.');
      setLoading(false);
      return;
    }
    geo.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLoc({ lat: latitude, lng: longitude, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
        setLoading(false);
      },
      () => { setError('Location access denied.'); setLoading(false); },
      { timeout: 8000 },
    );
  };

  useEffect(() => { detect(); }, []);

  return (
    <Modal title="📍 Send Location" onClose={onClose}>
      <div className="mb-3 flex gap-2 rounded-xl bg-black/20 p-1">
        <button
          type="button"
          onClick={() => setMode('static')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${mode === 'static' ? 'bg-brand-blue text-white' : 'text-[var(--neu-text-muted)]'}`}
        >
          Current location
        </button>
        <button
          type="button"
          onClick={() => setMode('live')}
          className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${mode === 'live' ? 'bg-brand-blue text-white' : 'text-[var(--neu-text-muted)]'}`}
        >
          Share live location
        </button>
      </div>
      {loading && <p className="text-sm text-[var(--neu-text-muted)]">Detecting location…</p>}
      {error && <p className="text-sm text-brand-red">{error}</p>}
      {loc && (
        <div className="mb-4 rounded-xl bg-brand-black p-3 text-sm text-[var(--neu-text-muted)]">
          <p className="font-mono text-xs text-[var(--neu-text-muted)]">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>
          <input
            className="mt-2 w-full rounded bg-brand-black px-3 py-1.5 text-sm text-[var(--neu-text-muted)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
            placeholder="Add address label (optional)"
            defaultValue={loc.address}
            onChange={(e) => setLoc((l) => l ? { ...l, address: e.target.value } : l)}
          />
        </div>
      )}
      {mode === 'live' && (
        <div className="mb-4">
          <p className="mb-2 text-xs text-[var(--neu-text-muted)] opacity-70">Share for</p>
          <div className="flex gap-2">
            {LIVE_DURATION_PRESETS.map((p) => (
              <button
                key={p.minutes}
                type="button"
                onClick={() => setDuration(p.minutes)}
                className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${duration === p.minutes ? 'bg-brand-blue text-white' : 'bg-black/20 text-[var(--neu-text-muted)]'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-[var(--neu-text-muted)] opacity-60">
            Your location updates in this chat until it expires or you stop sharing.
          </p>
        </div>
      )}
      <button
        disabled={!loc || loading}
        onClick={() => loc && onDone(
          mode === 'live'
            ? {
                type: 'location',
                content: `📍 Live location · ${LIVE_DURATION_PRESETS.find((p) => p.minutes === duration)?.label ?? ''}`,
                locationSnapshot: { latitude: loc.lat, longitude: loc.lng, address: loc.address, isLive: true, durationMinutes: duration },
                meta: { latitude: loc.lat, longitude: loc.lng, address: loc.address, durationMinutes: duration },
              }
            : {
                type: 'location',
                content: `📍 ${loc.address}`,
                locationSnapshot: { latitude: loc.lat, longitude: loc.lng, address: loc.address },
                meta: { latitude: loc.lat, longitude: loc.lng, address: loc.address },
              },
        )}
        className="w-full rounded-xl bg-brand-blue py-2.5 text-sm font-medium text-white hover:bg-brand-blue/85 disabled:opacity-40"
      >
        {mode === 'live' ? 'Start Sharing Live Location' : 'Send Location'}
      </button>
      {error && <button onClick={detect} className="mt-2 w-full text-center text-xs text-brand-blue hover:underline">Retry</button>}
    </Modal>
  );
}

// ─── Poll Modal ───────────────────────────────────────────────────────────────
// Real polls: single- or multiple-choice, with an anonymous-voting toggle.
// Voting/results are backed by a real PollVote collection server-side (not
// crammed into the immutable message content) — see chat.poll.controller.ts.
// Default is anonymous:true (individual voters hidden from other
// participants, only aggregate counts shown) since that's the lower-friction
// default for casual group polls; a poll creator can opt into showing who
// voted for what, mirroring Telegram's "Anonymous Voting" toggle (default on).
function PollModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const submit = () => {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) return;
    onDone({
      type: 'poll',
      content: `📊 Poll: ${q}`,
      meta: { question: q, options: opts, allowMultiple, isAnonymous },
    });
  };

  return (
    <Modal title="📊 Create Poll" onClose={onClose}>
      <input
        className="mb-3 w-full rounded-xl bg-brand-black px-3 py-2 text-sm text-[var(--neu-text-muted)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
        placeholder="Poll question…"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        maxLength={200}
      />
      <div className="mb-3 flex flex-col gap-2">
        {options.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="flex-1 rounded-xl bg-brand-black px-3 py-2 text-sm text-[var(--neu-text-muted)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
              placeholder={`Option ${i + 1}`}
              value={o}
              onChange={(e) => setOptions((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
              maxLength={100}
            />
            {options.length > 2 && (
              <button onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))} className="text-[var(--neu-text-muted)] hover:text-brand-red">✕</button>
            )}
          </div>
        ))}
      </div>
      {options.length < 10 && (
        <button onClick={() => setOptions((prev) => [...prev, ''])} className="mb-3 text-xs text-brand-blue hover:underline">+ Add option</button>
      )}
      <label className="mb-2 flex items-center gap-2 text-sm text-[var(--neu-text-muted)]">
        <input type="checkbox" checked={allowMultiple} onChange={(e) => setAllowMultiple(e.target.checked)} className="accent-brand-blue" />
        Allow multiple answers
      </label>
      <label className="mb-4 flex items-center gap-2 text-sm text-[var(--neu-text-muted)]">
        <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="accent-brand-blue" />
        Anonymous voting
      </label>
      <button
        disabled={!question.trim() || options.filter(Boolean).length < 2}
        onClick={submit}
        className="w-full rounded-xl bg-brand-blue py-2.5 text-sm font-medium text-white hover:bg-brand-blue/85 disabled:opacity-40"
      >
        Create Poll
      </button>
    </Modal>
  );
}

// ─── Contact Card Modal ───────────────────────────────────────────────────────
// Shares a REAL NeyborHuud user's profile as a contact card (type:
// "contact_share") — distinct from the legacy manual name/phone-entry
// "contact" type kept above for backward compatibility with old messages.
// Backed by the real global user-search endpoint (useSearch(..., "users")),
// not just the current user's follow list, so any NeyborHuud user can be
// shared, not only people you already follow.
function ContactShareModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const { query, setQuery, results, loading } = useSearch('', 'users');
  const users = results?.users?.data ?? [];

  return (
    <SharePickerSheet
      title="👤 Share Contact"
      emptyLabel={query ? 'No users found' : 'Search for a Neybor to share their profile'}
      loading={loading}
      items={users.map((u): SharePickerItem => ({
        id: u._id,
        title: [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || u.username,
        subtitle: u.username ? `@${u.username}` : undefined,
        thumbnail: u.avatarUrl ?? null,
        icon: '👤',
      }))}
      onPick={(item) => {
        const u = users.find((x) => x._id === item.id);
        onDone({
          type: 'contact_share',
          content: `👤 ${item.title}`,
          meta: { userId: item.id, name: item.title, username: u?.username, avatarUrl: item.thumbnail },
        });
      }}
      onClose={onClose}
    >
      <SharePickerSearchInput value={query} onChange={setQuery} placeholder="Search by name or username…" />
    </SharePickerSheet>
  );
}

// ─── SOS Modal ────────────────────────────────────────────────────────────────
function SOSModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [ref, setRef] = useState('');
  const [severity, setSeverity] = useState('high');

  return (
    <Modal title="🆘 Send SOS Context" onClose={onClose}>
      <p className="mb-3 text-xs text-brand-red300">This shares emergency context with chat participants.</p>
      <input
        className="mb-3 w-full rounded-xl bg-brand-black px-3 py-2 text-sm text-[var(--neu-text-muted)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
        placeholder="Emergency ID / Reference (optional)"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        maxLength={24}
      />
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="mb-4 w-full rounded-xl bg-brand-black px-3 py-2 text-sm text-[var(--neu-text-muted)] focus:outline-none"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <button
        onClick={() => onDone({
          type: 'sos',
          content: `🆘 SOS — severity: ${severity}`,
          emergencyRef: ref.trim() || undefined,
          meta: { severity },
        })}
        className="w-full rounded-xl bg-brand-red py-2.5 text-sm font-medium text-white hover:bg-brand-red/85"
      >
        Send SOS
      </button>
    </Modal>
  );
}

// ─── Tracking Modal ───────────────────────────────────────────────────────────
function TrackingModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [sessionRef, setSessionRef] = useState('');
  const [live, setLive] = useState(true);

  return (
    <Modal title="📡 Share Tracking Session" onClose={onClose}>
      <input
        className="mb-3 w-full rounded-xl bg-brand-black px-3 py-2 text-sm text-[var(--neu-text-muted)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
        placeholder="Tracking session ID"
        value={sessionRef}
        onChange={(e) => setSessionRef(e.target.value)}
        maxLength={24}
      />
      <label className="mb-4 flex items-center gap-2 text-sm text-[var(--neu-text-muted)]">
        <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="accent-brand-blue" />
        Share as live session
      </label>
      <button
        disabled={!sessionRef.trim()}
        onClick={() => onDone({
          type: 'tracking',
          content: `📡 Tracking session${live ? ' (live)' : ''}`,
          trackingSessionRef: sessionRef.trim(),
          meta: { live },
        })}
        className="w-full rounded-xl bg-brand-blue py-2.5 text-sm font-medium text-white hover:bg-brand-blue/85 disabled:opacity-40"
      >
        Share Session
      </button>
    </Modal>
  );
}

// ─── Kidnapping Info Modal ────────────────────────────────────────────────────
function KidnappingModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [sessionRef, setSessionRef] = useState('');
  const [status, setStatus] = useState('active');

  return (
    <Modal title="🚨 Kidnapping Alert" onClose={onClose}>
      <p className="mb-3 text-xs text-brand-red">Only share with verified responders or family contacts.</p>
      <input
        className="mb-3 w-full rounded-xl bg-brand-black px-3 py-2 text-sm text-[var(--neu-text-muted)] placeholder:text-[var(--neu-text-muted)] focus:outline-none"
        placeholder="Tracking session reference"
        value={sessionRef}
        onChange={(e) => setSessionRef(e.target.value)}
        maxLength={24}
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="mb-4 w-full rounded-xl bg-brand-black px-3 py-2 text-sm text-[var(--neu-text-muted)] focus:outline-none"
      >
        <option value="active">Active / Ongoing</option>
        <option value="suspected">Suspected</option>
        <option value="resolved">Resolved</option>
      </select>
      <button
        disabled={!sessionRef.trim()}
        onClick={() => onDone({
          type: 'kidnapping_info',
          content: `🚨 Kidnapping alert — ${status}`,
          trackingSessionRef: sessionRef.trim(),
          meta: { status },
        })}
        className="w-full rounded-xl bg-brand-red py-2.5 text-sm font-medium text-white hover:bg-brand-red/85 disabled:opacity-40"
      >
        Send Alert
      </button>
    </Modal>
  );
}

// ─── Event Share Picker ───────────────────────────────────────────────────────
// Real event picker (type: "event_share"): lists the user's own organized
// events first (useUserEvents), falling back to a general browse list
// (useEvents) if they haven't organized any. This is a first-class,
// server-validated share (the backend re-fetches and snapshots the real
// event by ID) rather than the old manual title/ID text-entry "event" type,
// which is kept only for backward compatibility with already-sent messages.
function EventShareModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const { user } = useAuth();
  const mine = useUserEvents(user?.id ?? null, 20);
  const browse = useEvents();
  const mineItems = (mine.data ?? []) as any[];
  const browseItems = ((browse.data as any)?.pages?.flatMap((p: any) => extractPageItems(p, 'events')) ?? []) as any[];
  const items = mineItems.length > 0 ? mineItems : browseItems;
  const loading = mine.isLoading || (mineItems.length === 0 && browse.isLoading);

  return (
    <SharePickerSheet
      title="📅 Share Event"
      emptyLabel="No events to share yet"
      loading={loading}
      items={items.map((e): SharePickerItem => ({
        id: e.id ?? e._id,
        title: e.title,
        subtitle: e.startDate ? new Date(e.startDate).toLocaleDateString('en-NG', { dateStyle: 'medium' }) : undefined,
        thumbnail: e.coverImage ?? null,
        icon: '📅',
      }))}
      onPick={(item) => {
        const e = items.find((x) => (x.id ?? x._id) === item.id);
        onDone({
          type: 'event_share',
          content: `📅 ${item.title}`,
          meta: { eventId: item.id, title: item.title, startDate: e?.startDate, thumbnail: item.thumbnail },
        });
      }}
      onClose={onClose}
    />
  );
}

// ─── Product Share Picker ─────────────────────────────────────────────────────
// Real product picker (type: "product_share") — casually sharing/forwarding
// a marketplace listing INTO an existing, unrelated conversation. Distinct
// from "Message Seller" (which creates its own dedicated marketplace
// conversation) — this is "hey look what I found", shared into any chat.
function ProductShareModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const { user } = useAuth();
  const mine = useUserMarketplace(user?.id ?? null, 20);
  const browse = useMarketplaceProducts();
  const mineItems = (mine.data ?? []) as any[];
  const browseItems = ((browse.data as any)?.pages?.flatMap((p: any) => extractPageItems(p, 'products')) ?? []) as any[];
  const items = mineItems.length > 0 ? mineItems : browseItems;
  const loading = mine.isLoading || (mineItems.length === 0 && browse.isLoading);

  return (
    <SharePickerSheet
      title="🛍️ Share Listing"
      emptyLabel="No listings to share yet"
      loading={loading}
      items={items.map((p): SharePickerItem => ({
        id: p.id ?? p._id,
        title: p.title,
        subtitle: typeof p.price === 'number' ? formatNaira(p.price) : undefined,
        thumbnail: p.images?.[0] ?? null,
        icon: '🛍️',
      }))}
      onPick={(item) => {
        const p = items.find((x) => (x.id ?? x._id) === item.id);
        onDone({
          type: 'product_share',
          content: `🛍️ ${item.title}`,
          meta: { productId: item.id, title: item.title, price: p?.price, currency: p?.currency ?? 'NGN', thumbnail: item.thumbnail },
        });
      }}
      onClose={onClose}
    />
  );
}

// ─── Job Share Picker ─────────────────────────────────────────────────────────
function JobShareModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const { user } = useAuth();
  const mine = useUserJobs(user?.id ?? null, 20);
  const browse = useJobs();
  const mineItems = (mine.data ?? []) as any[];
  const browseItems = ((browse.data as any)?.pages?.flatMap((p: any) => extractPageItems(p, 'jobs')) ?? []) as any[];
  const items = mineItems.length > 0 ? mineItems : browseItems;
  const loading = mine.isLoading || (mineItems.length === 0 && browse.isLoading);

  return (
    <SharePickerSheet
      title="💼 Share Job"
      emptyLabel="No jobs to share yet"
      loading={loading}
      items={items.map((j): SharePickerItem => ({
        id: j.id ?? j._id,
        title: j.title,
        subtitle: j.workMode ? j.workMode.replace('-', ' ') : undefined,
        icon: '💼',
      }))}
      onPick={(item) => {
        const j = items.find((x) => (x.id ?? x._id) === item.id);
        onDone({
          type: 'job_share',
          content: `💼 ${item.title}`,
          meta: { jobId: item.id, title: item.title, type: j?.type, workMode: j?.workMode, salary: j?.salary },
        });
      }}
      onClose={onClose}
    />
  );
}

// ─── Post Share Picker ────────────────────────────────────────────────────────
function PostShareModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const { user } = useAuth();
  const mine = useUserPosts(user?.id ?? null);
  const browse = usePosts();
  const mineItems = ((mine.data as any)?.pages?.flatMap((p: any) => extractPageItems(p, 'posts')) ?? []) as any[];
  const browseItems = ((browse.data as any)?.pages?.flatMap((p: any) => extractPageItems(p, 'posts')) ?? []) as any[];
  const items = mineItems.length > 0 ? mineItems : browseItems;
  const loading = mine.isLoading || (mineItems.length === 0 && browse.isLoading);

  return (
    <SharePickerSheet
      title="📝 Share Post"
      emptyLabel="No posts to share yet"
      loading={loading}
      items={items.map((p): SharePickerItem => ({
        id: p.id ?? p._id,
        title: (p.title || p.content || p.body || 'Post').slice(0, 80),
        subtitle: p.author?.name ?? p.author?.username,
        thumbnail: p.media?.[0]?.url ?? (typeof p.media?.[0] === 'string' ? p.media[0] : null),
        icon: '📝',
      }))}
      onPick={(item) => {
        const p = items.find((x) => (x.id ?? x._id) === item.id);
        onDone({
          type: 'post_share',
          content: `📝 ${item.title}`,
          meta: {
            postId: item.id,
            snippet: item.title,
            thumbnail: item.thumbnail,
            authorName: p?.author?.name ?? p?.author?.username,
            authorId: p?.author?.id ?? p?.authorId,
          },
        });
      }}
      onClose={onClose}
    />
  );
}

// ─── Trip Share Modal (Safe Trips → casual "follow along" share) ─────────────
// Shares the sender's CURRENTLY ACTIVE Safe Trip into this chat so a friend
// can follow along without becoming a full Guardian. Deliberately only
// offered when a real active trip exists (useTripMonitor) — there's nothing
// to pick from otherwise.
function TripShareModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const { state } = useTripMonitor();
  const trip = state.trip;
  const hasActiveTrip = !!trip && (trip.status === 'active' || trip.status === 'escalated') && !(trip as any).pausedAt;

  return (
    <Modal title="🧭 Share Trip Status" onClose={onClose}>
      {!hasActiveTrip ? (
        <p className="text-sm text-[var(--neu-text-muted)]">You don&apos;t have an active Safe Trip right now. Start one from the Sentinel tab to share it here.</p>
      ) : (
        <>
          <p className="mb-3 text-xs text-[var(--neu-text-muted)] opacity-70">
            Shares your live trip status so this chat can follow along — they won&apos;t become a Guardian.
          </p>
          <div className="mb-4 rounded-xl bg-brand-black p-3 text-sm text-[var(--neu-text-muted)]">
            <p className="font-medium">{(trip as any).originLocation?.address ?? 'Origin'} → {(trip as any).destinationLocation?.address ?? 'Destination'}</p>
            <p className="mt-1 text-xs opacity-70">Status: {trip!.status}</p>
          </div>
          <button
            onClick={() => onDone({
              type: 'trip_share',
              content: '🧭 Following my trip',
              meta: { tripId: (trip as any)._id },
            })}
            className="w-full rounded-xl bg-brand-blue py-2.5 text-sm font-medium text-white hover:bg-brand-blue/85"
          >
            Share Trip Status
          </button>
        </>
      )}
    </Modal>
  );
}

// ─── Emergency Report Share Modal ─────────────────────────────────────────────
// Shares a summary of one of the sender's OWN past emergency reports —
// distinct from the automatic incident-conversation mechanism (an active SOS
// already creates its own protected conversation with Guardians; this is
// purely a retrospective "here's what happened" summary share, e.g. telling
// a friend about a report you filed earlier). Deliberately does NOT expose
// an in-progress/active-SOS share path here, to avoid competing with or
// diluting the real emergency flow.
function EmergencyShareModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    let active = true;
    safetyService.getRecentEmergencies(10).then((res: any) => {
      if (!active) return;
      setReports(res?.data?.emergencies ?? []);
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <SharePickerSheet
      title="🚨 Share Emergency Report"
      emptyLabel="You have no past emergency reports to share"
      loading={loading}
      items={reports.map((r): SharePickerItem => ({
        id: r._id ?? r.id,
        title: `${r.type ?? 'Emergency'} · ${r.severity ?? ''}`.trim(),
        subtitle: r.createdAt ? new Date(r.createdAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }) : undefined,
        icon: '🚨',
      }))}
      onPick={(item) => {
        onDone({
          type: 'emergency_share',
          content: '🚨 Shared an emergency report',
          meta: { emergencyId: item.id },
        });
      }}
      onClose={onClose}
    />
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type ActiveModal =
  | 'location' | 'poll' | 'contact' | 'contact_share' | 'sos' | 'tracking' | 'kidnapping_info'
  | 'event' | 'marketplace' | 'product_share' | 'event_share' | 'job_share' | 'post_share'
  | 'trip_share' | 'emergency_share' | 'voice' | null;

// Media row: gallery picks (image/video/audio/document) plus a distinct
// Camera tile. Camera and Image/Video both go through the SAME hidden file
// input/upload pipeline — a PWA can't launch a genuinely separate native
// camera surface without risky non-standard APIs, so "Camera" sets the
// input's `capture` attribute (see openFilePicker) to hint the OS to open
// the camera app directly instead of the gallery, which is what
// `<input type="file" capture>` already does on every mobile browser that
// supports it. This was verified: no existing camera-access code existed
// before Phase 2 (grepped for `capture=` — zero matches), so this is new,
// but intentionally reuses the existing upload pipeline rather than adding
// getUserMedia()-based in-app camera capture, which would be redundant and
// riskier in a PWA context for zero real UX gain over the native capture hint.
const MEDIA_ACTIONS: {
  key: 'camera' | 'image' | 'video' | 'audio' | 'document';
  label: string;
  icon: string;
  accept: string;
  capture?: 'environment';
}[] = [
  { key: 'camera',   label: 'Camera',   icon: '📷',  accept: acceptAttr('image'), capture: 'environment' },
  { key: 'image',    label: 'Gallery',  icon: '🖼️',  accept: acceptAttr('image') },
  { key: 'video',    label: 'Video',    icon: '🎥',  accept: acceptAttr('video') },
  { key: 'audio',    label: 'Audio',    icon: '🎵',  accept: acceptAttr('audio') },
  { key: 'document', label: 'Document', icon: '📄',  accept: acceptAttr('document') },
];

// "Share" row — forwarding real NeyborHuud content into this chat (contact
// cards, listings, events, jobs, posts) — grouped separately from "Huud
// context" safety/location tiles below, mirroring how Telegram/WhatsApp
// separate "people & content" shares from location/safety-flavored actions.
const SHARE_ACTIONS: { key: ActiveModal & string; label: string; icon: string; color: string }[] = [
  { key: 'contact_share', label: 'Contact',     icon: '👤', color: 'bg-brand-blue' },
  { key: 'product_share', label: 'Listing',     icon: '🛍️', color: 'bg-primary' },
  { key: 'event_share',   label: 'Event',       icon: '📅', color: 'bg-brand-blue' },
  { key: 'job_share',     label: 'Job',         icon: '💼', color: 'bg-brand-blue' },
  { key: 'post_share',    label: 'Post',        icon: '📝', color: 'bg-brand-blue' },
  { key: 'poll',          label: 'Poll',        icon: '📊', color: 'bg-brand-blue' },
];

// "Huud context" row — location + the safety-toolkit shares that genuinely
// belong in chat (see the module doc comment at the bottom of this file for
// the full reasoning on what safety features were and weren't added here).
const CONTEXT_ACTIONS: { key: ActiveModal & string; label: string; icon: string; color: string }[] = [
  { key: 'location',        label: 'Location',      icon: '📍', color: 'bg-brand-green-dark' },
  { key: 'trip_share',       label: 'Trip Status',   icon: '🧭', color: 'bg-brand-green-dark' },
  { key: 'emergency_share',  label: 'Emergency Report', icon: '🚨', color: 'bg-brand-red' },
  { key: 'tracking',         label: 'Tracking',      icon: '📡', color: 'bg-brand-blue' },
  { key: 'kidnapping_info',  label: 'Kidnapping',    icon: '🚨', color: 'bg-brand-red' },
  { key: 'sos',              label: 'Safety Alert',  icon: '🆘', color: 'bg-brand-red' },
];

const ChatActionMenu = forwardRef<ChatActionMenuHandle, Props>(function ChatActionMenu({ disabled, onAction }, ref) {
  const [open, setOpen] = useState(false);
  const { handleProps, getPanelStyle, reset: resetSheetDrag } = useBottomSheetDrag({
    onDismiss: () => setOpen(false),
  });
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [pendingAccept, setPendingAccept] = useState('image/jpeg,image/png,image/webp,image/gif');
  const [pendingMediaKey, setPendingMediaKey] = useState<keyof typeof ALLOWED_MIME>('image');
  const [pendingCapture, setPendingCapture] = useState<'environment' | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    openVoiceRecorder: () => {
      setOpen(false);
      setActiveModal('voice');
    },
  }));

  useEffect(() => {
    if (open) resetSheetDrag();
  }, [open, resetSheetDrag]);

  // NOTE: there is deliberately no document-level "click outside to close"
  // handler here.
  //
  // There used to be one, and it made every tile in the sheet dead. The sheet
  // is rendered with createPortal into document.body, but menuRef wraps only
  // the "+" trigger — so menuRef.contains(tile) was always false. Tapping a
  // tile fired mousedown → setOpen(false) → the sheet unmounted before the
  // click event could reach the tile's own onClick. No error, nothing
  // happened, every icon looked broken.
  //
  // Dismissal is already handled properly by the sheet's own backdrop button
  // and the Escape handler below, so the extra listener was redundant as well
  // as harmful.

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setActiveModal(null); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const openFilePicker = (key: keyof typeof ALLOWED_MIME, accept: string, capture?: 'environment') => {
    setPendingAccept(accept);
    setPendingMediaKey(key);
    setPendingCapture(capture);
    setOpen(false);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // Frontend strict MIME validation
    const allowed = ALLOWED_MIME[pendingMediaKey];
    if (!allowed.includes(file.type)) {
      toast.error(`Invalid file type: ${file.type || 'unknown'}. Allowed: ${allowed.join(', ')}`);
      return;
    }

    // "document" is sent as type: "document" (Phase 2, 50MB cap, distinct
    // filename/size/icon rendering) — every other picked file keeps its
    // existing type (image/video/audio), including the Camera tile, which
    // uses the same "image" pipeline with a capture hint (see MEDIA_ACTIONS).
    onAction({
      type: pendingMediaKey as ChatMessageType,
      content: file.name,
      mediaFile: file,
    });
  };

  const handleModalDone = (result: ActionResult) => {
    setActiveModal(null);
    onAction(result);
  };

  return (
    <>
      {/* Hidden file input. `capture` is only set when the Camera tile was
          tapped — every mobile browser that supports the attribute opens the
          native camera app directly instead of the gallery/file picker. */}
      <input
        ref={fileInputRef}
        type="file"
        accept={pendingAccept}
        capture={pendingCapture}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Context action modals */}
      {activeModal === 'location'        && <LocationModal      onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'poll'            && <PollModal          onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'contact_share'   && <ContactShareModal  onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'product_share'   && <ProductShareModal  onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'event_share'     && <EventShareModal    onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'job_share'       && <JobShareModal      onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'post_share'      && <PostShareModal     onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'trip_share'      && <TripShareModal     onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'emergency_share' && <EmergencyShareModal onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'sos'             && <SOSModal           onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'tracking'        && <TrackingModal      onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'kidnapping_info' && <KidnappingModal    onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'voice'           && <VoiceRecorder      onDone={handleModalDone} onClose={() => setActiveModal(null)} />}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          disabled={disabled}
          aria-label="Add attachment or context action"
          aria-expanded={open}
          className={`chat-attach-trigger${open ? ' chat-attach-trigger--open' : ''}`}
        >
          <span className="material-symbols-outlined text-[24px]">{open ? 'close' : 'add'}</span>
        </button>

        {open && typeof document !== 'undefined'
          ? createPortal(
              <div className="chat-attach-root" role="presentation">
                <button
                  type="button"
                  className="chat-attach-backdrop"
                  aria-label="Close attachments"
                  onClick={() => setOpen(false)}
                />
                <div
                  className="chat-attach-sheet"
                  role="dialog"
                  aria-label="Attach or share"
                  style={getPanelStyle(true, 480)}
                >
                  <BottomSheetDragHandle handleProps={handleProps} className="pb-0 pt-1" />
                  <section className="chat-attach-section">
                    <p className="chat-attach-section__title">Media</p>
                    <div className="chat-attach-grid">
                      {MEDIA_ACTIONS.map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => openFilePicker(
                            a.key === 'camera' ? 'image' : a.key,
                            a.accept,
                            a.capture,
                          )}
                          className="chat-attach-tile mod-inset"
                        >
                          <span className="text-2xl" aria-hidden>{a.icon}</span>
                          <span className="chat-attach-tile__label">{a.label}</span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setOpen(false);
                          setActiveModal('voice');
                        }}
                        className="chat-attach-tile mod-inset"
                      >
                        <span className="text-2xl" aria-hidden>🎤</span>
                        <span className="chat-attach-tile__label">Voice</span>
                      </button>
                    </div>
                  </section>
                  <div className="mod-divider mx-4" />
                  <section className="chat-attach-section">
                    <p className="chat-attach-section__title">Share</p>
                    <div className="chat-attach-grid">
                      {SHARE_ACTIONS.map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            setActiveModal(a.key as ActiveModal);
                          }}
                          className="chat-attach-tile mod-inset"
                        >
                          <span className="text-2xl" aria-hidden>{a.icon}</span>
                          <span className="chat-attach-tile__label">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                  <div className="mod-divider mx-4" />
                  <section className="chat-attach-section">
                    <p className="chat-attach-section__title">Huud context</p>
                    <div className="chat-attach-grid">
                      {CONTEXT_ACTIONS.map((a) => (
                        <button
                          key={a.key}
                          type="button"
                          onClick={() => {
                            setOpen(false);
                            setActiveModal(a.key as ActiveModal);
                          }}
                          className="chat-attach-tile mod-inset"
                        >
                          <span className="text-2xl" aria-hidden>{a.icon}</span>
                          <span className="chat-attach-tile__label">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>,
              document.body,
            )
          : null}
      </div>
    </>
  );
});

export default ChatActionMenu;

/**
 * ── Safety-toolkit shares: what was built here, and what was deliberately
 * skipped (item 10 of the Phase 2 spec) ──
 *
 * Built:
 *  - Trip Status share ("trip_share") — a lightweight, casual "follow my
 *    Safe Trip" share into ANY chat, letting a friend see status without
 *    becoming a full Guardian. Only offered when the sender has a real
 *    active trip (useTripMonitor) — nothing to fake if there isn't one.
 *  - Emergency Report share ("emergency_share") — a retrospective summary
 *    of one of the sender's OWN past emergency reports (type/severity/
 *    status/location/timestamp), for telling a friend "here's what
 *    happened" after the fact. Explicitly reuses the existing
 *    GET /safety/emergency/history endpoint — no new backend list endpoint
 *    needed.
 *
 * Deliberately skipped:
 *  - "Share SOS" — NOT built. An active SOS already automatically creates
 *    its own protected, priority incident conversation with all accepted
 *    Guardians added and every message flagged emergency-priority (see
 *    ChatService.createIncidentConversation). Adding a second, manual
 *    "share my SOS into this other chat" action would create a redundant,
 *    unprotected, un-prioritized copy of emergency context sitting in an
 *    ordinary conversation — a genuine safety regression risk (someone
 *    could see a stale/faked "SOS" card with none of the real incident
 *    conversation's guarantees). The existing dedicated mechanism is
 *    correct and should not be duplicated or competed with.
 *  - Guardians / Safety Circle / Panic PIN / Fake Call / Wellness
 *    Check-ins / Geofences / Sentinel red-zone alerts — none of these map
 *    naturally onto "attach this into an arbitrary chat message". Guardian
 *    and Circle relationships are already 1:1 invite flows with their own
 *    UI; Panic PIN and Fake Call are deliberately private/disguised
 *    features where being "shareable" would defeat their purpose; Wellness
 *    Check-ins and Geofences are personal, ongoing configurations rather
 *    than a one-off thing to forward into a conversation; a Sentinel
 *    red-zone alert is a neighbourhood-wide advisory already broadcast to
 *    everyone it's relevant to — forwarding it manually into a chat adds
 *    nothing a screenshot/link wouldn't already do, and risks looking like
 *    a personalized alert when it isn't.
 */
