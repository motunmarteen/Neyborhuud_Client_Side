import { redirect } from 'next/navigation';

/** Legacy URLs — redirect old gossip detail paths to Huud Gist threads */
export default async function LegacyLocalNewsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/local-news/gist/${encodeURIComponent(id)}`);
}
