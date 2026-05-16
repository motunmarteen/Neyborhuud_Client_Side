"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { DiscoveryFeedItem } from "@/lib/feedDiscoveryMerge";
import { ProductCard } from "@/components/marketplace/ProductCard";
import EventCard from "@/components/events/EventCard";
import JobCard from "@/components/jobs/JobCard";
import ApplyModal from "@/components/jobs/ApplyModal";
import { useAttendEvent } from "@/hooks/useEvents";
import { useSaveJob } from "@/hooks/useJobs";

export type FeedDiscoveryItem = Extract<
  DiscoveryFeedItem,
  { _type: "discovery_marketplace" } | { _type: "discovery_event" } | { _type: "discovery_job" }
>;

interface FeedDiscoveryBlockProps {
  item: FeedDiscoveryItem;
  userLocation: { lat: number; lng: number } | null;
  currentUserId: string | null;
}

function DiscoveryChrome({
  icon,
  label,
  subtitle,
  children,
  footer,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  children: ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div
      className="overflow-hidden rounded-[28px] border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
      style={{
        background:
          "linear-gradient(165deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.03) 42%, rgba(0,0,0,0.18) 100%)",
      }}
    >
      <div className="flex items-center gap-2.5 border-b border-white/10 px-3 py-2.5 sm:px-3.5">
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-white/90"
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.14)",
            backdropFilter: "blur(12px)",
          }}
        >
          <span className="material-symbols-outlined text-[18px]">{icon}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/50">{label}</p>
          <p className="truncate text-[11px] font-semibold text-white/85">{subtitle ?? "Suggested while you scroll"}</p>
        </div>
      </div>
      <div className="p-2 sm:p-2.5">{children}</div>
      {footer}
    </div>
  );
}

function SectionFooter({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <div
      className="flex items-center justify-end border-t border-white/10 px-3 py-2.5 sm:px-3.5"
      style={{ background: "rgba(0,0,0,0.12)" }}
    >
      <Link
        href={href}
        className="inline-flex items-center gap-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-300/90 transition-colors hover:text-emerald-200"
      >
        {label}
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
      </Link>
    </div>
  );
}

export function FeedDiscoveryBlock({ item, userLocation, currentUserId }: FeedDiscoveryBlockProps) {
  const attendEvent = useAttendEvent();
  const saveJob = useSaveJob();
  const [applyTarget, setApplyTarget] = useState<{ id: string; title: string } | null>(null);

  if (item._type === "discovery_marketplace") {
    const { products } = item;
    const first = products[0];
    const pid = first ? first.id || (first as { _id?: string })._id : undefined;
    const marketplaceHref = pid
      ? `/marketplace?product=${encodeURIComponent(String(pid))}`
      : "/marketplace";
    return (
      <DiscoveryChrome
        icon="storefront"
        label="Marketplace"
        subtitle="Swipe for more listings"
        footer={<SectionFooter href={marketplaceHref} label="View marketplace" />}
      >
        <div
          className="-mx-0.5 flex gap-3 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 pt-1 snap-x snap-mandatory no-scrollbar"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {products.map((p) => {
            const id = p.id || (p as { _id?: string })._id;
            return (
              <div
                key={String(id)}
                className="w-[min(292px,calc(100vw-2rem))] max-w-[85vw] shrink-0 snap-center sm:w-[288px] sm:max-w-none"
              >
                <ProductCard
                  product={p}
                  userLocation={userLocation}
                  currentUserId={currentUserId ?? undefined}
                />
              </div>
            );
          })}
        </div>
      </DiscoveryChrome>
    );
  }

  if (item._type === "discovery_event") {
    const ev = item.data;
    return (
      <DiscoveryChrome
        icon="event"
        label="Events"
        subtitle="Happening around you"
        footer={<SectionFooter href="/events" label="See more events" />}
      >
        <EventCard
          variant="feed"
          event={ev}
          onAttend={(eventId) =>
            attendEvent.mutate({
              eventId,
              attending: !!ev.isAttending,
            })
          }
          attendPending={attendEvent.isPending}
        />
      </DiscoveryChrome>
    );
  }

  const job = item.data;

  return (
    <>
      <DiscoveryChrome
        icon="work"
        label="Jobs"
        subtitle="Opportunity in your network"
        footer={<SectionFooter href="/jobs" label="See more jobs" />}
      >
        <JobCard
          job={job}
          onApply={(id) => setApplyTarget({ id, title: job.title })}
          onSave={(id, isSaved) => saveJob.mutate({ jobId: id, saved: isSaved })}
        />
      </DiscoveryChrome>
      {applyTarget && (
        <ApplyModal
          jobId={applyTarget.id}
          jobTitle={applyTarget.title}
          onClose={() => setApplyTarget(null)}
        />
      )}
    </>
  );
}
