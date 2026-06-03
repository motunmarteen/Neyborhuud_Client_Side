import { redirect } from 'next/navigation';

/** Legacy /gossip — Huud Gist lives under Local News */
export default function GossipPage() {
  redirect('/local-news?tab=huud-gist');
}
