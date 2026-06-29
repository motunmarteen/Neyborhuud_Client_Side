/** Static copy mined from NeyborHuud-PWA routes & NeyborHuud-ServerSide product docs (not generic marketing fluff). */

export const trustChips = [
  "Hyperlocal feeds (GPS-bound communities)",
  "Sentinel safety hub + SOS command centre",
  "FYI bulletins with priority & expiry",
  "Guardian networks + trip check-ins",
  "Jobs, services & marketplace (Owambeh)",
];

export const howItWorks = [
  {
    title: "Create your account",
    detail:
      "Sign up with email, choose a username, and set a strong password. The backend enforces serious password rules so weak credentials never enter the system.",
    icon: "person_add",
  },
  {
    title: "Pin your neighbourhood",
    detail:
      "GPS verification assigns you to the right state, LGA, and ward-style community. Content, commerce, and safety signals stay where they matter — on your street.",
    icon: "location_on",
  },
  {
    title: "Pick your community context",
    detail:
      "When needed, select or confirm the community you belong to so posts, FYI bulletins, and marketplace items stay relevant and nearby.",
    icon: "groups",
  },
  {
    title: "Build your safety circle",
    detail:
      "Invite guardians you trust, configure trips with timed check-ins, and set geofences. If you miss a check-in, the system escalates through your guardian list — and can silently trigger SOS.",
    icon: "shield_person",
  },
  {
    title: "Live inside three feeds",
    detail:
      "FYI for official-style bulletins, GossipLocale for culture and conversation, Owambeh for buying, selling, gigs, and events — all filtered by proximity, not popularity.",
    icon: "dynamic_feed",
  },
];

export const feedExplainers = [
  {
    name: "FYI (For Your Information)",
    accent: "blue",
    what:
      "Structured notices that need to stay readable: safety updates, council-style announcements, lost & found, and local news.",
    backend:
      "Supports priority levels (up to critical), expiry so stale alerts disappear, types like safety_notice / lost_found / community_announcement / local_news, and authority-backed posts where roles allow.",
    inApp: "Dedicated FYI surfaces in the PWA so utility information does not drown in chatty threads.",
  },
  {
    name: "GossipLocale",
    accent: "primary",
    what:
      "The human layer — questions, gist, cultural context, and neighbourhood voice. Built for discussion, not for scrolling the whole internet.",
    backend:
      "Threaded comments, anonymous posting where enabled, tags, and discussion types so moderators can reason about content.",
    inApp: "Think of it as the village square: expressive, local, and fast-moving.",
  },
  {
    name: "Owambeh",
    accent: "dark",
    what:
      "Commerce and opportunity — listings, buyer intent, events nearby, and the hustle graph of your area.",
    backend:
      "Feeds integrate marketplace signals so discovery stays within minutes of home, not random DMs from strangers far away.",
    inApp: "Pairs with jobs, services bookings, and wallet flows inside the app.",
  },
];

export const safetyPillars = [
  {
    title: "Trips & timed check-ins",
    icon: "route",
    means:
      "You define a journey, an ETA, and how often the app should ask “still okay?” Miss the window, and guardians are notified in stages — with automatic silent SOS if you remain unreachable.",
    source: "Safety hub “Active protection” + documented escalation ladder.",
  },
  {
    title: "Live tracking & kidnapping mode",
    icon: "my_location",
    means:
      "When a trip or emergency is live, guardians can see your moving location. The stack records breadcrumb points and can fall back when GPS is weak — so people helping you see the best available fix, honestly labeled.",
    source: "Safety / live tracking routes in the PWA.",
  },
  {
    title: "Geofences (safe & restricted)",
    icon: "fence",
    means:
      "Draw rings around places you should stay in or avoid. Enter a restricted zone and the app can warn your network or auto-trigger SOS; leave a safe zone unexpectedly and people you trust can know.",
    source: "Geofence routes + server-side geo queries.",
  },
  {
    title: "Guardians & safety circle",
    icon: "shield_person",
    means:
      "Guardians are explicit trusted contacts — not random followers. The safety circle surfaces who is watching, who is on a trip, and what changed recently.",
    source: "Safety manage hub network section.",
  },
  {
    title: "SOS command centre",
    icon: "emergency",
    means:
      "Countdown before broadcast (so pocket dials fail less), active incident panel, drill mode to practice without alarming anyone, and long-press SOS from the dock for silent alerts.",
    source: "Dedicated /sos page in the PWA.",
  },
  {
    title: "Discreet tools",
    icon: "mic",
    means:
      "Panic PIN (duress unlock that quietly signals distress), fake incoming call, and silent recording workflows — designed for situations where obvious actions are unsafe.",
    source: "Safety tools tiles (fake call, panic PIN, manage hub).",
  },
];

export const platformModules = [
  { label: "Feed & posts", icon: "home", href: "/feed" },
  { label: "Explore", icon: "explore", href: "/explore" },
  { label: "FYI bulletins", icon: "campaign", href: "/fyi" },
  { label: "Marketplace", icon: "storefront", href: "/marketplace" },
  { label: "Jobs & gigs", icon: "work", href: "/jobs" },
  { label: "Services & bookings", icon: "home_repair_service", href: "/services" },
  { label: "Events", icon: "event", href: "/events" },
  { label: "Messages", icon: "chat", href: "/messages" },
  { label: "Local news", icon: "newspaper", href: "/local-news" },
  { label: "Help requests", icon: "volunteer_activism", href: "/help-request" },
  { label: "Incident reports", icon: "gavel", href: "/incident-reports" },
  { label: "Gamification & wallet", icon: "account_balance", href: "/gamification" },
  { label: "Safety hub", icon: "health_and_safety", href: "/safety" },
];

export const glossary = [
  {
    term: "Huud",
    def: "Your neighbourhood operating layer — the people, feeds, and safety graph around where you actually live.",
  },
  {
    term: "Sentinel",
    def: "The umbrella name for NeyborHuud’s safety intelligence surfaces: SOS, trips, geofences, AI-assisted scans, and your guardian network.",
  },
  {
    term: "Guardian",
    def: "A person you explicitly trust to receive protective alerts, live location context, and escalation if things go wrong.",
  },
  {
    term: "HuudCoin (economy)",
    def: "In-app rewards unit tied to departments, actions, and caps — powering streaks, tips, boosts, and marketplace velocity without turning the whole app into a casino.",
  },
  {
    term: "Trust score / verification",
    def: "Progressive assurance so neighbours, buyers, and gig posters can see who completed which real-world checks — reducing scams in local commerce.",
  },
  {
    term: "Drill mode (SOS)",
    def: "Practice the SOS flow locally without notifying guardians — confidence without crying wolf.",
  },
];

export const faqItems = [
  {
    q: "Is NeyborHuud “just another social network”?",
    a: "No. Global feeds optimize for worldwide popularity; NeyborHuud optimizes for proximity and safety. The product separates utility (FYI), conversation (GossipLocale), and commerce (Owambeh) so each stays usable.",
  },
  {
    q: "What happens when I press SOS?",
    a: "The PWA arms a visible countdown (unless you use silent SOS via long-press). When it fires, guardians and emergency workflows receive structured context — not a vague text. You can cancel, resolve, or rehearse with drill mode.",
  },
  {
    q: "What if I miss a trip check-in?",
    a: "Missed check-ins move through escalation stages: a quiet ping to top guardians, then broader alerts with last known location, then automatic silent SOS if you still cannot respond — so hesitation does not mean silence.",
  },
  {
    q: "How are communities assigned?",
    a: "Automatic assignment uses GPS boundaries (state / LGA-style areas) so you see what is relevant without manually hunting hashtags. You can still pick or refine community context when the product asks.",
  },
  {
    q: "Can strangers see my exact address?",
    a: "The product is built around community relevance, not publishing your living room on a map. Share precision only where features (trips, SOS) require it, and guardians are people you designate.",
  },
  {
    q: "What data can I export or delete?",
    a: "The backend implements self-service data export, anonymization, and right to be forgotten flows — aligned with serious privacy expectations (NDPR-minded consent flags exist in the auth stack).",
  },
  {
    q: "Does the app work if GPS is weak?",
    a: "Live tracking degrades gracefully: accuracy tiers, network-assisted estimates, and honest labeling so helpers never think a noisy dot is perfect GPS.",
  },
  {
    q: "What is Sentinel AI in practical terms?",
    a: "Threat scanning and risk surfaces that watch community signals (not stalk individual chatter) to spotlight patterns worth acting on — paired with human moderation and reporting tools.",
  },
  {
    q: "How do FYI bulletins stay trustworthy?",
    a: "Types, priorities, expiries, helpful marks, and role-gated authority endorsements keep “official-ish” posts structured — unlike a random group chat pinned message.",
  },
  {
    q: "Can I use marketplace & jobs safely?",
    a: "Transactions inherit your trust graph: verification tiers, neighbour proximity, and reporting flows designed for high-scam categories in informal commerce.",
  },
  {
    q: "Where do I manage notifications?",
    a: "Inside the Safety hub settings tiles (“Notifications”, auto-trigger rules, emergency services toggles) and general app settings for day-to-day noise control.",
  },
  {
    q: "Who do I contact for help?",
    a: "Use the Support section on this page — email targets for general help, partnerships, and safety-specific questions. Critical emergencies should always go to local emergency services first.",
  },
];

export const supportChannels = [
  {
    title: "Product support",
    desc: "Account access, verification email issues, and everyday “how do I…?” questions.",
    action: "Email support",
    href: "mailto:support@neyborhuud.com?subject=NeyborHuud%20support",
  },
  {
    title: "Safety guidance",
    desc: "Questions about SOS, guardians, trips, or geofences — non-emergency only.",
    action: "Email safety desk",
    href: "mailto:safety@neyborhuud.com?subject=NeyborHuud%20safety",
  },
  {
    title: "Partners & press",
    desc: "Cities, NGOs, enterprise safety programs, and media needing fact-checked detail.",
    action: "Email partnerships",
    href: "mailto:partners@neyborhuud.com?subject=NeyborHuud%20partnership",
  },
];
