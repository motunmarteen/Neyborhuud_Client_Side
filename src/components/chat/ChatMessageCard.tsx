'use client';

/**
 * ChatMessageCard
 * Renders the correct card layout for every ChatMessage type.
 * All cards are self-contained and fail safely (fallback to text bubble).
 */

import type { ReactNode } from 'react';
import { ChatMessage } from '@/types/api';
import { ChatExpandableText } from '@/components/chat/ChatExpandableText';
import { ChatMessageTicks } from '@/components/chat/ChatMessageTicks';
import { MessageReactions } from '@/components/chat/MessageReactions';

function timeStr(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function Meta({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <div className="chat-bubble__meta">
      <span>{timeStr(msg.createdAt)}</span>
      {mine ? <ChatMessageTicks status={msg.status} /> : null}
    </div>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────
function CardShell({ icon, label, color, children, mine, msg }: {
  icon: string; label: string; color: string; children: ReactNode; mine: boolean; msg: ChatMessage;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl ${color} max-w-[280px] sm:max-w-xs`}>
      <div className="flex items-center gap-2 px-3 py-2 opacity-80">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-white/70">{label}</span>
      </div>
      <div className="bg-brand-black/80 px-3 pb-2 pt-1">
        {children}
        <Meta msg={msg} mine={mine} />
      </div>
    </div>
  );
}

// ─── Per-type renderers ───────────────────────────────────────────────────────

function LocationCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const loc = msg.locationSnapshot ?? (msg.meta as any);
  const lat = loc?.latitude ?? loc?.lat;
  const lng = loc?.longitude ?? loc?.lng;
  const address = loc?.address ?? msg.content;
  const mapsUrl = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : null;

  return (
    <CardShell icon="📍" label="Location" color="bg-status-success/20" mine={mine} msg={msg}>
      {lat && lng && (
        <p className="font-mono text-[10px] text-primary">{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</p>
      )}
      <p className="text-sm text-[var(--neu-text-muted)]">{address}</p>
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-primary hover:underline">
          Open in Maps →
        </a>
      )}
    </CardShell>
  );
}

function EventCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { title, time, eventId } = msg.meta ?? {};
  return (
    <CardShell icon="📅" label="Event" color="bg-purple-900" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-[var(--neu-text-muted)]">{title ?? msg.content}</p>
      {time && <p className="text-xs text-status-info">{new Date(time).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
      {eventId && <p className="text-[10px] text-[var(--neu-text-muted)] mt-0.5">ID: {eventId}</p>}
    </CardShell>
  );
}

function MarketplaceCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { title, price, itemId } = msg.meta ?? {};
  return (
    <CardShell icon="🛒" label="Marketplace" color="bg-primary900" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-[var(--neu-text-muted)]">{title ?? msg.content}</p>
      {price !== undefined && <p className="text-xs text-primary font-bold">₦{price.toLocaleString()}</p>}
      {itemId && <p className="text-[10px] text-[var(--neu-text-muted)] mt-0.5">Item: {itemId}</p>}
    </CardShell>
  );
}

function ContactCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { name, phone } = msg.meta ?? {};
  return (
    <CardShell icon="👤" label="Contact" color="bg-brand-blue/30" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-[var(--neu-text-muted)]">{name ?? msg.content}</p>
      {phone && (
        <a href={`tel:${phone}`} className="text-xs text-brand-blue hover:underline">{phone}</a>
      )}
    </CardShell>
  );
}

function PollCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { question, options, votes } = msg.meta ?? {};
  return (
    <CardShell icon="📊" label="Poll" color="bg-brand-blue900" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-[var(--neu-text-muted)] mb-2">{question ?? msg.content}</p>
      {options?.map((opt, i) => {
        const voters = votes?.[String(i)]?.length ?? 0;
        return (
          <div key={i} className="mb-1.5 overflow-hidden rounded-lg bg-brand-black">
            <div
              className="h-7 flex items-center px-3 text-xs text-[var(--neu-text-muted)] bg-brand-blue800/40"
              style={{ minWidth: '100%' }}
            >
              {opt}
              {voters > 0 && <span className="ml-auto text-brand-blue300 text-[10px]">{voters} vote{voters !== 1 ? 's' : ''}</span>}
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
    <CardShell icon="📡" label="Tracking Session" color="bg-brand-blue900" mine={mine} msg={msg}>
      {live && <span className="mb-1 inline-block rounded-full bg-primary/20 px-2 py-0.5 text-[10px] text-primary">● LIVE</span>}
      {sessionRef && <p className="text-xs text-brand-blue300 font-mono">{sessionRef}</p>}
      <p className="text-sm text-[var(--neu-text-muted)] mt-0.5">{msg.content}</p>
    </CardShell>
  );
}

function KidnappingCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { status } = msg.meta ?? {};
  const sessionRef = msg.trackingSessionRef;
  const statusColor = status === 'resolved' ? 'text-primary' : status === 'suspected' ? 'text-primary400' : 'text-brand-red';
  return (
    <CardShell icon="🚨" label="Kidnapping Alert" color="bg-status-danger/25" mine={mine} msg={msg}>
      {status && <p className={`text-xs font-bold uppercase ${statusColor}`}>{status}</p>}
      {sessionRef && <p className="text-[10px] text-[var(--neu-text-muted)] font-mono mt-0.5">Session: {sessionRef}</p>}
      <p className="text-sm text-[var(--neu-text-muted)] mt-0.5">{msg.content}</p>
    </CardShell>
  );
}

function SOSCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { severity } = msg.meta ?? {};
  const sev = severity ?? 'high';
  const sevColor = sev === 'critical' ? 'text-brand-red' : sev === 'high' ? 'text-brand-red' : sev === 'medium' ? 'text-primary400' : 'text-brand-blue';
  return (
    <CardShell icon="🆘" label="SOS" color="bg-status-danger/20" mine={mine} msg={msg}>
      <p className={`text-xs font-bold uppercase ${sevColor}`}>Severity: {sev}</p>
      {msg.emergencyRef && <p className="text-[10px] text-[var(--neu-text-muted)] font-mono mt-0.5">Ref: {msg.emergencyRef}</p>}
      <p className="text-sm text-[var(--neu-text-muted)] mt-0.5">{msg.content}</p>
    </CardShell>
  );
}

// ─── Media renderers ──────────────────────────────────────────────────────────

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
    <div className="flex items-center gap-3 rounded-2xl bg-brand-black px-4 py-3 max-w-[280px]">
      <span className="text-2xl">📎</span>
      <div className="min-w-0 flex-1">
        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-brand-blue hover:underline">
          {msg.content}
        </a>
        <p className="text-[10px] text-[var(--neu-text-muted)] mt-0.5">Document</p>
      </div>
      <Meta msg={msg} mine={mine} />
    </div>
  );
}

// ─── Plain text bubble ────────────────────────────────────────────────────────
function TextBubble({
  msg,
  mine,
  isPriority,
  currentUserId,
  onReactionsUpdate,
}: {
  msg: ChatMessage;
  mine: boolean;
  isPriority: boolean;
  currentUserId?: string;
  onReactionsUpdate?: (reactions: ChatMessage['reactions']) => void;
}) {
  const bubbleClass = isPriority
    ? 'chat-bubble chat-bubble--priority'
    : mine
      ? 'chat-bubble chat-bubble--out'
      : 'chat-bubble chat-bubble--in';

  return (
    <div className={bubbleClass}>
      <div className="chat-bubble__body">
        {isPriority ? (
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-90">Priority</p>
        ) : null}
        {msg.isDeleted ? (
          <p className="italic opacity-70">Message deleted</p>
        ) : (
          <ChatExpandableText text={msg.content ?? ''} />
        )}
        <Meta msg={msg} mine={mine} />
      </div>
      {!msg.isDeleted ? (
        <MessageReactions
          msg={msg}
          mine={mine}
          currentUserId={currentUserId}
          onUpdated={onReactionsUpdate}
        />
      ) : null}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
function MessageStack({
  mine,
  senderLabel,
  children,
}: {
  mine: boolean;
  senderLabel?: string | null;
  children: ReactNode;
}) {
  return (
    <div className={`chat-message-stack ${mine ? 'chat-message-stack--out' : 'chat-message-stack--in'}`}>
      {!mine && senderLabel ? (
        <span className="chat-message-stack__sender">{senderLabel}</span>
      ) : null}
      {children}
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
    <MessageStack mine={mine} senderLabel={senderLabel}>
      {node}
    </MessageStack>
  );

  if (msg.isDeleted) {
    return wrap(<TextBubble msg={msg} mine={mine} isPriority={false} {...textProps} />);
  }

  switch (msg.type) {
    case 'image': return wrap(msg.mediaUrl ? <ImageBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} {...textProps} />);
    case 'video': return wrap(msg.mediaUrl ? <VideoBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} {...textProps} />);
    case 'audio': return wrap(msg.mediaUrl ? <AudioBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} {...textProps} />);
    case 'file':  return wrap(msg.mediaUrl ? <FileBubble  msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} {...textProps} />);
    case 'system':         return wrap(<TextBubble msg={msg} mine={mine} isPriority={false} {...textProps} />);
    case 'location':       return wrap(<LocationCard    msg={msg} mine={mine} />);
    case 'event':          return wrap(<EventCard       msg={msg} mine={mine} />);
    case 'marketplace':    return wrap(<MarketplaceCard msg={msg} mine={mine} />);
    case 'contact':        return wrap(<ContactCard     msg={msg} mine={mine} />);
    case 'poll':           return wrap(<PollCard        msg={msg} mine={mine} />);
    case 'tracking':       return wrap(<TrackingCard    msg={msg} mine={mine} />);
    case 'kidnapping_info':return wrap(<KidnappingCard  msg={msg} mine={mine} />);
    case 'sos':            return wrap(<SOSCard         msg={msg} mine={mine} />);
    default:               return wrap(<TextBubble     msg={msg} mine={mine} isPriority={isPriority} {...textProps} />);
  }
}
