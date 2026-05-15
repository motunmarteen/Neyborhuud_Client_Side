/**
 * Right Sidebar Component - Stitch Design
 * Shows upcoming events, marketplace picks, trending topics
 * Only visible on xl breakpoint and above
 */

'use client';

import Link from 'next/link';
import SidebarWeatherWidget from './SidebarWeatherWidget';
import { useEvents } from '@/hooks/useEvents';
import { useMarketplaceProducts } from '@/hooks/useMarketplace';

export default function RightSidebar() {
    const { data: eventsData, isLoading: eventsLoading } = useEvents();
    const eventsRaw = eventsData?.pages?.flatMap((page: any) => page?.data?.events ?? page?.data ?? []) ?? [];
    const upcomingEvents = Array.isArray(eventsRaw) ? eventsRaw.slice(0, 3) : [];

    const { data: marketplaceData, isLoading: marketplaceLoading } = useMarketplaceProducts();
    const listingsRaw = marketplaceData?.pages?.flatMap((page: any) => page?.data ?? []) ?? [];
    const recentListings = Array.isArray(listingsRaw) ? listingsRaw.slice(0, 2) : [];

    return (
        <aside className="hidden xl:flex w-[480px] flex-col gap-6 p-6 neu-base overflow-y-auto shrink-0" style={{ boxShadow: '-4px 0 12px var(--neu-shadow-dark)' }}>
            {/* Weather Widget */}
            <SidebarWeatherWidget />

            {/* Events Widget */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Link href="/events" className="text-base font-bold hover:text-primary transition-colors" style={{ color: 'var(--neu-text)' }}>Upcoming Events</Link>
                    <Link href="/events" className="text-primary text-xs font-bold hover:underline">See all</Link>
                </div>
                <div className="flex flex-col gap-3">
                    {eventsLoading ? (
                        <>
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="neu-card-sm rounded-xl p-3 flex gap-3 animate-pulse">
                                    <div className="neu-socket rounded-lg w-12 h-12 shrink-0" />
                                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                                        <div className="h-3 rounded bg-current opacity-10 w-3/4" />
                                        <div className="h-2.5 rounded bg-current opacity-10 w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : upcomingEvents.length === 0 ? (
                        <Link href="/events" className="text-xs py-2 hover:text-primary transition-colors" style={{ color: 'var(--neu-text-muted)' }}>No upcoming events nearby. Browse all →</Link>
                    ) : upcomingEvents.map((event: any) => {
                        const date = event.date ? new Date(event.date) : null;
                        const month = date ? date.toLocaleString('default', { month: 'short' }) : '';
                        const day = date ? String(date.getDate()) : '';
                        const attendees = event.attendeeCount ?? event.attendees?.length ?? 0;
                        return (
                            <Link
                                key={event._id ?? event.id}
                                href={`/events/${event._id ?? event.id}`}
                                className="neu-card-sm rounded-xl p-3 flex gap-3 cursor-pointer transition-all hover:scale-[1.01]"
                            >
                                <div className="neu-socket rounded-lg w-12 h-12 flex flex-col items-center justify-center shrink-0 text-primary">
                                    <span className="text-xs font-bold uppercase">{month}</span>
                                    <span className="text-lg font-bold leading-none">{day}</span>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h3 className="text-sm font-bold leading-tight mb-1 truncate" style={{ color: 'var(--neu-text)' }}>{event.title}</h3>
                                    <p className="text-xs truncate" style={{ color: 'var(--neu-text-muted)' }}>
                                        {event.location?.name ?? event.location?.address ?? event.locationName ?? ''}
                                    </p>
                                    {attendees > 0 && (
                                        <p className="text-[11px] mt-1 text-primary font-bold">{attendees} attending</p>
                                    )}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Marketplace Widget */}
            <div className="flex flex-col gap-3">
                <div className="neu-divider" />
                <div className="flex items-center justify-between">
                    <Link href="/marketplace" className="text-base font-bold hover:text-primary transition-colors" style={{ color: 'var(--neu-text)' }}>Marketplace</Link>
                    <Link href="/marketplace" className="text-primary text-xs font-bold hover:underline">Browse</Link>
                </div>
                {marketplaceLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        {[0, 1].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-square rounded-xl mb-2 neu-card-sm" />
                                <div className="h-3 rounded bg-current opacity-10 w-3/4 mb-1" />
                                <div className="h-2.5 rounded bg-current opacity-10 w-1/3" />
                            </div>
                        ))}
                    </div>
                ) : recentListings.length === 0 ? (
                    <Link href="/marketplace" className="text-xs py-2 hover:text-primary transition-colors" style={{ color: 'var(--neu-text-muted)' }}>No listings nearby yet. Browse all →</Link>
                ) : (
                    <div className="grid grid-cols-2 gap-3">
                        {recentListings.map((item: any) => {
                            const price = item.price != null
                                ? item.price === 0 ? 'Free' : `₦${Number(item.price).toLocaleString()}`
                                : item.priceLabel ?? 'Free';
                            const isFree = item.price === 0 || price === 'Free';
                            const image = item.images?.[0] ?? item.image ?? item.thumbnail ?? null;
                            return (
                                <Link
                                    key={item._id ?? item.id}
                                    href={`/marketplace?product=${encodeURIComponent(String(item._id ?? item.id))}`}
                                    className="group cursor-pointer"
                                >
                                    {image ? (
                                        <div
                                            className="aspect-square rounded-xl bg-cover bg-center mb-2 overflow-hidden neu-card-sm"
                                            style={{ backgroundImage: `url("${image}")` }}
                                        >
                                            <div className="w-full h-full bg-black/0 group-hover:bg-black/10 transition-colors" />
                                        </div>
                                    ) : (
                                        <div className="aspect-square rounded-xl mb-2 neu-card-sm flex items-center justify-center">
                                            <span className="material-symbols-outlined text-[32px] text-gray-300">shopping_bag</span>
                                        </div>
                                    )}
                                    <h4 className="text-sm font-medium truncate" style={{ color: 'var(--neu-text)' }}>{item.title ?? item.name}</h4>
                                    <p className={`text-xs font-bold ${isFree ? 'text-green-500' : 'text-primary'}`}>
                                        {price}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </aside>
    );
}
