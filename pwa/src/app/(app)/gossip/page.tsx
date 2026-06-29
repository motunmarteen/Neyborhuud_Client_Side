import { redirect } from 'next/navigation';

/** Legacy /gossip — Huud Gist now lives at its own /gist pillar. */
export default function GossipPage() {
  redirect('/gist');
}
