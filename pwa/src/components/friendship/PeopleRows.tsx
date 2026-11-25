'use client';

/** Shared rows for Chats, People and communities. */

import Image from 'next/image';
import { Users } from 'lucide-react';

/** One white list with rounded corners; rows go inside. */
export const LIST_CLASS = 'overflow-hidden rounded-[22px] bg-white shadow-[0_2px_10px_rgba(29,36,51,0.06)]';

export function RowAvatar({ src, name, community, danger }: { src?: string | null; name: string; community?: boolean; danger?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid h-12 w-12 shrink-0 place-items-center overflow-hidden ${community ? 'rounded-2xl' : 'rounded-full'} ${danger ? 'bg-red-soft' : 'bg-green-soft text-brand-green-dark'}`}
    >
      {src ? (
        <Image src={src} alt="" width={48} height={48} className="h-full w-full object-cover" />
      ) : danger ? (
        <span className="text-xl">🚨</span>
      ) : community ? (
        <Users size={22} />
      ) : (
        <span className="text-base font-extrabold">{name.replace('@', '')[0]?.toUpperCase() ?? '?'}</span>
      )}
    </span>
  );
}

export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[22px] bg-white" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3.5 motion-reduce:animate-none">
          <div className="h-12 w-12 shrink-0 rounded-full bg-background" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded-full bg-background" />
            <div className="h-3 w-2/3 rounded-full bg-background" />
          </div>
        </div>
      ))}
    </div>
  );
}
