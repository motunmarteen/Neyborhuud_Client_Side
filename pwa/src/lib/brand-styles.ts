/**
 * Shared brand-token class maps — single source for content-type badges,
 * ambient palettes, and emergency chip styles (DESIGN.md §4).
 */

export const SPHERE_PALETTES: Record<string, [string, string, string]> = {
    post:         ['rgba(0,212,49,0.45)',  'rgba(0,0,255,0.35)',   'rgba(0,111,53,0.25)'],
    event:        ['rgba(0,0,255,0.45)',   'rgba(0,212,49,0.35)',  'rgba(0,111,53,0.25)'],
    marketplace:  ['rgba(0,212,49,0.45)',  'rgba(0,111,53,0.35)',  'rgba(0,0,255,0.25)'],
    emergency:    ['rgba(255,0,0,0.50)',   'rgba(255,0,0,0.35)',   'rgba(0,212,49,0.20)'],
    fyi:          ['rgba(0,212,49,0.45)',  'rgba(0,0,255,0.35)',   'rgba(0,111,53,0.25)'],
    help_request: ['rgba(0,111,53,0.45)',  'rgba(0,212,49,0.35)',   'rgba(0,0,255,0.25)'],
    gossip:       ['rgba(0,0,255,0.45)',   'rgba(0,212,49,0.35)',  'rgba(255,0,0,0.20)'],
    job:          ['rgba(0,0,255,0.45)',   'rgba(0,212,49,0.35)',  'rgba(0,111,53,0.25)'],
};

export const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
    event:        { label: 'EVENT',     cls: 'bg-brand-blue/20 text-white/90 border-brand-blue/25' },
    marketplace:  { label: 'MARKET',    cls: 'bg-primary/20 text-white/90 border-primary/25' },
    emergency:    { label: 'EMERGENCY', cls: 'bg-brand-red/25 text-white/90 border-brand-red/30' },
    fyi:          { label: 'FYI',       cls: 'bg-primary/20 text-white/90 border-primary/25' },
    help_request: { label: 'HELP',      cls: 'bg-brand-green-dark/20 text-white/90 border-brand-green-dark/25' },
    gossip:       { label: 'GOSSIP',    cls: 'bg-brand-blue/20 text-white/90 border-brand-blue/25' },
    job:          { label: 'JOB',       cls: 'bg-brand-blue/20 text-white/90 border-brand-blue/25' },
};

export const EMERGENCY_ACTION_CLS: Record<string, string> = {
    acknowledge: 'bg-brand-blue/25 text-white/90 border-brand-blue/30',
    aware:       'bg-primary/25 text-white/90 border-primary/30',
    nearby:      'bg-brand-green-dark/25 text-white/90 border-brand-green-dark/30',
    safe:        'bg-primary/25 text-white/90 border-primary/30',
    confirm:     'bg-brand-green-dark/25 text-white/90 border-brand-green-dark/30',
    dispute:     'bg-brand-red/25 text-white/90 border-brand-red/30',
};

/** Quick-action accent rotation for sidebar tiles */
export const SIDEBAR_ACCENTS = [
    'var(--brand-blue)',
    'var(--brand-green-dark)',
    'var(--primary)',
    'var(--primary)',
    'var(--brand-red)',
    'var(--brand-blue)',
] as const;
