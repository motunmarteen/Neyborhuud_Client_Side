'use client';

/**
 * PostCard — the one card every post type uses (feed, profile, marketplace, events, ...).
 *
 * Same frame for all types (author, text, photos, actions), plus a detail block
 * that changes with the type so the important thing stands out:
 *
 *   post         text + photos
 *   fyi          📢 notice, "Helpful" instead of repost
 *   emergency    🚨 red edge, severity, Confirm / Not true / I'm safe / I'm nearby
 *   marketplace  🛒 big price, condition, delivery → Message seller
 *   job          💼 title, salary, type → Message to apply
 *   event        🎉 date tile, time, venue, going → I'm going
 *   services     🛠️ rate, areas → Book
 *   help_request 🙏 category, progress → I can help
 *
 * Presentational: data in, callbacks out. Follow, the ⋯ menu, share sheets and
 * reposting are wired by the screen that renders it.
 */

import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Pin,
  Repeat2,
  Share2,
  ThumbsUp,
  Users,
} from 'lucide-react';
import type { MediaItem, Post, PostAuthor } from '@/types/api';
import { Card } from '@/components/ui/Card';
import { Chip, type ChipTone } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { PostCardMediaSlider } from '@/components/feed/PostCardMediaSlider';
import { formatNaira } from '@/lib/currency';
import { renderFormattedText } from '@/lib/renderFormattedText';
import { resolveUserAvatarUrl } from '@/lib/userAvatar';

export type PostPrimaryAction = 'message_seller' | 'apply' | 'going' | 'book' | 'help';
export type EmergencyAction = 'confirm' | 'dispute' | 'safe' | 'nearby';

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
  /** Shown as "Follow" next to the name when provided. */
  onFollow?: () => void;
  isFollowing?: boolean;
  /** For events: whether the viewer is going (changes the button). */
  isGoing?: boolean;
};

// ── Small helpers ────────────────────────────────────────────────────────────

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

const CONDITION: Record<string, string> = { new: 'Brand new', used: 'Tokunbo (used)', refurbished: 'Refurbished', free: 'Free' };
const DELIVERY: Record<string, string> = { pickup: 'Pickup', delivery: 'Delivery', both: 'Pickup or delivery' };

type TypeMeta = { label: string; icon: string; tone: ChipTone };
const TYPE_META: Partial<Record<NonNullable<Post['contentType']>, TypeMeta>> = {
  fyi: { label: 'FYI', icon: '📢', tone: 'amber' },
  emergency: { label: 'Safety alert', icon: '🚨', tone: 'red' },
  marketplace: { label: 'For sale', icon: '🛒', tone: 'green' },
  job: { label: 'Job', icon: '💼', tone: 'blue' },
  event: { label: 'Event', icon: '🎉', tone: 'purple' },
  services: { label: 'Service', icon: '🛠️', tone: 'blue' },
  help_request: { label: 'Needs help', icon: '🙏', tone: 'red' },
  gossip: { label: 'Gist', icon: '💬', tone: 'neutral' },
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

// ── Type detail blocks ───────────────────────────────────────────────────────

function MarketplaceBlock({ post }: { post: Post }) {
  const m = post.metadata ?? {};
  const price = post.price ?? m.price;
  const condition = post.itemCondition ?? m.itemCondition;
  const delivery = post.deliveryOption ?? m.deliveryOption;
  const negotiable = post.isNegotiable ?? m.isNegotiable;
  const availability = post.availability ?? m.availability;
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
        {post.itemCategory ?? m.itemCategory ? <Chip>{cap(post.itemCategory ?? m.itemCategory)}</Chip> : null}
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
    `inline-flex min-h-10 items-center justify-center gap-1 rounded-full border px-3 text-[13px] font-bold transition-colors ${
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

const PRIMARY: Partial<Record<NonNullable<Post['contentType']>, { action: PostPrimaryAction; label: string }>> = {
  marketplace: { action: 'message_seller', label: 'Message seller' },
  job: { action: 'apply', label: 'Message to apply' },
  event: { action: 'going', label: "I'm going" },
  services: { action: 'book', label: 'Book' },
  help_request: { action: 'help', label: 'I can help' },
};

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
  onFollow,
  isFollowing,
  isGoing,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);

  const author = post.author as PostAuthor & { location?: { lga?: string } };
  const name = [author?.firstName, author?.lastName].filter(Boolean).join(' ') || author?.name || author?.username || 'Neighbour';
  const username = author?.username;
  const isAnonymous = !author?.id || author.id === 'anonymous';
  const avatar = resolveUserAvatarUrl(author);
  const area =
    (post.location as { lga?: string } | undefined)?.lga ||
    author?.location?.lga ||
    '';

  const type = post.contentType ?? 'post';
  const meta = TYPE_META[type];
  const primary = PRIMARY[type];
  const isEmergency = type === 'emergency' || post.cardStyle === 'emergency_red';
  const isFyi = type === 'fyi';

  const text = (post.content || post.body || '').trim();
  const isLong = text.length > 260;

  const media: Array<{ url: string; type?: MediaItem['type']; thumbnailUrl?: string }> = Array.isArray(post.media)
    ? post.media
        .map((m) => (typeof m === 'string' ? { url: m } : { url: m.url, type: m.type, thumbnailUrl: m.thumbnailUrl }))
        .filter((m) => Boolean(m.url))
    : [];

  const detail =
    type === 'marketplace' ? <MarketplaceBlock post={post} />
    : type === 'job' ? <JobBlock post={post} />
    : type === 'event' ? <EventBlock post={post} />
    : type === 'services' ? <ServiceBlock post={post} />
    : type === 'help_request' ? <HelpBlock post={post} />
    : isEmergency ? <EmergencyBlock post={post} onAction={onEmergencyAction} />
    : null;

  // Marketplace leads with the photo and price, like a listing; other types lead with the words.
  const photosFirst = type === 'marketplace';

  const handleCardClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (!t.closest('button, a, video, [role="button"]')) onCardClick?.();
  };

  const photos = media.length ? (
    <div className="mt-3">
      <PostCardMediaSlider items={media} altPrefix={text ? text.slice(0, 80) : `Post by ${name}`} />
    </div>
  ) : null;

  return (
    <Card
      variant={isEmergency ? 'accent' : 'plain'}
      accentColor="#E5484D"
      padding="none"
      className="w-full overflow-hidden"
      onClick={handleCardClick}
    >
      <article aria-label={`${meta ? meta.label + ' from' : 'Post from'} ${name}`}>
        {/* Top line: what kind of post, and pinned / reposted */}
        {meta || post.repostedBy || post.isPinned ? (
          <div className="flex min-w-0 items-center gap-2 px-4 pt-3 text-xs font-bold text-muted">
            {meta ? <Chip tone={meta.tone} icon={meta.icon}>{meta.label}</Chip> : null}
            {post.isPinned ? (
              <span className="inline-flex items-center gap-1">
                <Pin size={13} aria-hidden /> Pinned
              </span>
            ) : post.repostedBy ? (
              <span className="inline-flex min-w-0 items-center gap-1 truncate">
                <Repeat2 size={14} className="shrink-0" aria-hidden /> {post.repostedBy?.name || `@${post.repostedBy?.username}`} reposted
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Header */}
        <header className={`flex items-start gap-3 px-4 ${meta || post.repostedBy || post.isPinned ? 'pt-2.5' : 'pt-3.5'}`}>
          {isAnonymous || !username ? (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-background text-lg" aria-hidden>👤</span>
          ) : (
            <Link href={`/profile/${username}`} className="shrink-0" aria-label={`${name}'s profile`} onClick={(e) => e.stopPropagation()}>
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded-full bg-green-soft font-heading text-base font-extrabold text-brand-green-dark" aria-hidden>
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </Link>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1">
              <span className="truncate text-[15px] font-extrabold text-navy">{isAnonymous ? 'A neighbour' : name}</span>
              {author?.isVerified ? <BadgeCheck size={16} className="shrink-0 fill-primary text-white" aria-label="Verified" /> : null}
              {onFollow && !isFollowing && !isAnonymous ? (
                <>
                  <span className="text-faint" aria-hidden>·</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFollow();
                    }}
                    className="tap-target shrink-0 text-[13px] font-extrabold text-brand-green-dark hover:underline"
                  >
                    Follow
                  </button>
                </>
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

          <div className="flex shrink-0 items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMenu?.();
              }}
              aria-label="More options"
              aria-haspopup="menu"
              className="tap-target -mr-1.5 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-background hover:text-navy"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>
        </header>

        {/* Photos first for listings */}
        {photosFirst ? photos : null}

        {/* Detail block for listings sits right under the photo */}
        {photosFirst && detail ? <div className="px-4 pt-3">{detail}</div> : null}

        {/* Text */}
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

        {/* Main action for the type */}
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

        {/* Action row */}
        <footer className="mt-2 flex items-center justify-between border-t border-line px-2 py-1">
          <div className="flex items-center">
            <ActionButton label={post.isLiked ? 'Unlike' : 'Like'} count={compact(post.likes)} active={post.isLiked} activeClass="text-brand-red bg-red-soft" onClick={onLike}>
              <Heart size={19} className={post.isLiked ? 'fill-current' : ''} aria-hidden />
            </ActionButton>
            <ActionButton label="Comment" count={compact(post.comments)} activeClass="" onClick={onComment}>
              <MessageCircle size={19} aria-hidden />
            </ActionButton>
            {isFyi && onHelpful ? (
              <ActionButton
                label="Helpful"
                count={compact(post.helpfulCount as number | undefined)}
                active={!!post.isHelpful}
                activeClass="text-brand-green-dark bg-green-soft"
                onClick={onHelpful}
              >
                <ThumbsUp size={18} className={post.isHelpful ? 'fill-current' : ''} aria-hidden />
              </ActionButton>
            ) : onRepost ? (
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
