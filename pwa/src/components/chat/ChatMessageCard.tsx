'use client';

/**
 * ChatMessageCard
 * Renders the correct card layout for every ChatMessage type.
 * All cards are self-contained and fail safely (fallback to text bubble).
 *
 * ── Sentinel Design System ──
 * Outgoing: bg-slate-800 text-white  (premium dark bubble)
 * Incoming: bg-gray-100 text-gray-900 (clean, light bubble)
 * Specialty cards: soft tinted backgrounds (blue-50, red-50, etc.)
 */

import { type ReactNode, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { ChatMessage } from '@/types/api';
import { ChatExpandableText } from '@/components/chat/ChatExpandableText';
import { ChatMessageTicks } from '@/components/chat/ChatMessageTicks';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { MessageActionSheet } from '@/components/chat/MessageActionSheet';
import { DealStatusCard } from '@/components/chat/DealStatusCard';
import { OfferCard } from '@/components/chat/OfferCard';
import { formatNaira } from '@/lib/currency';
import { chatService } from '@/services/chat.service';
import { InteractiveMap } from '@/components/ui/InteractiveMap';
import socketService from '@/lib/socket';

// ─── Reply-to quoted preview (audit finding #6) ──────────────────────────────
// Rendered above the message content when a message has a replyToPreview,
// mirroring WhatsApp/Telegram's quoted-message snippet on the sent message.
function ReplyQuote({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const preview = msg.replyToPreview;
  if (!preview) return null;
  return (
    <div
      className={`mb-1 rounded-lg border-l-[3px] px-2 py-1 text-[12px] leading-snug ${
        mine ? 'border-white/40 bg-white/10 text-white/80' : 'border-gray-300 bg-black/[0.03] text-gray-600'
      }`}
    >
      <p className={`truncate font-semibold ${mine ? 'text-white/90' : 'text-gray-700'}`}>
        {preview.senderName || 'Neybor'}
      </p>
      <p className="truncate italic opacity-90">
        {preview.isDeleted ? 'Message deleted' : preview.contentPreview}
      </p>
    </div>
  );
}

function timeStr(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function Meta({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <div className={`flex shrink-0 items-center justify-end gap-1 text-[10px] ${mine ? 'text-white/60' : 'text-gray-400'}`}>
      <span>{timeStr(msg.createdAt)}</span>
      {mine ? <ChatMessageTicks status={msg.status} /> : null}
    </div>
  );
}

// ─── Card shell (specialty messages) ─────────────────────────────────────────
function CardShell({ icon, label, bg, text, children, mine, msg }: {
  icon: string; label: string; bg: string; text: string; children: ReactNode; mine: boolean; msg: ChatMessage;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl ${bg} max-w-[280px] sm:max-w-xs`}>
      <div className={`flex items-center gap-2 px-3 py-2 ${text}`}>
        <span className="text-base">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide opacity-70">{label}</span>
      </div>
      <div className="px-3 pb-2 pt-1">
        {children}
        <Meta msg={msg} mine={mine} />
      </div>
    </div>
  );
}

// ─── Per-type renderers ──────────────────────────────────────────────────────

// Location card — reuses InteractiveMap (the same MapLibre/OSM component
// used by the Geofences page) for a small, read-only map preview instead of
// just a "Open in Maps" link, so it looks/feels consistent with the rest of
// the app's mapping UI. Also handles LIVE location shares: shows a pulsing
// "LIVE" badge and countdown, listens for message:location_update over the
// same socket connection used everywhere else in chat, and — if this is the
// viewer's own share — offers a "Stop sharing" button.
function LocationCard({ msg, mine, currentUserId }: { msg: ChatMessage; mine: boolean; currentUserId?: string }) {
  const [snapshot, setSnapshot] = useState(msg.locationSnapshot);
  const [stopping, setStopping] = useState(false);
  const meta = msg.meta as any;
  const loc = snapshot ?? meta;
  const lat = loc?.latitude ?? loc?.lat;
  const lng = loc?.longitude ?? loc?.lng;
  const address = loc?.address ?? msg.content;
  const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;
  const isLive = !!snapshot?.isLive;
  const isStopped = !!snapshot?.stoppedAt;
  const expiresAt = snapshot?.expiresAt ? new Date(snapshot.expiresAt).getTime() : null;
  const isExpired = !!expiresAt && Date.now() > expiresAt;
  const messageId = msg.id ?? (msg as any)._id;
  // Auto-shared during an SOS rather than manually shared — styled red so a
  // guardian scanning the thread can't mistake it for a casual location drop.
  const isIncident = !!meta?.incidentLive;

  useEffect(() => {
    if (!isLive || !messageId) return;
    const onUpdate = (data: any) => {
      if (data?.messageId !== messageId) return;
      setSnapshot(data.locationSnapshot);
    };
    const onStopped = (data: any) => {
      if (data?.messageId !== messageId) return;
      setSnapshot((s) => (s ? { ...s, stoppedAt: new Date().toISOString() } : s));
    };
    socketService.on('message:location_update', onUpdate);
    socketService.on('message:location_stopped', onStopped);
    return () => {
      socketService.off('message:location_update', onUpdate);
      socketService.off('message:location_stopped', onStopped);
    };
  }, [isLive, messageId]);

  const handleStop = async () => {
    if (!messageId) return;
    setStopping(true);
    try {
      await chatService.stopLiveLocation(messageId);
    } catch {
      toast.error('Could not stop sharing. Try again.');
    } finally {
      setStopping(false);
    }
  };

  return (
    <CardShell
      icon={isIncident ? '🚨' : '📍'}
      label={isIncident ? 'Emergency Live Location' : isLive ? 'Live Location' : 'Location'}
      bg={isIncident ? 'bg-red-50' : 'bg-emerald-50'}
      text={isIncident ? 'text-red-700' : 'text-emerald-700'}
      mine={mine}
      msg={msg}
    >
      {lat && lng && (
        <div className="mb-2 overflow-hidden rounded-xl">
          <InteractiveMap
            center={{ lat: Number(lat), lng: Number(lng) }}
            draggable={false}
            showMarker
            showDragHint={false}
            showNavigationControl={false}
            showAttribution={false}
            height="120px"
            zoom={14}
          />
        </div>
      )}
      {isLive && !isStopped && !isExpired && (
        <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" /> LIVE
        </span>
      )}
      {isLive && (isStopped || isExpired) && (
        <span className="mb-1 inline-block rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-500">
          {isStopped ? 'Sharing stopped' : 'Sharing ended'}
        </span>
      )}
      {lat && lng && (
        <p className={`font-mono text-[10px] ${isIncident ? 'text-red-600' : 'text-emerald-600'}`}>{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</p>
      )}
      <p className="text-sm text-gray-700">{address}</p>
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={`mt-1 block text-xs font-semibold hover:underline ${isIncident ? 'text-red-600' : 'text-emerald-600'}`}>
          Open in Maps →
        </a>
      )}
      {isLive && mine && currentUserId === msg.senderId && !isStopped && !isExpired && (
        <button
          type="button"
          disabled={stopping}
          onClick={handleStop}
          className="mt-2 w-full rounded-lg bg-red-100 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-200 disabled:opacity-50"
        >
          {stopping ? 'Stopping…' : 'Stop Sharing'}
        </button>
      )}
    </CardShell>
  );
}

function EventCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { title, time, eventId } = msg.meta ?? {};
  return (
    <CardShell icon="📅" label="Event" bg="bg-purple-50" text="text-purple-700" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-gray-900">{title ?? msg.content}</p>
      {time && <p className="text-xs text-purple-600">{new Date(time).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
      {eventId && <p className="text-[10px] text-gray-400 mt-0.5">ID: {eventId}</p>}
    </CardShell>
  );
}

function MarketplaceCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { title, price, itemId } = msg.meta ?? {};
  return (
    <CardShell icon="🛒" label="Marketplace" bg="bg-blue-50" text="text-blue-700" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-gray-900">{title ?? msg.content}</p>
      {price !== undefined && <p className="text-xs text-blue-600 font-bold">{formatNaira(price)}</p>}
      {itemId && <p className="text-[10px] text-gray-400 mt-0.5">Item: {itemId}</p>}
    </CardShell>
  );
}

// Real poll: single- or multiple-choice voting backed by a server PollVote
// collection (chat.poll.controller.ts), live vote counts/percentages, and
// real-time updates via the "poll:vote" socket event broadcast to everyone
// in the conversation. Anonymous polls (the default) show only aggregate
// counts; non-anonymous polls could additionally reveal voter identities,
// but this card intentionally keeps the same "counts + percentages" display
// either way — voter-identity disclosure isn't rendered anywhere in the UI
// yet, since PollVote rows don't currently need to expose individual voters
// beyond aggregate counts for a first, complete version of this feature.
function PollCard({ msg, mine, currentUserId }: { msg: ChatMessage; mine: boolean; currentUserId?: string }) {
  const messageId = msg.id ?? (msg as any)._id;
  const { question, options, allowMultiple, votes: initialVotes } = msg.meta ?? {};
  const [votes, setVotes] = useState(initialVotes ?? {});
  const [selected, setSelected] = useState<number[]>([]);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    if (!messageId) return;
    const onVote = (data: any) => {
      if (data?.messageId !== messageId) return;
      setVotes(data.results ?? {});
    };
    socketService.on('poll:vote', onVote);
    return () => socketService.off('poll:vote', onVote);
  }, [messageId]);

  useEffect(() => {
    if (!currentUserId) return;
    const mine: number[] = [];
    Object.entries(votes ?? {}).forEach(([idx, v]: [string, any]) => {
      if (v?.userIds?.includes(currentUserId)) mine.push(Number(idx));
    });
    setSelected(mine);
  }, [votes, currentUserId]);

  const totalVotes = Object.values(votes ?? {}).reduce((sum: number, v: any) => sum + (v?.count ?? 0), 0);

  const castVote = async (optionIndex: number) => {
    if (!messageId || voting) return;
    setVoting(true);
    let next: number[];
    if (allowMultiple) {
      next = selected.includes(optionIndex) ? selected.filter((i) => i !== optionIndex) : [...selected, optionIndex];
    } else {
      next = [optionIndex];
    }
    try {
      await chatService.votePoll(
        messageId,
        allowMultiple ? { optionIndexes: next } : { optionIndex: next[0] },
      );
      setSelected(next);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not vote. Try again.');
    } finally {
      setVoting(false);
    }
  };

  return (
    <CardShell icon="📊" label={allowMultiple ? 'Poll · Multiple choice' : 'Poll'} bg="bg-indigo-50" text="text-indigo-700" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-gray-900 mb-2">{question ?? msg.content}</p>
      {options?.map((opt: string, i: number) => {
        const count = votes?.[String(i)]?.count ?? 0;
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        const isSelected = selected.includes(i);
        return (
          <button
            key={i}
            type="button"
            disabled={voting}
            onClick={() => castVote(i)}
            className="mb-1.5 block w-full overflow-hidden rounded-lg bg-indigo-100/60 text-left disabled:opacity-70"
          >
            <div className="relative h-8">
              <div
                className={`absolute inset-y-0 left-0 ${isSelected ? 'bg-indigo-300/70' : 'bg-indigo-200/50'}`}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex h-8 items-center gap-1.5 px-3 text-xs text-gray-800">
                {isSelected && <span aria-hidden>✓</span>}
                <span className="flex-1 truncate">{opt}</span>
                <span className="text-indigo-700 text-[10px] font-semibold">{pct}%</span>
              </div>
            </div>
          </button>
        );
      })}
      <p className="mt-1 text-[10px] text-gray-500">{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</p>
    </CardShell>
  );
}

function TrackingCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { live } = msg.meta ?? {};
  const sessionRef = msg.trackingSessionRef;
  return (
    <CardShell icon="📡" label="Tracking Session" bg="bg-cyan-50" text="text-cyan-700" mine={mine} msg={msg}>
      {live && <span className="mb-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">● LIVE</span>}
      {sessionRef && <p className="text-xs text-cyan-600 font-mono">{sessionRef}</p>}
      <p className="text-sm text-gray-700 mt-0.5">{msg.content}</p>
    </CardShell>
  );
}

function KidnappingCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { status } = msg.meta ?? {};
  const sessionRef = msg.trackingSessionRef;
  const statusColor = status === 'resolved' ? 'text-green-700' : status === 'suspected' ? 'text-amber-600' : 'text-red-700';
  return (
    <CardShell icon="🚨" label="Kidnapping Alert" bg="bg-red-50" text="text-red-700" mine={mine} msg={msg}>
      {status && <p className={`text-xs font-bold uppercase ${statusColor}`}>{status}</p>}
      {sessionRef && <p className="text-[10px] text-gray-400 font-mono mt-0.5">Session: {sessionRef}</p>}
      <p className="text-sm text-gray-700 mt-0.5">{msg.content}</p>
    </CardShell>
  );
}

function SOSCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { severity } = msg.meta ?? {};
  const sev = severity ?? 'high';
  const sevColor = sev === 'critical' ? 'text-red-700' : sev === 'high' ? 'text-red-600' : sev === 'medium' ? 'text-amber-600' : 'text-blue-600';
  return (
    <CardShell icon="🆘" label="SOS" bg="bg-red-50" text="text-red-700" mine={mine} msg={msg}>
      <p className={`text-xs font-bold uppercase ${sevColor}`}>Severity: {sev}</p>
      {msg.emergencyRef && <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {msg.emergencyRef}</p>}
      <p className="text-sm text-gray-700 mt-0.5">{msg.content}</p>
    </CardShell>
  );
}

// ─── Phase 2 rich-card shares ────────────────────────────────────────────────
// Each renders distinctly and navigates to the real underlying page on tap,
// per the spec's "don't just dump a generic shared-content bubble" requirement.

/** A real NeyborHuud user's profile, shared as a contact card. Tap → profile. */
function ContactShareCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { username, name, avatarUrl } = msg.meta ?? {};
  const body = (
    <div className="flex items-center gap-3">
      {avatarUrl ? (
        <span className="relative block h-11 w-11 shrink-0 overflow-hidden rounded-full">
          <Image src={avatarUrl} alt={name ?? 'Contact'} fill sizes="44px" className="object-cover" />
        </span>
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-200 text-lg">👤</span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-sm text-gray-900">{name ?? msg.content}</p>
        {username && <p className="truncate text-xs text-sky-600">@{username}</p>}
      </div>
    </div>
  );
  return (
    <CardShell icon="👤" label="Contact" bg="bg-sky-50" text="text-sky-700" mine={mine} msg={msg}>
      {username ? (
        <Link href={`/profile/${username}`} className="block hover:opacity-80">{body}</Link>
      ) : body}
    </CardShell>
  );
}

/** A marketplace listing, shared/forwarded into this chat. Tap → product page. */
function ProductShareCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { productId, title, price, thumbnail } = msg.meta ?? {};
  const body = (
    <div className="flex items-center gap-3">
      {thumbnail ? (
        <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg">
          <Image src={thumbnail} alt={title ?? 'Listing'} fill sizes="56px" className="object-cover" />
        </span>
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">🛍️</span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-sm text-gray-900">{title ?? msg.content}</p>
        {typeof price === 'number' && <p className="text-xs font-bold text-primary">{formatNaira(price)}</p>}
      </div>
    </div>
  );
  return (
    <CardShell icon="🛍️" label="Listing" bg="bg-blue-50" text="text-blue-700" mine={mine} msg={msg}>
      {productId ? (
        <Link href={`/marketplace/${productId}`} className="block hover:opacity-80">{body}</Link>
      ) : body}
    </CardShell>
  );
}

/** A community event, shared into this chat. Tap → event page. */
function EventShareCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { eventId, title, startDate, thumbnail } = msg.meta ?? {};
  const body = (
    <div className="flex items-center gap-3">
      {thumbnail ? (
        <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg">
          <Image src={thumbnail} alt={title ?? 'Event'} fill sizes="56px" className="object-cover" />
        </span>
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-purple-200 text-xl">📅</span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-sm text-gray-900">{title ?? msg.content}</p>
        {startDate && <p className="text-xs text-purple-600">{new Date(startDate).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
      </div>
    </div>
  );
  return (
    <CardShell icon="📅" label="Event" bg="bg-purple-50" text="text-purple-700" mine={mine} msg={msg}>
      {eventId ? (
        <Link href={`/events/${eventId}`} className="block hover:opacity-80">{body}</Link>
      ) : body}
    </CardShell>
  );
}

/** A job listing, shared into this chat. Tap → job page. */
function JobShareCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { jobId, title, workMode, salary } = msg.meta ?? {};
  const body = (
    <div>
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-lg">💼</span>
        <p className="truncate font-semibold text-sm text-gray-900">{title ?? msg.content}</p>
      </div>
      <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-gray-500">
        {workMode && <span className="capitalize">{String(workMode).replace('-', ' ')}</span>}
        {salary?.min && <span>{formatNaira(salary.min)}{salary.max ? `–${formatNaira(salary.max)}` : ''}{salary.period ? `/${salary.period}` : ''}</span>}
      </div>
    </div>
  );
  return (
    <CardShell icon="💼" label="Job" bg="bg-blue-50" text="text-blue-700" mine={mine} msg={msg}>
      {jobId ? (
        <Link href={`/jobs/${jobId}`} className="block hover:opacity-80">{body}</Link>
      ) : body}
    </CardShell>
  );
}

/** A community feed post, shared into this chat. Tap → best-effort deep link into the feed. */
function PostShareCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { postId, snippet, thumbnail, authorName } = msg.meta ?? {};
  const body = (
    <div className="flex items-center gap-3">
      {thumbnail ? (
        <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg">
          <Image src={thumbnail} alt="Post" fill sizes="56px" className="object-cover" />
        </span>
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-xl">📝</span>
      )}
      <div className="min-w-0">
        {authorName && <p className="truncate text-xs font-semibold text-gray-500">{authorName}</p>}
        <p className="truncate text-sm text-gray-900">{snippet ?? msg.content}</p>
      </div>
    </div>
  );
  return (
    <CardShell icon="📝" label="Post" bg="bg-slate-100" text="text-slate-700" mine={mine} msg={msg}>
      {postId ? (
        <Link href={`/feed?highlight=${postId}`} className="block hover:opacity-80">{body}</Link>
      ) : body}
    </CardShell>
  );
}

/** A snapshot of the sender's own active Safe Trip — casual "follow along" share, not a Guardian relationship. */
function TripShareCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { status, origin, destination, expectedArrival } = msg.meta ?? {};
  return (
    <CardShell icon="🧭" label="Trip Status" bg="bg-emerald-50" text="text-emerald-700" mine={mine} msg={msg}>
      <p className="text-sm font-semibold text-gray-900">{origin ?? '?'} → {destination ?? '?'}</p>
      <div className="mt-1 flex items-center gap-2">
        {status && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">{status}</span>
        )}
        {expectedArrival && (
          <span className="text-[10px] text-gray-500">
            ETA {new Date(expectedArrival).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </CardShell>
  );
}

/** A retrospective summary of one of the sender's own past emergency reports. */
function EmergencyShareCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { type, severity, status, reportedAt } = msg.meta ?? {};
  const sevColor = severity === 'critical' || severity === 'high' ? 'text-red-700' : 'text-amber-600';
  return (
    <CardShell icon="🚨" label="Emergency Report" bg="bg-red-50" text="text-red-700" mine={mine} msg={msg}>
      <p className="text-sm font-semibold capitalize text-gray-900">{type ?? 'Emergency'}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {severity && <span className={`text-[10px] font-bold uppercase ${sevColor}`}>{severity}</span>}
        {status && <span className="text-[10px] text-gray-500 capitalize">{status}</span>}
      </div>
      {reportedAt && (
        <p className="mt-0.5 text-[10px] text-gray-400">
          {new Date(reportedAt).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      )}
    </CardShell>
  );
}

/** Shared/legacy manual-entry contact type (name/phone typed by hand) — kept for old messages. */
function ContactCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { name, phone } = msg.meta ?? {};
  return (
    <CardShell icon="👤" label="Contact" bg="bg-sky-50" text="text-sky-700" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-gray-900">{name ?? msg.content}</p>
      {phone && (
        <a href={`tel:${phone}`} className="text-xs text-sky-600 hover:underline">{phone}</a>
      )}
    </CardShell>
  );
}

// ─── Media renderers ─────────────────────────────────────────────────────────

function ImageBubble({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <div className="max-w-[240px] sm:max-w-xs">
      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="relative block w-full rounded-2xl overflow-hidden" style={{ height: 240 }}>
        <Image src={msg.mediaUrl ?? ''} alt={msg.content || 'image'} fill sizes="240px" className="object-cover" />
      </a>
      <Meta msg={msg} mine={mine} />
    </div>
  );
}

function VideoBubble({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <div className="max-w-[280px]">
      <video src={msg.mediaUrl} controls className="w-full rounded-2xl" style={{ maxHeight: 240 }} />
      <Meta msg={msg} mine={mine} />
    </div>
  );
}

function AudioBubble({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <div className="min-w-[200px] max-w-[280px]">
      <audio src={msg.mediaUrl} controls className="w-full" />
      <Meta msg={msg} mine={mine} />
    </div>
  );
}

function FileBubble({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 max-w-[280px] ${mine ? 'bg-slate-700' : 'bg-gray-100'}`}>
      <span className="text-2xl">📎</span>
      <div className="min-w-0 flex-1">
        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className={`block truncate text-sm font-medium hover:underline ${mine ? 'text-blue-300' : 'text-blue-600'}`}>
          {msg.content}
        </a>
        <p className={`text-[10px] mt-0.5 ${mine ? 'text-white/50' : 'text-gray-400'}`}>Document</p>
      </div>
      <Meta msg={msg} mine={mine} />
    </div>
  );
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(name?: string): string {
  if (!name) return '';
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
}

const DOC_ICON_BY_EXT: Record<string, string> = {
  PDF: '📕',
  DOC: '📘', DOCX: '📘',
  XLS: '📗', XLSX: '📗', CSV: '📗',
  PPT: '📙', PPTX: '📙',
  ZIP: '🗜️', RAR: '🗜️',
  TXT: '📄',
};

/**
 * Document bubble — Phase 2 `type: "document"` (PDF/Word/Excel/zip/etc, up
 * to 50MB, see chat.constants.ts on the backend). Rendered WhatsApp/
 * Telegram-style: a file-type icon, filename, human-readable size, and a
 * tap-to-open/download link — distinct from the legacy `FileBubble` above
 * (which predates fileName/fileSize metadata and just showed a generic 📎).
 */
function DocumentBubble({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const ext = fileExtension(msg.fileName ?? msg.content);
  const icon = DOC_ICON_BY_EXT[ext] ?? '📄';
  const size = formatFileSize(msg.fileSize);
  return (
    <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 max-w-[280px] ${mine ? 'bg-slate-700' : 'bg-gray-100'}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-black/10 text-2xl">{icon}</span>
      <div className="min-w-0 flex-1">
        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" download className={`block truncate text-sm font-medium hover:underline ${mine ? 'text-blue-300' : 'text-blue-600'}`}>
          {msg.fileName ?? msg.content}
        </a>
        <p className={`text-[10px] mt-0.5 ${mine ? 'text-white/50' : 'text-gray-400'}`}>
          {[ext, size].filter(Boolean).join(' · ') || 'Document'}
        </p>
      </div>
      <Meta msg={msg} mine={mine} />
    </div>
  );
}

// ─── Plain text bubble ───────────────────────────────────────────────────────
function TextBubble({
  msg,
  mine,
  isPriority,
}: {
  msg: ChatMessage;
  mine: boolean;
  isPriority: boolean;
}) {
  const bubbleClass = isPriority
    ? 'rounded-[20px] bg-red-50 text-red-900 px-4 py-1.5 max-w-[280px] sm:max-w-xs border border-red-100'
    : mine
      ? 'rounded-[20px] bg-slate-800 text-white px-4 py-1.5 max-w-[280px] sm:max-w-xs shadow-sm'
      : 'rounded-[20px] bg-gray-100 text-gray-900 px-4 py-1.5 max-w-[280px] sm:max-w-xs shadow-sm';

  return (
    <div>
      <div className={bubbleClass}>
        {isPriority ? (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-red-600">Priority</p>
        ) : null}
        {!msg.isDeleted ? <ReplyQuote msg={msg} mine={mine} /> : null}
        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
          {msg.isDeleted ? (
            <p className="italic opacity-70 text-sm">Message deleted</p>
          ) : (
            <div className="text-[15px] leading-snug break-words">
              <ChatExpandableText text={msg.content ?? ''} />
            </div>
          )}
          <Meta msg={msg} mine={mine} />
        </div>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
function MessageStack({
  msg,
  mine,
  senderLabel,
  currentUserId,
  onReactionsUpdate,
  onReply,
  onDeleteForMe,
  children,
}: {
  msg: ChatMessage;
  mine: boolean;
  senderLabel?: string | null;
  currentUserId?: string;
  onReactionsUpdate?: (reactions: ChatMessage['reactions']) => void;
  onReply?: (msg: ChatMessage) => void;
  onDeleteForMe?: (msg: ChatMessage) => void;
  children: ReactNode;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Long-press opens the ACTION sheet (reply/report/delete-for-me) — a
  // right-click / long-context-menu still opens the emoji reaction picker,
  // matching the pre-existing behavior so nothing regresses there.
  const startPress = () => {
    timerRef.current = setTimeout(() => {
      setActionsOpen(true);
    }, 500);
  };
  const cancelPress = () => {
    clearTimeout(timerRef.current);
  };

  return (
    <div className={`flex flex-col ${mine ? 'items-end' : 'items-start'} my-0.5 px-1`}>
      {!mine && senderLabel ? (
        <span className="mb-0.5 ml-1 text-[11px] font-semibold text-gray-500">{senderLabel}</span>
      ) : null}
      <div
        ref={containerRef}
        onPointerDown={startPress}
        onPointerUp={cancelPress}
        onPointerMove={cancelPress}
        onPointerCancel={cancelPress}
        onContextMenu={(e) => { e.preventDefault(); setPickerOpen(true); }}
        className="relative"
      >
        {children}
      </div>
      {!msg.isDeleted ? (
        <MessageReactions
          msg={msg}
          mine={mine}
          currentUserId={currentUserId}
          onUpdated={onReactionsUpdate}
          openPicker={pickerOpen}
          onClosePicker={() => setPickerOpen(false)}
          anchorRef={containerRef}
        />
      ) : null}
      <MessageActionSheet
        msg={msg}
        mine={mine}
        open={actionsOpen}
        onClose={() => setActionsOpen(false)}
        anchorRef={containerRef}
        onReply={(m) => onReply?.(m)}
        onDeleteForMe={(m) => onDeleteForMe?.(m)}
      />
    </div>
  );
}

export default function ChatMessageCard({
  msg,
  mine,
  currentUserId,
  onReactionsUpdate,
  senderLabel,
  onReply,
  onDeleteForMe,
}: {
  msg: ChatMessage;
  mine: boolean;
  currentUserId?: string;
  onReactionsUpdate?: (reactions: ChatMessage['reactions']) => void;
  senderLabel?: string | null;
  onReply?: (msg: ChatMessage) => void;
  onDeleteForMe?: (msg: ChatMessage) => void;
}) {
  const isPriority = msg.priority === 'emergency';
  const textProps = { currentUserId, onReactionsUpdate };

  const wrap = (node: ReactNode) => (
    <MessageStack
      msg={msg}
      mine={mine}
      senderLabel={senderLabel}
      currentUserId={currentUserId}
      onReactionsUpdate={onReactionsUpdate}
      onReply={onReply}
      onDeleteForMe={onDeleteForMe}
    >
      {node}
    </MessageStack>
  );

  if (msg.isDeleted) {
    return wrap(<TextBubble msg={msg} mine={mine} isPriority={false} />);
  }

  switch (msg.type) {
    case 'image': return wrap(msg.mediaUrl ? <ImageBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />);
    case 'video': return wrap(msg.mediaUrl ? <VideoBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />);
    case 'audio': return wrap(msg.mediaUrl ? <AudioBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />);
    case 'file':  return wrap(msg.mediaUrl ? <FileBubble  msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />);
    case 'document': return wrap(msg.mediaUrl ? <DocumentBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />);
    case 'system':
      // System messages carry structured meta for interactive deal cards:
      //   - offerAction → haggle OfferCard (accept/reject/counter/withdraw)
      //   - dealAction  → DealStatusCard (I've Paid / Confirm Receipt)
      // Everything else falls back to a plain system text bubble.
      if (msg.meta?.offerAction) {
        return wrap(<OfferCard msg={msg} currentUserId={currentUserId} />);
      }
      if (msg.meta?.dealAction) {
        return wrap(<DealStatusCard msg={msg} currentUserId={currentUserId} />);
      }
      return wrap(<TextBubble msg={msg} mine={mine} isPriority={false} />);
    case 'location':       return wrap(<LocationCard    msg={msg} mine={mine} currentUserId={currentUserId} />);
    case 'event':          return wrap(<EventCard       msg={msg} mine={mine} />);
    case 'marketplace':    return wrap(<MarketplaceCard msg={msg} mine={mine} />);
    case 'contact':        return wrap(<ContactCard     msg={msg} mine={mine} />);
    case 'poll':           return wrap(<PollCard        msg={msg} mine={mine} currentUserId={currentUserId} />);
    case 'tracking':       return wrap(<TrackingCard    msg={msg} mine={mine} />);
    case 'kidnapping_info':return wrap(<KidnappingCard  msg={msg} mine={mine} />);
    case 'sos':            return wrap(<SOSCard         msg={msg} mine={mine} />);
    case 'contact_share':  return wrap(<ContactShareCard   msg={msg} mine={mine} />);
    case 'product_share':  return wrap(<ProductShareCard   msg={msg} mine={mine} />);
    case 'event_share':    return wrap(<EventShareCard     msg={msg} mine={mine} />);
    case 'job_share':      return wrap(<JobShareCard       msg={msg} mine={mine} />);
    case 'post_share':     return wrap(<PostShareCard      msg={msg} mine={mine} />);
    case 'trip_share':     return wrap(<TripShareCard      msg={msg} mine={mine} />);
    case 'emergency_share':return wrap(<EmergencyShareCard msg={msg} mine={mine} />);
    default:               return wrap(<TextBubble     msg={msg} mine={mine} isPriority={isPriority} />);
  }
}
