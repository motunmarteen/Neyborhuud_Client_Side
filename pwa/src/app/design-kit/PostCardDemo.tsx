'use client';

import { useState } from 'react';
import type { Post } from '@/types/api';
import { PostCard, type EmergencyAction } from '@/components/feed/PostCard';

const author = (first: string, last: string, username: string, lga: string, verified = false) =>
  ({ id: `u-${username}`, firstName: first, lastName: last, name: `${first} ${last}`, username, avatarUrl: null, isVerified: verified, location: { lga, state: 'Lagos' } }) as unknown as Post['author'];

const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const base = { likes: 0, comments: 0, shares: 0, views: 0 };

// Prices, rates and targets are integer kobo, like the API.
const SAMPLES: Post[] = [
  { ...base, id: 'd1', contentType: 'post', author: author('Tunde', 'Bakare', 'tunde', 'Somolu', true), content: 'Light don come back for Bajulaiye Road after 3 days. Thank God o! Who else get light for their side?', media: [{ url: '/images/auth-hero.jpg', type: 'image' }] as Post['media'], likes: 24, comments: 8, shares: 2, createdAt: ago(5) },
  { ...base, id: 'd7', contentType: 'emergency', severity: 'critical', emergencyType: 'fire', author: author('Femi', 'Johnson', 'femi', 'Somolu'), content: 'Fire at the market behind Pedro bus stop. Fire service don dey come. Avoid the area.', likes: 40, comments: 22, shares: 15, createdAt: ago(2) } as Post,
  { ...base, id: 'd3', contentType: 'marketplace', author: author('Kemi', 'Ade', 'kemi', 'Ikeja'), content: 'Fairly used Samsung fridge, still very cold. Moving out so I need to sell quick.', price: 18_500_000, isNegotiable: true, itemCondition: 'used', itemCategory: 'appliances', deliveryOption: 'pickup', media: [{ url: '/illustration_delivery.png', type: 'image' }] as Post['media'], likes: 5, comments: 4, createdAt: ago(60) },
  { ...base, id: 'd4', contentType: 'job', author: author('Ibrahim', 'Musa', 'ibrahim', 'Surulere'), content: 'We need a cashier for our supermarket on Adeniran Ogunsanya.', metadata: { jobTitle: 'Cashier', jobType: 'full_time', salary: '80000', workMode: 'on-site', requirements: 'OND, 1 year experience' }, comments: 11, createdAt: ago(120) },
  { ...base, id: 'd5', contentType: 'event', author: author('Ada', 'Okafor', 'ada', 'Lekki'), content: 'Estate residents meeting. We go talk about security and the new gate levy.', eventDate: new Date(Date.now() + 3 * 864e5).toISOString(), eventTime: '4:00 PM', venue: { name: 'Community Hall', address: 'Block C' }, ticketInfo: 'free', metadata: { attendeesCount: 18 }, likes: 12, comments: 6, createdAt: ago(200) },
  { ...base, id: 'd6', contentType: 'services', author: author('Segun', 'Ola', 'segun', 'Gbagada'), content: 'Professional AC repair and gas refill. Fast and neat work.', metadata: { serviceName: 'AC repair & gas refill', serviceCategory: 'repairs', rate: 1_500_000, rateType: 'flat', serviceArea: 'Gbagada, Anthony, Maryland', availability: 'available' }, likes: 7, createdAt: ago(300) },
  { ...base, id: 'd2', contentType: 'fyi', author: author('Ngozi', 'Eze', 'ngozi', 'Yaba'), content: 'Water board people dey work for Herbert Macaulay. Road partly closed till evening. Use Commercial Avenue.', helpfulCount: 14, likes: 3, comments: 2, createdAt: ago(18) } as Post,
  { ...base, id: 'd8', contentType: 'help_request', author: author('Bisi', 'Lawal', 'bisi', 'Bariga'), content: 'Please I need help with my mum hospital bill at LUTH. Anything you fit give, God bless you.', helpCategory: 'medical', targetAmount: 15_000_000, amountReceived: 6_200_000, likes: 9, comments: 5, createdAt: ago(45) },
];

export function PostCardDemo() {
  const [posts, setPosts] = useState(SAMPLES);
  const [going, setGoing] = useState<Record<string, boolean>>({});

  const update = (id: string, fn: (p: Post) => Partial<Post>) =>
    setPosts((all) => all.map((p) => (p.id === id ? { ...p, ...fn(p) } : p)));

  const emergency = (id: string) => (a: EmergencyAction) =>
    update(id, (p) => {
      if (a === 'confirm' || a === 'dispute') return { confirmDisputeAction: p.confirmDisputeAction === a ? null : a };
      if (a === 'safe') return { isSafe: !p.isSafe };
      return { isNearby: !p.isNearby };
    });

  return (
    <div className="-mx-2 flex flex-col gap-3 rounded-3xl bg-background p-2">
      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          onLike={() => update(p.id, (x) => ({ isLiked: !x.isLiked, likes: x.likes + (x.isLiked ? -1 : 1) }))}
          onSave={() => update(p.id, (x) => ({ isSaved: !x.isSaved }))}
          onRepost={() => update(p.id, (x) => ({ isShared: !x.isShared, shares: x.shares + (x.isShared ? -1 : 1) }))}
          onHelpful={() => update(p.id, (x) => ({ isHelpful: !x.isHelpful, helpfulCount: ((x.helpfulCount as number) ?? 0) + (x.isHelpful ? -1 : 1) }) as Partial<Post>)}
          onComment={() => {}}
          onShare={() => {}}
          onMenu={() => {}}
          onFollow={() => {}}
          onEmergencyAction={emergency(p.id)}
          onPrimaryAction={(a) => (a === 'going' ? setGoing((g) => ({ ...g, [p.id]: !g[p.id] })) : undefined)}
          isGoing={!!going[p.id]}
        />
      ))}
    </div>
  );
}
