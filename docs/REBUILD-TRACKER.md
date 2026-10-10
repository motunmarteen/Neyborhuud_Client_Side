# NeyborHuud Rebuild Tracker

The single place to see **what's done and what's next** in the complete rebuild: infrastructure, backend, design and UX, every screen, language, gamification, sharing, growth, mobile apps and launch.

**How to use it**
- Tick a box (`[x]`) when a task is **merged to `main` and verified** (tests pass, checked in a browser or on a phone where it matters).
- Add the commit hash after the task, for example `[x] F-02 Fonts … (b369f5a)`.
- Update the **progress table** and **last updated** line at the end of each work session.
- Status for tasks in progress: put `🟡` at the start of the line. Blocked: `⛔` plus the reason.

**Last updated:** 10 October 2026

> **PWA first.** NeyborHuud runs in the phone's browser from a link: no download, no app store, lowest barrier to entry. Installing ("Add to home screen") is optional. Store apps come later, only if needed.

**Related documents**

| Document | What it holds |
|---|---|
| [FEATURE-MAP.md](FEATURE-MAP.md) | Where every one of the 108 page files lives in the new design |
| [GAMIFICATION-REVIEW.md](GAMIFICATION-REVIEW.md) | Impact, levels, HuudCredit, quests, billboards, payouts |
| [GROWTH-ROADMAP.md](GROWTH-ROADMAP.md) | Growth ideas, 90-day plan, metrics |
| [LANGUAGE.md](LANGUAGE.md) | How NeyborHuud talks (Nigerian everyday English) |
| Design mockup | https://claude.ai/artifact/19HoEr6RC6dPDcHwfmHDhz (phone, rewards, share cards) |

---

## Progress

| Phase | Done | Total | Status |
|---|---|---|---|
| 0. Already done (before this tracker) | 24 | 24 | ✅ |
| 1. Infrastructure and accounts | 9 | 19 | 🟡 API live on HTTPS; owner items left |
| 2. Design foundation | 1 | 13 | ⏸ after Phase 1 |
| 3. Map home (sky + live map) | 0 | 16 | ⬜ |
| 4. Screens (restyle all 95) | 1 | 95 | 🟡 language batch 1 only |
| 5. Language rollout | 1 | 9 | 🟡 |
| 6. Sentinel AI upgrades | 0 | 6 | ⬜ |
| 7. Gamification backend | 0 | 18 | ⬜ waiting on your OK |
| 8. Sharing and virality | 0 | 10 | ⬜ |
| 9. Growth features | 0 | 9 | ⬜ |
| 10. Ads, billboards and payouts | 0 | 9 | ⬜ |
| 11. Quality, performance, accessibility | 0 | 10 | ⬜ |
| 12. PWA: works from a link, no download | 0 | 12 | ⬜ |
| 14. Store apps (later, optional) | 0 | 6 | ⏸ later |
| 13. Pilot and launch | 0 | 8 | ⬜ |

Order: 1 runs alongside everything. **12 (PWA) is built into every phase**, not left to the end. **2 → 3 → 4** is the main design line. 7 and 8 can start after 2. 10 needs 7. 13 needs 1, 3, 4 (core screens), 11 and 12.

---

## Phase 0: Already done

Kept here so the whole history is in one place.

**Security and backend (server `main`)**
- [x] 0-01 Server-side trust: identity, role, community and location always from the database; ban/suspend enforced on every request
- [x] 0-02 Coins awarded only by the server; daily caps; lifetime-once rewards
- [x] 0-03 KYC to manual review; NIN/BVN encrypted; NIPOST simulated data never verifies in production
- [x] 0-04 Upload checks (real file type, memory budget); vouch distance uses verified home; disputes scoped to admins and elders
- [x] 0-05 Vulnerable libraries patched (server and app: 0 critical) (b820607, 320427a)
- [x] 0-06 Light media: photos shrunk on phone, re-encoded to WebP on server, GPS removed, CDN delivery (1886779, c7fb0a9)
- [x] 0-07 SSRF blocked in link previews (7f05d67)
- [x] 0-08 Users never see raw server error text (4b3f1e1)
- [x] 0-09 Marketplace rejects invalid item condition with a clear message (9f5a009)

**Chat**
- [x] 0-10 Edit (15 min), delete for everyone (48 h, or group admins), forward with "forwarded many times" limit, live updates (9fb4f13)
- [x] 0-11 Hold-to-talk voice notes, swipe to reply, Chats / Groups tabs (71a2958)
- [x] 0-12 Prohibited items and scam wording blocked in marketplace, services and jobs (9fb4f13)

**Design and planning**
- [x] 0-13 Frontend redesign phases 1–4 merged and live on app.neyborhuud.com (PR #17)
- [x] 0-14 Feature map: all 108 page files placed in the new design (e70d6c8)
- [x] 0-15 Growth roadmap (c4640bf, 70e8b1b)
- [x] 0-16 Language guide + first wording batch (greetings, post prompts, weather, Buy am / Price am) (9e7f003)
- [x] 0-17 Gamification review v1 and v2 (95ba108, bfb17c8)
- [x] 0-18 Currency renamed to **HuudCredit** everywhere users see it (11972d9, b369f5a, 3130f09)
- [x] 0-19 Clickable mockup: map home, live sky, weathers, Sentinel, Gist, Create, Sentinel tab, Me, sharing, quests, rewards, billboards

**Accounts and repos**
- [x] 0-20 Repos moved to github.com/motunmarteen (server, app, landing)
- [x] 0-21 Huncho6 removed from all three repos
- [x] 0-22 App's Vercel project deploys from motunmarteen/Neyborhuud_Client_Side; duplicate Vercel projects disconnected
- [x] 0-23 Backend PR #41 and frontend PR #17 merged
- [x] 0-24 Landing redesign committed (50fca00)

---

## Phase 1: Infrastructure and accounts

**Goal:** the API is live again, secure, and every account belongs to the owner.

- [x] I-01 AWS account ready: account 843256241786, signed in on this computer as profile `neyborhuud`, default Region **eu-west-2 (London)**
- [x] I-01b AWS tools: AWS CLI 2.36, uv, Agent Toolkit (113 skills; AWS MCP server set to the `neyborhuud` profile; AWS rules in the workspace CLAUDE.md)
- [ ] I-01c Stop using the root login day to day: create an admin user (IAM Identity Center or IAM) with two-factor sign-in; turn on MFA for root; set a billing alert
- [x] I-02 API server on AWS: CloudFormation stack `neyborhuud-api` (eu-west-2), EC2 **t4g.small** (Graviton, arm64) Ubuntu 24.04 `i-00316803d10522364`, 20 GB disk, about **$19.60/month** on credits, fixed IP **16.60.205.159**, no SSH port (Session Manager), IMDSv2, encrypted disk, CloudTrail audit log. Files: server repo `infra/` (b81af3c, e1a1b16)
- [x] I-02b Read-only GitHub deploy key on the server repo
- [x] I-03 `api.neyborhuud.com` → 16.60.205.159 (Namecheap); Let's Encrypt HTTPS with HTTP→HTTPS redirect, auto-renewal tested (cert until 8 Jan 2027, renews itself); CORS for app.neyborhuud.com and socket.io checked
- [x] I-04 Production settings in Secrets Manager (`neyborhuud/prod/api-env`, AWS-managed key); API deployed with PM2 + Nginx; preflight 16/16 passed; MongoDB Atlas connected; health 200 from the internet
- [x] I-04d Old unused KMS key `5a022ab4-dcb3-491b-bbb6-df3c0217d16c` scheduled for deletion on 17 Oct 2026 (cancel before then with `aws kms cancel-key-deletion` if ever needed)
- [ ] I-04b Upgrade the AWS account from the **Free plan** to a paid plan before **11 January 2027** (Free-plan accounts are closed when credits or the plan run out) (*owner*)
- [ ] I-04c Fix the AWS MCP server in VS Code: fully quit and reopen VS Code so it finds `uvx` (installed during setup)
- [ ] ⏸ I-05 (owner chose to defer 2026-10-10: accounts locked down, no known outside copies; revisit before launch) **Rotate leaked secrets**: MongoDB password, Cloudinary secret, API keys, email password (old `.env.staging` in git history)
- [ ] 🔴 I-05b **Email is not sending** (checked 2026-10-10: Gmail rejects the login after the password change). Fix: new app password at myaccount.google.com/apppasswords (neyborhuudteam@gmail.com) → paste after MAIL_PASS= in ~/.neyborhuud-secrets/rotated.env → Claude runs apply-rotated + put-secret-value + redeploy (*owner*, deferred)
- [x] I-06 (done 2026-10-10 by owner) Lock Huncho6 out of: domain registrar (Namecheap), MongoDB Atlas, Cloudinary, Firebase, Termii, Vercel — *owner*
- [x] I-07 (done 2026-10-10; org now has only motunmarteen, no invites or outside collaborators) Remove Huncho6 from the NeyborHuud GitHub org (`gh auth refresh -s admin:org`, then remove)
- [ ] I-08 Fix GitHub Actions billing on the personal account so server tests run again — *owner*
- [ ] 🟡 I-09 Landing site: ✅ new `neyborhuud-landing` project in the `neyborhuudteam` Vercel team, deploying from `motunmarteen/neyborhuud-landing` (live at neyborhuud-landing-mrt2kd6is-neyborhuudteam-9782s-projects.vercel.app); ⬜ move the **neyborhuud.com** domain to it from whichever Vercel account holds it now (*owner*)
- [ ] I-10 Uptime monitoring and alerts for the API (and Sentry check)
- [ ] I-11 Daily MongoDB Atlas backups confirmed; restore tested once
- [ ] I-12 Staging environment (separate database) for testing before production

---

### What the owner needs to do (Phase 1)

1. ✅ **AWS account and sign-in** (done 10 Oct).
2. **Domain registrar (I-06).** Log in to Namecheap (or wherever neyborhuud.com is registered). Make sure **you** are the only owner, turn on two-factor login, and remove any access for Huncho6.
3. **MongoDB Atlas, Cloudinary, Firebase, Termii, Vercel (I-06).** In each: Members / Team settings → remove Huncho6 → confirm you are owner → turn on two-factor login.
4. **Rotate secrets (I-05)** in the same dashboards: new MongoDB database user password, new Cloudinary API secret, new Firebase service key, new Termii and other API keys, new email password. Put the new values into `~/.neyborhuud-secrets/production-secrets.env` (never in chat or git).
5. **GitHub org (I-07).** In a terminal run `gh auth refresh -h github.com -s admin:org`, approve in the browser, then tell me; I'll remove Huncho6 from the NeyborHuud org.
6. **GitHub Actions billing (I-08).** github.com/settings/billing → check Actions limits and payment method so the server's automatic tests run again.
7. **neyborhuud.com domain (I-09).** Find the Vercel account that holds the domain (alwaysmotun… or huncho6…). Remove it there, then add it to the **neyborhuud-landing** project in the neyborhuudteam team (Settings → Domains).
8. **Backups (I-11).** MongoDB Atlas → your cluster → Backup → confirm daily backups are on.

## Phase 2: Design foundation

**Goal:** the new look in the shared building blocks, so every screen improves at once. Light theme only.

- [x] F-01 (ea6f99e palette, ~1,100 colour values in 121 files; next commit removes 137 dark CSS rules + 993 dark: classes; build passes) Colour tokens: green `#00B82E` / deep green `#0E8A3E`, navy text `#1D2433`, muted `#5B6478`, background `#EEF2F7`, safety red `#E5484D`, amber, purple; remove dark-mode-only styles
- [x] F-02a Fredoka for headings and logo, self-hosted (2965456)
- [x] F-02b (1ac93e0; ₦, Yoruba/Igbo dots and Hausa ɓ ɗ ƙ checked in the browser; mockup artboards still show Fredoka) Switch headings to **Nunito** and text to **Nunito Sans** (Fredoka can't draw ₦ or Yoruba/Igbo letters); Noto Sans as fallback for Hausa ɓ ɗ ƙ; update mockup and share cards
- [x] F-03 (shared <Button> rebuilt: primary/secondary/soft/ghost/danger, sm 40 with 48px tap area, md 48, lg 56; 44 filled buttons converted; shared .btn-glass-* restyled; /design-kit page shows all blocks) Buttons: pill shapes (primary green, white outline, danger); 48 px touch targets
- [x] F-04 (<Card> plain/accent/floating, <Chip> 6 tones, <FilterChip> navy-when-on; BrowseFilterChip uses it; legacy .mod-chip (221 uses) restyled for light theme; shown on /design-kit) Cards, chips and filter chips (the map-layer style)
- [x] F-05 (AppBottomSheet: title/close/footer, 90svh, safe area; handle 40x5; navy-tint backdrop; reduced motion = fade; 3 dark chat sheets made light; drag/Esc/backdrop tested; ~36 custom sheets move over screen by screen) Bottom sheet component (the slide-up panel used everywhere), with handle and drag-to-close
- [ ] F-06 Floating top bar (logo, area, HuudCredit, bell, avatar)
- [ ] F-07 New bottom bar: My Huud · Gist · ➕ Create · Chats · Sentinel
- [ ] F-08 Toast and thank-you card (with coin animation)
- [ ] F-09 Empty states, loading skeletons, error states (Nigerian wording)
- [ ] F-10 Pins and badges component set (emoji pins, coloured rings, ripple)
- [ ] F-11 Reduced-motion and low-data modes respected by all animations
- [ ] F-12 Visual check of 10 key screens after the switch (no broken layouts)

---

## Phase 3: Map home (the sky + live map)

**Goal:** My Huud becomes the live neighbourhood map under the real sky, as in the mockup.

- [ ] M-01 MapLibre base map with our own style (soft colours, labels), real Lagos streets from OpenStreetMap
- [ ] M-02 3D buildings from real footprints; tilt and rotate; pinch zoom
- [ ] M-03 Live sky over the map: time-of-day colours, sun and moon path (east → west), stars
- [ ] M-04 Horizon blend (land fades into the sky), palm-tree horizon, sunlight on the ground
- [ ] M-05 Weather on the map: clouds and their shadows, drizzle, rain (current Sky Feed Hero drops), storm with lightning, harmattan haze, puddles
- [ ] M-06 Night lights: windows, street lamps, glowing billboards
- [ ] M-07 Pins from Street Radar (`/geo/radar`) with layer chips: Safety, Traffic, Light & water, Market, Work, Events, Help
- [ ] M-08 Live pins via socket (appear and ripple instantly)
- [ ] M-09 Pin panels (bottom sheet) for every type, with actions and "Ask Sentinel about this"
- [ ] M-10 Moving traffic driven by real go-slow reports (calm when no data)
- [ ] M-11 Neighbour activity as area pulses (never exact homes)
- [ ] M-12 Pulse ticker: news + exchange rates + weather; "Today's Pulse" panel
- [ ] M-13 Calm view toggle
- [ ] M-14 Area Champion crown marker
- [ ] M-15 Low-data mode: flat 2D map, no animation, cached last view
- [ ] M-16 Performance target: smooth on a ₦60,000 Android phone; map loads in under 3 s on 3G

---

## Phase 4: Screens (restyle all 95)

**Goal:** every real screen rebuilt in the new design and language. Tick a screen when it is restyled, uses the new components, uses Nigerian wording, works on a phone and has no console errors. New home for each screen is in [FEATURE-MAP.md](FEATURE-MAP.md).

### Getting started (12)

- [ ] S-001 `(marketing)` → Getting started (restyled)
- [ ] S-002 `(marketing)/complete-profile` → Getting started (restyled)
- [ ] S-003 `(marketing)/forgot-password` → Getting started (restyled)
- [ ] S-004 `(marketing)/login` → Getting started (restyled)
- [ ] S-005 `(marketing)/pick-community` → Getting started (restyled)
- [ ] S-006 `(marketing)/reset-password` → Getting started (restyled)
- [ ] S-007 `(marketing)/setup-complete` → Getting started (restyled)
- [ ] S-008 `(marketing)/signup` → Getting started (restyled)
- [ ] S-009 `(marketing)/verify-email` → Getting started (restyled)
- [ ] S-010 `(marketing)/verify-location` → Getting started (restyled)
- [ ] S-011 `(marketing)/welcome` → Getting started (restyled)
- [ ] S-012 `/app-root` → Getting started: opening screen (restyled)

### Home, map and feed (Gist) (13)

- [ ] S-013 `/explore` → Gist tab
- [ ] S-014 `/feed` → Gist tab
- [ ] S-015 `/feed/media-preview` → Opens from posts (unchanged)
- [ ] S-016 `/fyi` → Gist → FYI / Light & water layer
- [ ] S-017 `/gist` → Gist → News / Pulse ticker
- [ ] S-018 `/gist/[id]` → Gist → News / Pulse ticker
- [ ] S-019 `/local-news` → Gist → News / Pulse ticker
- [ ] S-020 `/local-news/[id]` → Gist → News / Pulse ticker
- [ ] S-021 `/local-news/gist/[id]` → Gist → News / Pulse ticker
- [ ] S-022 `/map` → Merged into the home map
- [ ] S-023 `/neighborhood` → Becomes the map home (My Huud)
- [ ] S-024 `/notifications` → 🔔 in the top bar
- [ ] S-025 `/saved` → Me → Saved

### Chats and communities (6)

- [ ] S-026 `/chat/[conversationId]` → Chats → conversation
- [ ] S-027 `/communities` → Chats → Groups / Everything → Communities
- [ ] S-028 `/communities/[id]` → Chats → Groups / Everything → Communities
- [ ] S-029 `/communities/join/[code]` → Chats → Groups / Everything → Communities
- [ ] S-030 `/friendship` → Chats tab (inbox, find neighbours)
- [ ] S-031 `/messages/[conversationId]` → Chats → conversation

### Sentinel (safety) (20)

- [ ] S-032 `/community-emergency` → Sentinel → Tools (+ map banner when active)
- [ ] S-033 `/incident-reports` → Safety layer pins / Sentinel → Reports
- [ ] S-034 `/incident-reports/[id]` → Safety layer pins / Sentinel → Reports
- [ ] S-035 `/safety` → Sentinel tab
- [ ] S-036 `/safety/emergency` → Sentinel → Tools → Report emergency
- [ ] S-037 `/safety/fake-call` → Sentinel → Tools → Fake call
- [ ] S-038 `/safety/geofences` → Sentinel → Protect → Safety zones (+ red zones on map)
- [ ] S-039 `/safety/incident/[id]` → Safety layer pins / Sentinel → Reports
- [ ] S-040 `/safety/kidnapping-tracking` → Sentinel → Protect → Emergency tracking
- [ ] S-041 `/safety/kidnapping-tracking/watch/[sessionId]` → Sentinel → Protect → Emergency tracking
- [ ] S-042 `/safety/manage` → Sentinel → Your network (guardians, circle)
- [ ] S-043 `/safety/panic-pin` → Sentinel → Tools → Panic PIN
- [ ] S-044 `/safety/panic-pin/enter` → Sentinel → Tools → Panic PIN
- [ ] S-045 `/safety/panic-pin/practice` → Sentinel → Tools → Panic PIN
- [ ] S-046 `/safety/sentinel` → Sentinel → What Sentinel watches / alerts
- [ ] S-047 `/safety/sentinel/settings` → Sentinel → What Sentinel watches / alerts
- [ ] S-048 `/safety/trips` → Sentinel → Protect → Safe trips (+ trip pill on map)
- [ ] S-049 `/safety/trips/history` → Sentinel → Protect → Safe trips (+ trip pill on map)
- [ ] S-050 `/safety/trips/watch/[userId]` → Sentinel → Protect → Safe trips (+ trip pill on map)
- [ ] S-051 `/sos` → SOS button everywhere / Sentinel → SOS

### Marketplace (6)

- [ ] S-052 `/marketplace` → Market layer on the map / Everything → Market / Me → my listings & deals
- [ ] S-053 `/marketplace/[id]` → Market layer on the map / Everything → Market / Me → my listings & deals
- [ ] S-054 `/marketplace/[id]/edit` → Market layer on the map / Everything → Market / Me → my listings & deals
- [ ] S-055 `/marketplace/create` → Market layer on the map / Everything → Market / Me → my listings & deals
- [ ] S-056 `/marketplace/my-deals` → Market layer on the map / Everything → Market / Me → my listings & deals
- [ ] S-057 `/marketplace/my-listings` → Market layer on the map / Everything → Market / Me → my listings & deals

### Work: jobs and services (9)

- [ ] S-058 `/jobs` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved
- [ ] S-059 `/jobs/[id]` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved
- [ ] S-060 `/jobs/my-applications` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved
- [ ] S-061 `/jobs/saved` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved
- [ ] S-062 `/services` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved
- [ ] S-063 `/services/[id]` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved
- [ ] S-064 `/services/my-bookings` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved
- [ ] S-065 `/services/my-favorites` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved
- [ ] S-066 `/work` → Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved

### Events and help (7)

- [ ] S-067 `/events` → Events layer on the map / Everything → Events / Me → My events
- [ ] S-068 `/events/[id]` → Events layer on the map / Everything → Events / Me → My events
- [ ] S-069 `/events/[id]/edit` → Events layer on the map / Everything → Events / Me → My events
- [ ] S-070 `/events/my-events` → Events layer on the map / Everything → Events / Me → My events
- [ ] S-071 `/events/nearby` → Events layer on the map / Everything → Events / Me → My events
- [ ] S-072 `/help-request` → Help layer on the map / ➕ Help request
- [ ] S-073 `/help-request/[id]` → Help layer on the map / ➕ Help request

### Me: profile, rewards, settings (15)

- [ ] S-074 `/huud-economy` → Me → HuudCredit, rewards, score (🪙 in top bar)
- [ ] S-075 `/huud-economy/score` → Me → HuudCredit, rewards, score (🪙 in top bar)
- [ ] S-076 `/huud-economy/wallet` → Me → HuudCredit, rewards, score (🪙 in top bar)
- [ ] S-077 `/premium/success` → Me → Premium
- [ ] S-078 `/profile/[username]` → Me → profile, passport, followers
- [ ] S-079 `/profile/[username]/followers` → Me → profile, passport, followers
- [ ] S-080 `/profile/[username]/following` → Me → profile, passport, followers
- [ ] S-081 `/profile/passport` → Me → profile, passport, followers
- [ ] S-082 `/rewards` → Me → HuudCredit, rewards, score (🪙 in top bar)
- [ ] S-083 `/settings` → Me → Settings
- [ ] S-084 `/settings/blocked` → Me → Settings
- [ ] S-085 `/settings/location` → Me → Settings
- [ ] S-086 `/settings/password` → Me → Settings
- [ ] S-087 `/settings/payout` → Me → Settings
- [ ] S-088 `/settings/places` → Me → Settings

### Info and admin (7)

- [ ] S-089 `/admin` → Me → Admin (admins only)
- [ ] S-090 `/admin/reports` → Me → Admin (admins only)
- [ ] S-091 `/admin/users` → Me → Admin (admins only)
- [ ] S-092 `/info/community-rules` → Me → Help & rules
- [ ] S-093 `/info/nigeria-postal-codes` → Me → Help & rules
- [ ] S-094 `/info/privacy-policy` → Me → Help & rules
- [ ] S-095 `/info/terms-of-service` → Me → Help & rules

Plus the panels and pop-ups that belong to these screens (post window, SOS sheet, offer sheet, share sheet, etc.): restyled together with their screen.

---

## Phase 5: Language rollout

- [x] L-01 Language guide written (LANGUAGE.md) and first batch: greetings, post prompts, weather, marketplace buying (9e7f003)
- [ ] L-02 Onboarding and sign-up wording
- [ ] L-03 Feed, posts, comments, Gist wording
- [ ] L-04 Chat, marketplace, services, jobs, events wording
- [ ] L-05 Safety screens: plain and calm (level 1 of the guide)
- [ ] L-06 Server messages, push notifications, emails and SMS in the same voice
- [ ] L-07 Move all text into the language system (`lib/i18n.tsx`) so every screen can switch language
- [ ] L-08 Complete Pidgin; then Yoruba, Hausa, Igbo
- [ ] L-09 Native-speaker review of every translation before release

---

## Phase 6: Sentinel AI upgrades

- [ ] S-01 Sentinel orb on the map; ring colour from area mood (safe / advisory / alert)
- [ ] S-02 "Ask Sentinel" bar on home and "Ask about this" on pins, with suggested questions
- [ ] S-03 Answers show their sources and end with an action (start safe trip, show route, chat service)
- [ ] S-04 Voice questions (hold to talk)
- [ ] S-05 Widen scope: questions about Lagos and general topics, while safety and money answers stay strictly grounded in real data
- [ ] S-06 Sentinel tab: SOS centre, Protect, Your network, Tools, "What Sentinel watches", History (all existing safety features)

---

## Phase 7: Gamification backend

**Waiting on your go-ahead.** It changes how real users earn. See GAMIFICATION-REVIEW.md.

- [ ] G-01 Separate **Impact** from HuudCredit in the database and API
- [ ] G-02 6-level ladder (New Neighbour → Huud Elder) with unlocks; migrate existing users (nobody goes down; Legacy marks)
- [ ] G-03 New earning table; **pay on confirmation** (safety reports, help, light updates)
- [ ] G-04 Remove coins for likes, follows and raw posts and comments
- [ ] G-05 Referral pays when the friend becomes active (first verified action), not at signup
- [ ] G-06 Welcome quest (5 steps)
- [ ] G-07 Daily quests (3 a day, bonus, streak with weekly saver)
- [ ] G-08 Huud of the Week challenge (admin sets the theme; area progress)
- [ ] G-09 Area leaderboards: my area, Lagos areas, friends; weekly reset
- [ ] G-10 Area Champion of the Week (auto-picked, crown on map, share card)
- [ ] G-11 Founding Neighbour: 25 slots per street
- [ ] G-12 Badges cut to 16; old badges kept as Legacy
- [ ] G-13 Shop: map skins, profile frames, shout-outs, birthday boards
- [ ] G-14 Community projects with sponsor matching
- [ ] G-15 Gifting HuudCredit with limits (Level 2+, verified, 500 a day, 2,000 a month)
- [ ] G-16 Sponsored missions (labelled; never buy reviews)
- [ ] G-17 One price list checked against real earning (no inflation)
- [ ] G-18 Anti-abuse: confirmations from different verified people, device/phone overlap checks, reversals

---

## Phase 8: Sharing and virality

- [ ] V-01 Shared scene renderer: sky + neighbourhood behind any card (server-side image generation, so links preview on WhatsApp)
- [ ] V-02 Share cards: Today in my area, Light don come, item for sale, event invite, invite neighbours, level up, Area Champion, area ranking
- [ ] V-03 Share sheet: WhatsApp status and chat, Instagram, X, TikTok, copy link, save picture
- [ ] V-04 Public share pages (`neyborhuud.com/somolu`, `/m/…`, `/e/…`) that open the app or a preview
- [ ] V-05 Link previews (Open Graph images) using the scene
- [ ] V-06 Safety reports never shareable publicly (circle only)
- [ ] V-07 Reward when someone joins from your share (pay on activation)
- [ ] V-08 "Today in [area]" generated daily
- [ ] V-09 Live counters ("312 neighbours · 38 active now") on map and cards
- [ ] V-10 Track shares → visits → joins → active users

---

## Phase 9: Growth features

- [ ] R-01 First-time visitor mode: see your area without signing up; join only to post, buy or set up SOS
- [ ] R-02 First-time tour (3 steps)
- [ ] R-03 Quiet-area state: honest, useful public info, invite and "Set up my estate"
- [ ] R-04 Estate launch kit: create the estate community, rules, QR poster for the gate
- [ ] R-05 No-network mode: last map, "still sending" items, SOS by SMS
- [ ] R-06 Voice posting in English, Pidgin, Yoruba, Igbo, Hausa
- [ ] R-07 Analytics: activation, day-1/7/30 return, invite conversion, active residents per area
- [ ] R-08 Community ambassador tools
- [ ] R-09 Notification settings: categories, quiet hours, frequency

---

## Phase 10: Ads, billboards and payouts

- [ ] A-01 Billboard spots on the map (limited per area), booking flow, moderation queue, "Ad" label, night glow
- [ ] A-02 Pay for billboards with HuudCredit or naira (Paystack or Flutterwave)
- [ ] A-03 Buy HuudCredit with naira (one way in)
- [ ] A-04 Sponsored pins, sponsored Gist cards, featured services, boosted events
- [ ] A-05 Business profile and ad dashboard (views, taps)
- [ ] A-06 ⛔ Legal check with a Nigerian fintech/tax lawyer (payouts, withholding tax, AML records)
- [ ] A-07 Contributor programme: eligibility, monthly pool from ad revenue, split by verified Impact
- [ ] A-08 Payouts in naira to verified bank accounts (minimum ₦5,000) or as HuudCredit with a bonus
- [ ] A-09 Never pay for safety, SOS or crime content (enforced in code)

---

## Phase 11: Quality, performance, accessibility

- [ ] Q-01 Automated tests for every new server feature (keep the suite green)
- [ ] Q-02 App tests for the new components and flows
- [ ] Q-03 End-to-end smoke test of main journeys (join, post, buy, chat, SOS, share)
- [ ] Q-04 Performance budget per screen; image and map caching
- [ ] Q-05 Accessibility: contrast, touch targets, screen reader labels, reduced motion
- [ ] Q-06 Security review of new features (billboards, gifting, payouts, sharing)
- [ ] Q-07 Load test the API (map, radar, chat) before launch
- [ ] Q-08 Error monitoring (Sentry) on app and server
- [ ] Q-09 Test in the browser on 3 real low-end Android phones and 1 iPhone (Chrome, Safari, Opera)
- [ ] Q-10 Show the clickable mockup to 5–10 people in Lagos; fix what confuses them

---

## Phase 12: PWA, works from a link with no download

**Goal:** someone taps a link on WhatsApp and is using NeyborHuud in seconds, in their browser, on any phone.

- [ ] P-01 Opens straight from any shared link (`neyborhuud.com/somolu`, item, event, invite) with no sign-up wall (see R-01)
- [ ] P-02 Fast first load on 3G: small first download, map and images load after the first screen, under 3 s to something useful
- [ ] P-03 Works on cheap Android phones and older iPhones (Chrome, Safari, Opera Mini fallback page)
- [ ] P-04 Service worker: offline map of last area, queued posts ("still sending"), cached Gist
- [ ] P-05 Optional "Add NeyborHuud to your home screen" prompt after real use (never on first visit); app icon and splash
- [ ] P-06 Web push notifications (Android browsers; iPhone only after Add to home screen, iOS 16.4+), with permission asked at the right moment
- [ ] P-07 Location in the browser: clear permission screen; safe trip and SOS work while the page is open; explain the limits honestly
- [ ] P-08 SOS by SMS link when there's no data (pre-filled SMS to guardians)
- [ ] P-09 Low-data mode switch (flat map, no animation, smaller images)
- [ ] P-10 Share sheet uses the phone's native share (Web Share API) with WhatsApp first, fallback buttons otherwise
- [ ] P-11 Camera and voice notes from the browser (photo upload, hold-to-talk)
- [ ] P-12 PWA checks pass (Lighthouse PWA and performance) on every release

## Phase 13: Pilot and launch

- [ ] X-01 Pick one estate or street for the pilot; recruit 5–10 organisers
- [ ] X-02 Onboard residents with the estate kit and QR posters
- [ ] X-03 Watch the metrics weekly (activation, returns, invites, issues resolved)
- [ ] X-04 Interview people who stay, leave and never finish joining
- [ ] X-05 Fix the top problems from the pilot
- [ ] X-06 Expand to neighbouring streets with active organisers
- [ ] X-07 Public launch plan (share cards, Area Champion, Huud of the Week)
- [ ] X-08 Go / no-go review against the pilot numbers

---

## Phase 14: Store apps (later, optional)

Only if the PWA hits limits we can't work around (for example background location for long safe trips, or iPhone push for users who won't add to home screen). Android already has a Capacitor project; iOS does not.

- [ ] N-01 Decide if store apps are needed, based on pilot data
- [ ] N-02 Android build from the same code (Capacitor)
- [ ] N-03 iOS project (Capacitor) and build
- [ ] N-04 Background location and native push
- [ ] N-05 Store listings, privacy forms, screenshots
- [ ] N-06 Google Play and App Store release

---

## Decisions log

| Date | Decision |
|---|---|
| 2026-10-09 | Server decides everything about trust; the app is never trusted |
| 2026-10-10 | Home becomes the live map under the real sky (Lagos Life style, light theme) |
| 2026-10-10 | Gist is the feed; bottom bar: My Huud · Gist · ➕ · Chats · Sentinel |
| 2026-10-10 | Nigerian everyday English by default; plain wording for safety and money |
| 2026-10-10 | Currency name: **HuudCredit** |
| 2026-10-10 | Two meters: Impact + HuudCredit; 6-level ladder; pay on confirmation |
| 2026-10-10 | Billboards on the map (HuudCredit or naira); gifting with limits |
| 2026-10-10 | No trading or selling HuudCredit between users; payouts only through the contributor programme, after legal review |
| 2026-10-10 | Safety reports never shared publicly and never paid in cash |
| 2026-10-10 | **PWA first**: no download needed; store apps later and optional |
| 2026-10-10 | Fonts: **Nunito** (headings) + **Nunito Sans** (text), Noto Sans fallback. Snapchat's fonts (Avenir Next, Graphik) are paid; tested 19 free fonts for ₦ and Nigerian letters |
| 2026-10-10 | Phase 1 before Phase 2; AWS Region eu-west-2 (London) |
