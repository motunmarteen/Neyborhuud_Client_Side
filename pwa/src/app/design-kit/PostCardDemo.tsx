'use client';

import { useState } from 'react';
import type { Post } from '@/types/api';
import { PostCard, type EmergencyAction, type PostPoll } from '@/components/feed/PostCard';

const author = (first: string, last: string, username: string, lga: string, verified = false) =>
  ({ id: `u-${username}`, firstName: first, lastName: last, name: `${first} ${last}`, username, avatarUrl: null, isVerified: verified, location: { lga, state: 'Lagos' } }) as unknown as Post['author'];

const ago = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const base = { likes: 0, comments: 0, shares: 0, views: 0 };

const IMG = [
  '/images/auth-hero.jpg',
  '/illustration_community_alert.png',
  '/illustration_events.png',
  '/illustration_marketplace.png',
  '/illustration_delivery.png',
  '/illustration_fyi.png',
  '/illustration_help.png',
  '/illustration_jobs.png',
  '/illustration_safety.png',
  '/illustration_services.png',
];
const photos = (...idx: number[]) => idx.map((i) => ({ url: IMG[i], type: 'image' })) as Post['media'];

// Prices, rates, targets and rewards are integer kobo, like the API.
const SAMPLES: Post[] = [
  { ...base, id: 'd1', contentType: 'post', author: author('Tunde', 'Bakare', 'tunde', 'Somolu', true), content: 'Light don come back for Bajulaiye Road after 3 days. Thank God o! See how the street bright tonight 😄', media: photos(0, 1, 2, 5, 8, 9), likes: 24, comments: 8, shares: 2, createdAt: ago(5) },
  { ...base, id: 'd7', contentType: 'emergency', severity: 'critical', emergencyType: 'fire', author: author('Femi', 'Johnson', 'femi', 'Somolu'), content: 'Fire at the market behind Pedro bus stop. Fire service don dey come. Avoid the area.', media: photos(8, 1), likes: 40, comments: 22, shares: 15, createdAt: ago(2) } as Post,
  { ...base, id: 'd9', contentType: 'post', type: 'poll', author: author('Chidi', 'Nwosu', 'chidi', 'Yaba'), content: 'Estate people, which day should we do the monthly sanitation?', metadata: { poll: { options: [{ text: 'First Saturday', votes: 21 }, { text: 'Last Saturday', votes: 34 }, { text: 'Any Sunday after church', votes: 9 }], myVote: null, endsAt: new Date(Date.now() + 2 * 864e5).toISOString() } satisfies PostPoll }, likes: 6, comments: 14, createdAt: ago(40) },
  { ...base, id: 'd3', contentType: 'marketplace', author: author('Kemi', 'Ade', 'kemi', 'Ikeja'), content: 'Fairly used Samsung fridge, still very cold. Moving out so I need to sell quick.', price: 18_500_000, isNegotiable: true, itemCondition: 'used', itemCategory: 'appliances', deliveryOption: 'pickup', media: photos(3, 4, 6), likes: 5, comments: 4, createdAt: ago(60) },
  { ...base, id: 'd10', contentType: 'fyi', author: author('Aisha', 'Bello', 'aisha', 'Surulere'), content: 'I lost my black Tecno phone inside a keke from Ojuelegba to Bode Thomas. Please if you see am, help me. The lock screen na my daughter picture.', metadata: { fyiType: 'lost_found', lostFound: 'lost', itemName: 'Black Tecno Camon phone', lastSeen: 'Keke, Ojuelegba to Bode Thomas', seenAt: 'Yesterday, 6pm', reward: 1_000_000 }, media: photos(5, 7), helpfulCount: 4, comments: 3, createdAt: ago(90) },
  { ...base, id: 'd11', contentType: 'fyi', author: author('Musa', 'Ibrahim', 'musa_i', 'Bariga'), content: 'Found this school bag with books near the Bariga junction BRT stop. The name inside is Tobi. I dey keep am for my shop.', metadata: { fyiType: 'lost_found', lostFound: 'found', itemName: 'Blue school bag', lastSeen: 'Bariga junction BRT stop', seenAt: 'This morning' }, media: photos(6), helpfulCount: 9, comments: 2, createdAt: ago(25) },
  { ...base, id: 'd4', contentType: 'job', author: author('Ibrahim', 'Musa', 'ibrahim', 'Surulere'), content: 'We need a cashier for our supermarket on Adeniran Ogunsanya.', metadata: { jobTitle: 'Cashier', jobType: 'full_time', salary: '80,000', workMode: 'on-site', requirements: 'OND, 1 year experience' }, media: photos(7), comments: 11, createdAt: ago(120) },
  { ...base, id: 'd5', contentType: 'event', author: author('Ada', 'Okafor', 'ada', 'Lekki'), content: 'Estate residents meeting. We go talk about security and the new gate levy.', eventDate: new Date(Date.now() + 3 * 864e5).toISOString(), eventTime: '4:00 PM', venue: { name: 'Community Hall', address: 'Block C' }, ticketInfo: 'free', metadata: { attendeesCount: 18 }, media: photos(2, 0, 1, 9), likes: 12, comments: 6, createdAt: ago(200) },
  { ...base, id: 'd6', contentType: 'services', author: author('Segun', 'Ola', 'segun', 'Gbagada'), content: 'Professional AC repair and gas refill. Fast and neat work.', metadata: { serviceName: 'AC repair & gas refill', serviceCategory: 'repairs', rate: 1_500_000, rateType: 'flat', serviceArea: 'Gbagada, Anthony, Maryland', availability: 'available' }, media: photos(9, 4), likes: 7, createdAt: ago(300) },
  { ...base, id: 'd2', contentType: 'fyi', author: author('Ngozi', 'Eze', 'ngozi', 'Yaba'), content: 'Water board people dey work for Herbert Macaulay. Road partly closed till evening. Use Commercial Avenue.', media: photos(5), helpfulCount: 14, likes: 3, comments: 2, createdAt: ago(18) } as Post,
  { ...base, id: 'd8', contentType: 'help_request', author: author('Bisi', 'Lawal', 'bisi', 'Bariga'), content: 'Please I need help with my mum hospital bill at LUTH. Anything you fit give, God bless you.', helpCategory: 'medical', targetAmount: 15_000_000, amountReceived: 6_200_000, media: photos(6, 1, 0), likes: 9, comments: 5, createdAt: ago(45) },
];

export function PostCardDemo() {
  const [posts, setPosts] = useState(SAMPLES);
  const [going, setGoing] = useState<Record<string, boolean>>({});
  const [following, setFollowing] = useState<Record<string, boolean>>({ 'u-ada': true });

  const update = (id: string, fn: (p: Post) => Partial<Post>) =>
    setPosts((all) => all.map((p) => (p.id === id ? { ...p, ...fn(p) } : p)));

  const emergency = (id: string) => (a: EmergencyAction) =>
    update(id, (p) => {
      if (a === 'confirm' || a === 'dispute') return { confirmDisputeAction: p.confirmDisputeAction === a ? null : a };
      if (a === 'safe') return { isSafe: !p.isSafe };
      return { isNearby: !p.isNearby };
    });

  const vote = (id: string) => (i: number) =>
    update(id, (p) => {
      const poll = p.metadata?.poll as PostPoll;
      const options = poll.options.map((o, k) => (k === i ? { ...o, votes: o.votes + 1 } : o));
      return { metadata: { ...p.metadata, poll: { ...poll, options, myVote: i } } };
    });

  return (
    <div className="-mx-5 flex flex-col gap-3 bg-background py-3">
      {posts.map((p) => {
        const authorId = (p.author as { id: string }).id;
        return (
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
            onFollow={() => setFollowing((f) => ({ ...f, [authorId]: !f[authorId] }))}
            isFollowing={!!following[authorId]}
            onEmergencyAction={emergency(p.id)}
            onVote={vote(p.id)}
            onPrimaryAction={(a) => (a === 'going' ? setGoing((g) => ({ ...g, [p.id]: !g[p.id] })) : undefined)}
            isGoing={!!going[p.id]}
          />
        );
      })}
    </div>
  );
}
