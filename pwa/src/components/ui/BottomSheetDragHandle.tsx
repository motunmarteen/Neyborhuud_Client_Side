'use client';

import type { useBottomSheetDrag } from '@/hooks/useBottomSheetDrag';

type HandleProps = ReturnType<typeof useBottomSheetDrag>['handleProps'];

type BottomSheetDragHandleProps = {
  handleProps: HandleProps;
  className?: string;
};

export function BottomSheetDragHandle({ handleProps, className = '' }: BottomSheetDragHandleProps) {
  return (
    <div {...handleProps} className={`${handleProps.className} ${className}`.trim()}>
      <span className="h-1 w-12 rounded-full bg-[var(--neu-text-muted)]/40 dark:bg-white/20" aria-hidden />
    </div>
  );
}
