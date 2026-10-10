'use client';

/**
 * PostCard — the one card every post type uses (feed, profile, marketplace, events, ...).
 *
 * Same frame for all types (author, text, photo slider, actions). What a post is, is shown
 * by a small icon badge on the corner of the author's avatar (no extra space); only a
 * safety alert's badge pulses. A detail block and one main button change with the type:
 *
 *   post         text + photos
 *   fyi          📢 notice, "Helpful" instead of repost
 *   lost_found   🔎 lost / found item, last seen → I found it / It's mine
 *   poll         📊 options with live results → tap to vote
 *   emergency    🚨 severity, It's true / Not true / I'm safe / I'm nearby
 *   marketplace  🛒 big price, condition, delivery → Message seller
 *   job          💼 title, salary, type → Message to apply
 *   event        🎉 date tile, time, venue, going → I'm going
 *   services     🛠️ rate, areas → Book
 *   help_request 🙏 category, progress → I can help
 *
 * Presentational: data in, callbacks out. The screen that renders it wires follow,
 * the menu sheet, sharing, reposting and voting.
 */

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Bookmark,
  Check,
  Heart,
  Loader2,
  MapPin,
  MessageCircle,
  Pin,
  Repeat2,
  Share2,
  ThumbsUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type { MediaItem, Post, PostAuthor } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { Chip, type ChipTone } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { PhotoCarousel } from '@/components/feed/PhotoCarousel';
import { PostCardMenuIcon } from '@/components/feed/PostCardMenuIcon';
import { formatNaira } from '@/lib/currency';
import { renderFormattedText } from '@/lib/renderFormattedText';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

export type PostKind =
  | 'post'
  | 'fyi'
  | 'lost_found'
  | 'poll'
  | 'emergency'
  | 'marketplace'
  | 'job'
  | 'event'
  | 'services'
  | 'help_request'
  | 'gossip';

export type PostPrimaryAction = 'message_seller' | 'apply' | 'going' | 'book' | 'help' | 'found_it' | 'its_mine';
export type EmergencyAction = 'confirm' | 'dispute' | 'safe' | 'nearby';

/** Poll data on a post (metadata.poll). Feed polls still need server support — see REBUILD-TRACKER. */
export type PostPoll = {
  options: { text: string; votes: number }[];
  /** Index the viewer voted for, if any. */
  myVote?: number | null;
  endsAt?: string;
};

export type PostCardProps = {
  post: Post;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onRepost?: () => void;
  onHelpful?: () => void;
  onMenu?: () => void;
  onCardClick?: () => void;
  onPrimaryAction?: (action: PostPrimaryAction) => void;
  onEmergencyAction?: (action: EmergencyAction) => void;
  onVote?: (optionIndex: number) => void;
  /** Open the original post inside a repost-with-comment. */
  onOpenQuoted?: () => void;
  /** Shows the follow icon next to the name when provided (hidden on your own posts). */
  onFollow?: () => void;
  isFollowing?: boolean;
  followPending?: boolean;
  /** For events: whether the viewer is going (changes the button). */
  isGoing?: boolean;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const compact = (n?: number) => {
  if (!n) return '';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
};

export function shortTimeAgo(iso?: string | null): string {
  if (!iso) return '';
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/** Feed job salaries are typed in naira (free text), unlike prices which are kobo. */
function salaryText(raw: unknown): string | null {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim();
  const digits = s.replace(/,/g, '');
  if (/^\d+(\.\d+)?$/.test(digits)) return `₦${Math.round(Number(digits)).toLocaleString('en-NG')}`;
  return s;
}

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/[_-]+/g, ' ') : '');

export function getPostKind(post: Post): PostKind {
  const m = post.metadata ?? {};
  if (post.type === 'poll' || m.poll) return 'poll';
  if (post.contentType === 'fyi' && m.fyiType === 'lost_found') return 'lost_found';
  if (post.cardStyle === 'emergency_red') return 'emergency';
  return (post.contentType as PostKind) ?? 'post';
}

const CONDITION: Record<string, string> = { new: 'Brand new', used: 'Tokunbo (used)', refurbished: 'Refurbished', free: 'Free' };
const DELIVERY: Record<string, string> = { pickup: 'Pickup', delivery: 'Delivery', both: 'Pickup or delivery' };

/** Icon badge per type: what the post is, shown on the avatar corner. */
const KIND_BADGE: Partial<Record<PostKind, { icon: string; label: string; bg: string }>> = {
  fyi: { icon: '📢', label: 'FYI', bg: 'bg-amber-soft' },
  lost_found: { icon: '🔎', label: 'Lost and found', bg: 'bg-blue-soft' },
  poll: { icon: '📊', label: 'Poll', bg: 'bg-green-soft' },
  emergency: { icon: '🚨', label: 'Safety alert', bg: 'bg-red-soft' },
  marketplace: { icon: '🛒', label: 'For sale', bg: 'bg-green-soft' },
  job: { icon: '💼', label: 'Job', bg: 'bg-blue-soft' },
  event: { icon: '🎉', label: 'Event', bg: 'bg-purple-soft' },
  services: { icon: '🛠️', label: 'Service', bg: 'bg-blue-soft' },
  help_request: { icon: '🙏', label: 'Needs help', bg: 'bg-red-soft' },
  gossip: { icon: '💬', label: 'Gist', bg: 'bg-background' },
};

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-navy">
      <span className="mt-0.5 shrink-0 text-muted" aria-hidden>{icon}</span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}

function ActionButton({
  label,
  count,
  active,
  activeClass,
  onClick,
  children,
}: {
  label: string;
  count?: string;
  active?: boolean;
  activeClass: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={count ? `${label}, ${count}` : label}
      aria-pressed={active}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2.5 text-[13px] font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active ? activeClass : 'text-muted hover:bg-background hover:text-navy'
      }`}
    >
      {children}
      {count ? <span>{count}</span> : null}
    </button>
  );
}

type MediaEntry = { url: string; type?: MediaItem['type']; thumbnailUrl?: string };

// ── Type detail blocks ───────────────────────────────────────────────────────

function MarketplaceBlock({ post }: { post: Post }) {
  const m = post.metadata ?? {};
  const price = post.price ?? m.price;
  const condition = post.itemCondition ?? m.itemCondition;
  const delivery = post.deliveryOption ?? m.deliveryOption;
  const negotiable = post.isNegotiable ?? m.isNegotiable;
  const availability = post.availability ?? m.availability;
  const category = post.itemCategory ?? m.itemCategory;
  const isFree = condition === 'free' || price === 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-heading text-2xl font-black text-navy">{isFree ? 'Free' : price != null ? formatNaira(price) : 'Price on request'}</span>
        {negotiable && !isFree ? <span className="text-sm font-bold text-brand-green-dark">Negotiable</span> : null}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {availability === 'sold' ? <Chip tone="red">Sold</Chip> : availability === 'reserved' ? <Chip tone="amber">Reserved</Chip> : null}
        {condition && condition !== 'free' ? <Chip>{CONDITION[condition] ?? cap(condition)}</Chip> : null}
        {delivery ? <Chip>{DELIVERY[delivery] ?? cap(delivery)}</Chip> : null}
        {category ? <Chip>{cap(category)}</Chip> : null}
      </div>
    </div>
  );
}

function JobBlock({ post }: { post: Post }) {
  const m = post.metadata ?? {};
  const salary = salaryText(m.salary);
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-background p-3">
      {m.jobTitle ? <p className="font-heading text-lg font-extrabold leading-tight text-navy">{m.jobTitle}</p> : null}
      {salary ? (
        <p className="text-[15px] font-extrabold text-brand-green-dark">
          {salary}
          {/^₦/.test(salary) ? <span className="font-semibold text-muted"> / month</span> : null}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-1.5">
        {m.jobType ? <Chip tone="blue">{cap(m.jobType)}</Chip> : null}
        {m.workMode ? <Chip>{cap(m.workMode)}</Chip> : null}
      </div>
      {m.requirements ? <p className="text-sm text-muted">Needs: {m.requirements}</p> : null}
    </div>
  );
}

function EventBlock({ post }: { post: Post }) {
  const m = post.metadata ?? {};
  const dateIso = post.eventDate ?? m.eventDate;
  const time = post.eventTime ?? m.eventTime;
  const venue = post.venue ?? m.venue;
  const venueText = venue ? (typeof venue === 'object' ? [venue.name, venue.address].filter(Boolean).join(', ') : String(venue)) : '';
  const date = dateIso ? new Date(dateIso) : null;
  const ticket = post.ticketInfo ?? m.ticketInfo;
  const ticketPrice = post.ticketPrice ?? m.ticketPrice;
  const going = (post as { attendeesCount?: number }).attendeesCount ?? m.attendeesCount;

  return (
    <div className="flex items-stretch gap-3">
      {date ? (
        <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-purple-soft py-2 text-[#5E3BB8]" aria-hidden>
          <span className="text-[11px] font-black uppercase tracking-wide">{date.toLocaleDateString('en-NG', { month: 'short' })}</span>
          <span className="font-heading text-2xl font-black leading-none">{date.getDate()}</span>
        </div>
      ) : null}
      <div className="flex min-w-0 flex-col justify-center gap-1">
        {date ? (
          <p className="text-sm font-extrabold text-navy">
            {date.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}
            {time ? ` · ${time}` : ''}
          </p>
        ) : null}
        {venueText ? <InfoRow icon={<MapPin size={15} />}>{venueText}</InfoRow> : null}
        <div className="flex flex-wrap items-center gap-1.5">
          {ticket === 'paid' && ticketPrice ? <Chip tone="purple">{formatNaira(ticketPrice)}</Chip> : ticket ? <Chip tone="green">Free entry</Chip> : null}
          {typeof going === 'number' && going > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-muted">
              <Users size={13} aria-hidden /> {going} going
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ServiceBlock({ post }: { post: Post }) {
  const m = post.metadata ?? {};
  const rateSuffix = m.rateType === 'hourly' ? ' / hour' : m.rateType === 'flat' ? ' flat' : m.rateType ? ' per job' : '';
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-background p-3">
      {m.serviceName ? <p className="font-heading text-lg font-extrabold leading-tight text-navy">{m.serviceName}</p> : null}
      {m.rate != null ? (
        <p className="text-[15px] font-extrabold text-brand-green-dark">
          {formatNaira(m.rate)}
          <span className="font-semibold text-muted">{rateSuffix}</span>
        </p>
      ) : null}
      {m.serviceArea ? <InfoRow icon={<MapPin size={15} />}>Covers {m.serviceArea}</InfoRow> : null}
      <div className="flex flex-wrap gap-1.5">
        {m.availability ? <Chip tone={m.availability === 'available' ? 'green' : 'neutral'}>{cap(m.availability)}</Chip> : null}
        {m.serviceCategory ? <Chip>{cap(m.serviceCategory)}</Chip> : null}
      </div>
    </div>
  );
}

function HelpBlock({ post }: { post: Post }) {
  const m = post.metadata ?? {};
  const cat = post.helpCategory ?? m.helpCategory;
  const target = post.targetAmount ?? m.targetAmount;
  const received = post.amountReceived ?? m.amountReceived ?? 0;
  const pct = target ? Math.min(100, Math.round((received / target) * 100)) : null;
  return (
    <div className="flex flex-col gap-2">
      {cat ? <div><Chip tone="red">{cap(cat)}</Chip></div> : null}
      {target ? (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-red-soft" role="progressbar" aria-valuenow={pct ?? 0} aria-valuemin={0} aria-valuemax={100} aria-label="Raised so far">
            <div className="h-full rounded-full bg-brand-red" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs font-bold text-muted">
            {formatNaira(received)} raised of {formatNaira(target)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Server shape: metadata.lostFound (see /api/v1/lost-found). HuudCredit pledges only, never cash. */
export type LostFoundMeta = {
  kind: 'lost' | 'found';
  itemName: string;
  category?: string;
  place?: string;
  seenAt?: string;
  pledge?: number;
  pledgeStatus?: 'none' | 'held' | 'assigned' | 'released' | 'refunded';
  status?: 'open' | 'matched' | 'returned' | 'closed';
};

const lostFoundOf = (post: Post) => (post.metadata?.lostFound ?? null) as LostFoundMeta | null;

function seenWhen(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  const yesterday = new Date(today.getTime() - 864e5).toDateString() === d.toDateString();
  const time = d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true });
  if (sameDay) return `Today, ${time}`;
  if (yesterday) return `Yesterday, ${time}`;
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

function LostFoundBlock({ post }: { post: Post }) {
  const lf = lostFoundOf(post);
  if (!lf) return null;
  const isFound = lf.kind === 'found';
  const done = lf.status === 'returned';
  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-background p-3">
      <div className="flex items-center gap-2">
        {done ? <Chip tone="green" icon="✓">Returned</Chip> : <Chip tone={isFound ? 'green' : 'amber'}>{isFound ? 'Found' : 'Lost'}</Chip>}
        <p className="min-w-0 truncate font-heading text-lg font-extrabold text-navy">{lf.itemName}</p>
      </div>
      {lf.place ? (
        <InfoRow icon={<MapPin size={15} />}>
          {isFound ? 'Found at' : 'Last seen'} {lf.place}
          {lf.seenAt ? <span className="text-muted"> · {seenWhen(lf.seenAt)}</span> : null}
        </InfoRow>
      ) : null}
      {!done && lf.pledge && lf.pledgeStatus === 'held' ? (
        <p className="text-sm font-extrabold text-amber-ink">🪙 {lf.pledge} HuudCredit thank-you for whoever returns it</p>
      ) : null}
      {!done ? <p className="text-xs text-muted">{isFound ? 'To claim it, describe something only the owner would know.' : 'Returned items earn the finder 50 HuudCredit.'}</p> : null}
    </div>
  );
}

function PollBlock({ poll, onVote }: { poll: PostPoll; onVote?: (i: number) => void }) {
  const total = poll.options.reduce((s, o) => s + o.votes, 0);
  const ended = poll.endsAt ? new Date(poll.endsAt).getTime() < Date.now() : false;
  const showResults = ended || poll.myVote != null;
  const left = poll.endsAt && !ended ? Math.ceil((new Date(poll.endsAt).getTime() - Date.now()) / 864e5) : null;
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Poll">
      {poll.options.map((o, i) => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0;
        const mine = poll.myVote === i;
        return showResults ? (
          <div key={i} className="relative min-h-11 overflow-hidden rounded-2xl border border-line">
            <div className={`absolute inset-y-0 left-0 ${mine ? 'bg-green-soft' : 'bg-background'}`} style={{ width: `${pct}%` }} aria-hidden />
            <div className="relative flex min-h-11 items-center justify-between gap-2 px-3.5 text-sm">
              <span className={`flex items-center gap-1.5 ${mine ? 'font-extrabold text-brand-green-dark' : 'font-semibold text-navy'}`}>
                {mine ? <Check size={15} aria-label="Your vote" /> : null}
                {o.text}
              </span>
              <span className="font-extrabold tabular-nums text-navy">{pct}%</span>
            </div>
          </div>
        ) : (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onVote?.(i);
            }}
            className="min-h-11 rounded-2xl border border-line bg-white px-3.5 text-left text-sm font-bold text-navy transition-colors hover:border-primary hover:bg-green-soft"
          >
            {o.text}
          </button>
        );
      })}
      <p className="text-xs font-bold text-muted">
        {total.toLocaleString('en-NG')} {total === 1 ? 'vote' : 'votes'}
        {ended ? ' · Poll closed' : left != null ? ` · ${left} ${left === 1 ? 'day' : 'days'} left` : ''}
      </p>
    </div>
  );
}

const SEVERITY: Record<string, { label: string; tone: ChipTone }> = {
  critical: { label: 'Critical', tone: 'red' },
  medium: { label: 'Serious', tone: 'amber' },
  low: { label: 'Low', tone: 'neutral' },
};

function EmergencyBlock({ post, onAction }: { post: Post; onAction?: (a: EmergencyAction) => void }) {
  const sev = SEVERITY[post.severity ?? ''] ?? null;
  const confirmed = post.confirmDisputeAction === 'confirm';
  const disputed = post.confirmDisputeAction === 'dispute';
  const btn = (on: boolean) =>
    `inline-flex min-h-11 items-center justify-center gap-1 rounded-full border px-3 text-[13px] font-bold transition-colors ${
      on ? 'border-transparent bg-navy text-white' : 'border-line bg-white text-navy hover:bg-background'
    }`;
  const fire = (a: EmergencyAction) => (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction?.(a);
  };
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {sev ? <Chip tone={sev.tone}>{sev.label}</Chip> : null}
        {post.emergencyType ? <Chip>{cap(post.emergencyType)}</Chip> : null}
        {post.verificationStatus === 'community_confirmed' ? <Chip tone="green" icon="✓">Neighbours confirmed</Chip> : null}
      </div>
      <p className="text-xs font-bold text-muted">Are you around there? Help your neighbours know wetin dey happen.</p>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={fire('confirm')} aria-pressed={confirmed} className={btn(confirmed)}>✓ It&apos;s true</button>
        <button type="button" onClick={fire('dispute')} aria-pressed={disputed} className={btn(disputed)}>✗ Not true</button>
        <button type="button" onClick={fire('safe')} aria-pressed={!!post.isSafe} className={btn(!!post.isSafe)}>🙋🏾 I&apos;m safe</button>
        <button type="button" onClick={fire('nearby')} aria-pressed={!!post.isNearby} className={btn(!!post.isNearby)}>📍 I&apos;m nearby</button>
      </div>
    </div>
  );
}

/** One-line summary of what a post is, for the framed original inside a repost. */
function quotedSummary(post: Post, kind: PostKind): string | null {
  const m = post.metadata ?? {};
  switch (kind) {
    case 'marketplace': {
      const price = post.price ?? m.price;
      return price != null ? `For sale · ${formatNaira(price)}` : 'For sale';
    }
    case 'job': return [m.jobTitle, salaryText(m.salary)].filter(Boolean).join(' · ') || 'Job';
    case 'event': {
      const d = post.eventDate ?? m.eventDate;
      return d ? `Event · ${new Date(d).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })}` : 'Event';
    }
    case 'services': return m.serviceName ? `Service · ${m.serviceName}` : 'Service';
    case 'lost_found': {
      const lf = lostFoundOf(post);
      return lf ? `${lf.kind === 'found' ? 'Found' : 'Lost'} · ${lf.itemName}` : 'Lost & Found';
    }
    case 'emergency': return 'Safety alert';
    case 'poll': return 'Poll';
    default: return null;
  }
}

function QuotedPost({ post, onOpen }: { post: Post; onOpen?: () => void }) {
  const a = post.author as PostAuthor;
  const name = [a?.firstName, a?.lastName].filter(Boolean).join(' ') || a?.name || a?.username || 'Neighbour';
  const kind = getPostKind(post);
  const badge = KIND_BADGE[kind];
  const summary = quotedSummary(post, kind);
  const text = (post.content || post.body || '').trim();
  const first = Array.isArray(post.media) && post.media.length ? (typeof post.media[0] === 'string' ? post.media[0] : post.media[0].thumbnailUrl || post.media[0].url) : null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen?.();
      }}
      className="block w-full overflow-hidden rounded-2xl border border-line text-left transition-colors hover:bg-[#F6F8FB]"
      aria-label={`Original post by ${name}`}
    >
      <div className="flex items-center gap-2 px-3 pt-2.5 text-[13px]">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-green-soft text-[11px] font-extrabold text-brand-green-dark" aria-hidden>{name.charAt(0).toUpperCase()}</span>
        <span className="truncate font-extrabold text-navy">{name}</span>
        {badge ? <span aria-label={badge.label} role="img" className="shrink-0">{badge.icon}</span> : null}
        <span className="shrink-0 text-muted">· {shortTimeAgo(post.createdAt)}</span>
      </div>
      {summary ? (
        <p className={`px-3 pt-1 text-[13px] font-extrabold ${kind === 'emergency' ? 'text-[#C2353A]' : 'text-brand-green-dark'}`}>{summary}</p>
      ) : null}
      {text ? <p className="line-clamp-3 px-3 pt-1 text-sm leading-snug text-navy">{text}</p> : null}
      {first ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={first} alt="" loading="lazy" className="mt-2.5 aspect-[16/9] w-full object-cover" />
      ) : (
        <span className="block h-2.5" aria-hidden />
      )}
    </button>
  );
}

function primaryFor(kind: PostKind, post: Post): { action: PostPrimaryAction; label: string } | null {
  switch (kind) {
    case 'marketplace': return { action: 'message_seller', label: 'Message seller' };
    case 'job': return { action: 'apply', label: 'Message to apply' };
    case 'event': return { action: 'going', label: "I'm going" };
    case 'services': return { action: 'book', label: 'Book' };
    case 'help_request': return { action: 'help', label: 'I can help' };
    case 'lost_found': {
      const lf = lostFoundOf(post);
      if (!lf || lf.status === 'returned' || lf.status === 'closed') return null;
      return lf.kind === 'found'
        ? { action: 'its_mine', label: "It's mine" }
        : { action: 'found_it', label: 'I have it / I saw it' };
    }
    default: return null;
  }
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function PostCard({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
  onRepost,
  onHelpful,
  onMenu,
  onCardClick,
  onPrimaryAction,
  onEmergencyAction,
  onVote,
  onOpenQuoted,
  onFollow,
  isFollowing,
  followPending,
  isGoing,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);

  const author = post.author as PostAuthor & { location?: { lga?: string } };
  const name = [author?.firstName, author?.lastName].filter(Boolean).join(' ') || author?.name || author?.username || 'Neighbour';
  const username = author?.username;
  const isAnonymous = !author?.id || author.id === 'anonymous';
  const avatar = resolveUserAvatarUrl(author);
  const area = (post.location as { lga?: string } | undefined)?.lga || author?.location?.lga || '';

  const kind = getPostKind(post);
  const badge = KIND_BADGE[kind];
  const primary = primaryFor(kind, post);
  const isEmergency = kind === 'emergency';
  const helpfulKind = kind === 'fyi' || kind === 'lost_found';
  const poll = (post.metadata?.poll as PostPoll | undefined) ?? null;

  const text = (post.content || post.body || '').trim();
  const isLong = text.length > 260;

  const media: MediaEntry[] = Array.isArray(post.media)
    ? post.media
        .map((m) => (typeof m === 'string' ? { url: m } : { url: m.url, type: m.type, thumbnailUrl: m.thumbnailUrl }))
        .filter((m) => Boolean(m.url))
    : [];

  const detail =
    kind === 'marketplace' ? <MarketplaceBlock post={post} />
    : kind === 'job' ? <JobBlock post={post} />
    : kind === 'event' ? <EventBlock post={post} />
    : kind === 'services' ? <ServiceBlock post={post} />
    : kind === 'help_request' ? <HelpBlock post={post} />
    : kind === 'lost_found' ? <LostFoundBlock post={post} />
    : kind === 'poll' && poll ? <PollBlock poll={poll} onVote={onVote} />
    : isEmergency ? <EmergencyBlock post={post} onAction={onEmergencyAction} />
    : null;

  // Listings lead with the photo and price; everything else leads with the words.
  const photosFirst = kind === 'marketplace';

  const handleCardClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!t.closest('button, a, video, [role="button"]')) onCardClick?.();
  };

  const photos = media.length ? (
    <div className="mt-3">
      <PhotoCarousel items={media} alt={text ? text.slice(0, 80) : `Post by ${name}`} />
    </div>
  ) : null;

  const avatarEl = isAnonymous || !username ? (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-background text-lg" aria-hidden>👤</span>
  ) : avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
  ) : (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-green-soft font-heading text-base font-extrabold text-brand-green-dark" aria-hidden>
      {name.charAt(0).toUpperCase()}
    </span>
  );

  return (
    <Card padding="none" className="w-full overflow-hidden" onClick={handleCardClick}>
      <article aria-label={`${badge ? badge.label + ' from' : 'Post from'} ${isAnonymous ? 'a neighbour' : name}`}>
        {/* Pinned / reposted line */}
        {post.isPinned || post.repostedBy ? (
          <div className="flex min-w-0 items-center gap-1.5 px-4 pt-3 text-xs font-bold text-muted">
            {post.isPinned ? (
              <>
                <Pin size={13} aria-hidden /> Pinned
              </>
            ) : (
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <Repeat2 size={14} className="shrink-0" aria-hidden /> {post.repostedBy?.name || `@${post.repostedBy?.username}`} reposted
              </span>
            )}
          </div>
        ) : null}

        {/* Header */}
        <header className={`flex items-start gap-3 px-4 ${post.isPinned || post.repostedBy ? 'pt-2' : 'pt-3.5'}`}>
          <div className="relative shrink-0">
            {isAnonymous || !username ? (
              avatarEl
            ) : (
              <Link href={`/profile/${username}`} className="block" aria-label={`${name}'s profile`} onClick={(e) => e.stopPropagation()}>
                {avatarEl}
              </Link>
            )}
            {/* What this post is: icon badge on the avatar corner (takes no space in the card) */}
            {badge ? (
              <span className="absolute -bottom-1 -right-1.5 grid h-[22px] w-[22px] place-items-center" title={badge.label}>
                {isEmergency ? (
                  <span className="absolute inset-0 rounded-full bg-brand-red/50 motion-safe:animate-ping" aria-hidden />
                ) : null}
                <span className={`relative grid h-[22px] w-[22px] place-items-center rounded-full text-[12px] leading-none ring-2 ring-white ${badge.bg}`} aria-label={badge.label} role="img">
                  {badge.icon}
                </span>
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate text-[15px] font-extrabold text-navy">{isAnonymous ? 'A neighbour' : name}</span>
              {author?.isVerified ? <BadgeCheck size={16} className="shrink-0 fill-primary text-white" aria-label="Verified" /> : null}
              {onFollow && !isAnonymous ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFollow();
                  }}
                  disabled={followPending}
                  aria-label={isFollowing ? `Following ${name}. Tap to unfollow` : `Follow ${name}`}
                  aria-pressed={!!isFollowing}
                  className={`tap-target ml-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-50 ${
                    isFollowing ? 'text-brand-green-dark hover:text-brand-red' : 'text-muted hover:bg-background hover:text-navy'
                  }`}
                >
                  {followPending ? (
                    <Loader2 className="h-[17px] w-[17px] motion-safe:animate-spin" strokeWidth={1.75} aria-hidden />
                  ) : isFollowing ? (
                    <UserCheck className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
                  ) : (
                    <UserPlus className="h-[17px] w-[17px]" strokeWidth={1.75} aria-hidden />
                  )}
                </button>
              ) : null}
            </div>
            <p className="flex min-w-0 items-center gap-1 text-[13px] text-muted">
              {username && !isAnonymous ? <span className="truncate">@{username}</span> : null}
              {username && !isAnonymous ? <span aria-hidden>·</span> : null}
              <time dateTime={post.createdAt} className="shrink-0">{shortTimeAgo(post.createdAt)}</time>
              {area ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="inline-flex min-w-0 items-center gap-0.5 truncate">
                    <MapPin size={12} className="shrink-0" aria-hidden />
                    {area}
                  </span>
                </>
              ) : null}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onMenu?.();
            }}
            aria-label="More options"
            aria-haspopup="menu"
            className="tap-target -mr-1.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-background hover:text-navy"
          >
            <PostCardMenuIcon className="h-5 w-5" />
          </button>
        </header>

        {photosFirst ? photos : null}
        {photosFirst && detail ? <div className="px-4 pt-3">{detail}</div> : null}

        {text ? (
          <div className="px-4 pt-2.5">
            <div className={`whitespace-pre-wrap break-words text-[15px] leading-[1.5] text-navy ${!expanded && isLong ? 'line-clamp-5' : ''}`}>
              {renderFormattedText(text, { stopPropagation: true })}
            </div>
            {isLong ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                className="mt-1 text-sm font-extrabold text-brand-green-dark hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            ) : null}
          </div>
        ) : null}

        {!photosFirst && detail ? <div className="px-4 pt-3">{detail}</div> : null}
        {!photosFirst ? photos : null}

        {/* Repost with comment: the original sits inside as a small framed card */}
        {post.quotedPost ? (
          <div className="px-4 pt-3">
            <QuotedPost post={post.quotedPost} onOpen={onOpenQuoted ?? onCardClick} />
          </div>
        ) : null}

        {primary && onPrimaryAction ? (
          <div className="px-4 pt-3">
            <Button
              variant={primary.action === 'going' && isGoing ? 'secondary' : 'soft'}
              fullWidth
              onClick={(e) => {
                e.stopPropagation();
                onPrimaryAction(primary.action);
              }}
            >
              {primary.action === 'going' && isGoing ? '✓ You’re going' : primary.label}
            </Button>
          </div>
        ) : null}

        <footer className="mt-2 flex items-center justify-between border-t border-line px-2 py-1">
          <div className="flex items-center">
            {/* One reaction per card: notices (FYI, lost & found) get "Helpful", everything else "Like". */}
            {helpfulKind && onHelpful ? (
              <ActionButton
                label="Helpful"
                count={compact(post.helpfulCount as number | undefined)}
                active={!!post.isHelpful}
                activeClass="text-brand-green-dark bg-green-soft"
                onClick={onHelpful}
              >
                <ThumbsUp size={18} className={post.isHelpful ? 'fill-current' : ''} aria-hidden />
              </ActionButton>
            ) : (
              <ActionButton label={post.isLiked ? 'Unlike' : 'Like'} count={compact(post.likes)} active={post.isLiked} activeClass="text-brand-red bg-red-soft" onClick={onLike}>
                <Heart size={19} className={post.isLiked ? 'fill-current' : ''} aria-hidden />
              </ActionButton>
            )}
            <ActionButton label="Comment" count={compact(post.comments)} activeClass="" onClick={onComment}>
              <MessageCircle size={19} aria-hidden />
            </ActionButton>
            {onRepost ? (
              <ActionButton label="Repost" count={compact(post.shares)} active={post.isShared} activeClass="text-brand-green-dark bg-green-soft" onClick={onRepost}>
                <Repeat2 size={19} aria-hidden />
              </ActionButton>
            ) : null}
          </div>
          <div className="flex items-center">
            <ActionButton label={post.isSaved ? 'Saved' : 'Save'} active={post.isSaved} activeClass="text-brand-green-dark bg-green-soft" onClick={onSave}>
              <Bookmark size={19} className={post.isSaved ? 'fill-current' : ''} aria-hidden />
            </ActionButton>
            <ActionButton label="Share" activeClass="" onClick={onShare}>
              <Share2 size={18} aria-hidden />
            </ActionButton>
          </div>
        </footer>
      </article>
    </Card>
  );
}
