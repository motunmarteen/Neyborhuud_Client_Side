import PageClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

// Static-export support: emit one placeholder shell; the client component
// resolves the real "sessionId" param at runtime via useParams(). Mirrors
// the same pattern used by /safety/trips/watch/[userId].
export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('sessionId');
}

export default function Page() {
  return <PageClient />;
}
