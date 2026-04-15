'use client';

import { useState, useEffect } from 'react';

interface TrendingTopic {
    id: string;
    title: string;
    category: string;
    postCount: number;
    trending: boolean;
}

interface NewsItem {
    id: string;
    title: string;
    source: string;
    timeAgo: string;
    imageUrl?: string;
    postCount?: number;
    category: string;
    avatars?: string[];
}

// In a real app these would come from an API. For now we use the data structure
// so the UI is ready. The backend endpoint can be wired later.
function useNewsAndTrending(tab: 'news' | 'trending') {
    const [items, setItems] = useState<NewsItem[]>([]);
    const [topics, setTopics] = useState<TrendingTopic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        // Simulated delay — replace with actual API call
        const timer = setTimeout(() => {
            if (tab === 'news') {
                setItems([]);
            } else {
                setTopics([]);
            }
            setLoading(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [tab]);

    return { items, topics, loading };
}

export function TrendingPanel() {
    const { topics, loading } = useNewsAndTrending('trending');

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex flex-col gap-2 px-4 py-3">
                        <div className="h-3 w-24 rounded bg-white/5" />
                        <div className="h-5 w-48 rounded bg-white/10" />
                        <div className="h-3 w-32 rounded bg-white/5" />
                    </div>
                ))}
            </div>
        );
    }

    if (topics.length === 0) {
        return (
            <div className="flex flex-col items-center py-16 px-6">
                <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--neu-text-muted)' }}>trending_up</span>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--neu-text)' }}>Nothing trending yet</p>
                <p className="text-xs text-center" style={{ color: 'var(--neu-text-muted)' }}>
                    Trending topics from your neighborhood and Nigeria will appear here as community activity grows.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col divide-y" style={{ borderColor: 'var(--neu-shadow-dark, rgba(255,255,255,0.05))' }}>
            {topics.map((topic) => (
                <div key={topic.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                    <p className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                        {topic.category} · Trending
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--neu-text)' }}>
                        {topic.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                        {topic.postCount.toLocaleString()} posts
                    </p>
                </div>
            ))}
        </div>
    );
}

export function NewsPanel() {
    const { items, loading } = useNewsAndTrending('news');

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <div className="px-4 pt-3">
                    <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="animate-pulse px-4 py-3">
                        <div className="h-5 w-full rounded bg-white/10 mb-2" />
                        <div className="h-4 w-3/4 rounded bg-white/5 mb-2" />
                        <div className="flex gap-2 items-center">
                            <div className="h-3 w-20 rounded bg-white/5" />
                            <div className="h-3 w-16 rounded bg-white/5" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center py-16 px-6">
                <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--neu-text-muted)' }}>newspaper</span>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--neu-text)' }}>No news yet</p>
                <p className="text-xs text-center" style={{ color: 'var(--neu-text-muted)' }}>
                    Breaking news and stories from Nigeria and around the world will appear here. Stay tuned.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col">
            <h3 className="px-4 pt-3 pb-2 text-lg font-extrabold" style={{ color: 'var(--neu-text)' }}>
                Today&rsquo;s News
            </h3>
            <div className="flex flex-col divide-y" style={{ borderColor: 'var(--neu-shadow-dark, rgba(255,255,255,0.05))' }}>
                {items.map((item) => (
                    <article key={item.id} className="px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <h4 className="text-[15px] font-bold leading-snug mb-1.5" style={{ color: 'var(--neu-text)' }}>
                            {item.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-wrap">
                            {item.avatars && item.avatars.length > 0 && (
                                <div className="flex -space-x-2">
                                    {item.avatars.slice(0, 3).map((av, i) => (
                                        <img key={i} src={av} alt="" className="w-5 h-5 rounded-full border border-black" />
                                    ))}
                                </div>
                            )}
                            <span className="text-xs" style={{ color: 'var(--neu-text-muted)' }}>
                                {item.timeAgo} · {item.category}
                                {item.postCount ? ` · ${item.postCount >= 1000 ? `${(item.postCount / 1000).toFixed(1)}K` : item.postCount} posts` : ''}
                            </span>
                        </div>
                    </article>
                ))}
            </div>
        </div>
    );
}
