'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip, FilterChip } from '@/components/ui/Chip';

const LAYERS = [
  { id: 'all', label: 'All', icon: '🗺️' },
  { id: 'safety', label: 'Safety', icon: '🚨', count: 2 },
  { id: 'market', label: 'Market', icon: '🛒' },
  { id: 'events', label: 'Events', icon: '🎉', count: 1 },
  { id: 'jobs', label: 'Jobs', icon: '💼' },
  { id: 'fyi', label: 'FYI', icon: '📢' },
];

export function CardsAndChipsDemo() {
  const [layer, setLayer] = useState('all');

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Filter chips (map layers)</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
          {LAYERS.map((l) => (
            <FilterChip key={l.id} active={layer === l.id} onClick={() => setLayer(l.id)} icon={l.icon} count={l.count}>
              {l.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Chips (labels)</p>
        <div className="flex flex-wrap gap-2">
          <Chip tone="green" icon="✓">Confirmed</Chip>
          <Chip tone="red" icon="🚨">Safety alert</Chip>
          <Chip tone="amber" icon="🪙">+5 HuudCredit</Chip>
          <Chip tone="purple" icon="🎉">Event</Chip>
          <Chip tone="blue" icon="ℹ️">Info</Chip>
          <Chip>2 mins ago</Chip>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-faint">Cards</p>
        <div className="flex flex-col gap-3 rounded-3xl bg-background p-3">
          <Card>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-soft text-xl" aria-hidden>💡</span>
              <div className="min-w-0">
                <p className="font-bold">Light don come back for Adeola Odeku</p>
                <p className="mt-0.5 text-sm text-muted">Two neighbours confirmed it.</p>
                <div className="mt-2 flex gap-2">
                  <Chip tone="green" icon="✓">Confirmed</Chip>
                  <Chip>5 mins ago</Chip>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="accent" accentColor="#7A4FD8">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-purple-soft text-xl" aria-hidden>🎉</span>
              <div className="min-w-0">
                <p className="font-bold">Estate residents&apos; meeting</p>
                <p className="mt-0.5 text-sm text-muted">Saturday, 4pm · Community hall</p>
              </div>
            </div>
          </Card>

          <Card variant="floating" padding="sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-red-soft text-lg" aria-hidden>🚧</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Road blocked on Admiralty Way</p>
                <p className="text-xs text-muted">Floating card — sits on top of the map</p>
              </div>
              <Chip tone="red">Live</Chip>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
