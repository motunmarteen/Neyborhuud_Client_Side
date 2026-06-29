import PageClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

// Static-export support: emit one placeholder shell; the client component
// resolves the real "code" param at runtime via useParams(). See
// src/lib/staticExportParams.ts.
export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('code');
}

export default function Page() {
  return <PageClient />;
}
