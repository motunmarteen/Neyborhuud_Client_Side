/**
 * FYISubtypeTabs
 * Horizontal scrollable tab bar for filtering FYI posts by subtype.
 */

'use client';

export type FYISubtype = '' | 'safety_notice' | 'lost_found' | 'community_announcement' | 'alert';

interface FYISubtypeTabsProps {
    activeSubtype: FYISubtype;
    onSubtypeChange: (subtype: FYISubtype) => void;
}

const TABS: Array<{ key: FYISubtype; label: string; icon: string }> = [
    { key: '',                       label: 'All',          icon: 'apps' },
    { key: 'safety_notice',          label: 'Safety',       icon: 'emergency_home' },
    { key: 'lost_found',             label: 'Lost & Found', icon: 'search' },
    { key: 'community_announcement', label: 'Announcements',icon: 'campaign' },
    { key: 'alert',                  label: 'Alerts',       icon: 'warning' },
];

// Per-subtype accent color when active
const ACTIVE_COLOR: Record<string, string> = {
    '':                       'text-[var(--primary)]',
    safety_notice:             'text-red-400',
    lost_found:                'text-purple-400',
    community_announcement:    'text-blue-400',
    alert:                     'text-orange-400',
};

export function FYISubtypeTabs({ activeSubtype, onSubtypeChange }: FYISubtypeTabsProps) {
    return (
        <div className="border-b overflow-x-auto scrollbar-none" style={{ borderColor: 'var(--neu-shadow-light)' }}>
            <div className="flex min-w-max px-4">
                {TABS.map((tab) => {
                    const isActive = activeSubtype === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => onSubtypeChange(tab.key)}
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
