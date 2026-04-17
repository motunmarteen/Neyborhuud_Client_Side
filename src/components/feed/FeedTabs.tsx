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
        <div className="bg-white border-b border-black/[0.06]">
            <div className="grid grid-cols-3">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => onTabChange(tab.key)}
                        className={`py-1.5 px-2 text-xs md:text-sm font-medium transition-all ${
                            activeTab === tab.key ? 'font-bold text-[var(--neu-text)]' : 'text-[var(--neu-text-muted)] hover:text-[var(--neu-text-secondary)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
