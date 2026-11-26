'use client';

import { FilterChip } from '@/components/ui/Chip';
import { LAYERS, type MapLayer } from '@/lib/mapPins';
import { useTranslation } from '@/lib/i18n';

/**
 * The map's filters (M-07): "All", or one kind of pin at a time (owner 2026-11-25; all seven
 * used to be dark and "on" together, so nothing stood out). Tap the chosen one again for All.
 */
export function MapLayerChips({
  selected,
  onSelect,
  counts,
}: {
  /** null = All. */
  selected: MapLayer | null;
  onSelect: (next: MapLayer | null) => void;
  counts?: Partial<Record<MapLayer, number>>;
}) {
  const { t } = useTranslation();
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-1 pb-1" role="group" aria-label={t('home.filters')}>
      <FilterChip floating active={selected === null} onClick={() => onSelect(null)}>
        {t('home.all')}
      </FilterChip>
      {LAYERS.map((l) => (
        <FilterChip
          key={l.key}
          floating
          active={selected === l.key}
          onClick={() => onSelect(selected === l.key ? null : l.key)}
          icon={l.emoji}
          count={counts?.[l.key]}
        >
          {l.label}
        </FilterChip>
      ))}
    </div>
  );
}
