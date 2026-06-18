"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import type { DiscoveryFeedItem } from "@/lib/feedDiscoveryMerge";
import type { Post, Service, Event, Job, User } from "@/types/api";
import type { RssArticle } from "@/types/incident";
import type { Product } from "@/services/marketplace.service";
import { formatTimeAgo } from "@/utils/timeAgo";
import { formatDistance, haversineDistance } from "@/utils/distance";
import { useFollow } from "@/hooks/useFollow";
import MapPinAvatar from "@/components/ui/MapPinAvatar";
import { GREEN_ROLE } from "@/lib/green-scale";

export type FeedDiscoveryItem = Extract<
  DiscoveryFeedItem,
  { _type: "discovery_marketplace" } | { _type: "discovery_event" } | { _type: "discovery_job" } | { _type: "discovery_help" } | { _type: "discovery_services" } | { _type: "discovery_news" } | { _type: "discovery_neighbors" }
>;

interface FeedDiscoveryBlockProps {
  item: FeedDiscoveryItem;
  userLocation: { lat: number; lng: number } | null;
  currentUserId: string | null;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunked: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunked.push(arr.slice(i, i + size));
  }
  return chunked;
}

function formatConditionWords(condition?: string) {
  if (!condition) return "";
  return condition
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatConditionLabel(condition?: string) {
  const w = formatConditionWords(condition);
  return w ? w.toUpperCase() : "";
}

function formatEventDate(d: string) {
  return new Date(d).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatSalary(job: Job) {
  if (!job.salary || (!job.salary.min && !job.salary.max)) return null;
  const { min, max, currency, period } = job.salary;
  const sym = currency === "NGN" ? "₦" : currency;
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
      ? `${(n / 1000).toFixed(0)}k`
      : n.toLocaleString();
  return `${sym}${fmt(min)} – ${fmt(max)} / ${period}`;
}

/* ── Section chrome — header bar above a horizontal carousel ── */
function DiscoveryChrome({
  icon,
  label,
  subtitle,
  href,
  children,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  href?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-[#121b14] border-b border-black/[0.06] dark:border-white/[0.06] overflow-hidden w-full max-w-none mx-auto">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <span className="material-symbols-outlined text-[16px] font-black">{icon}</span>
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold text-[var(--neu-text)] dark:text-white leading-tight">{label}</p>
          </div>
        </div>
        {href && (
          <Link href={href} className="text-[12px] font-bold text-[var(--neu-text-muted)] dark:text-white/50 hover:text-primary transition-colors">
            View All
          </Link>
        )}
      </div>
      <div className="px-3 pb-3">
        {children}
      </div>
    </div>
  );
}

/* ── Stake-style card: full-bleed image with overlaid content ── */
function StakeCard({
  href,
  imageSrc,
  imageAlt,
  fallbackIcon,
  fallbackGradient,
  topBadge,
  title,
  subtitle,
  statDot,
  statText,
  aspectClass = "aspect-[4/5]",
}: {
  href: string;
  imageSrc?: string | null;
  imageAlt?: string;
  fallbackIcon?: string;
  fallbackGradient?: string;
  topBadge?: ReactNode;
  title: string;
  subtitle?: string;
  statDot?: string;
  statText?: string;
  aspectClass?: string;
}) {
  const [imgErr, setImgErr] = useState(false);
  const hasImage = imageSrc && !imgErr;

  return (
    <Link
      href={href}
      className="horizontal-carousel-item group/stake relative block overflow-hidden rounded-2xl shrink-0 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{ width: 160 }}
    >
      <div className={`relative w-full ${aspectClass} overflow-hidden`}>
        {hasImage ? (
          <Image
            src={imageSrc}
            alt={imageAlt || title}
            fill
            sizes="160px"
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover/stake:scale-[1.06]"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: fallbackGradient || "linear-gradient(135deg, #1a2a1e 0%, #0d1a10 100%)" }}
          >
            <span className="material-symbols-outlined text-4xl text-white/25">
              {fallbackIcon || "image"}
            </span>
          </div>
        )}

        {/* Gradient overlay for text readability */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top badge */}
        {topBadge && (
          <div className="absolute left-2 top-2 z-10">
            {topBadge}
          </div>
        )}

        {/* Bottom overlaid content */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 space-y-0.5">
          <h4 className="text-[13px] font-extrabold text-white leading-tight line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {title}
          </h4>
          {subtitle && (
            <p className="text-[10px] font-semibold text-white/65 uppercase tracking-wide leading-tight truncate">
              {subtitle}
            </p>
          )}
          {statText && (
            <div className="flex items-center gap-1 pt-0.5">
              {statDot && (
                <span className="inline-block w-[6px] h-[6px] rounded-full" style={{ backgroundColor: statDot }} />
              )}
              <span className="text-[10px] font-medium text-white/55">{statText}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ── Category cover card — vibrant gradient with illustration ── */
function CategoryCoverCard({
  imageSrc,
  title,
  subtitle,
  buttonLabel,
  buttonHref,
  gradient,
}: {
  imageSrc: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonHref: string;
  gradient?: string;
}) {
  return (
    <Link
      href={buttonHref}
      className="horizontal-carousel-item group/cover relative block overflow-hidden rounded-2xl shrink-0 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
      style={{ width: 160 }}
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden" style={{ background: gradient || "linear-gradient(135deg, #0e4a1f 0%, #1a8a3e 50%, #00d431 100%)" }}>
        {/* Illustration image centered */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <Image
            src={imageSrc}
            alt={title}
            width={120}
            height={120}
            loading="lazy"
            className="w-full h-full object-contain drop-shadow-lg transition-transform duration-500 group-hover/cover:scale-110"
          />
        </div>

        {/* Gradient overlay for text */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Bottom content */}
        <div className="absolute inset-x-0 bottom-0 z-10 p-2.5 space-y-1">
          <h4 className="text-[13px] font-extrabold text-white leading-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
            {title}
          </h4>
          <p className="text-[9px] font-bold text-white/60 uppercase tracking-wider leading-tight truncate">
            {subtitle}
          </p>
          <span className="inline-block mt-1 px-3 py-1 bg-primary hover:bg-brand-green-dark text-black text-[10px] font-black rounded-lg text-center transition-all shadow-sm">
            {buttonLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ── People / Neighbor Follow Card ── */
function NeighborFollowCard({ user, currentUserId }: { user: User; currentUserId: string | null }) {
  const userId = user.id || (user as any)._id;
  const isOwnProfile = currentUserId === userId;
  const { isFollowing, toggleFollow, isPending } = useFollow(userId, { enabled: !isOwnProfile && !!currentUserId });
  const displayName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.username || "Neighbor";
  const userInitial = displayName[0]?.toUpperCase() || "U";

  return (
    <div
      className="horizontal-carousel-item group relative flex flex-col items-center overflow-hidden rounded-2xl shrink-0 p-3 bg-black/[0.02] dark:bg-[#18231c] border border-black/[0.06] dark:border-white/[0.06] transition-transform duration-200 hover:scale-[1.02]"
      style={{ width: 140 }}
    >
      <Link href={`/profile/${user.username}`} className="flex flex-col items-center w-full">
        <MapPinAvatar
          src={user.profilePicture || user.avatarUrl}
          alt={displayName}
          fallbackInitial={userInitial}
          size="lg"
        />
        <h4 className="mt-2.5 text-[12px] font-extrabold text-[var(--neu-text)] dark:text-white leading-tight truncate w-full text-center">
          {displayName}
        </h4>
        <p className="text-[10px] font-medium text-[var(--neu-text-muted)] dark:text-white/60 truncate w-full text-center">
          @{user.username}
        </p>
      </Link>

      {!isOwnProfile && (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (currentUserId) {
              toggleFollow();
            }
          }}
          disabled={isPending || !currentUserId}
          className={`mt-3 w-full py-1.5 rounded-full text-[11px] font-black transition-all ${
            isFollowing
              ? "border border-black/[0.08] dark:border-white/[0.08] text-[var(--neu-text-muted)] dark:text-white/60 hover:bg-brand-red/10 hover:text-brand-red hover:border-brand-red"
              : "bg-primary text-black hover:bg-brand-green-dark"
          } disabled:opacity-50`}
        >
          {isPending ? "..." : isFollowing ? "Following" : "Follow"}
        </button>
      )}
    </div>
  );
}

export function FeedDiscoveryBlock({ item, userLocation, currentUserId }: FeedDiscoveryBlockProps) {
  if (item._type === "discovery_marketplace") {
    const { products } = item;

    return (
      <DiscoveryChrome
        icon="storefront"
        label="Marketplace"
        href="/marketplace"
      >
        <div className="horizontal-carousel items-start">
          <CategoryCoverCard
            imageSrc="/illustration_marketplace.png"
            title="Local Market"
            subtitle="Trade with neighbors"
            buttonLabel="Shop Now"
            buttonHref="/marketplace"
            gradient="linear-gradient(135deg, #1a4a28 0%, #0d8a3e 50%, #00c431 100%)"
          />
          {products.map((p) => {
            const id = p.id || (p as { _id?: string })._id;
            const distanceLabel =
              userLocation && p.location?.latitude != null && p.location?.longitude != null
                ? formatDistance(
                    haversineDistance(
                      userLocation.lat,
                      userLocation.lng,
                      p.location.latitude,
                      p.location.longitude,
                    ),
                  )
                : null;
            const formattedPrice = new Intl.NumberFormat("en-NG", {
              style: "currency",
              currency: p.currency || "NGN",
              minimumFractionDigits: 0,
            }).format(p.price);

            return (
              <StakeCard
                key={String(id)}
                href={`/marketplace?product=${encodeURIComponent(String(id))}`}
                imageSrc={p.images?.[0]}
                imageAlt={p.title}
                fallbackIcon="storefront"
                fallbackGradient="linear-gradient(135deg, #0e2a18 0%, #1a3a22 100%)"
                topBadge={
                  p.condition ? (
                    <span className="rounded-full bg-black/50 px-2 py-0.5 text-[8px] font-black uppercase text-white/90 backdrop-blur-sm border border-white/10">
                      {formatConditionLabel(p.condition)}
                    </span>
                  ) : undefined
                }
                title={p.title}
                subtitle={formattedPrice}
                statDot={GREEN_ROLE.brand}
                statText={distanceLabel ? `${distanceLabel} away` : undefined}
              />
            );
          })}
        </div>
      </DiscoveryChrome>
    );
  }

  if (item._type === "discovery_event") {
    const ev = item.data;
    const eventId = ev.id ?? (ev as any)._id;

    return (
      <DiscoveryChrome
        icon="event"
        label="Events"
        href="/events"
      >
        <div className="horizontal-carousel items-start">
          <CategoryCoverCard
            imageSrc="/illustration_events.png"
            title="Huud Gatherings"
            subtitle="Connect locally"
            buttonLabel="All Events"
            buttonHref="/events"
            gradient="linear-gradient(135deg, #1a2a4a 0%, #2a4a8a 50%, #1a56ff 100%)"
          />
          <StakeCard
            href={`/events/${eventId}`}
            imageSrc={ev.coverImage}
            imageAlt={ev.title}
            fallbackIcon="event"
            fallbackGradient="linear-gradient(135deg, #1a2a4a 0%, #2a4a8a 100%)"
            topBadge={
              <span className="rounded-full bg-brand-blue/80 px-2 py-0.5 text-[8px] font-black uppercase text-white/90 backdrop-blur-sm">
                {ev.type}
              </span>
            }
            title={ev.title}
            subtitle={formatEventDate(ev.startDate)}
            statDot="#1A56FF"
            statText={ev.attendeesCount != null ? `${ev.attendeesCount} going` : ev.venue || undefined}
          />
        </div>
      </DiscoveryChrome>
    );
  }

  if (item._type === "discovery_job") {
    const job = item.data;
    const jobId = job.id ?? (job as any)._id;
    const employerName = job.employer
      ? [job.employer.firstName, job.employer.lastName].filter(Boolean).join(" ") ||
        job.employer.username
      : null;
    const salary = formatSalary(job);

    return (
      <DiscoveryChrome
        icon="work"
        label="Jobs"
        href="/jobs"
      >
        <div className="horizontal-carousel items-start">
          <CategoryCoverCard
            imageSrc="/illustration_jobs.png"
            title="Local Careers"
            subtitle="Work nearby"
            buttonLabel="Browse Jobs"
            buttonHref="/jobs"
            gradient="linear-gradient(135deg, #2a1a4a 0%, #6a3a9a 50%, #9a5acf 100%)"
          />
          <StakeCard
            href={`/jobs/${jobId}`}
            fallbackIcon="work"
            fallbackGradient="linear-gradient(135deg, #2a1a4a 0%, #4a2a7a 100%)"
            topBadge={
              <span className="rounded-full bg-primary/80 px-2 py-0.5 text-[8px] font-black uppercase text-white backdrop-blur-sm">
                {job.type.replace("-", " ")}
              </span>
            }
            title={job.title}
            subtitle={salary || employerName || undefined}
            statDot={GREEN_ROLE.brand}
            statText={
              (job.location?.lga || job.location?.state)
                ? [job.location?.lga, job.location?.state].filter(Boolean).join(", ")
                : undefined
            }
          />
        </div>
      </DiscoveryChrome>
    );
  }

  if (item._type === "discovery_help") {
    const { requests } = item;

    return (
      <DiscoveryChrome icon="volunteer_activism" label="Help Needed" href="/help-request">
        <div className="horizontal-carousel items-start">
          <CategoryCoverCard
            imageSrc="/illustration_help.png"
            title="Community Help"
            subtitle="Support neighbors"
            buttonLabel="View Requests"
            buttonHref="/help-request"
            gradient="linear-gradient(135deg, #4a1a1a 0%, #8a2a2a 50%, #cc3333 100%)"
          />
          {requests.map(req => (
            <StakeCard
              key={req.id}
              href={`/help-request/${req.id}`}
              imageSrc={req.author?.avatarUrl}
              fallbackIcon="volunteer_activism"
              fallbackGradient="linear-gradient(135deg, #3a1a1a 0%, #5a2a2a 100%)"
              topBadge={
                <span className="rounded-full bg-brand-red/80 px-2 py-0.5 text-[8px] font-black uppercase text-white backdrop-blur-sm">
                  Help
                </span>
              }
              title={req.content?.slice(0, 60) || "Help needed"}
              subtitle={req.author?.name || "Neighbor"}
              statDot="#FF0000"
              statText={formatTimeAgo(req.createdAt)}
            />
          ))}
        </div>
      </DiscoveryChrome>
    );
  }

  if (item._type === "discovery_services") {
    const { services } = item;

    return (
      <DiscoveryChrome icon="handyman" label="Local Services" href="/services">
        <div className="horizontal-carousel items-start">
          <CategoryCoverCard
            imageSrc="/illustration_services.png"
            title="Local Pros"
            subtitle="Trusted professionals"
            buttonLabel="Browse Services"
            buttonHref="/services"
            gradient="linear-gradient(135deg, #1a3a2a 0%, #2a6a4a 50%, #00a555 100%)"
          />
          {services.map(srv => (
            <StakeCard
              key={srv.id}
              href={`/services/${srv.id}`}
              imageSrc={srv.images?.[0]}
              fallbackIcon="handyman"
              fallbackGradient="linear-gradient(135deg, #1a2a22 0%, #2a4a32 100%)"
              topBadge={
                srv.category ? (
                  <span className="rounded-full bg-primary/70 px-2 py-0.5 text-[8px] font-black uppercase text-white backdrop-blur-sm">
                    {srv.category}
                  </span>
                ) : undefined
              }
              title={srv.title}
              subtitle={srv.provider?.username ? `by ${srv.provider.firstName || srv.provider.username}` : "Local Pro"}
              statDot={GREEN_ROLE.brand}
              statText={srv.location?.formattedAddress || "Local"}
            />
          ))}
        </div>
      </DiscoveryChrome>
    );
  }

  if (item._type === "discovery_news") {
    const { articles } = item;

    return (
      <DiscoveryChrome icon="newspaper" label="Local News" href="/local-news">
        <div className="horizontal-carousel items-start">
          <CategoryCoverCard
            imageSrc="/illustration_fyi.png"
            title="Local Updates"
            subtitle="Stay informed"
            buttonLabel="Read News"
            buttonHref="/local-news"
            gradient="linear-gradient(135deg, #1a2a3a 0%, #2a4a6a 50%, #3a6a9a 100%)"
          />
          {articles.map(art => (
            <StakeCard
              key={art.id}
              href={art.link}
              imageSrc={art.imageUrl}
              fallbackIcon="newspaper"
              fallbackGradient="linear-gradient(135deg, #1a2a3a 0%, #2a3a5a 100%)"
              topBadge={
                <span className="rounded-full bg-brand-blue/70 px-2 py-0.5 text-[8px] font-black uppercase text-white/90 backdrop-blur-sm">
                  {art.sourceName}
                </span>
              }
              title={art.title}
              subtitle={art.sourceName}
              statDot="#1A56FF"
              statText={formatTimeAgo(art.pubDate)}
            />
          ))}
        </div>
      </DiscoveryChrome>
    );
  }

  if (item._type === "discovery_neighbors") {
    const { users } = item;
    // Don't render block if empty (e.g. only own profile was in list)
    if (!users || users.length === 0) return null;

    return (
      <DiscoveryChrome icon="group" label="People in your Huud" href="/neighborhood">
        <div className="horizontal-carousel items-start">
          <CategoryCoverCard
            imageSrc="/illustration_community_alert.png"
            title="Your Neighbors"
            subtitle="Connect Locally"
            buttonLabel="View All"
            buttonHref="/neighborhood"
            gradient="linear-gradient(135deg, #4a2a1a 0%, #8a4a2a 50%, #d46a00 100%)"
          />
          {users.map((user) => {
            const userId = user.id || (user as any)._id;
            return (
              <NeighborFollowCard
                key={String(userId)}
                user={user}
                currentUserId={currentUserId}
              />
            );
          })}
        </div>
      </DiscoveryChrome>
    );
  }

  return null;
}
