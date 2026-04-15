'use client';

import { ContentType, FeedTab } from '@/types/api';
import { useTranslation } from '@/lib/i18n';

export type ExploreTab = 'for_you' | 'trending' | 'news' | ContentType;

interface ExploreTabsProps {
    activeTab: ExploreTab;
    onTabChange: (tab: ExploreTab) => void;
}

const TABS: { key: ExploreTab; labelKey: string; fallback: string }[] = [
    { key: 'for_you', labelKey: 'explore.forYou', fallback: 'For You' },
    { key: 'trending', labelKey: 'explore.trending', fallback: 'Trending' },
    { key: 'news', labelKey: 'explore.news', fallback: 'News' },
    { key: 'post', labelKey: 'contentType.post', fallback: 'Posts' },
    { key: 'fyi', labelKey: 'contentType.fyi', fallback: 'FYI' },
    { key: 'gossip', labelKey: 'contentType.gossip', fallback: 'Gossip' },
    { key: 'help_request', labelKey: 'contentType.help_request', fallback: 'Help' },
    { key: 'job', labelKey: 'contentType.job', fallback: 'Jobs' },
    { key: 'event', labelKey: 'contentType.event', fallback: 'Events' },
    { key: 'marketplace', labelKey: 'contentType.marketplace', fallback: 'Market' },
];

export function ExploreTabs({ activeTab, onTabChange }: ExploreTabsProps) {
    const { t } = useTranslation();

    return (
        <div className="w-full border-b" style={{ borderColor: 'var(--neu-shadow-dark, rgba(255,255,255,0.05))' }}>
            <nav className="flex overflow-x-auto scrollbar-hide" role="tablist">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.key;
                    const label = t(tab.labelKey);
                    // Use fallback if i18n returned the raw key
                    const displayLabel = label === tab.labelKey ? tab.fallback : label;

                    return (
                        <button
                            key={tab.key}
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onTabChange(tab.key)}
                            className={`relative flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                                isActive
                                    ? 'font-bold'
                                    : 'hover:opacity-80'
                            }`}
                            style={{
                                color: isActive ? 'var(--neu-text)' : 'var(--neu-text-muted)',
                            }}
                        >
                            {displayLabel}
                            {isActive && (
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </div>
    );
}
