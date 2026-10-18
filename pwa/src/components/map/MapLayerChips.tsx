'use client';

import { FilterChip } from '@/components/ui/Chip';
import { LAYERS, type MapLayer } from '@/lib/mapPins';
import { useTranslation } from '@/lib/i18n';

/** The map's layer chips (M-07): switch each kind of pin on or off. */
export function MapLayerChips({
  active,
  onChange,
  counts,
  onMore,
  moreOn = 0,
}: {
  active: MapLayer[];
  onChange: (next: MapLayer[]) => void;
  counts?: Partial<Record<MapLayer, number>>;
  /** "People & places" (friends, birthdays, businesses): opens the lens picker. */
  onMore?: () => void;
  moreOn?: number;
}) {
  const { t } = useTranslation();
  const toggle = (k: MapLayer) => onChange(active.includes(k) ? active.filter((x) => x !== k) : [...active, k]);
  return (
    <div className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="group" aria-label="What to show on the map">
      {onMore ? (
        <FilterChip active={moreOn > 0} onClick={onMore} icon="👥" count={moreOn || undefined}>
          {t('map.people')}
        </FilterChip>
      ) : null}
      {LAYERS.map((l) => (
        <FilterChip key={l.key} active={active.includes(l.key)} onClick={() => toggle(l.key)} icon={l.emoji} count={counts?.[l.key]}>
          {l.label}
        </FilterChip>
      ))}
    </div>
  );
}
