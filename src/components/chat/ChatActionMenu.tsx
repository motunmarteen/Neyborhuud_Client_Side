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

import { useEffect, useRef, useState } from 'react';
import { ChatMessage, ChatMessageMeta, ChatMessageType } from '@/types/api';

// ─── MIME Whitelist (single source of truth for frontend validation) ──────────
export const ALLOWED_MIME: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'],
  file: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'text/plain',
    'text/csv',
  ],
};

function acceptAttr(key: keyof typeof ALLOWED_MIME) {
  return ALLOWED_MIME[key].join(',');
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ActionResult {
  type: ChatMessageType;
  content: string;
  mediaUrl?: string;
  mediaFile?: File; // raw file, caller uploads it
  meta?: ChatMessageMeta;
  locationSnapshot?: { latitude: number; longitude: number; address?: string };
  emergencyRef?: string;
  trackingSessionRef?: string;
}

interface Props {
  disabled?: boolean;
  onAction: (result: ActionResult) => void;
}

// ─── Small modal wrapper ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-t-2xl bg-gray-900 p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold text-gray-100">{title}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-100 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Location Modal ───────────────────────────────────────────────────────────
function LocationModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loc, setLoc] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const detect = () => {
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLoc({ lat: latitude, lng: longitude, address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}` });
        setLoading(false);
      },
      () => { setError('Location access denied.'); setLoading(false); },
      { timeout: 8000 },
    );
  };

  useEffect(() => { detect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal title="📍 Send Location" onClose={onClose}>
      {loading && <p className="text-sm text-gray-400">Detecting location…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {loc && (
        <div className="mb-4 rounded-xl bg-gray-800 p-3 text-sm text-gray-200">
          <p className="font-mono text-xs text-gray-400">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>
          <input
            className="mt-2 w-full rounded bg-gray-700 px-3 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
            placeholder="Add address label (optional)"
            defaultValue={loc.address}
            onChange={(e) => setLoc((l) => l ? { ...l, address: e.target.value } : l)}
          />
        </div>
      )}
      <button
        disabled={!loc || loading}
        onClick={() => loc && onDone({
          type: 'location',
          content: `📍 ${loc.address}`,
          locationSnapshot: { latitude: loc.lat, longitude: loc.lng, address: loc.address },
          meta: { latitude: loc.lat, longitude: loc.lng, address: loc.address },
        })}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
      >
        Send Location
      </button>
      {error && <button onClick={detect} className="mt-2 w-full text-center text-xs text-blue-400 hover:underline">Retry</button>}
    </Modal>
  );
}

// ─── Poll Modal ───────────────────────────────────────────────────────────────
function PollModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  const submit = () => {
    const q = question.trim();
    const opts = options.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) return;
    onDone({
      type: 'poll',
      content: `📊 Poll: ${q}`,
      meta: { question: q, options: opts },
    });
  };

  return (
    <Modal title="📊 Create Poll" onClose={onClose}>
      <input
        className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
        placeholder="Poll question…"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        maxLength={200}
      />
      <div className="mb-3 flex flex-col gap-2">
        {options.map((o, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="flex-1 rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
              placeholder={`Option ${i + 1}`}
              value={o}
              onChange={(e) => setOptions((prev) => prev.map((v, idx) => idx === i ? e.target.value : v))}
              maxLength={100}
            />
            {options.length > 2 && (
              <button onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))} className="text-gray-500 hover:text-red-400">✕</button>
            )}
          </div>
        ))}
      </div>
      {options.length < 6 && (
        <button onClick={() => setOptions((prev) => [...prev, ''])} className="mb-3 text-xs text-blue-400 hover:underline">+ Add option</button>
      )}
      <button
        disabled={!question.trim() || options.filter(Boolean).length < 2}
        onClick={submit}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
      >
        Create Poll
      </button>
    </Modal>
  );
}

// ─── Contact Modal ────────────────────────────────────────────────────────────
function ContactModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  return (
    <Modal title="👤 Share Contact" onClose={onClose}>
      <input className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      <input className="mb-4 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} />
      <button
        disabled={!name.trim() || !phone.trim()}
        onClick={() => onDone({ type: 'contact', content: `👤 ${name} · ${phone}`, meta: { name: name.trim(), phone: phone.trim() } })}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
      >
        Share Contact
      </button>
    </Modal>
  );
}

// ─── SOS Modal ────────────────────────────────────────────────────────────────
function SOSModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [ref, setRef] = useState('');
  const [severity, setSeverity] = useState('high');

  return (
    <Modal title="🆘 Send SOS Context" onClose={onClose}>
      <p className="mb-3 text-xs text-orange-300">This shares emergency context with chat participants.</p>
      <input
        className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
        placeholder="Emergency ID / Reference (optional)"
        value={ref}
        onChange={(e) => setRef(e.target.value)}
        maxLength={24}
      />
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="mb-4 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none"
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
        className="w-full rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-500"
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
        className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
        placeholder="Tracking session ID"
        value={sessionRef}
        onChange={(e) => setSessionRef(e.target.value)}
        maxLength={24}
      />
      <label className="mb-4 flex items-center gap-2 text-sm text-gray-300">
        <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="accent-blue-500" />
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
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
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
      <p className="mb-3 text-xs text-red-300">Only share with verified responders or family contacts.</p>
      <input
        className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
        placeholder="Tracking session reference"
        value={sessionRef}
        onChange={(e) => setSessionRef(e.target.value)}
        maxLength={24}
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="mb-4 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none"
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
        className="w-full rounded-xl bg-red-700 py-2.5 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-40"
      >
        Send Alert
      </button>
    </Modal>
  );
}

// ─── Event Modal ──────────────────────────────────────────────────────────────
function EventModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [eventId, setEventId] = useState('');

  return (
    <Modal title="📅 Share Event" onClose={onClose}>
      <input className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      <input className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Event ID (optional)" value={eventId} onChange={(e) => setEventId(e.target.value)} maxLength={24} />
      <input type="datetime-local" className="mb-4 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:outline-none" value={time} onChange={(e) => setTime(e.target.value)} />
      <button
        disabled={!title.trim()}
        onClick={() => onDone({ type: 'event', content: `📅 ${title}`, meta: { eventId: eventId.trim() || undefined, title: title.trim(), time: time || undefined } })}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
      >
        Share Event
      </button>
    </Modal>
  );
}

// ─── Marketplace Modal ────────────────────────────────────────────────────────
function MarketplaceModal({ onDone, onClose }: { onDone: (r: ActionResult) => void; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [itemId, setItemId] = useState('');

  return (
    <Modal title="🛒 Share Item" onClose={onClose}>
      <input className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Item title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      <input className="mb-3 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Item ID (optional)" value={itemId} onChange={(e) => setItemId(e.target.value)} maxLength={24} />
      <input type="number" min="0" className="mb-4 w-full rounded-xl bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Price (₦)" value={price} onChange={(e) => setPrice(e.target.value)} />
      <button
        disabled={!title.trim()}
        onClick={() => onDone({ type: 'marketplace', content: `🛒 ${title}${price ? ` — ₦${price}` : ''}`, meta: { itemId: itemId.trim() || undefined, title: title.trim(), price: price ? Number(price) : undefined } })}
        className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
      >
        Share Item
      </button>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type ActiveModal = 'location' | 'poll' | 'contact' | 'sos' | 'tracking' | 'kidnapping_info' | 'event' | 'marketplace' | null;

const MEDIA_ACTIONS = [
  { key: 'image',  label: 'Image',    icon: '🖼️',  accept: acceptAttr('image') },
  { key: 'video',  label: 'Video',    icon: '🎥',  accept: acceptAttr('video') },
  { key: 'audio',  label: 'Audio',    icon: '🎵',  accept: acceptAttr('audio') },
  { key: 'file',   label: 'Document', icon: '📄',  accept: acceptAttr('file') },
] as const;

const CONTEXT_ACTIONS: { key: ActiveModal & string; label: string; icon: string; color: string }[] = [
  { key: 'location',       label: 'Location',     icon: '📍', color: 'bg-green-700' },
  { key: 'event',          label: 'Event',        icon: '📅', color: 'bg-purple-700' },
  { key: 'marketplace',    label: 'Marketplace',  icon: '🛒', color: 'bg-yellow-700' },
  { key: 'contact',        label: 'Contact',      icon: '👤', color: 'bg-blue-700' },
  { key: 'poll',           label: 'Poll',         icon: '📊', color: 'bg-cyan-700' },
  { key: 'tracking',       label: 'Tracking',     icon: '📡', color: 'bg-indigo-700' },
  { key: 'kidnapping_info',label: 'Kidnapping',   icon: '🚨', color: 'bg-red-800' },
  { key: 'sos',            label: 'SOS',          icon: '🆘', color: 'bg-red-700' },
];

export default function ChatActionMenu({ disabled, onAction }: Props) {
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [pendingAccept, setPendingAccept] = useState('image/jpeg,image/png,image/webp,image/gif');
  const [pendingMediaKey, setPendingMediaKey] = useState<keyof typeof ALLOWED_MIME>('image');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setActiveModal(null); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const openFilePicker = (key: keyof typeof ALLOWED_MIME, accept: string) => {
    setPendingAccept(accept);
    setPendingMediaKey(key);
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
      alert(`Invalid file type: ${file.type || 'unknown'}.\nAllowed: ${allowed.join(', ')}`);
      return;
    }

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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={pendingAccept}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Context action modals */}
      {activeModal === 'location'        && <LocationModal    onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'poll'            && <PollModal        onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'contact'         && <ContactModal     onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'sos'             && <SOSModal         onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'tracking'        && <TrackingModal    onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'kidnapping_info' && <KidnappingModal  onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'event'           && <EventModal       onDone={handleModalDone} onClose={() => setActiveModal(null)} />}
      {activeModal === 'marketplace'     && <MarketplaceModal onDone={handleModalDone} onClose={() => setActiveModal(null)} />}

      <div className="relative" ref={menuRef}>
        {/* "+" button */}
        <button
          type="button"
          onClick={() => setOpen((s) => !s)}
          disabled={disabled}
          aria-label="Add attachment or context action"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl font-bold transition-all duration-200 disabled:opacity-40 ${
            open
              ? 'rotate-45 bg-blue-600 text-white shadow-lg shadow-blue-900/50'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
        >
          +
        </button>

        {/* Action sheet */}
        {open && (
          <div className="absolute bottom-14 left-0 z-50 w-72 overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 shadow-2xl">

            {/* MEDIA section */}
            <div className="px-4 pt-4 pb-2">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Media</p>
              <div className="grid grid-cols-4 gap-2">
                {MEDIA_ACTIONS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => openFilePicker(a.key as keyof typeof ALLOWED_MIME, a.accept)}
                    className="flex flex-col items-center gap-1 rounded-xl bg-gray-800 p-3 text-center transition-colors hover:bg-gray-700"
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-[10px] text-gray-400">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mx-4 my-1 h-px bg-gray-800" />

            {/* CONTEXT ACTIONS section */}
            <div className="px-4 pt-2 pb-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">Context Actions</p>
              <div className="grid grid-cols-4 gap-2">
                {CONTEXT_ACTIONS.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => { setOpen(false); setActiveModal(a.key as ActiveModal); }}
                    className="flex flex-col items-center gap-1 rounded-xl bg-gray-800 p-3 text-center transition-colors hover:bg-gray-700"
                  >
                    <span className="text-2xl">{a.icon}</span>
                    <span className="text-[10px] text-gray-400 leading-tight">{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
