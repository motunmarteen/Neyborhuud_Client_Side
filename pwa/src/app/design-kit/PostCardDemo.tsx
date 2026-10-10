'use client';

import { useState } from 'react';
import { Copy, MessageCircle, PenLine, Repeat2, Send } from 'lucide-react';
import { AppBottomSheet } from '@/components/ui/AppBottomSheet';
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

// Prices, rates and targets are integer kobo, like the API. Lost & Found pledges are HuudCredit (never cash).
const SAMPLES: Post[] = [
  { ...base, id: 'd1', contentType: 'post', author: author('Tunde', 'Bakare', 'tunde', 'Somolu', true), content: 'Light don come back for Bajulaiye Road after 3 days. Thank God o! See how the street bright tonight 😄', media: photos(0, 1, 2, 5, 8, 9), likes: 24, comments: 8, shares: 2, createdAt: ago(5) },
  { ...base, id: 'd7', contentType: 'emergency', severity: 'critical', emergencyType: 'fire', author: author('Femi', 'Johnson', 'femi', 'Somolu'), content: 'Fire at the market behind Pedro bus stop. Fire service don dey come. Avoid the area.', media: photos(8, 1), likes: 40, comments: 22, shares: 15, createdAt: ago(2) } as Post,
  { ...base, id: 'd9', contentType: 'post', type: 'poll', author: author('Chidi', 'Nwosu', 'chidi', 'Yaba'), content: 'Estate people, which day should we do the monthly sanitation?', metadata: { poll: { options: [{ text: 'First Saturday', votes: 21 }, { text: 'Last Saturday', votes: 34 }, { text: 'Any Sunday after church', votes: 9 }], myVote: null, endsAt: new Date(Date.now() + 2 * 864e5).toISOString() } satisfies PostPoll }, likes: 6, comments: 14, createdAt: ago(40) },
  { ...base, id: 'd3', contentType: 'marketplace', author: author('Kemi', 'Ade', 'kemi', 'Ikeja'), content: 'Fairly used Samsung fridge, still very cold. Moving out so I need to sell quick.', price: 18_500_000, isNegotiable: true, itemCondition: 'used', itemCategory: 'appliances', deliveryOption: 'pickup', media: photos(3, 4, 6), likes: 5, comments: 4, createdAt: ago(60) },
  { ...base, id: 'd10', contentType: 'fyi', author: author('Aisha', 'Bello', 'aisha', 'Surulere'), content: 'I lost my black Tecno phone inside a keke from Ojuelegba to Bode Thomas. Please if you see am, help me..', metadata: { fyiType: 'lost_found', lostFound: { kind: 'lost', itemName: 'Black Tecno Camon phone', category: 'phone', place: 'Keke, Ojuelegba to Bode Thomas', seenAt: new Date(Date.now() - 864e5).toISOString(), pledge: 200, pledgeStatus: 'held', status: 'open' } }, media: photos(5, 7), helpfulCount: 4, comments: 3, createdAt: ago(90) },
  { ...base, id: 'd11', contentType: 'fyi', author: author('Musa', 'Ibrahim', 'musa_i', 'Bariga'), content: 'Found this school bag with books near the Bariga junction BRT stop. I dey keep am for my shop. Owner, tell me wetin dey inside make I know say na you.', metadata: { fyiType: 'lost_found', lostFound: { kind: 'found', itemName: 'Blue school bag', category: 'bag', place: 'Bariga junction BRT stop', seenAt: new Date(Date.now() - 3 * 3600_000).toISOString(), pledge: 0, pledgeStatus: 'none', status: 'open' } }, media: photos(6), helpfulCount: 9, comments: 2, createdAt: ago(25) },
  { ...base, id: 'd4', contentType: 'job', author: author('Ibrahim', 'Musa', 'ibrahim', 'Surulere'), content: 'We need a cashier for our supermarket on Adeniran Ogunsanya.', metadata: { jobTitle: 'Cashier', jobType: 'full_time', salary: '80,000', workMode: 'on-site', requirements: 'OND, 1 year experience' }, media: photos(7), comments: 11, createdAt: ago(120) },
  { ...base, id: 'd5', contentType: 'event', author: author('Ada', 'Okafor', 'ada', 'Lekki'), content: 'Estate residents meeting. We go talk about security and the new gate levy.', eventDate: new Date(Date.now() + 3 * 864e5).toISOString(), eventTime: '4:00 PM', venue: { name: 'Community Hall', address: 'Block C' }, ticketInfo: 'free', metadata: { attendeesCount: 18 }, media: photos(2, 0, 1, 9), likes: 12, comments: 6, createdAt: ago(200) },
  { ...base, id: 'd6', contentType: 'services', author: author('Segun', 'Ola', 'segun', 'Gbagada'), content: 'Professional AC repair and gas refill. Fast and neat work.', metadata: { serviceName: 'AC repair & gas refill', serviceCategory: 'repairs', rate: 1_500_000, rateType: 'flat', serviceArea: 'Gbagada, Anthony, Maryland', availability: 'available' }, media: photos(9, 4), likes: 7, createdAt: ago(300) },
  { ...base, id: 'd2', contentType: 'fyi', author: author('Ngozi', 'Eze', 'ngozi', 'Yaba'), content: 'Water board people dey work for Herbert Macaulay. Road partly closed till evening. Use Commercial Avenue.', media: photos(5), helpfulCount: 14, likes: 3, comments: 2, createdAt: ago(18) } as Post,
  { ...base, id: 'd8', contentType: 'help_request', author: author('Bisi', 'Lawal', 'bisi', 'Bariga'), content: 'Please I need help with my mum hospital bill at LUTH. Anything you fit give, God bless you.', helpCategory: 'medical', targetAmount: 15_000_000, amountReceived: 6_200_000, media: photos(6, 1, 0), likes: 9, comments: 5, createdAt: ago(45) },
];

// Sharing inside the app: a plain repost (the original card with a "reposted" line)
// and a repost with comment (the sharer's words, with the original framed inside).
const original = (id: string) => SAMPLES.find((p) => p.id === id)!;
SAMPLES.splice(
  2,
  0,
  { ...original('d3'), id: 'r1', repostedBy: { id: 'u-chidi', name: 'Chidi Nwosu', username: 'chidi' } },
  {
    ...base,
    id: 'r2',
    contentType: 'post',
    mood: 'repost',
    author: author('Kemi', 'Ade', 'kemi', 'Ikeja'),
    content: 'Abeg if you get family around Pedro, call them make dem stay indoors 🙏🏾',
    quotedPost: original('d7'),
    likes: 18,
    comments: 4,
    shares: 9,
    createdAt: ago(1),
  },
);

const SHARE_OPTIONS = [
  { key: 'repost', label: 'Repost', sub: 'Share it to your neighbours as it is', icon: Repeat2 },
  { key: 'quote', label: 'Repost with comment', sub: 'Add your own words on top', icon: PenLine },
  { key: 'chat', label: 'Send in a chat', sub: 'To a neighbour or a group', icon: Send },
  { key: 'whatsapp', label: 'WhatsApp', sub: 'Share the link outside NeyborHuud', icon: MessageCircle },
  { key: 'copy', label: 'Copy link', sub: 'Paste it anywhere', icon: Copy },
];

export function PostCardDemo() {
  const [posts, setPosts] = useState(SAMPLES);
  const [going, setGoing] = useState<Record<string, boolean>>({});
  const [shareFor, setShareFor] = useState<string | null>(null);
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
            onShare={() => setShareFor(p.id)}
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

      <AppBottomSheet open={shareFor !== null} onClose={() => setShareFor(null)} title="Share this post">
        <div className="flex flex-col gap-1 pb-2">
          {SHARE_OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => setShareFor(null)}
                className="flex min-h-14 items-center gap-3 rounded-2xl px-2 text-left transition-colors hover:bg-background"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-soft text-brand-green-dark">
                  <Icon size={19} aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold text-navy">{o.label}</span>
                  <span className="block text-xs text-muted">{o.sub}</span>
                </span>
              </button>
            );
          })}
        </div>
      </AppBottomSheet>
    </div>
  );
}
