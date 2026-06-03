import { redirect } from 'next/navigation';

/** Legacy /popular URL — merged into My Huud (Street Radar tab) */
export default async function PopularPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const legacy = params.tab;
  const tab = !legacy || legacy === 'hot' ? 'street-radar' : legacy;
  redirect(`/neighborhood?tab=${encodeURIComponent(tab)}`);
}
