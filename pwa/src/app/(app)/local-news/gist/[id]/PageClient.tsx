'use client';

import { RedirectTo } from '@/components/navigation/RedirectTo';

/** Gist was removed (owner, 2026-10-15) and its threads deleted; old links open the Feed. */
export default function GistThreadRemoved() {
  return <RedirectTo href="/feed" />;
}
