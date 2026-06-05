/**
 * Feed Tabs — three backend feed layers with swipe + brand accent (DESIGN.md §16).
 */

import { motion } from 'framer-motion';
import { FeedTab } from '@/types/api';

export const FEED_TAB_ORDER: FeedTab[] = ['your_huud', 'street_radar', 'following_places'];

interface FeedTabsProps {
    activeTab: FeedTab;
    onTabChange: (tab: FeedTab) => void;
    className?: string;
}

const TAB_CONFIG: Array<{ key: FeedTab; label: string }> = [
    { key: 'your_huud', label: 'Your Huud' },
    { key: 'street_radar', label: 'Street Radar' },
    { key: 'following_places', label: 'Following Places' },
];

export function FeedTabs({ activeTab, onTabChange, className }: FeedTabsProps) {
    return (
        <div className={`mod-card rounded-2xl overflow-hidden${className ? ` ${className}` : ''}`}>
            {/* eslint-disable-next-line jsx-a11y/role-has-required-aria-props -- tab children are rendered via motion.button in the map below */}
            <div
                role="tablist"
                aria-label="Feed layers"
                className="grid grid-cols-3 relative gap-0.5 p-1"
            >
                {TAB_CONFIG.map((tab) => {
                    const active = activeTab === tab.key;
                    return (
                        <motion.button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => onTabChange(tab.key)}
                            whileTap={{ scale: 0.96 }}
                            className={`segmented-tab ${active ? 'segmented-tab--active' : 'segmented-tab--inactive'} py-2 px-2 text-xs font-semibold touch-manipulation min-h-[40px] rounded-full`}
                        >
                            {tab.label}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
