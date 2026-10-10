/**
 * Right Sidebar Component — Clean Daylight White Foundation
 * Shows upcoming events, marketplace picks, and neighborhood news.
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useHuudDisplayName } from '@/hooks/useHuudDisplayName';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { useEvents } from '@/hooks/useEvents';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';
import { NewsPanel } from '@/components/feed/NewsPanel';
import { fromKobo } from '@/lib/currency';
import { Calendar, ShoppingBag, Sparkles, ArrowRight, Search } from 'lucide-react';

export default function RightSidebar() {
  const router = useRouter();
  const { user } = useAuth();
  const huudName = useHuudDisplayName(user);

  const { data: eventsData, isLoading: eventsLoading } = useEvents();
  const eventsRaw = eventsData?.pages?.flatMap((page: any) => page?.data?.events ?? page?.data ?? []) ?? [];
  const upcomingEvents = Array.isArray(eventsRaw) ? eventsRaw.slice(0, 3) : [];

  const { data: marketplaceData, isLoading: marketplaceLoading } = useMarketplaceProducts();
  const listingsRaw = marketplaceData?.pages?.flatMap((page: any) => page?.data ?? []) ?? [];
  const recentListings = Array.isArray(listingsRaw) ? listingsRaw.slice(0, 2) : [];

  return (
    <aside className="hidden lg:flex w-[320px] xl:w-[360px] flex-col gap-5 p-5 bg-white border-l border-black/[0.08] overflow-y-auto shrink-0 select-none">
      {/* 1. Global Search Bar (Twitter/X style desktop search) */}
      <button
        type="button"
        onClick={() => router.push('/explore')}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.08] text-xs text-[#5B6478] transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-2.5 truncate">
          <Search size={15} className="text-[#9AA3B1] group-hover:text-[#0E8A3E] transition-colors shrink-0" />
          <span suppressHydrationWarning className="truncate font-medium">
            Search in {huudName !== 'your neighborhood' && huudName ? huudName : 'your neighborhood'}...
          </span>
        </div>
        <kbd className="px-1.5 py-0.5 rounded-lg bg-white border border-black/10 text-[10px] font-bold text-[#9AA3B1] shrink-0">
          ⌘K
        </kbd>
      </button>

      {/* Onboarding checklist — hidden once complete */}
      <OnboardingChecklist />

      {/* Events Widget */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9AA3B1]">
            <Calendar size={13} className="text-[#0E8A3E]" />
            <span>Upcoming Events</span>
          </div>
          <Link href="/events" className="text-[#0E8A3E] text-[11px] font-bold hover:underline flex items-center gap-0.5">
            <span>See all</span>
            <ArrowRight size={11} />
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {eventsLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3 rounded-2xl bg-white border border-black/[0.08] flex gap-3 animate-pulse shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-black/[0.04] shrink-0" />
                  <div className="flex flex-col gap-2 flex-1 min-w-0 justify-center">
                    <div className="h-3 rounded-full bg-black/[0.08] w-3/4" />
                    <div className="h-2.5 rounded-full bg-black/[0.04] w-1/2" />
                  </div>
                </div>
              ))}
            </>
          ) : upcomingEvents.length === 0 ? (
            <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] text-center shadow-xs">
              <p className="text-xs font-semibold text-[#5B6478]">No upcoming events nearby</p>
              <Link href="/events" className="text-xs font-bold text-[#0E8A3E] hover:underline mt-1 inline-block">
                Explore all events →
              </Link>
            </div>
          ) : (
            upcomingEvents.map((event: any) => {
              const date = event.date ? new Date(event.date) : null;
              const month = date ? date.toLocaleString('default', { month: 'short' }) : '';
              const day = date ? String(date.getDate()) : '';
              const attendees = event.attendeeCount ?? event.attendees?.length ?? 0;
              return (
                <Link
                  key={event._id ?? event.id}
                  href={`/events/${event._id ?? event.id}`}
                  className="p-3 rounded-2xl bg-white border border-black/[0.08] hover:border-[#0E8A3E]/50 transition-all flex gap-3 cursor-pointer shadow-xs group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col items-center justify-center shrink-0 text-[#0E8A3E]">
                    <span className="text-[10px] font-black uppercase leading-none">{month}</span>
                    <span className="text-base font-black leading-tight">{day}</span>
                  </div>
                  <div className="flex flex-col min-w-0 justify-center">
                    <h3 className="text-xs font-bold text-[#1D2433] group-hover:text-[#0E8A3E] transition-colors truncate">
                      {event.title}
                    </h3>
                    <p className="text-[11px] font-medium text-[#5B6478] truncate mt-0.5">
                      {event.location?.name ?? event.location?.address ?? event.locationName ?? 'Lekki Phase 1'}
                    </p>
                    {attendees > 0 && (
                      <p className="text-[10px] mt-1 text-[#0E8A3E] font-bold">
                        {attendees} neighbors attending
                      </p>
                    )}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* Marketplace Widget */}
      <div className="flex flex-col gap-3 pt-2 border-t border-black/[0.06]">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9AA3B1]">
            <ShoppingBag size={13} className="text-amber-600" />
            <span>Marketplace Picks</span>
          </div>
          <Link href="/marketplace" className="text-[#0E8A3E] text-[11px] font-bold hover:underline flex items-center gap-0.5">
            <span>Browse</span>
            <ArrowRight size={11} />
          </Link>
        </div>

        {marketplaceLoading ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[0, 1].map((i) => (
              <div key={i} className="p-2.5 rounded-2xl bg-white border border-black/[0.08] animate-pulse shadow-xs">
                <div className="aspect-square rounded-xl bg-black/[0.04] mb-2" />
                <div className="h-3 rounded-full bg-black/[0.08] w-3/4 mb-1" />
                <div className="h-2.5 rounded-full bg-black/[0.04] w-1/2" />
              </div>
            ))}
          </div>
        ) : recentListings.length === 0 ? (
          <div className="p-3.5 rounded-2xl bg-white border border-black/[0.08] text-center shadow-xs">
            <p className="text-xs font-semibold text-[#5B6478]">No local listings nearby yet</p>
            <Link href="/marketplace" className="text-xs font-bold text-[#0E8A3E] hover:underline mt-1 inline-block">
              Sell or browse items →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {recentListings.map((item: any) => {
              const price = item.price != null
                ? item.price === 0
                  ? 'Free'
                  : `₦${fromKobo(Number(item.price)).toLocaleString()}`
                : item.priceLabel ?? 'Free';
              const image = item.images?.[0] ?? item.image ?? item.thumbnail ?? null;
              return (
                <Link
                  key={item._id ?? item.id}
                  href={`/marketplace?product=${encodeURIComponent(String(item._id ?? item.id))}`}
                  className="group p-2.5 rounded-2xl bg-white border border-black/[0.08] hover:border-amber-400/60 transition-all shadow-xs flex flex-col justify-between"
                >
                  {image ? (
                    <div
                      className="aspect-square rounded-xl bg-cover bg-center mb-2 overflow-hidden border border-black/[0.05]"
                      style={{ backgroundImage: `url("${image}")` }}
                    />
                  ) : (
                    <div className="aspect-square rounded-xl mb-2 bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#0E8A3E]">
                      <ShoppingBag size={24} />
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-bold text-[#1D2433] group-hover:text-amber-700 transition-colors truncate">
                      {item.title ?? item.name}
                    </h4>
                    <p className="text-xs font-black text-[#0E8A3E] mt-0.5">
                      {price}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* News Widget */}
      <div className="flex flex-col gap-3 pt-2 border-t border-black/[0.06]">
        <NewsPanel />
      </div>
    </aside>
  );
}
