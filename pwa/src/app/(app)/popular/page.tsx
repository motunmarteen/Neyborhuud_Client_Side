import { RedirectTo } from '@/components/navigation/RedirectTo';

/** Legacy /popular: the Feed shows what's popular now. */
export default function PopularPage() {
  return <RedirectTo href="/feed" />;
}
