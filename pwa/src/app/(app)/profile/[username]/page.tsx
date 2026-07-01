import PageClient from './PageClient';
import { capStaticParams } from '@/lib/staticExportParams';

export const dynamicParams = true;
export function generateStaticParams() {
  return capStaticParams('username');
}

export default function Page() {
  return <PageClient />;
}
