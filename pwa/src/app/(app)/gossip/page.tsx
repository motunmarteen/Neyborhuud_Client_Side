import { RedirectTo } from '@/components/navigation/RedirectTo';

/** Gist was removed (owner, 2026-10-15): the Feed replaced it. Old links open the Feed. */
export default function GistRemovedPage() {
  return <RedirectTo href="/feed" />;
}
