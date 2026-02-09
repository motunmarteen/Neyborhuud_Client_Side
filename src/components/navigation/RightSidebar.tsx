/**
 * Right Sidebar Component - Stitch Design
 * Shows upcoming events, marketplace picks, trending topics
 * Only visible on xl breakpoint and above
 */

'use client';

import Link from 'next/link';

interface TrendingItem {
    category: string;
    topic: string;
}

interface MarketplaceItem {
    title: string;
    price: string;
    isFree?: boolean;
    image: string;
}

interface EventItem {
    month: string;
    day: string;
    title: string;
    details: string;
    attendees: number;
}

export default function RightSidebar() {
    // Placeholder data - in production from API
    const events: EventItem[] = [
        { month: 'Oct', day: '24', title: 'Block Party & BBQ', details: 'Sat, 2:00 PM • Central Park', attendees: 14 },
    ];

    const marketplaceItems: MarketplaceItem[] = [
        { title: 'Vintage Chair', price: '$45', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200&h=200&fit=crop' },
        { title: 'Moving Boxes', price: 'Free', isFree: true, image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&h=200&fit=crop' },
    ];

    const trending: TrendingItem[] = [
        { category: 'Local Business', topic: '#NewCoffeeShop' },
        { category: 'Safety', topic: '#SchoolZoneSpeed' },
    ];

    return (
        <aside className="hidden xl:flex w-80 flex-col gap-6 p-6 neu-base overflow-y-auto shrink-0" style={{ boxShadow: '-4px 0 12px var(--neu-shadow-dark)' }}>
            {/* Events Widget */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Upcoming Events</h2>
                    <Link href="/events" className="text-primary text-xs font-bold hover:underline">See all</Link>
                </div>
                <div className="flex flex-col gap-3">
                    {events.map((event, idx) => (
                        <div key={idx} className="neu-card-sm rounded-xl p-3 flex gap-3 cursor-pointer transition-all hover:scale-[1.01]">
                            <div className="neu-socket rounded-lg w-12 h-12 flex flex-col items-center justify-center shrink-0 text-primary">
                                <span className="text-xs font-bold uppercase">{event.month}</span>
                                <span className="text-lg font-bold leading-none">{event.day}</span>
                            </div>
                            <div className="flex flex-col">
                                <h3 className="text-sm font-bold leading-tight mb-1" style={{ color: 'var(--neu-text)' }}>{event.title}</h3>
                                <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>{event.details}</p>
                                <div className="flex items-center mt-2">
                                    <div className="flex -space-x-2">
                                        <div className="w-5 h-5 rounded-full neu-chip text-[8px] flex items-center justify-center font-bold text-primary">A</div>
                                        <div className="w-5 h-5 rounded-full neu-chip text-[8px] flex items-center justify-center font-bold text-primary">B</div>
                                    </div>
                                    <div className="w-5 h-5 rounded-full neu-socket text-[8px] flex items-center justify-center font-bold ml-0" style={{ color: 'var(--neu-text-muted)' }}>+{event.attendees}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Marketplace Widget */}
            <div className="flex flex-col gap-3">
                <div className="neu-divider" />
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Marketplace</h2>
                    <Link href="/marketplace" className="text-primary text-xs font-bold hover:underline">Browse</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {marketplaceItems.map((item, idx) => (
                        <div key={idx} className="group cursor-pointer">
                            <div
                                className="aspect-square rounded-xl bg-cover bg-center mb-2 overflow-hidden neu-card-sm"
                                style={{ backgroundImage: `url("${item.image}")` }}
                            >
                                <div className="w-full h-full bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                            </div>
                            <h4 className="text-sm font-medium truncate" style={{ color: 'var(--neu-text)' }}>{item.title}</h4>
                            <p className={`text-xs font-bold ${item.isFree ? 'text-green-500' : 'text-primary'}`}>
                                {item.price}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Trending Topics */}
            <div className="flex flex-col gap-3">
                <div className="neu-divider" />
                <h2 className="text-base font-bold" style={{ color: 'var(--neu-text)' }}>Trending Nearby</h2>
                <div className="flex flex-col gap-2">
                    {trending.map((item, idx) => (
                        <Link key={idx} href="#" className="flex items-center justify-between group neu-card-sm rounded-xl p-3 transition-all hover:scale-[1.01]">
                            <div>
                                <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--neu-text-muted)' }}>{item.category}</p>
                                <p className="text-sm font-bold group-hover:text-primary transition-colors" style={{ color: 'var(--neu-text)' }}>{item.topic}</p>
                            </div>
                            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--neu-text-muted)' }}>trending_up</span>
                        </Link>
                    ))}
                </div>
            </div>
        </aside>
    );
}
