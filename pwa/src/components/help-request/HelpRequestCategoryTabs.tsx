'use client';

/** Filter help requests by kind: one row of the shared chips (owner 2026-11-26). */

import { ChipRow, FilterChip } from '@/components/ui/Chip';

export type HelpRequestCategory = '' | 'financial' | 'medical' | 'food' | 'shelter' | 'emergency';

interface HelpRequestCategoryTabsProps {
    activeCategory: HelpRequestCategory;
    onCategoryChange: (category: HelpRequestCategory) => void;
}

const TABS: Array<{ key: HelpRequestCategory; label: string }> = [
    { key: '', label: 'All' },
    { key: 'financial', label: 'Money' },
    { key: 'medical', label: 'Medical' },
    { key: 'food', label: 'Food' },
    { key: 'shelter', label: 'Shelter' },
    { key: 'emergency', label: 'Safety' },
];

export function HelpRequestCategoryTabs({ activeCategory, onCategoryChange }: HelpRequestCategoryTabsProps) {
    return (
        <ChipRow label="Kinds of help">
            {TABS.map((tab) => (
                <FilterChip key={tab.key || 'all'} active={activeCategory === tab.key} onClick={() => onCategoryChange(tab.key)}>
                    {tab.label}
                </FilterChip>
            ))}
        </ChipRow>
    );
}
