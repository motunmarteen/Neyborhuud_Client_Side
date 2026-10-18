import { RedirectTo } from '@/components/navigation/RedirectTo';

/** The old discovery map was merged into the map home (My Huud). Old links open it. */
export default function MapMovedPage() {
  return <RedirectTo href="/huud" />;
}
