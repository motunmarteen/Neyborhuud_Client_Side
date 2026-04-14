/**
 * Feed Tabs Component
 * Tabs for switching between the three backend feed layers.
 */

import { FeedTab } from '@/types/api';

interface FeedTabsProps {
    activeTab: FeedTab;
    onTabChange: (tab: FeedTab) => void;
}

const TAB_CONFIG: Array<{ key: FeedTab; label: string }> = [
    { key: 'your_huud', label: 'Your Huud' },
    { key: 'street_radar', label: 'Street Radar' },
    { key: 'following_places', label: 'Following Places' },
];

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
    return (
        <div className="neu-socket rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 gap-1 p-1">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={`py-3 px-2 text-xs md:text-sm font-medium transition-all relative rounded-xl ${
                            activeTab === tab.key ? 'font-bold neu-card-sm' : ''
                        }`}
                        style={{ color: activeTab === tab.key ? 'var(--neu-text)' : 'var(--neu-text-muted)' }}
                    >
                        {tab.label}
                        {activeTab === tab.key && (
                            <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
