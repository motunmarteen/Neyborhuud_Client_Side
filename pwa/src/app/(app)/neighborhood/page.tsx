import { RedirectTo } from '@/components/navigation/RedirectTo';

/** The old "My Huud" list became the live map home (Phase 3). Old links open it. */
export default function NeighborhoodMovedPage() {
  return <RedirectTo href="/huud" />;
}
