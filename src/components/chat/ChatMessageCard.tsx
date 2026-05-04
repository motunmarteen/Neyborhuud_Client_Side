'use client';

/**
 * ChatMessageCard
 * Renders the correct card layout for every ChatMessage type.
 * All cards are self-contained and fail safely (fallback to text bubble).
 */

import { ChatMessage } from '@/types/api';

function timeStr(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

// ─── Status ticks ─────────────────────────────────────────────────────────────
function Ticks({ status }: { status: ChatMessage['status'] }) {
  return (
    <span className="ml-1">
      {status === 'read' || status === 'delivered' ? '✓✓' : '✓'}
    </span>
  );
}

// ─── Timestamp + ticks row ────────────────────────────────────────────────────
function Meta({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  return (
    <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-blue-200' : 'text-gray-500'}`}>
      <span>{timeStr(msg.createdAt)}</span>
      {mine && <Ticks status={msg.status} />}
    </div>
  );
}

// ─── Card shell ───────────────────────────────────────────────────────────────
function CardShell({ icon, label, color, children, mine, msg }: {
  icon: string; label: string; color: string; children: React.ReactNode; mine: boolean; msg: ChatMessage;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl ${color} max-w-[280px] sm:max-w-xs`}>
      <div className="flex items-center gap-2 px-3 py-2 opacity-80">
        <span className="text-base">{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-white/70">{label}</span>
      </div>
      <div className="bg-gray-900/80 px-3 pb-2 pt-1">
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
    <CardShell icon="📍" label="Location" color="bg-green-900" mine={mine} msg={msg}>
      {lat && lng && (
        <p className="font-mono text-[10px] text-green-300">{Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}</p>
      )}
      <p className="text-sm text-gray-100">{address}</p>
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-green-400 hover:underline">
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
      <p className="font-semibold text-sm text-gray-100">{title ?? msg.content}</p>
      {time && <p className="text-xs text-purple-300">{new Date(time).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>}
      {eventId && <p className="text-[10px] text-gray-500 mt-0.5">ID: {eventId}</p>}
    </CardShell>
  );
}

function MarketplaceCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { title, price, itemId } = msg.meta ?? {};
  return (
    <CardShell icon="🛒" label="Marketplace" color="bg-yellow-900" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-gray-100">{title ?? msg.content}</p>
      {price !== undefined && <p className="text-xs text-yellow-300 font-bold">₦{price.toLocaleString()}</p>}
      {itemId && <p className="text-[10px] text-gray-500 mt-0.5">Item: {itemId}</p>}
    </CardShell>
  );
}

function ContactCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { name, phone } = msg.meta ?? {};
  return (
    <CardShell icon="👤" label="Contact" color="bg-blue-900" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-gray-100">{name ?? msg.content}</p>
      {phone && (
        <a href={`tel:${phone}`} className="text-xs text-blue-300 hover:underline">{phone}</a>
      )}
    </CardShell>
  );
}

function PollCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { question, options, votes } = msg.meta ?? {};
  return (
    <CardShell icon="📊" label="Poll" color="bg-cyan-900" mine={mine} msg={msg}>
      <p className="font-semibold text-sm text-gray-100 mb-2">{question ?? msg.content}</p>
      {options?.map((opt, i) => {
        const voters = votes?.[String(i)]?.length ?? 0;
        return (
          <div key={i} className="mb-1.5 overflow-hidden rounded-lg bg-gray-800">
            <div
              className="h-7 flex items-center px-3 text-xs text-gray-200 bg-cyan-800/40"
              style={{ minWidth: '100%' }}
            >
              {opt}
              {voters > 0 && <span className="ml-auto text-cyan-300 text-[10px]">{voters} vote{voters !== 1 ? 's' : ''}</span>}
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
    <CardShell icon="📡" label="Tracking Session" color="bg-indigo-900" mine={mine} msg={msg}>
      {live && <span className="mb-1 inline-block rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] text-green-400">● LIVE</span>}
      {sessionRef && <p className="text-xs text-indigo-300 font-mono">{sessionRef}</p>}
      <p className="text-sm text-gray-100 mt-0.5">{msg.content}</p>
    </CardShell>
  );
}

function KidnappingCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { status } = msg.meta ?? {};
  const sessionRef = msg.trackingSessionRef;
  const statusColor = status === 'resolved' ? 'text-green-400' : status === 'suspected' ? 'text-yellow-400' : 'text-red-400';
  return (
    <CardShell icon="🚨" label="Kidnapping Alert" color="bg-red-950" mine={mine} msg={msg}>
      {status && <p className={`text-xs font-bold uppercase ${statusColor}`}>{status}</p>}
      {sessionRef && <p className="text-[10px] text-gray-400 font-mono mt-0.5">Session: {sessionRef}</p>}
      <p className="text-sm text-gray-100 mt-0.5">{msg.content}</p>
    </CardShell>
  );
}

function SOSCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const { severity } = msg.meta ?? {};
  const sev = severity ?? 'high';
  const sevColor = sev === 'critical' ? 'text-red-300' : sev === 'high' ? 'text-orange-400' : sev === 'medium' ? 'text-yellow-400' : 'text-blue-400';
  return (
    <CardShell icon="🆘" label="SOS" color="bg-red-900" mine={mine} msg={msg}>
      <p className={`text-xs font-bold uppercase ${sevColor}`}>Severity: {sev}</p>
      {msg.emergencyRef && <p className="text-[10px] text-gray-400 font-mono mt-0.5">Ref: {msg.emergencyRef}</p>}
      <p className="text-sm text-gray-100 mt-0.5">{msg.content}</p>
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
    <div className="flex items-center gap-3 rounded-2xl bg-gray-800 px-4 py-3 max-w-[280px]">
      <span className="text-2xl">📎</span>
      <div className="min-w-0 flex-1">
        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block truncate text-sm text-blue-300 hover:underline">
          {msg.content}
        </a>
        <p className="text-[10px] text-gray-500 mt-0.5">Document</p>
      </div>
      <Meta msg={msg} mine={mine} />
    </div>
  );
}

// ─── Plain text bubble ────────────────────────────────────────────────────────
function TextBubble({ msg, mine, isPriority }: { msg: ChatMessage; mine: boolean; isPriority: boolean }) {
  return (
    <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
      isPriority
        ? 'border-2 border-red-600 bg-red-900/40'
        : mine
        ? 'bg-blue-700 text-white'
        : 'bg-gray-800 text-gray-100'
    }`}>
      {isPriority && <p className="mb-1 text-[10px] font-bold uppercase text-red-300">🚨 Priority</p>}
      {msg.isDeleted
        ? <p className="italic text-gray-400 text-sm">[deleted]</p>
        : <p className="text-sm leading-relaxed">{msg.content}</p>
      }
      <Meta msg={msg} mine={mine} />
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ChatMessageCard({ msg, mine }: { msg: ChatMessage; mine: boolean }) {
  const isPriority = msg.priority === 'emergency';

  if (msg.isDeleted) {
    return <TextBubble msg={msg} mine={mine} isPriority={false} />;
  }

  switch (msg.type) {
    case 'image': return msg.mediaUrl ? <ImageBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />;
    case 'video': return msg.mediaUrl ? <VideoBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />;
    case 'audio': return msg.mediaUrl ? <AudioBubble msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />;
    case 'file':  return msg.mediaUrl ? <FileBubble  msg={msg} mine={mine} /> : <TextBubble msg={msg} mine={mine} isPriority={isPriority} />;
    case 'location':       return <LocationCard    msg={msg} mine={mine} />;
    case 'event':          return <EventCard       msg={msg} mine={mine} />;
    case 'marketplace':    return <MarketplaceCard msg={msg} mine={mine} />;
    case 'contact':        return <ContactCard     msg={msg} mine={mine} />;
    case 'poll':           return <PollCard        msg={msg} mine={mine} />;
    case 'tracking':       return <TrackingCard    msg={msg} mine={mine} />;
    case 'kidnapping_info':return <KidnappingCard  msg={msg} mine={mine} />;
    case 'sos':            return <SOSCard         msg={msg} mine={mine} />;
    default:               return <TextBubble     msg={msg} mine={mine} isPriority={isPriority} />;
  }
}
