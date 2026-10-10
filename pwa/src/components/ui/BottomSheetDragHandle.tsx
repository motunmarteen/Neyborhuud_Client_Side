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
      <span className="h-[5px] w-10 rounded-full bg-line" aria-hidden />
    </div>
  );
}
