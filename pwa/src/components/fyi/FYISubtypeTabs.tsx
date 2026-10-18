/**
 * FYISubtypeTabs
 * Horizontal scrollable tab bar for filtering FYI posts by subtype.
 */

'use client';

import { BrowseTabStrip } from '@/components/layout/BrowseTabStrip';
import { useTranslation } from '@/lib/i18n';

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

export function FYISubtypeTabs({ activeSubtype, onSubtypeChange }: FYISubtypeTabsProps) {
    const { t } = useTranslation();
    return (
        <BrowseTabStrip
            tabs={TABS.map((tab) => ({ id: tab.key || 'all', label: t(`fyi.tab.${tab.key || 'all'}`), icon: tab.icon }))}
            activeId={activeSubtype || 'all'}
            onChange={(id) => onSubtypeChange((id === 'all' ? '' : id) as FYISubtype)}
        />
    );
}
