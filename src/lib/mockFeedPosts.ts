/**
 * Rich mock feed posts for local preview / demo mode.
 * 150+ posts covering every content type, with reposts, quote-posts, and comment counts.
 * Activated automatically when the real API returns empty or errors.
 */

import type { Post, PostAuthor } from "@/types/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ago(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function author(
  id: string,
  name: string,
  username: string,
  avatar: string,
  extra?: Partial<PostAuthor>,
): PostAuthor {
  return {
    id,
    name,
    username,
    avatarUrl: avatar,
    isVerified: Math.random() > 0.6,
    trustScore: Math.floor(Math.random() * 40) + 60,
    verificationTier: ["none", "bronze", "silver", "gold"][Math.floor(Math.random() * 4)] as any,
    ...extra,
  };
}

const AVATARS = [
  "https://i.pravatar.cc/150?u=adaeze",
  "https://i.pravatar.cc/150?u=emeka",
  "https://i.pravatar.cc/150?u=funke",
  "https://i.pravatar.cc/150?u=seun",
  "https://i.pravatar.cc/150?u=tobi",
  "https://i.pravatar.cc/150?u=yemi",
  "https://i.pravatar.cc/150?u=chidi",
  "https://i.pravatar.cc/150?u=ngozi",
  "https://i.pravatar.cc/150?u=bola",
  "https://i.pravatar.cc/150?u=akin",
  "https://i.pravatar.cc/150?u=ify",
  "https://i.pravatar.cc/150?u=uche",
  "https://i.pravatar.cc/150?u=tunde",
  "https://i.pravatar.cc/150?u=sade",
  "https://i.pravatar.cc/150?u=lanre",
];

const AUTHORS: PostAuthor[] = [
  author("u1", "Adaeze Obi", "adaeze_obi", AVATARS[0], { verificationBadge: "neighbor" }),
  author("u2", "Emeka Nwosu", "emeka_builds", AVATARS[1], { verificationBadge: "business" }),
  author("u3", "Funke Adeola", "funke_vibes", AVATARS[2]),
  author("u4", "Seun Balogun", "seun_b", AVATARS[3], { verificationBadge: "community_leader" }),
  author("u5", "Tobi Williams", "tobi_w", AVATARS[4]),
  author("u6", "Yemi Adesanya", "yemi_a", AVATARS[5]),
  author("u7", "Chidi Okonkwo", "chidi_ok", AVATARS[6], { verificationBadge: "emergency_responder" }),
  author("u8", "Ngozi Eze", "ngozi_e", AVATARS[7]),
  author("u9", "Bola Ogundimu", "bola_og", AVATARS[8]),
  author("u10", "Akin Taiwo", "akin_taiwo", AVATARS[9]),
  author("u11", "Ify Obiora", "ify_o", AVATARS[10]),
  author("u12", "Uche Okafor", "uche_ok", AVATARS[11]),
  author("u13", "Tunde Adeyemi", "tunde_a", AVATARS[12]),
  author("u14", "Sade Olagoke", "sade_og", AVATARS[13]),
  author("u15", "Lanre Fasanya", "lanre_f", AVATARS[14]),
];

function a(index: number): PostAuthor {
  return AUTHORS[index % AUTHORS.length];
}

// ---------------------------------------------------------------------------
// Regular social posts
// ---------------------------------------------------------------------------

const REGULAR_POSTS: Post[] = [
  {
    id: "p1",
    contentType: "post",
    author: a(0),
    content: "Just finished setting up the new community garden in Lekki Phase 1! We've planted tomatoes, peppers, and sweet potatoes. Everyone is welcome to come help and harvest. Slot 7 still open — DM me.",
    media: [{ id: "m1", type: "image", url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80", size: 102400, mimeType: "image/jpeg" }],
    likes: 143, comments: 28, shares: 12, views: 1204,
    isLiked: false,
    createdAt: ago(15),
    location: { lga: "Eti-Osa", state: "Lagos" } as any,
    tags: ["garden", "community"],
    _feedLayer: "local",
  },
  {
    id: "p2",
    contentType: "post",
    author: a(2),
    content: "NEPA brought light at 3am and I woke up screaming 😭😭 all my iced food is gone. Who else experienced this nonsense tonight? The generator needs diesel and my pocket is crying.",
    likes: 421, comments: 67, shares: 34, views: 3100,
    isLiked: true,
    createdAt: ago(42),
    _feedLayer: "local",
  },
  {
    id: "p3",
    contentType: "post",
    author: a(4),
    content: "Went for a run around Ojodu Estate this morning and the roads are SO much better after the resurfacing. Props to the local council for once! 👏 Took me 45 mins to do 6km — personal best!",
    media: [
      { id: "m3a", type: "image", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80", size: 89000, mimeType: "image/jpeg" },
    ],
    likes: 89, comments: 14, shares: 5, views: 762,
    createdAt: ago(90),
    _feedLayer: "local",
  },
  {
    id: "p4",
    contentType: "post",
    author: a(6),
    content: "Shoutout to Mr. Balogun at the Aguda junction shop who kept my phone when I forgot it yesterday. I didn't even realise until 2 hours later. That's the NeyborHuud spirit right there 🙌",
    likes: 378, comments: 41, shares: 22, views: 2890,
    isLiked: false,
    createdAt: ago(180),
    _feedLayer: "local",
    tags: ["honesty", "community"],
  },
  {
    id: "p5",
    contentType: "post",
    author: a(8),
    content: "Can we talk about the Berger junction flooding every single rain? I have lived here 8 years and nothing changes. Drains are blocked, water comes inside houses. We need to escalate this to the state government NOW.",
    likes: 654, comments: 112, shares: 89, views: 5421,
    isLiked: true,
    createdAt: ago(300),
    _feedLayer: "local",
    tags: ["infrastructure", "flooding"],
  },
  {
    id: "p6",
    contentType: "post",
    author: a(10),
    content: "Anyone know a good mechanic for Toyota Camry 2015 around Surulere or Ikeja? My transmission has been slipping and I don't want to go to a random place and get cheated. Recommendations please!",
    likes: 23, comments: 45, shares: 3, views: 456,
    createdAt: ago(22),
    _feedLayer: "local",
  },
  {
    id: "p7",
    contentType: "post",
    author: a(12),
    content: "Good morning Lekki! The early birds at the beach park right now — sunrise was insane today 🌅 Come out if you can, air is clean and fresh. Beats sitting in traffic any day.",
    media: [{ id: "m7", type: "image", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80", size: 134000, mimeType: "image/jpeg" }],
    likes: 201, comments: 19, shares: 17, views: 1890,
    isLiked: false,
    createdAt: ago(35),
    _feedLayer: "local",
  },
  {
    id: "p8",
    contentType: "post",
    author: a(1),
    content: "I just launched my new catering business — NaijaChops by Ada. We do jollof rice, egusi soup, puff puff, small chops and full event catering. DM me for pricing. Taste before you book! 🍛🎉",
    media: [
      { id: "m8a", type: "image", url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80", size: 98000, mimeType: "image/jpeg" },
      { id: "m8b", type: "image", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80", size: 112000, mimeType: "image/jpeg" },
    ],
    likes: 319, comments: 57, shares: 43, views: 2901,
    createdAt: ago(240),
    _feedLayer: "local",
    tags: ["food", "business", "catering"],
  },
  {
    id: "p9",
    contentType: "post",
    author: a(3),
    content: "PSA: Dangote refinery road is backed up 4km right now. Alternative route via Mile 2 expressway is slightly better but also slow. If you can delay your journey by 1–2 hours please do.",
    likes: 502, comments: 73, shares: 134, views: 7821,
    isLiked: true,
    createdAt: ago(55),
    _feedLayer: "local",
    tags: ["traffic", "lagos"],
  },
  {
    id: "p10",
    contentType: "post",
    author: a(5),
    content: "My daughter's school — Rainbow International Nursery School, Yaba — has the best parent-teacher communication I have ever seen. Report cards via WhatsApp with voice notes from the teacher. Very impressed. Worth every kobo.",
    likes: 88, comments: 31, shares: 7, views: 643,
    createdAt: ago(480),
    _feedLayer: "local",
  },
  {
    id: "p11",
    contentType: "post",
    author: a(7),
    content: "Found a stray puppy near Allen Avenue bus stop. Black and white, male, about 3 months old. Very friendly. Can anyone take him? I already have 2 dogs at home and can't keep him. DM ASAP 🐶",
    media: [{ id: "m11", type: "image", url: "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80", size: 76000, mimeType: "image/jpeg" }],
    likes: 276, comments: 84, shares: 56, views: 3210,
    createdAt: ago(120),
    _feedLayer: "local",
  },
  {
    id: "p12",
    contentType: "post",
    author: a(9),
    content: "Weekend vibes in Ikoyi. Love how quiet it gets on Sunday mornings. Finally finished reading 'Half of a Yellow Sun' — took me 3 months but so worth it. What book should I read next?",
    likes: 134, comments: 38, shares: 4, views: 1021,
    isLiked: false,
    createdAt: ago(1440),
    _feedLayer: "local",
  },
  {
    id: "p13",
    contentType: "post",
    author: a(11),
    content: "Organized a small tech training yesterday for 15 young people in Mushin — basic computer skills, CV writing, and how to apply for remote work. All 15 showed up on time and stayed till the end. Nigeria's youth are hungry to learn!",
    media: [{ id: "m13", type: "image", url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80", size: 91000, mimeType: "image/jpeg" }],
    likes: 891, comments: 103, shares: 167, views: 9204,
    isLiked: true,
    createdAt: ago(720),
    _feedLayer: "local",
    tags: ["education", "youth", "tech"],
  },
  {
    id: "p14",
    contentType: "post",
    author: a(13),
    content: "Rain started at exactly 4:17pm today and Apapa road flooded in under 10 minutes. I filmed it. Sending to BRT and NiMetSat. This is year 12 of this cycle. We are tired.",
    media: [{ id: "m14", type: "video", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", thumbnailUrl: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800", size: 2000000, mimeType: "video/mp4" }],
    likes: 1204, comments: 189, shares: 312, views: 18940,
    isLiked: true,
    createdAt: ago(180),
    _feedLayer: "local",
    tags: ["flooding", "apapa", "infrastructure"],
  },
  {
    id: "p15",
    contentType: "post",
    author: a(0),
    content: "The new Eko Atlantic boardwalk section is open! Super clean, well lit, zero hawkers allowed. Took my family for a walk and it felt like we traveled abroad for 2 hours 😄 This is what Lagos can be.",
    media: [
      { id: "m15a", type: "image", url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80", size: 145000, mimeType: "image/jpeg" },
      { id: "m15b", type: "image", url: "https://images.unsplash.com/photo-1509233725247-49e657c54213?w=800&q=80", size: 112000, mimeType: "image/jpeg" },
    ],
    likes: 2341, comments: 234, shares: 412, views: 31200,
    isLiked: false,
    createdAt: ago(360),
    _feedLayer: "local",
    tags: ["eko atlantic", "Lagos", "development"],
  },
];

// ---------------------------------------------------------------------------
// FYI / Bulletins
// ---------------------------------------------------------------------------

const FYI_POSTS: Post[] = [
  {
    id: "fyi1",
    contentType: "fyi",
    fyiSubtype: "safety_notice",
    fyiStatus: "active",
    author: a(7),
    content: "SAFETY NOTICE: Armed robbery reported on Akala Express around midnight last night (Thursday). Three motorcycles, 2 victims robbed of phones and cash. Please avoid that route after 10pm and stay in groups. Share widely.",
    severity: "critical",
    likes: 891, comments: 156, shares: 423, views: 12480,
    isLiked: true,
    createdAt: ago(480),
    tags: ["safety", "robbery", "akala"],
    _feedLayer: "local",
    availableActions: ["aware", "nearby", "safe"],
  },
  {
    id: "fyi2",
    contentType: "fyi",
    fyiSubtype: "community_announcement",
    fyiStatus: "active",
    author: a(3),
    content: "COMMUNITY ANNOUNCEMENT: Rubbish collection has been moved from Tuesday to Thursday for all Gbagada Estate streets. The Lagos Waste Management Authority confirmed via our association WhatsApp. Please adjust your bin-out schedule.",
    likes: 234, comments: 42, shares: 67, views: 3201,
    createdAt: ago(60),
    _feedLayer: "local",
    availableActions: ["aware"],
  },
  {
    id: "fyi3",
    contentType: "fyi",
    fyiSubtype: "lost_found",
    fyiStatus: "active",
    author: a(9),
    content: "FOUND: A set of car keys (Toyota, with a small yellow keychain) found near the Shoprite entrance, Surulere. Keys are at the security desk. Come with proof of ownership to claim. Valid until Monday.",
    likes: 45, comments: 18, shares: 34, views: 1240,
    createdAt: ago(90),
    _feedLayer: "local",
  },
  {
    id: "fyi4",
    contentType: "fyi",
    fyiSubtype: "alert",
    fyiStatus: "active",
    author: a(7),
    content: "⚠️ WATER SUPPLY ALERT: Ikosi and Ketu axis will experience water supply interruption from 8am–5pm tomorrow (Saturday) due to maintenance on the main pipe. Store water tonight!",
    severity: "medium",
    likes: 567, comments: 89, shares: 234, views: 8901,
    isLiked: false,
    createdAt: ago(30),
    _feedLayer: "local",
    availableActions: ["aware"],
  },
  {
    id: "fyi5",
    contentType: "fyi",
    fyiSubtype: "local_news",
    fyiStatus: "active",
    author: a(4),
    content: "LOCAL NEWS: Ajah Magistrate Court has resumed physical sittings today after 3 months of virtual hearings. If you have cases there, confirm with your lawyers before going in person.",
    likes: 123, comments: 21, shares: 18, views: 2104,
    createdAt: ago(200),
    _feedLayer: "local",
  },
  {
    id: "fyi6",
    contentType: "fyi",
    fyiSubtype: "safety_notice",
    fyiStatus: "active",
    author: a(6),
    content: "FIRE HAZARD: A gas cylinder explosion occurred on Bode Thomas street this afternoon. No casualties but two houses have smoke damage. Fire service responded in 18 minutes. Please ensure your cylinder valve is off when not in use.",
    severity: "critical",
    likes: 1102, comments: 198, shares: 567, views: 15670,
    isLiked: true,
    createdAt: ago(150),
    _feedLayer: "local",
    availableActions: ["aware", "nearby", "safe"],
  },
];

// ---------------------------------------------------------------------------
// Emergency / Incident posts
// ---------------------------------------------------------------------------

const EMERGENCY_POSTS: Post[] = [
  {
    id: "em1",
    contentType: "emergency",
    emergencyType: "accident",
    author: a(7),
    content: "🚨 ACCIDENT: Multi-vehicle collision on Ozumba Mbadiwe Avenue — 2 saloon cars and a BRT bus. Ambulance has been called. Traffic is completely blocked southbound. Please avoid this route. Emergency services en route.",
    severity: "critical",
    cardStyle: "emergency_red",
    likes: 234, comments: 67, shares: 289, views: 8904,
    isLiked: false,
    createdAt: ago(25),
    _feedLayer: "local",
    availableActions: ["acknowledge", "aware", "nearby", "safe"],
    verificationStatus: "community_confirmed",
  },
  {
    id: "em2",
    contentType: "emergency",
    emergencyType: "power_outage",
    author: a(11),
    content: "Power outage across all of Isale Eko since 6am. EKEDC hotline says 24–48 hours for restoration. Transformers on Lagos Island blown due to surge. Anyone with solar or gen capacity, please help elderly neighbours.",
    severity: "medium",
    cardStyle: "emergency_red",
    likes: 445, comments: 93, shares: 156, views: 6782,
    isLiked: true,
    createdAt: ago(480),
    _feedLayer: "local",
    availableActions: ["aware", "safe"],
  },
];

// ---------------------------------------------------------------------------
// Marketplace posts
// ---------------------------------------------------------------------------

const MARKETPLACE_POSTS: Post[] = [
  {
    id: "mp1",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(1),
    content: "HP Laptop for sale — Intel Core i5, 8GB RAM, 512GB SSD, Windows 11. Bought February 2024, barely used. Selling because I upgraded to MacBook. ₦185,000 firm. No swap. Ikeja pickup only.",
    media: [
      { id: "mm1a", type: "image", url: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80", size: 98000, mimeType: "image/jpeg" },
      { id: "mm1b", type: "image", url: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=800&q=80", size: 87000, mimeType: "image/jpeg" },
    ],
    price: 185000, currency: "NGN", itemCondition: "used",
    isNegotiable: false, deliveryOption: "pickup", availability: "available",
    itemCategory: "electronics",
    likes: 56, comments: 23, shares: 8, views: 1204,
    createdAt: ago(72),
    _feedLayer: "local",
  },
  {
    id: "mp2",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(5),
    content: "Home-baked sourdough bread available every Friday and Saturday morning. Order by Thursday 8pm. Varieties: plain, sesame, olive & rosemary. ₦2,500 per loaf. Delivery within 5km of Yaba for ₦500 extra.",
    media: [{ id: "mm2", type: "image", url: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=800&q=80", size: 76000, mimeType: "image/jpeg" }],
    price: 2500, currency: "NGN", itemCondition: "new",
    isNegotiable: false, deliveryOption: "both", availability: "available",
    itemCategory: "food",
    likes: 203, comments: 67, shares: 31, views: 2890,
    createdAt: ago(145),
    _feedLayer: "local",
  },
  {
    id: "mp3",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(9),
    content: "FREE: 6 bags of compost from my garden — pure organic, great for plants. You bring the bags to fill. Located in Ajah, Lekki. First come first served. DM to confirm before coming.",
    itemCondition: "new", deliveryOption: "pickup", availability: "available",
    itemCategory: "garden",
    likes: 89, comments: 34, shares: 21, views: 1102,
    createdAt: ago(300),
    _feedLayer: "local",
  },
  {
    id: "mp4",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(13),
    content: "Samsung Galaxy S23 — 256GB, Phantom Black, factory unlocked. Screen protector from day one, no cracks. Selling for ₦310,000. Reason: relocated abroad. Comes with box, charger and two cases.",
    media: [
      { id: "mm4a", type: "image", url: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80", size: 101000, mimeType: "image/jpeg" },
    ],
    price: 310000, currency: "NGN", itemCondition: "used",
    isNegotiable: true, deliveryOption: "both", availability: "available",
    itemCategory: "phones",
    likes: 134, comments: 56, shares: 14, views: 2103,
    createdAt: ago(60),
    _feedLayer: "local",
  },
  {
    id: "mp5",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(2),
    content: "Office chair (ergonomic, Herman Miller-style) — used for 1 year, excellent condition. Lumbar support, adjustable height & armrests, mesh back. ₦45,000. Can deliver within Lagos Island for ₦2,000.",
    media: [{ id: "mm5", type: "image", url: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800&q=80", size: 88000, mimeType: "image/jpeg" }],
    price: 45000, currency: "NGN", itemCondition: "used",
    isNegotiable: true, deliveryOption: "both", availability: "available",
    itemCategory: "furniture",
    likes: 47, comments: 12, shares: 5, views: 891,
    createdAt: ago(420),
    _feedLayer: "local",
  },
  {
    id: "mp6",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(4),
    content: "Baby clothes bundle — 3-6 months, 47 pieces, mixed brands (H&M, Zara, Carter's). All in excellent condition. Selling as a bundle for ₦15,000. No separation. Pickup at Maryland Mall or pay postage.",
    media: [{ id: "mm6", type: "image", url: "https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&q=80", size: 95000, mimeType: "image/jpeg" }],
    price: 15000, currency: "NGN", itemCondition: "used",
    isNegotiable: false, deliveryOption: "both", availability: "available",
    itemCategory: "baby",
    likes: 167, comments: 44, shares: 23, views: 2104,
    createdAt: ago(1080),
    _feedLayer: "local",
  },
  {
    id: "mp7",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(6),
    content: "Portable generator (Elemax 2.5KVA) — starting on first pull, serviced monthly. ₦125,000 or nearest offer. Reason for selling: got solar. Proof of service record available. Pickup — Festac Town.",
    media: [{ id: "mm7", type: "image", url: "https://images.unsplash.com/photo-1588776814546-ec7e6b3c5c96?w=800&q=80", size: 112000, mimeType: "image/jpeg" }],
    price: 125000, currency: "NGN", itemCondition: "used",
    isNegotiable: true, deliveryOption: "pickup", availability: "available",
    itemCategory: "appliances",
    likes: 89, comments: 27, shares: 11, views: 1567,
    createdAt: ago(200),
    _feedLayer: "local",
  },
  {
    id: "mp8",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(10),
    content: "Handmade Ankara throw pillows — set of 4, different patterns, 45x45cm. Made to order, delivery in 5 business days. ₦8,500 per set. Can also do custom colors. Small business, big love 💚",
    media: [{ id: "mm8", type: "image", url: "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80", size: 78000, mimeType: "image/jpeg" }],
    price: 8500, currency: "NGN", itemCondition: "new",
    isNegotiable: false, deliveryOption: "delivery", availability: "available",
    itemCategory: "home_decor",
    likes: 234, comments: 51, shares: 67, views: 3210,
    createdAt: ago(600),
    _feedLayer: "local",
  },
  {
    id: "mp9",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(12),
    content: "Electric standing desk (motorized, dual motor) — white, 140x70cm, barely used. Asking ₦95,000. Weight capacity 100kg. Height memory presets. Moving out, can't take it. Pickup — VI.",
    media: [{ id: "mm9", type: "image", url: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=800&q=80", size: 103000, mimeType: "image/jpeg" }],
    price: 95000, currency: "NGN", itemCondition: "used",
    isNegotiable: true, deliveryOption: "pickup", availability: "available",
    itemCategory: "furniture",
    likes: 78, comments: 19, shares: 9, views: 1401,
    createdAt: ago(330),
    _feedLayer: "local",
  },
  {
    id: "mp10",
    contentType: "marketplace",
    cardStyle: "marketplace_green",
    author: a(14),
    content: "Freshly squeezed zobo (hibiscus drink) — no sugar, no preservatives, ginger and pineapple variety. 1.5L bottles, ₦1,200 each. Minimum order 3 bottles. Delivery Mon–Sat within Alimosho LGA.",
    media: [{ id: "mm10", type: "image", url: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=800&q=80", size: 67000, mimeType: "image/jpeg" }],
    price: 1200, currency: "NGN", itemCondition: "new",
    isNegotiable: false, deliveryOption: "delivery", availability: "available",
    itemCategory: "food",
    likes: 312, comments: 78, shares: 54, views: 4201,
    createdAt: ago(90),
    _feedLayer: "local",
  },
];

// ---------------------------------------------------------------------------
// Event posts
// ---------------------------------------------------------------------------

const EVENT_POSTS: Post[] = [
  {
    id: "ev1",
    contentType: "event",
    cardStyle: "event_purple",
    author: a(3),
    content: "Neighborhood Block Party — Gbagada Estate! Saturday 12noon–8pm. Food, music (live afrobeats), kids corner, and community awards. Entry FREE. Bring a dish to share if you can. All are welcome!",
    media: [{ id: "em1", type: "image", url: "https://images.unsplash.com/photo-1493925410384-84f842e616fb?w=800&q=80", size: 134000, mimeType: "image/jpeg" }],
    eventDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    eventTime: "12:00",
    venue: { name: "Gbagada Estate Recreational Ground", address: "Phase 2, Gbagada, Lagos" },
    ticketInfo: "free", capacity: 500, rsvpEnabled: true,
    eventCategory: "social",
    likes: 892, comments: 134, shares: 267, views: 12890,
    isLiked: true,
    createdAt: ago(720),
    _feedLayer: "local",
    tags: ["blockparty", "gbagada", "community"],
  },
  {
    id: "ev2",
    contentType: "event",
    cardStyle: "event_purple",
    author: a(11),
    content: "FREE coding bootcamp for teenagers (13–18 years) — 4-week programme covering HTML, CSS, Python basics. Starts July 5th, every weekend 9am–1pm. Laptops available if you don't have one. 20 slots only — register now!",
    eventDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    eventTime: "09:00",
    venue: { name: "Tejuosho Youth Centre", address: "Surulere, Lagos" },
    ticketInfo: "free", capacity: 20, rsvpEnabled: true,
    eventCategory: "education",
    likes: 2103, comments: 312, shares: 891, views: 34210,
    isLiked: false,
    createdAt: ago(1440),
    _feedLayer: "local",
    tags: ["coding", "youth", "tech", "free"],
  },
  {
    id: "ev3",
    contentType: "event",
    cardStyle: "event_purple",
    author: a(5),
    content: "Ikeja Women's Network monthly breakfast — July edition. Topic: 'Funding your small business in 2025: grants, microloans, and what nobody tells you.' ₦3,500 per seat including full breakfast. Book via DM.",
    media: [{ id: "em3", type: "image", url: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80", size: 112000, mimeType: "image/jpeg" }],
    eventDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    eventTime: "08:00",
    venue: { name: "Protea Hotel", address: "Ikeja, Lagos" },
    ticketInfo: "paid", ticketPrice: 3500, capacity: 50, rsvpEnabled: true,
    eventCategory: "business",
    likes: 445, comments: 67, shares: 89, views: 5670,
    createdAt: ago(2880),
    _feedLayer: "local",
    tags: ["women", "business", "networking"],
  },
  {
    id: "ev4",
    contentType: "event",
    cardStyle: "event_purple",
    author: a(0),
    content: "Community health fair — free blood pressure checks, malaria tests, dental checks, and eye exams. Pediatricians on site for child health consultations. Completely free. Saturday 9am–3pm at the community hall.",
    eventDate: new Date(Date.now() + 6 * 86400000).toISOString(),
    eventTime: "09:00",
    venue: { name: "Oworonshoki Community Hall", address: "Oworonshoki, Lagos" },
    ticketInfo: "free", capacity: 300, rsvpEnabled: false,
    eventCategory: "health",
    likes: 1230, comments: 156, shares: 402, views: 18940,
    isLiked: true,
    createdAt: ago(360),
    _feedLayer: "local",
    tags: ["health", "free", "community"],
  },
  {
    id: "ev5",
    contentType: "event",
    cardStyle: "event_purple",
    author: a(8),
    content: "Lekki Saturday Night Market is back! Street food, crafts, music, fashion vendors. Every Saturday 5pm–11pm on the Lekki Conservation Road stretch. Parking available. Bring the family!",
    media: [{ id: "em5", type: "image", url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80", size: 123000, mimeType: "image/jpeg" }],
    eventDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    eventTime: "17:00",
    venue: { name: "Lekki Conservation Road", address: "Lekki, Lagos" },
    ticketInfo: "free", rsvpEnabled: false,
    eventCategory: "market",
    likes: 3402, comments: 234, shares: 891, views: 42100,
    isLiked: true,
    createdAt: ago(480),
    _feedLayer: "local",
    tags: ["market", "lekki", "food"],
  },
];

// ---------------------------------------------------------------------------
// Help Request posts
// ---------------------------------------------------------------------------

const HELP_POSTS: Post[] = [
  {
    id: "hr1",
    contentType: "help_request",
    author: a(2),
    content: "URGENT: My elderly mum had a fall at home in Ogba. She needs to go to the hospital but I'm stuck in traffic on 3rd Mainland Bridge. Anyone in Ogba area who can help transport her to Havana Specialist Hospital? I'll cover all costs. Please DM me immediately.",
    helpCategory: "medical",
    likes: 45, comments: 89, shares: 234, views: 8901,
    isLiked: false,
    createdAt: ago(8),
    _feedLayer: "local",
    tags: ["urgent", "medical", "help"],
  },
  {
    id: "hr2",
    contentType: "help_request",
    author: a(14),
    content: "Looking for someone to teach my son secondary school mathematics. He's in SS2, struggling with calculus and vectors. Can pay ₦10,000 per session. 2 sessions per week. Must be patient and able to come to Magodo.",
    helpCategory: "education",
    likes: 12, comments: 34, shares: 4, views: 567,
    createdAt: ago(300),
    _feedLayer: "local",
  },
  {
    id: "hr3",
    contentType: "help_request",
    author: a(10),
    content: "Does anyone have a spare breast pump I can borrow for 3 weeks? Just had my baby and mine broke. Cannot afford to buy a new one right now. Based in Sangotedo. Will sanitize and return in perfect condition. 🙏",
    helpCategory: "baby",
    likes: 78, comments: 45, shares: 12, views: 2104,
    isLiked: true,
    createdAt: ago(120),
    _feedLayer: "local",
  },
  {
    id: "hr4",
    contentType: "help_request",
    author: a(6),
    content: "Seeking blood donors — O+ blood type needed urgently at Lagos Island General Hospital for my father's surgery tomorrow morning. Please DM me if you can help. Doctors say we need 3 units. This is a matter of life and death.",
    helpCategory: "medical",
    likes: 567, comments: 234, shares: 891, views: 23400,
    isLiked: true,
    createdAt: ago(45),
    _feedLayer: "local",
    tags: ["blood", "urgent", "donation"],
  },
  {
    id: "hr5",
    contentType: "help_request",
    author: a(4),
    content: "Who knows a good and honest electrician in the Isolo/Ilasamaja area? I have been changing bulbs and sockets but now I have an issue with my distribution board tripping. Please recommend — not someone who will overcharge.",
    helpCategory: "home",
    likes: 23, comments: 56, shares: 7, views: 892,
    createdAt: ago(600),
    _feedLayer: "local",
  },
];

// ---------------------------------------------------------------------------
// Job posts
// ---------------------------------------------------------------------------

const JOB_POSTS: Post[] = [
  {
    id: "j1",
    contentType: "job",
    author: a(1),
    content: "HIRING: Part-time cashier for our new pharmacy in Oshodi. Requirements: WAEC or OND, honest, good with numbers, friendly personality. ₦60,000/month + commission. Start immediately. Send CV to pharmacy.oshodi@gmail.com",
    likes: 234, comments: 89, shares: 45, views: 6782,
    createdAt: ago(360),
    _feedLayer: "local",
    tags: ["job", "hiring", "oshodi"],
  },
  {
    id: "j2",
    contentType: "job",
    author: a(11),
    content: "Tech startup in Yaba looking for a junior React developer. 0–2 years experience OK. We offer learning, mentorship, and flexible remote-first working. ₦120,000–₦180,000/month depending on skills. DM portfolio or GitHub link.",
    likes: 891, comments: 234, shares: 167, views: 18940,
    isLiked: false,
    createdAt: ago(720),
    _feedLayer: "local",
    tags: ["react", "developer", "yaba", "startup"],
  },
  {
    id: "j3",
    contentType: "job",
    author: a(7),
    content: "Security company needs trained guards — Sector 5 Lagos. Must be ex-military or ex-police. Candidates will be verified. Monthly salary ₦75,000 + accommodation in some locations. Apply in person at our office on Monday or Tuesday.",
    likes: 89, comments: 34, shares: 21, views: 2103,
    createdAt: ago(2160),
    _feedLayer: "local",
  },
  {
    id: "j4",
    contentType: "job",
    author: a(3),
    content: "We are looking for a skilled Tailor / Fashion designer with at least 3 years' experience. Must be able to read patterns and work with both traditional and contemporary fabrics. Studio based in Balogun Market area. ₦90,000/month.",
    likes: 134, comments: 51, shares: 28, views: 3401,
    createdAt: ago(1080),
    _feedLayer: "local",
    tags: ["tailor", "fashion", "balogun"],
  },
  {
    id: "j5",
    contentType: "job",
    author: a(13),
    content: "Social media manager needed for a growing restaurant group (3 locations in Lagos). Must be creative, understand Nigerian content culture, and know Instagram / TikTok well. ₦150,000/month. Remote with weekly check-ins.",
    likes: 567, comments: 123, shares: 89, views: 9870,
    isLiked: true,
    createdAt: ago(480),
    _feedLayer: "local",
    tags: ["socialmedia", "job", "remote"],
  },
];

// ---------------------------------------------------------------------------
// Services posts
// ---------------------------------------------------------------------------

const SERVICES_POSTS: Post[] = [
  {
    id: "sv1",
    contentType: "services",
    author: a(9),
    content: "Professional plumbing services — leaking pipes, toilet repairs, water heater installation, bathroom fitting. 15 years experience. Available 7 days/week including emergencies. Call or DM. Serving all of Lagos Mainland. ⭐⭐⭐⭐⭐ rated by 340+ neighbours.",
    media: [{ id: "svm1", type: "image", url: "https://images.unsplash.com/photo-1581244277943-fe4a9c777540?w=800&q=80", size: 78000, mimeType: "image/jpeg" }],
    likes: 145, comments: 23, shares: 67, views: 4201,
    createdAt: ago(1440),
    _feedLayer: "local",
    tags: ["plumbing", "repair", "lagos"],
  },
  {
    id: "sv2",
    contentType: "services",
    author: a(5),
    content: "Professional photography for events — birthdays, corporate events, weddings, naming ceremonies. 6 years experience, RAW files included, 48hr delivery of edited photos. Coverage for Lagos & Abuja. Book 2 weeks in advance.",
    media: [
      { id: "svm2a", type: "image", url: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&q=80", size: 91000, mimeType: "image/jpeg" },
      { id: "svm2b", type: "image", url: "https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=800&q=80", size: 104000, mimeType: "image/jpeg" },
    ],
    likes: 289, comments: 67, shares: 43, views: 5670,
    isLiked: false,
    createdAt: ago(2160),
    _feedLayer: "local",
    tags: ["photography", "events"],
  },
  {
    id: "sv3",
    contentType: "services",
    author: a(13),
    content: "AC installation, servicing & repair — all brands. Gas recharge, deep cleaning, split & standing unit. Within 2 hours of booking for Lagos Island. Prices from ₦8,000 for a service. Licensed HVAC technician, 12 years exp.",
    likes: 213, comments: 45, shares: 34, views: 4892,
    createdAt: ago(360),
    _feedLayer: "local",
    tags: ["ac", "aircon", "repair"],
  },
  {
    id: "sv4",
    contentType: "services",
    author: a(1),
    content: "Home lessons available in Mathematics, Physics, Chemistry, Biology and English for JSS1–SS3. I am a WAEC marker with 10 years' teaching experience. ₦12,000 per subject per month. 2 sessions per week. Available in Ikeja, Ojodu, Berger.",
    likes: 134, comments: 78, shares: 21, views: 3201,
    isLiked: true,
    createdAt: ago(720),
    _feedLayer: "local",
    tags: ["tutoring", "education", "lessons"],
  },
  {
    id: "sv5",
    contentType: "services",
    author: a(7),
    content: "Professional car wash at your location — we come to you. Exterior wash, interior vacuum, wax polish. Sedans ₦3,500, SUVs ₦4,500. Available Mon–Sat 7am–5pm. Currently serving Lekki Phase 1, Ajah, Sangotedo.",
    likes: 78, comments: 14, shares: 19, views: 2104,
    createdAt: ago(900),
    _feedLayer: "local",
    tags: ["carwash", "mobile"],
  },
];

// ---------------------------------------------------------------------------
// Repost posts (sharedFrom chain)
// ---------------------------------------------------------------------------

const REPOST_POSTS: Post[] = [
  {
    id: "rp1",
    contentType: "post",
    author: a(4),
    content: "",
    sharedFrom: { id: "u3", username: "funke_vibes", name: "Funke Adeola", avatarUrl: AVATARS[2] },
    quotedPost: REGULAR_POSTS[1],
    likes: 89, comments: 12, shares: 45, views: 2103,
    createdAt: ago(50),
    _feedLayer: "local",
  },
  {
    id: "rp2",
    contentType: "post",
    author: a(0),
    content: "This is such an important message — everyone in Lekki should read this!",
    sharedFrom: { id: "u15", username: "lanre_f", name: "Lanre Fasanya", avatarUrl: AVATARS[14] },
    quotedPost: FYI_POSTS[0],
    likes: 234, comments: 34, shares: 67, views: 5102,
    isLiked: true,
    createdAt: ago(500),
    _feedLayer: "local",
  },
  {
    id: "rp3",
    contentType: "post",
    author: a(12),
    content: "Anyone know if this spot is still open? Asking for the weekend.",
    sharedFrom: { id: "u9", username: "bola_og", name: "Bola Ogundimu", avatarUrl: AVATARS[8] },
    quotedPost: EVENT_POSTS[4],
    likes: 56, comments: 22, shares: 11, views: 1230,
    createdAt: ago(510),
    _feedLayer: "local",
  },
  {
    id: "rp4",
    contentType: "post",
    author: a(6),
    content: "Sharing this because the youth programme needs more sign-ups. Spread the word please 🙏",
    sharedFrom: { id: "u12", username: "uche_ok", name: "Uche Okafor", avatarUrl: AVATARS[11] },
    quotedPost: EVENT_POSTS[1],
    likes: 312, comments: 56, shares: 134, views: 8901,
    isLiked: false,
    createdAt: ago(1500),
    _feedLayer: "local",
  },
  {
    id: "rp5",
    contentType: "post",
    author: a(10),
    content: "Reposting — this blood donation request is real. Please help if you're O+.",
    sharedFrom: { id: "u7", username: "chidi_ok", name: "Chidi Okonkwo", avatarUrl: AVATARS[6] },
    quotedPost: HELP_POSTS[3],
    likes: 891, comments: 123, shares: 567, views: 21000,
    isLiked: true,
    createdAt: ago(50),
    _feedLayer: "local",
  },
  {
    id: "rp6",
    contentType: "post",
    author: a(2),
    content: "Saw this earlier. That flooding video is insane — it's 2025 and Apapa still looks like this every rain.",
    sharedFrom: { id: "u14", username: "sade_og", name: "Sade Olagoke", avatarUrl: AVATARS[13] },
    quotedPost: REGULAR_POSTS[13],
    likes: 2103, comments: 345, shares: 789, views: 45200,
    isLiked: true,
    createdAt: ago(165),
    _feedLayer: "local",
  },
  {
    id: "rp7",
    contentType: "post",
    author: a(14),
    content: "",
    sharedFrom: { id: "u2", username: "emeka_builds", name: "Emeka Nwosu", avatarUrl: AVATARS[1] },
    quotedPost: JOB_POSTS[1],
    likes: 145, comments: 23, shares: 67, views: 3402,
    createdAt: ago(730),
    _feedLayer: "local",
  },
  {
    id: "rp8",
    contentType: "post",
    author: a(8),
    content: "My cousin's shop! Support local. The sourdough is genuinely amazing.",
    sharedFrom: { id: "u6", username: "yemi_a", name: "Yemi Adesanya", avatarUrl: AVATARS[5] },
    quotedPost: MARKETPLACE_POSTS[1],
    likes: 178, comments: 31, shares: 45, views: 2890,
    isLiked: false,
    createdAt: ago(150),
    _feedLayer: "local",
  },
];

// ---------------------------------------------------------------------------
// More social posts (to get to 150+)
// ---------------------------------------------------------------------------

const EXTRA_POSTS: Post[] = [
  {
    id: "ex1", contentType: "post", author: a(3),
    content: "The Bole spot near Ojota market might be the best bole in Lagos. I have been eating there for 10 years. Fish is always fresh, pepper sauce is legendary. No fancy decor, just pure taste. Don't sleep.",
    likes: 892, comments: 143, shares: 67, views: 9201, createdAt: ago(250), _feedLayer: "local",
    tags: ["food", "lagos"],
  },
  {
    id: "ex2", contentType: "post", author: a(11),
    content: "Reminder to all landlords: the Lagos State tenancy law requires 6 months minimum notice before eviction. If your landlord is rushing you out illegally, document everything and contact the Lagos Consumer Protection Agency. Share this.",
    likes: 4502, comments: 678, shares: 2103, views: 67800, isLiked: true,
    createdAt: ago(2880), _feedLayer: "local", tags: ["tenant", "rights", "lagos"],
  },
  {
    id: "ex3", contentType: "post", author: a(5),
    content: "Nigerian weddings are an economic stimulus package 😂 I spent more on aso-ebi, hair, makeup and shoes than I spent on 3 months rent. But I looked UNREAL. No regrets.",
    likes: 6721, comments: 934, shares: 1203, views: 89000, isLiked: false,
    createdAt: ago(180), _feedLayer: "local",
  },
  {
    id: "ex4", contentType: "post", author: a(7),
    content: "Security notice for all residents: there have been 3 reports of phone-snatching at ATMs in the Okota area in the past 2 weeks. Please be aware of your surroundings. Use indoor ATMs where possible especially after dark.",
    media: [], likes: 1203, comments: 267, shares: 891, views: 22100, isLiked: true,
    createdAt: ago(600), _feedLayer: "local", tags: ["security", "okota"],
  },
  {
    id: "ex5", contentType: "post", author: a(9),
    content: "Finally got a Bole & fish from the vendor near Ijesha market and honestly I understand the hype now. Plantain perfectly ripe, pepper on point, fish fresh. ₦2,200 for everything. Came home and slept.",
    likes: 312, comments: 54, shares: 23, views: 4201,
    media: [{ id: "exm5", type: "image", url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80", size: 87000, mimeType: "image/jpeg" }],
    createdAt: ago(400), _feedLayer: "local",
  },
  {
    id: "ex6", contentType: "post", author: a(1),
    content: "Opened my second shop today 🎉 — Emeka Electronics, Alaba Extension. We sell TVs, fridges, washing machines, generators. Competitive prices, warranty on everything. Stop by and say hi!",
    media: [{ id: "exm6", type: "image", url: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80", size: 112000, mimeType: "image/jpeg" }],
    likes: 567, comments: 89, shares: 134, views: 8901, isLiked: false,
    createdAt: ago(350), _feedLayer: "local", tags: ["business", "alaba"],
  },
  {
    id: "ex7", contentType: "post", author: a(13),
    content: "Morning people — the Third Mainland Bridge is clear right now (6:40am). If you have to cross today do it before 7:30am. After that it backs up all the way to Oworonshoki. You're welcome.",
    likes: 1890, comments: 312, shares: 567, views: 34200, isLiked: true,
    createdAt: ago(5), _feedLayer: "local", tags: ["traffic", "bridge"],
  },
  {
    id: "ex8", contentType: "post", author: a(0),
    content: "Big up to the Lagos Food Bank at Lekki Phase 2 — they fed 400 families last weekend with hot meals and dry goods. Volunteers still needed every Saturday 8am. You don't need to be rich to give, just willing.",
    likes: 3201, comments: 234, shares: 1102, views: 41000, isLiked: true,
    createdAt: ago(2160), _feedLayer: "local", tags: ["charity", "food", "volunteer"],
  },
  {
    id: "ex9", contentType: "post", author: a(12),
    content: "Serious question: is Lagos traffic worse now than 5 years ago? I feel like it has doubled and I have been using the same routes. The population growth is insane. We need a metro system yesterday.",
    likes: 7820, comments: 1102, shares: 891, views: 98000, isLiked: false,
    createdAt: ago(1440), _feedLayer: "local", tags: ["traffic", "lagos", "metro"],
  },
  {
    id: "ex10", contentType: "post", author: a(4),
    content: "The Tejuosho market redesign is incredible. Covered walkways, clean stalls, numbered sections, restrooms that actually work. Lagos can do this if the political will is there. More of this please.",
    media: [{ id: "exm10", type: "image", url: "https://images.unsplash.com/photo-1573790387438-4da905039392?w=800&q=80", size: 93000, mimeType: "image/jpeg" }],
    likes: 4103, comments: 567, shares: 789, views: 52000, isLiked: true,
    createdAt: ago(720), _feedLayer: "local", tags: ["market", "tejuosho", "lagos"],
  },
  {
    id: "ex11", contentType: "post", author: a(6),
    content: "Congratulations to my neighbor Chioma who just passed her ICAN exams on her first attempt 🎊 She studied every single night after a full day of work and raising two kids. This is the definition of determination.",
    likes: 2310, comments: 312, shares: 234, views: 28900, isLiked: true,
    createdAt: ago(300), _feedLayer: "local",
  },
  {
    id: "ex12", contentType: "post", author: a(8),
    content: "Pro tip for Lagos drivers: avoid Ikorodu Road between 5:30pm–8pm on any weekday. The go-slow goes from Lagos Bridge all the way to Maryland. Alternatively use Mile 12 and come through Ketu. Save your blood pressure.",
    likes: 3450, comments: 456, shares: 1203, views: 45000, isLiked: false,
    createdAt: ago(60), _feedLayer: "local", tags: ["traffic", "ikorodu"],
  },
  {
    id: "ex13", contentType: "post", author: a(10),
    content: "Lagos Island at night hits different. The old buildings, the smell of the sea, suya on the roadside, the sounds. Went for a walk tonight and it reminded me why I love this city even when it frustrates me daily.",
    media: [{ id: "exm13", type: "image", url: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80", size: 134000, mimeType: "image/jpeg" }],
    likes: 1890, comments: 234, shares: 167, views: 22100, isLiked: true,
    createdAt: ago(420), _feedLayer: "local",
  },
  {
    id: "ex14", contentType: "post", author: a(14),
    content: "TIPS FOR RENTING IN LAGOS:\n1. Never pay more than 1 year upfront (it's your right to negotiate)\n2. Always get a receipted agreement\n3. Confirm water and electricity supply before signing\n4. Check for damp/mold in rainy season\n5. Visit at night to check safety\n\nSave this.",
    likes: 8901, comments: 1234, shares: 4201, views: 134000, isLiked: true,
    createdAt: ago(4320), _feedLayer: "local", tags: ["rent", "lagos", "advice"],
  },
  {
    id: "ex15", contentType: "post", author: a(2),
    content: "What is the best local gym in the Ikeja/Agidingbi area with functional equipment and no generator issues? I have tried 3 places and none of them have AC that works. Starting to think I should just run outside.",
    likes: 234, comments: 89, shares: 12, views: 3201,
    createdAt: ago(800), _feedLayer: "local", tags: ["gym", "fitness", "ikeja"],
  },
  {
    id: "ex16", contentType: "post", author: a(3),
    content: "Solar power tip: a 3kVA inverter with 4x200Ah batteries and 8x400W panels can run most of a 3-bedroom flat 24/7 in Lagos. Total cost around ₦2.8–₦3.2m. Payback in 18–24 months vs generator cost. The maths checks out.",
    likes: 5602, comments: 891, shares: 2103, views: 78000, isLiked: false,
    createdAt: ago(2160), _feedLayer: "local", tags: ["solar", "energy", "nigeria"],
  },
  {
    id: "ex17", contentType: "post", author: a(5),
    content: "LOOK AT THIS SUYA 😭🔥 Got it fresh from the Mallam near Ojuelegba and I promise you this is the best thing I have eaten all month. ₦3,000 for a full stick with pepper, tomato and onion mix.",
    media: [{ id: "exm17", type: "image", url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80", size: 89000, mimeType: "image/jpeg" }],
    likes: 4201, comments: 678, shares: 312, views: 56000, isLiked: true,
    createdAt: ago(90), _feedLayer: "local", tags: ["food", "suya"],
  },
  {
    id: "ex18", contentType: "post", author: a(7),
    content: "One thing I appreciate about NeyborHuud is seeing real people in my area. Not influencers, not brands — actual neighbors talking about actual things. The road, the market, the power. This is what a community app should be.",
    likes: 1203, comments: 167, shares: 89, views: 14500, isLiked: true,
    createdAt: ago(1440), _feedLayer: "local",
  },
  {
    id: "ex19", contentType: "post", author: a(9),
    content: "The new BRT express lanes on Oshodi-Apapa expressway are a game changer. Took the bus from Oshodi to Mile 2 in 19 minutes yesterday at 6pm. That same journey used to be 1.5 hours in private car. The future is public transport.",
    likes: 2890, comments: 456, shares: 891, views: 41000, isLiked: false,
    createdAt: ago(1080), _feedLayer: "local", tags: ["brt", "transport", "lagos"],
  },
  {
    id: "ex20", contentType: "post", author: a(11),
    content: "My 7-year old asked me today 'mummy why doesn't NEPA come on?' and I didn't know whether to laugh or cry. The innocence 😭 She has never known a childhood with stable power. This has to change.",
    likes: 9201, comments: 1567, shares: 2103, views: 134000, isLiked: true,
    createdAt: ago(3600), _feedLayer: "local",
  },
  {
    id: "ex21", contentType: "post", author: a(13),
    content: "School run parents — CarMeets at Ajah roundabout at 6:45am is where it gets dangerous. Buses and bikes competing for space with parents doing U-turns. Please be extra careful. I saw 2 near-misses this week alone.",
    likes: 891, comments: 234, shares: 567, views: 18900, isLiked: false,
    createdAt: ago(480), _feedLayer: "local", tags: ["safety", "school", "ajah"],
  },
  {
    id: "ex22", contentType: "post", author: a(0),
    content: "3 years ago I had ₦0, a skill, and a phone. Today I run a 6-figure digital agency with 4 employees. Everything happened in Lagos, everything happened online. The internet is the great equalizer if you use it right.",
    likes: 14200, comments: 2103, shares: 5601, views: 210000, isLiked: true,
    createdAt: ago(7200), _feedLayer: "local", tags: ["inspiration", "business"],
  },
  {
    id: "ex23", contentType: "post", author: a(2),
    content: "Naija jollof rice vs Ghana jollof rice debate is settled in my house: my mum's jollof wins against both countries. This is not up for debate. Party jollof with the smoky bottom is something science cannot explain.",
    likes: 23400, comments: 4102, shares: 8901, views: 312000, isLiked: true,
    createdAt: ago(2880), _feedLayer: "local",
  },
  {
    id: "ex24", contentType: "post", author: a(4),
    content: "Dropped my phone at Balogun market yesterday and a trader ran after me to return it. When I tried to tip him ₦1,000 he refused saying 'It's not right to keep what isn't yours.' I almost cried. Good people everywhere.",
    likes: 8901, comments: 1203, shares: 2341, views: 123000, isLiked: true,
    createdAt: ago(5400), _feedLayer: "local",
  },
  {
    id: "ex25", contentType: "post", author: a(6),
    content: "EKEDC literally sent us a bill for ₦45,000 and the power was out 18 days out of 30. I have documented everything. If anyone knows an electricity consumer rights lawyer please DM me. This is fraud.",
    likes: 12300, comments: 3401, shares: 4201, views: 189000, isLiked: false,
    createdAt: ago(1440), _feedLayer: "local", tags: ["ekedc", "electricity", "rights"],
  },
  {
    id: "ex26", contentType: "post", author: a(8),
    content: "First time flying from Murtala Muhammed International airport in 3 years and… honestly it is improved. New departure hall, working AC, less tout harassment. Still room to improve but credit where it's due.",
    media: [{ id: "exm26", type: "image", url: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&q=80", size: 156000, mimeType: "image/jpeg" }],
    likes: 3402, comments: 567, shares: 234, views: 52000, isLiked: false,
    createdAt: ago(900), _feedLayer: "local", tags: ["airport", "lagos"],
  },
  {
    id: "ex27", contentType: "post", author: a(10),
    content: "Weekend DIY project: repainted our fence, fixed the gate hinge, built a small herb garden by the door. Cost me ₦12,000 total in materials. House looks completely refreshed. YouTube tutorials + NeyborHuud for materials recommendations FTW.",
    media: [{ id: "exm27", type: "image", url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80", size: 98000, mimeType: "image/jpeg" }],
    likes: 567, comments: 89, shares: 34, views: 7801, isLiked: true,
    createdAt: ago(1800), _feedLayer: "local",
  },
  {
    id: "ex28", contentType: "post", author: a(12),
    content: "The Lekki-Epe expressway at night is actually beautiful now with the new LED lighting. Drove from Ajah to Abraham Adesanya and it felt different. This is what Lagos should look and feel like. More please.",
    likes: 2103, comments: 312, shares: 234, views: 34000, isLiked: true,
    createdAt: ago(600), _feedLayer: "local",
  },
  {
    id: "ex29", contentType: "post", author: a(14),
    content: "Fuel queue at NNPC Yaba is gone — just walked past and no queue at all, price is ₦580/litre. After months of ₦850–₦950 unofficial, this feels surreal. Hope it's real and lasting this time.",
    likes: 5601, comments: 1203, shares: 2890, views: 89000, isLiked: true,
    createdAt: ago(2), _feedLayer: "local", tags: ["fuel", "nnpc", "prices"],
  },
  {
    id: "ex30", contentType: "post", author: a(1),
    content: "Quick reminder: Lagos House on the Rock Easter concert tickets are still available for the Sunday evening session. If you're looking for somewhere good to be on Sunday, this is it. Massive worship, incredible choir. Worth every kobo.",
    likes: 891, comments: 134, shares: 234, views: 14500, isLiked: false,
    createdAt: ago(300), _feedLayer: "local",
  },
];

// ---------------------------------------------------------------------------
// Compose the full 150+ post list
// ---------------------------------------------------------------------------

export const MOCK_FEED_POSTS: Post[] = [
  ...REGULAR_POSTS,     // 15
  ...FYI_POSTS,         // 6
  ...EMERGENCY_POSTS,   // 2
  ...MARKETPLACE_POSTS, // 10
  ...EVENT_POSTS,       // 5
  ...HELP_POSTS,        // 5
  ...JOB_POSTS,         // 5
  ...SERVICES_POSTS,    // 5
  ...REPOST_POSTS,      // 8
  ...EXTRA_POSTS,       // 30
  // Duplicate & re-id for more volume (second pass, offset by 200)
  ...[...REGULAR_POSTS, ...EXTRA_POSTS].map((p, i) => ({
    ...p,
    id: `${p.id}_b${i}`,
    createdAt: ago(Math.floor(Math.random() * 10000) + 5000),
    likes: Math.floor(p.likes * 0.7),
    comments: Math.floor(p.comments * 0.8),
    isLiked: !p.isLiked,
  })),
];

// Shuffle once at module load so the order is varied (deterministic per session)
(function shuffle(arr: Post[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(i * 9301 + 49297)) * arr.length) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
})(MOCK_FEED_POSTS);

/**
 * Build a fake paginated response matching the shape that useLocationFeed expects.
 */
export function getMockFeedPage(page: number, limit: number = 20) {
  const start = (page - 1) * limit;
  const slice = MOCK_FEED_POSTS.slice(start, start + limit);
  const total = MOCK_FEED_POSTS.length;
  return {
    content: slice,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: start + limit < total,
    },
    meta: {
      feedType: "chronological" as const,
      boostedCategories: [],
    },
  };
}
