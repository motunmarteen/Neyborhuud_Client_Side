import PageClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

// Static-export support: this leaf lives under a dynamic [id] segment and
// must declare its own generateStaticParams. The client resolves the real
// param at runtime via useParams(). See src/lib/staticExportParams.ts.
export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('id');
}

export default function Page() {
  return <PageClient />;
}
