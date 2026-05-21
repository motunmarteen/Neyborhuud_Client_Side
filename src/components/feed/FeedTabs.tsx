/**
 * Feed Tabs — three backend feed layers with swipe + brand accent (DESIGN.md §16).
 */

import { motion } from 'framer-motion';
import { FeedTab } from '@/types/api';

export const FEED_TAB_ORDER: FeedTab[] = ['your_huud', 'street_radar', 'following_places'];

interface FeedTabsProps {
    activeTab: FeedTab;
    onTabChange: (tab: FeedTab) => void;
}

const TAB_CONFIG: Array<{ key: FeedTab; label: string; accent: string }> = [
    { key: 'your_huud', label: 'Your Huud', accent: 'bg-primary' },
    { key: 'street_radar', label: 'Street Radar', accent: 'bg-brand-blue' },
    { key: 'following_places', label: 'Following Places', accent: 'bg-brand-green-dark' },
];

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
    return (
        <div className="bg-white border-b border-black/[0.06]">
            <div className="grid grid-cols-3 relative">
                {TAB_CONFIG.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => onTabChange(tab.key)}
                            className={`relative py-2 px-2 text-xs md:text-sm font-medium transition-colors touch-manipulation min-h-[44px] ${
                                active
                                    ? 'font-bold text-[var(--neu-text)]'
                                    : 'text-[var(--neu-text-muted)] hover:text-[var(--neu-text-secondary)]'
                            }`}
                        >
                            {tab.label}
                            {active && (
                                <motion.span
                                    layoutId="feed-tab-accent"
                                    className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full ${tab.accent}`}
                                    transition={{ type: 'spring', damping: 28, stiffness: 360 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
