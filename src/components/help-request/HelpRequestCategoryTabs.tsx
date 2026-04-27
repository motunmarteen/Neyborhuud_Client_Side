/**
 * HelpRequestCategoryTabs
 * Horizontal scrollable tab bar for filtering Help Request posts by category.
 */

'use client';

export type HelpRequestCategory = '' | 'financial' | 'medical' | 'food' | 'shelter' | 'emergency';

interface HelpRequestCategoryTabsProps {
    activeCategory: HelpRequestCategory;
    onCategoryChange: (category: HelpRequestCategory) => void;
}

const TABS: Array<{ key: HelpRequestCategory; label: string; icon: string }> = [
    { key: '',          label: 'All',       icon: 'apps' },
    { key: 'financial', label: 'Financial', icon: 'account_balance_wallet' },
    { key: 'medical',   label: 'Medical',   icon: 'local_hospital' },
    { key: 'food',      label: 'Food',      icon: 'restaurant' },
    { key: 'shelter',   label: 'Shelter',   icon: 'home' },
    { key: 'emergency', label: 'Emergency', icon: 'emergency' },
];

const ACTIVE_COLOR: Record<string, string> = {
    '':          'text-[var(--primary)]',
    financial:   'text-green-400',
    medical:     'text-red-400',
    food:        'text-orange-400',
    shelter:     'text-blue-400',
    emergency:   'text-pink-400',
};

export function HelpRequestCategoryTabs({ activeCategory, onCategoryChange }: HelpRequestCategoryTabsProps) {
    return (
        <div className="border-b overflow-x-auto scrollbar-none" style={{ borderColor: 'var(--neu-shadow-light)' }}>
            <div className="flex min-w-max px-4">
                {TABS.map((tab) => {
                    const isActive = activeCategory === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => onCategoryChange(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-all whitespace-nowrap border-b-2 -mb-px ${
                                isActive
                                    ? `border-current ${ACTIVE_COLOR[tab.key]} font-semibold`
                                    : 'border-transparent hover:text-[var(--neu-text-secondary)]'
                            }`}
                            style={!isActive ? { color: 'var(--neu-text-muted)' } : undefined}
                        >
                            <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
