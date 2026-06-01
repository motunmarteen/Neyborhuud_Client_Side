'use client';

/**
 * useSos — reads app-wide SOS state from SosProvider.
 * @see src/contexts/SosContext.tsx
 */

export type { SosPhase, SosNotifyMeta, SosTriggerOptions, UseSosReturn } from '@/contexts/SosContext';
export { useSosContext as useSos } from '@/contexts/SosContext';
