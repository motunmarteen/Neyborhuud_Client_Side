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

import { type ReactNode, useState, useRef } from 'react';
import { ChatMessage } from '@/types/api';
import { ChatExpandableText } from '@/components/chat/ChatExpandableText';
import { ChatMessageTicks } from '@/components/chat/ChatMessageTicks';
import { MessageReactions } from '@/components/chat/MessageReactions';
import { DealStatusCard } from '@/components/chat/DealStatusCard';
import { OfferCard } from '@/components/chat/OfferCard';

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

function LocationCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const loc = msg.locationSnapshot ?? (msg.meta as any);
  const lat = loc?.latitude ?? loc?.lat;
  const lng = loc?.longitude ?? loc?.lng;
  const address = loc?.address ?? msg.content;
  const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <CardShell icon="📍" label="Location" bg="bg-emerald-50" text="text-emerald-700" mine={mine} msg={msg}>
      {lat && lng && (
        <p className="font-mono text-[10px] text-emerald-600">{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</p>
      )}
      <p className="text-sm text-gray-700">{address}</p>
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs font-semibold text-emerald-600 hover:underline">
          Open in Maps →
        </a>
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
      {price !== undefined && <p className="text-xs text-blue-600 font-bold">₦{price.toLocaleString()}</p>}
      {itemId && <p className="text-[10px] text-gray-400 mt-0.5">Item: {itemId}</p>}
    </CardShell>
  );
}

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

function PollCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { question, options, votes } = msg.meta ?? {};
  return (
    <CardShell icon="📊" label="Poll" bg="bg-indigo-50" text="text-indigo-700" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-gray-900 mb-2">{question ?? msg.content}</p>
      {options?.map((opt: string, i: number) => {
        const voters = votes?.[String(i)]?.length ?? 0;
        return (
          <div key={i} className="mb-1.5 overflow-hidden rounded-lg bg-indigo-100/60">
            <div className="h-7 flex items-center px-3 text-xs text-gray-700">
              {opt}
              {voters > 0 && <span className="ml-auto text-indigo-600 text-[10px]">{voters} vote{voters !== 1 ? 's' : ''}</span>}
            </div>
          </div>
        );
      })}
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

// ─── Media renderers ─────────────────────────────────────────────────────────

function ImageBubble({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <div className="max-w-[240px] sm:max-w-xs">
      <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={msg.mediaUrl} alt={msg.content || 'image'} className="w-full rounded-2xl object-cover" style={{ maxHeight: 240 }} />
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
  children,
}: {
  msg: ChatMessage;
  mine: boolean;
  senderLabel?: string | null;
  currentUserId?: string;
  onReactionsUpdate?: (reactions: ChatMessage['reactions']) => void;
  children: ReactNode;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  const startPress = () => {
    timerRef.current = setTimeout(() => {
      setPickerOpen(true);
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
    </div>
  );
}

export default function ChatMessageCard({
  msg,
  mine,
  currentUserId,
  onReactionsUpdate,
  senderLabel,
}: {
  msg: ChatMessage;
  mine: boolean;
  currentUserId?: string;
  onReactionsUpdate?: (reactions: ChatMessage['reactions']) => void;
  senderLabel?: string | null;
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
    case 'location':       return wrap(<LocationCard    msg={msg} mine={mine} />);
    case 'event':          return wrap(<EventCard       msg={msg} mine={mine} />);
    case 'marketplace':    return wrap(<MarketplaceCard msg={msg} mine={mine} />);
    case 'contact':        return wrap(<ContactCard     msg={msg} mine={mine} />);
    case 'poll':           return wrap(<PollCard        msg={msg} mine={mine} />);
    case 'tracking':       return wrap(<TrackingCard    msg={msg} mine={mine} />);
    case 'kidnapping_info':return wrap(<KidnappingCard  msg={msg} mine={mine} />);
    case 'sos':            return wrap(<SOSCard         msg={msg} mine={mine} />);
    default:               return wrap(<TextBubble     msg={msg} mine={mine} isPriority={isPriority} />);
  }
}
