# NeyborHuud Rebuild Tracker

The single place to see **what's done and what's next** in the complete rebuild: infrastructure, backend, design and UX, every screen, language, gamification, sharing, growth, mobile apps and launch.

**How to use it**
- Tick a box (`[x]`) when a task is **merged to `main` and verified** (tests pass, checked in a browser or on a phone where it matters).
- Add the commit hash after the task, for example `[x] F-02 Fonts … (b369f5a)`.
- Update the **progress table** and **last updated** line at the end of each work session.
- Status for tasks in progress: put `🟡` at the start of the line. Blocked: `⛔` plus the reason.

**Last updated:** 17 October 2026

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
| 2. Design foundation | 22 | 23 | ✅ done (F-15b moves to the Phase 3 map home) |
| 3. Map home (sky + live map) | 14 | 17 | 🟡 map home live at /huud; live pins, 3D buildings, street life, BRT, night lights, 3D billboards, go-slow traffic, area pulses, Today's Pulse done; low-data mode, speed done; left: M-14 crown (waits on Phase 7), M-17 living map, mockup extras |
| 4. Screens (restyle all 95) | 1 | 95 | 🟡 language batch 1 only |
| 5. Language rollout | 1 | 9 | 🟡 |
| 6. Sentinel AI upgrades | 0 | 6 | ⬜ |
| 7. Gamification backend | 0 | 18 | ⬜ waiting on your OK |
| 8. Sharing and virality | 0 | 10 | ⬜ |
| 9. Growth features | 0 | 9 | ⬜ |
| 10. Ads, billboards and payouts | 0 | 9 | 🟡 map ads built (server + app); waiting on Bachs keys, prices and the map home |
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
- [x] 0-21 former collaborator removed from all three repos
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
- [x] I-06 (done 2026-10-10 by owner) Lock former collaborator out of: domain registrar (Namecheap), MongoDB Atlas, Cloudinary, Firebase, Termii, Vercel — *owner*
- [x] I-07 (done 2026-10-10; org now has only motunmarteen, no invites or outside collaborators) Remove former collaborator from the NeyborHuud GitHub org (`gh auth refresh -s admin:org`, then remove)
- [ ] 🔴 I-06b (found 2026-10-17) **former collaborator's Vercel still gets the app's code**: every push to Neyborhuud_Client_Side builds in three Vercel projects: neyborhuudteam (the real app, fine), alwaysmotun's personal one and **former-collaborator-projects/neyborhuud-pwa** (both fail to build, but still clone the code). Owner: GitHub → Settings → Applications → Installed GitHub Apps → Vercel → Configure: check which Vercel accounts/repos it covers; in Vercel (alwaysmotun account) delete the old neyborhuud-pwa project; if former collaborator's link stays, uninstall the Vercel app and reconnect only from the neyborhuudteam team
- [ ] I-08 Fix GitHub Actions billing on the personal account so server tests run again — *owner*
- [ ] 🟡 I-09 Landing site: ✅ new `neyborhuud-landing` project in the `neyborhuudteam` Vercel team, deploying from `motunmarteen/neyborhuud-landing` (live at neyborhuud-landing-mrt2kd6is-neyborhuudteam-9782s-projects.vercel.app); ⬜ move the **neyborhuud.com** domain to it from whichever Vercel account holds it now (*owner*)
- [ ] I-10 Uptime monitoring and alerts for the API (and Sentry check)
- [ ] I-11 Daily MongoDB Atlas backups confirmed; restore tested once
- [ ] I-12 Staging environment (separate database) for testing before production

---

### What the owner needs to do (Phase 1)

1. ✅ **AWS account and sign-in** (done 10 Oct).
2. **Domain registrar (I-06).** Log in to Namecheap (or wherever neyborhuud.com is registered). Make sure **you** are the only owner, turn on two-factor login, and remove any access for former collaborator.
3. **MongoDB Atlas, Cloudinary, Firebase, Termii, Vercel (I-06).** In each: Members / Team settings → remove former collaborator → confirm you are owner → turn on two-factor login.
4. **Rotate secrets (I-05)** in the same dashboards: new MongoDB database user password, new Cloudinary API secret, new Firebase service key, new Termii and other API keys, new email password. Put the new values into `~/.neyborhuud-secrets/production-secrets.env` (never in chat or git).
5. **GitHub org (I-07).** In a terminal run `gh auth refresh -h github.com -s admin:org`, approve in the browser, then tell me; I'll remove former collaborator from the NeyborHuud org.
6. **GitHub Actions billing (I-08).** github.com/settings/billing → check Actions limits and payment method so the server's automatic tests run again.
7. **neyborhuud.com domain (I-09).** Find the Vercel account that holds the domain (alwaysmotun… or former collaborator…). Remove it there, then add it to the **neyborhuud-landing** project in the neyborhuudteam team (Settings → Domains).
8. **Backups (I-11).** MongoDB Atlas → your cluster → Backup → confirm daily backups are on.

## Phase 2: Design foundation

**Goal:** the new look in the shared building blocks, so every screen improves at once. Light theme only.

- [x] F-01 (ea6f99e palette, ~1,100 colour values in 121 files; next commit removes 137 dark CSS rules + 993 dark: classes; build passes) Colour tokens: green `#00B82E` / deep green `#0E8A3E`, navy text `#1D2433`, muted `#5B6478`, background `#EEF2F7`, safety red `#E5484D`, amber, purple; remove dark-mode-only styles
- [x] F-02a Fredoka for headings and logo, self-hosted (2965456)
- [x] F-02b (1ac93e0; ₦, Yoruba/Igbo dots and Hausa ɓ ɗ ƙ checked in the browser; mockup artboards still show Fredoka) Switch headings to **Nunito** and text to **Nunito Sans** (Fredoka can't draw ₦ or Yoruba/Igbo letters); Noto Sans as fallback for Hausa ɓ ɗ ƙ; update mockup and share cards
- [x] F-03 (shared <Button> rebuilt: primary/secondary/soft/ghost/danger, sm 40 with 48px tap area, md 48, lg 56; 44 filled buttons converted; shared .btn-glass-* restyled; /design-kit page shows all blocks) Buttons: pill shapes (primary green, white outline, danger); 48 px touch targets
- [x] F-04 (<Card> plain/accent/floating, <Chip> 6 tones, <FilterChip> navy-when-on; BrowseFilterChip uses it; legacy .mod-chip (221 uses) restyled for light theme; shown on /design-kit) Cards, chips and filter chips (the map-layer style)
- [x] F-05 (AppBottomSheet: title/close/footer, 90svh, safe area; handle 40x5; navy-tint backdrop; reduced motion = fade; 3 dark chat sheets made light; drag/Esc/backdrop tested; ~36 custom sheets move over screen by screen) Bottom sheet component (the slide-up panel used everywhere), with handle and drag-to-close
- [x] F-06 (TopBar 52px pill: logo + area / back + title; HuudCredit pill only when loaded (no fake 150); bell; avatar opens Me menu; Join free for visitors; fits 320-412px; ＋ and Search stay until F-07) Floating top bar (logo, area, HuudCredit, bell, avatar)
- [x] F-07 (full-width bar from the mockup; ➕ opens "Wetin you wan share?" with 10 one-tap signals + 8 create types and works from any screen via /feed?compose=; hold Sentinel = silent SOS (moved from the old Home button); Profile → top-bar avatar; ＋ removed from top bar, 🔍 always shown; floating SOS sits above the bar. My Huud → /feed and Gist → /gist until the map home in Phase 3) New bottom bar: My Huud · Gist · ➕ Create · Chats · Sentinel
- [x] F-08 (pwa 570bc37: navy message toasts; nhToast.thanks white card with gold coin pop + burst and +N only when the server really awarded; wired to safety confirms, signals, first poll vote, L&F, help, reports, check-in, sharing; fixed newest-under-oldest stacking, share +5 claim on reused links, email "50 HC" claim; server eabe809 share points_earned = real award, not yet deployed) Toast and thank-you card (with coin animation)
- [x] F-09 (EmptyState / ErrorState with offline wording / Skeleton in components/ui; 18 loading screens redrawn (were a navy flash); BrowseEmptyState (28 files) on EmptyState; 13 raw "Failed to load" states → ErrorState with retry; 4 error pages unified; per-screen inline empty texts move over in Phase 4) Empty states, loading skeletons, error states (Nigerian wording)
- [x] F-10 (components/map/Pins.tsx + .nh-pin/.nh-orb CSS: MapPin rings/ripple/tag/count, PersonPin me/champion, SentinelOrb mood, Leaflet HTML helpers; /map uses them) Pins and badges component set (emoji pins, coloured rings, ripple)
- [x] F-11 (calm mode <html data-calm>: OS reduced motion, Data Saver, or Settings "Save data"; all CSS animations/transitions stop except spinners; framer-motion MotionConfig; feed videos wait for a tap, background videos not loaded; also fixed text size setting) Reduced-motion and low-data modes respected by all animations
- [x] F-13 **Post card** — one card for every post type (`components/feed/PostCard.tsx`, proposal on /design-kit). Type shown by an icon badge on the avatar corner (only safety alerts pulse); no label row, no coloured edge; follow icon (person+ / person-tick); two-line more icon; Facebook-style photo grid (2 / 3 / 4 / 5+ with +N); full-width cards. Types: post, FYI, lost & found, poll, safety alert, marketplace, job, event, service, help request. ✅ owner approval → ✅ swap into feed, profile, FYI, help request (pwa 5978355: XPostCard wraps PostCard; poll voting, Lost & Found routing, safety buttons, repost chain, menu all browser-tested) → ✅ own pages: owner chose grid tiles in the post card look; BrowseTile under ProductCard / JobCard / ServiceCard / EventCard (all 9 pages)
- [x] F-13b (server 9a2044d: /api/v1/polls, area-only one vote each, changeable until close, creator +2 HC at 10 voters; also fixed the HuudCredit daily-limit race) **Feed polls on the server**: polls today exist only in chat (PollVote). Add poll posts (question, 2-4 options, end date), one vote per person, results, and the ➕ "Community Poll" option that has no backend yet
- [x] F-13c (server db7d78f: /api/v1/lost-found with private detail, claims, 4-digit handover code, 50 HC finder reward held 72h, ≤500 HC pledges, anti-gaming rules, flags + moderator decisions) **Lost & Found fields**
- [x] F-13d (➕ sheet: Poll and Lost & Found; Create poll sheet; Lost & Found sheet with private detail, photos, 0–500 HC pledge; /lost-found/[postId] (poster: claims beside private detail, accept/reject, close; others: claim, flag a return); /lost-found/claims/[claimId] (owner code, finder code entry, reward state, thank a helper); full flow tested in the browser with a fake API) **App screens for polls and Lost & Found**: create poll, create lost/found (with private detail and pledge), claims inbox for the poster, handover code screen (owner) and code entry (finder), helper thank-you, flag a return. ⚠️ Deploy the new server only together with these screens: the old FYI status buttons can no longer mark Lost & Found posts returned: lost or found, item name, last seen place and time, optional reward (kobo) in the FYI create form and API (today Lost & Found is only an FYI subtype label)
- [x] F-14 (/sentinel; Sentinel tab + top-bar 🔍 open it; /explore and #tag links redirect with the query; tested with canned API replies: empty state, name search, question answer; falls back to GET /search while the new server is not deployed) **Sentinel screen = Ask Sentinel (SSAA) + safety + Explore** (owner decision 2026-10-11): one "Ask Sentinel or search anything…" box at the top; answer area (answer, mood, sources, follow-ups) above grouped results (people, places, posts, market, events, artisans, jobs, bulletins); area safety status + SOS / Trip / Check-in; then Explore (quick questions, 8 tiles, trending, news). Top-bar 🔍 and a floating Sentinel button on the map open it; /explore redirects here. AI only for questions/requests; names/words/#tags return instant results with "Ask Sentinel about this"
- [x] F-14b (server e84d860 POST /api/v1/sentinel/ask, 22 tests; GET /search no longer returns deleted posts/users; the 5 dead client calls removed — they were never used) **Server: one ask/search endpoint** that runs search + AssistantService together, decides question vs keyword, and fixes the 5 search calls the app makes that do not exist (/search/events, /jobs, /marketplace, /services, /history)
- [x] F-15 (f4e7e05, 3724eb2) iPhone fixes from the owner's iPhone 13 Pro: status bar overlap (iOS status bar now "default"), giant profile photos on posts (pin avatars drew a positioned <img> in SVG foreignObject, which Safari does not clip; now SVG <image>), made-up "Live Huud Pulse" + "48 Verified Neighbors" now demo-only, untrue "+15 HC each" removed, Sentinel screen shows all 15 safety tools
- [ ] F-15b Real live activity for the home ("Live Huud Pulse") and a real verified-neighbours count from the server (Phase 3 map home)
- [x] F-15c (pwa 9fcfeff: photo moved out of SVG foreignObject; preview now matches the saved crop; editor guide uses the new pin shape) Check the photo editor (AvatarAdjusterModal, also uses SVG foreignObject) on an iPhone
- [x] F-15d (2026-10-11: owner confirmed all 36 were test data; archived like the app's Delete (status archived), run by the owner via Session Manager; live marketplace now 0 listings. Listed for the owner: 36 live listings, 35 look like test data (30 seeded "#NNNN" items from 3 accounts on 2026-05-02, plus Test Item, john doe, 15 pro, 12 pro max, Iphone); waiting for the owner to approve removal) Production marketplace has test-looking listings (e.g. "55\" LG Smart TV — #7820", "Iphone ₦12,000" with a jewellery photo): owner to decide whether to remove them (*owner*)
- [x] F-15e (pwa 7aa3178, owner: hide the fake parts: real balance, streak and ways to earn only; also fake 150 HC and "Lekki Phase 1" in the side menu; unused fake drawer deleted) The /rewards page is fake: "Claim ₦500" claims nothing, any promo code "redeems" +50 HuudCredit without the server, balance falls back to a made-up 150 and trust to 88. Hide the fake parts until Phase 7 (*owner OK*)
- [x] F-15f (pwa 9fcfeff) Settings still has a Dark mode switch although the app is light only since F-01 (remove it in the Settings restyle)
- [x] F-12 (pwa fc2dc02: 12 key screens + all 68 static routes checked for one top bar; fixed: double space under the top bar on every screen (owner report), 2 bars on /gist /work /events/create /marketplace/create, none on /lost-found, old header on /notifications; feed crash on a reply without radar signals; profile crash on missing username; developer test panel and fake chats in Chats now demo only) Visual check of 10 key screens after the switch (no broken layouts)
- [x] F-15g (pwa 9fcfeff, owner request) Profile-photo pin: classic map-pin shape (round head, sharp point), hairline edge instead of the thick white border

---

## Safety and civic upgrades (from the N-Alert research, owner decisions 2026-10-11)

**Deferred (owner, 2026-10-11):** all S-items, including election mode, wait until the platform build is finished; Phase 3 starts now. The election date does not move, so election mode is at risk if the build runs past mid-November.

**Order (owner):** finish the current work (F-13d Poll and Lost & Found screens, F-13 post card in the feed), then alarms → danger zones → complaints → rumour check. **Election mode comes after the current work but has a hard deadline:** presidential election **16 January 2027**, governorship **6 February 2027**. To be live and learnt by mid-December, election mode must start **by mid-November 2026 at the latest**.

- [ ] S-01 **Danger alarm**: urgent alarm sound + full-screen alert when danger is reported near you (app open); stronger emergency push (Android: urgent, stays on screen, strong vibration). Note: a web app cannot play its own siren while closed; the phone plays its notification sound
- [ ] S-02 **SOS siren**: loud siren you switch on during SOS to scare an attacker and alert people nearby (max volume, flashing screen)
- [ ] S-03 **Voice / audio report**: speak a report (English, Pidgin, Yoruba, Igbo, Hausa) or record sound as evidence on safety reports
- [ ] S-04 **Danger zones**: zones formed from neighbour-confirmed reports (radius, reason, expiry), shown on the map, warning when you enter one with a safer route. Today: EmergencyZone model + read endpoint exist but nothing creates zones; red-zone LGA alerts and personal geofences exist
- [ ] S-04b Check that Sentinel red-zone alerts also go out as push notifications (code read shows a live socket fan-out; push not confirmed)
- [ ] S-05 **Complaint system** (FixMyStreet style): bad road, waste, light billing, gate; photo + location, neighbours add "me too", status received → in progress → fixed, routed to estate / LGA / utility. Today: nothing (no complaint code)
- [ ] S-06 **"Is it true?" rumour check**: ask about a claim; neighbours nearby + Sentinel weigh in; label confirmed / false / not yet known
- [ ] S-07 **Election mode (non-partisan)**: my polling unit + what to bring (PVC) + INEC links; election incident reports tagged to the polling unit (violence, vote buying, intimidation, ballot snatching, late materials, BVAS failure) with photo/video, anonymous option, neighbour confirmation; election-day safety map + avoid alerts; "I have voted, I am safe" check-in; election rumour check. **Never tally or announce results** — link to INEC IReV. Lawyer review: political ads, candidate polls. Deadline above
- [ ] S-08 **SOS by SMS** when there is no data (promised on the home canvas; not built), then offline reports that send when signal returns
- [ ] S-09 **Send to responders** (estate security, vigilante, police division) — needs partner agreements first (*owner*)

---

## Phase 3: Map home (the sky + live map)

**Goal:** My Huud becomes the live neighbourhood map under the real sky, as in the mockup.

**2026-10-15 (owner): back to the agreed mockup.** Gist is out of the system; the **Feed** replaces it (bottom bar: My Huud · Feed · ➕ · Chats · Sentinel). The Feed's top is the slim live sky from the mockup (title + real weather line), then "Wetin dey happen around you? + Post" and the tabs For you · Safety · FYI · Posts · Market · Work · Events · Help · Polls · News. The old sky hero, radar, greeting and Pulse moved to My Huud. My Huud (mockup): ⚡ PULSE ribbon, Sentinel orb (ring = real area mood), Me, Calm view, SOS in the right column, bottom sheet with greeting + weather, "Ask Sentinel anything…", "Wetin dey happen?", "Report", "Share today in <area>". Gestures: **swipe up on the sheet → Feed; swipe down on the Feed's sky → map.** Old /gist, /gossip and Gist-thread links open the Feed. Weather: no more invented forecasts or 28°/31° placeholders; unknown weather is not shown.
- [x] 2026-10-15 (later): map card hides (swipe down / ✕, "Show card"); Feed pull-down → map; help posts in the Feed; house ads + "Sample" preview ads (admins / Ads page switch); Pulse adds weather + go-slows; "📍 See on map"; fake "1.2K" views removed; **Gist deleted on the server** (API removed, 10 threads + 2 comments dropped, 57 Feed posts untouched)
- [x] 2026-10-16 (owner): Sentinel orb removed from the map (the card's "Ask Sentinel anything…" does the same; the area's mood is now a small amber/red dot on it); Me, Calm view and Sound moved into a ⋯ menu on the left, opposite SOS; both sit just above the card and follow it down when it is hidden; the map fills the notch area so the sky (sun, clouds) runs up behind the status bar (the blue strip was the page background showing above the map)
- [ ] Check: sign-up "complete profile" shows "100" coins while the balance loads (is 100 the real reward?)
- [x] 2026-10-17 first-time tour (mockup, 3 steps: your street live, the chips, SOS), once per phone after the swoop; replay from ⋯ "Show me around". SOS text made truthful: tap opens SOS, press-and-hold sends a silent alert, no network = sends when back online (no automatic SMS)
- [x] 2026-10-17 quiet street (mockup): when nothing is reported in your area the map card says "Your street dey wait for you", shows what is known (weather, go-slows), Invite neighbours (your invite link) and Set up my estate (opens Create community)
- [x] 2026-10-17 share card with your sky (mockup card 1): "Share today" makes a 1080x1920 picture of your live sky over your area with today's real items (go-slows, light & water, for sale, events, help; never safety), shared through the phone (WhatsApp, Instagram…), saved, or the link copied; the link carries your invite code
- [x] 2026-10-17 (owner: "let them see the map") **visitors**: /huud opens without sign-in: map, sky, street life, billboards, area pulses and pins except safety (server hides the safety layer from visitors); welcome card "Welcome to <area> 👋🏾 · look around, no sign-up needed" with the real member count, Show my area, Join free (keeps the sharer's invite code) and Show me around; "Share today" links now open the live map of the area (~1 km), not the sign-up form
- [ ] Still from the mockup: Area Champion crown (Phase 7); other share cards (light don come, for sale, event, invite, level, champion, area ranking)

**2026-10-15:** the map home is live at `/huud` and the My Huud tab opens it: real sky and weather, street life, 7 pin layers, billboards and sponsored pins (safety pins always drawn above ads), pin panels, "Me" (go to where I am) and "List" (the feed). After sign-in the app still lands on `/feed`; switch the landing to `/huud` once the owner has tried it.

- [x] M-01 (pwa: owner chose OpenFreeMap; lib/huudMapStyle.ts in the mockup palette, components/map/HuudMap.tsx; old maps moved off tile.openstreetmap.org; MapLibre worker served from public/) MapLibre base map with our own style (soft colours, labels), real streets across Nigeria from OpenStreetMap
- [x] M-02 (pwa: fill-extrusion from zoom 15, default 1-2 storeys where OSM has no height, zinc/terracotta/cream roofs; tilted street views, compass; calm mode flat) 3D buildings from real footprints; tilt and rotate; pinch zoom
- [x] M-03 (pwa: lib/sky.ts real sun times per place (NOAA, WAT) mapped onto the mockup palette; components/map/SkyMap.tsx; tested) Live sky over the map: time-of-day colours, sun and moon path (east → west), stars
- [x] M-04 (SkyMap fade + haze + sunlight on the ground; SkyHorizon: palms in the south, savanna acacias north of ~10°N) Horizon blend (land fades into the sky), palm-tree horizon, sunlight on the ground
- [x] M-05 (lib/mapWeather.ts + hooks/useMapWeather.ts; real weather every 15 min; harmattan = haze/dust/fog Nov-Mar; unknown = none; calm mode: no rain/lightning) Weather on the map: clouds and their shadows, drizzle, rain (current Sky Feed Hero drops), storm with lightning, harmattan haze, puddles
- [x] M-06 (lib/mapNight.ts: night palette inside MapLibre, lit-window pattern on walls, street lamps from dusk; billboard glow done with map ads, 2026-10-12) Night lights: windows, street lamps, glowing billboards
- [x] M-07 (server 57ec2d2 /geo/map-pins: 7 layers, ~110 m grid, no fake positions, max ~27 km box; radar now searches by area and drops items without a location; pwa: useMapPins + MapLayerChips + /feed?post deep link) Pins from Street Radar (`/geo/radar`) with layer chips: Safety, Traffic, Light & water, Market, Work, Events, Help
- [x] M-08 (server modules/geo/mapLive.ts: phones join ~5 km area rooms for the box on screen (signed-in sockets only); MongoDB change streams on posts, incident reports, products, jobs, events send "map:changed" with no content or position, max 1 per room every 2 s; app reloads pins through the normal privacy rules and new pins ripple for 10 s) Live pins via socket (appear and ripple instantly)
- [x] M-09 (pwa /huud: bottom sheet for every pin type: what, how fresh, price, "happening now", count on the block, Open / See the report, Ask Sentinel; ad panel with Visit) Pin panels (bottom sheet) for every type, with actions and "Ask Sentinel about this"
- [x] M-10 (2026-10-17: fresh traffic reports (go-slow, road block, accident, flood) make vehicles crawl and queue there; full for an hour, gone by 3 hours; minor reports slow less; expressways now carry street traffic too; normal flow when nothing is reported) Moving traffic driven by real go-slow reports (calm when no data)
- [x] 2026-10-17 (owner): **your own pins**: 🏠 your registered home (only on your phone, nobody else sees it) and the green "You are here" pin that follows you; never asks for location by itself (starts on "Me" or if already allowed)
- [x] M-11 (2026-10-17: server /geo/area-pulses: ~440 m cells where 2+ different people posted or reported in the last 2 h, cell centre only; app: green dot with a growing ripple, bigger where busier, still dot in Calm view) Neighbour activity as area pulses (never exact homes)
- [ ] 🟡 M-17 (first version live: vehicles, people, kids football, market crowds on real geometry; next: denser, go-slow speeds from reports) **Living map** (owner, 2026-10-12: "the map has to be real"): moving danfos, kekes, okadas and cars on real roads; people walking on real streets and paths; kids playing football on real pitches; crowds at real markets; density by time of day (rush hours busy, late night quiet) and weather (fewer people in rain), headlights at night; traffic speed from real go-slow reports (M-10). Decoration only, never real tracked people; off in calm mode
- [x] M-12 (2026-10-15 ⚡ ribbon; 2026-10-17: just the ⚡, steady scrolling that never freezes; tap ⚡ for **Today's Pulse**: around you (weather now, go-slows), the real 7-day forecast, today's naira rates with the time checked, news; no made-up fallback rates anywhere) Pulse ticker: news + exchange rates + weather; "Today's Pulse" panel
- [x] M-13 (2026-10-15: "Calm view / Live view" on the map, same setting as Save data: flat map, no motion) Calm view toggle
- [ ] M-14 Area Champion crown marker
- [x] M-15 (2026-10-17: flat, still map and no 3D/street life already came with Calm view / Save data; now map tiles are kept on the phone for 30 days (cache first, ~1,500 tiles), so revisits cost almost no data and the map shows offline; 2G or slower turns the light map on by itself unless Live view was chosen) Low-data mode: flat 2D map, no animation, cached last view
- [ ] 🟡 M-18 **Toy-world 3D** (owner, 2026-10-16, WareTrack reference): three.js layer inside MapLibre. Step 1 done: real OSM footprints become styled models (kiosk, bungalow with zinc/terracotta/green hip or gable roof, house, storey, plaza, warehouse with sawtooth roof, tall blocks), windows/doors, ground shadows, lit windows at night; **filler buildings along real roads where OSM has no outlines** (owner chose "fill in, plus help map Nigeria"; never on roads, water, parks, pitches or real buildings; real outlines win). Igando test: 0 → 577 buildings. Step 2 done: street life as 3D models (danfos, kekes, okadas with riders, cars in several paints, people, kids and the football) on the same simulation and real roads; palm trees on empty lots. Step 3 done (2026-10-17): **BRT buses** (Lagos blue / Primero red) run only on real BRT lanes from OpenStreetMap (`busway`; few are mapped yet, e.g. Ikorodu Road at Anthony), one per ~180 m so they never bunch; **head and tail lights** and a pool of light on the road for every vehicle after dusk; **3D billboards**: each map billboard ad stands on two posts at its spot, faces you, stays readable at any zoom, self-lit at night with lamps, tap opens the ad (2D board kept for screen readers). 2026-10-17 **help map Nigeria** done: where most buildings on screen are stand-ins, the map home invites people to add the real ones to OpenStreetMap (sheet with steps, privacy note, editor opened at the street; hidden a week per area once closed) (invite neighbours to add their buildings to OpenStreetMap so real outlines replace fillers)
- [x] M-16 (2026-10-17: three.js (~120 KB) loads only after the map shows, never in Calm view; phones with ≤2 GB or ≤4 cores get a lighter scene (half the 3D buildings, no antialias, 1.5x drawing, 40% fewer figures); map worker starts with the page; weather waits 3 s; app code served from the phone at once (CacheFirst for versioned files). Simulated 3G: return visit 2.1 s to map (target met); first visit ~16 s → ~10 s, the rest is the app's ~700 KB of code: Phase 11) Performance target: smooth on a ₦60,000 Android phone; map loads in under 3 s on 3G anywhere in Nigeria

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

- [x] 2026-10-17 (owner) **How it works for everything in Sentinel**: new guide `/safety/how-it-works` (16 sections: SOS, Panic PIN, Live Tracking, Fake Call, Safe Trips, check-ins, safe zones, guardians, Circle and status, emergency report, community emergency, incident reports, recap, how Sentinel watches, Ask Sentinel, what Sentinel never does), checked against today's code; every safety screen's How it works box links to its section; boxes added to Community emergency and Incident reports; links from the Sentinel tab and the hub. Corrected: Sentinel page said it reads chats (it never does), Live Tracking said agencies are alerted (they are not), Trips now states the 3-miss silent SOS
- [x] 2026-10-17 Ask Sentinel honesty (server 6692a39, deployed): "no reports" is never turned into "clear road", "power stable" or "calm"; no Lagos default area; no claims that DisCo / Huud Watch were notified
- [x] 2026-10-17 (owner: keep Share, share safely) **safety alerts share safely**: unconfirmed/disputed alerts ask "Share anyway?" first and the text is marked UNCONFIRMED/DISPUTED; the link opens a public page `/alert/<id>` with the live status (confirmed / unconfirmed / disputed / ended, age, area only; never the reporter, address or exact spot), and the WhatsApp preview says the same; no share HuudCredit until neighbours confirm (server 5c2a41b)
- [x] 2026-10-17 visitor welcome names the neighbourhood: "Welcome to Egbeda, Alimosho" (taken from the address, never a street)

- [ ] S-01 Sentinel orb on the map; ring colour from area mood (safe / advisory / alert)
- [ ] S-02 "Ask Sentinel" bar on home and "Ask about this" on pins, with suggested questions
- [ ] S-03 Answers show their sources and end with an action (start safe trip, show route, chat service)
- [ ] S-04 Voice questions (hold to talk)
- [ ] S-05 Widen scope: questions about Lagos and general topics, while safety and money answers stay strictly grounded in real data
- [ ] S-06 Sentinel tab: SOS centre, Protect, Your network, Tools, "What Sentinel watches", History (all existing safety features)

---

## Phase 7: Gamification backend

**Go-ahead given 2026-10-18.** See GAMIFICATION-REVIEW.md. Level powers apply to new accounts only; existing members keep the access they have.

**2026-10-16 audit and bug fixes (no change to what anyone earns):**
- [x] Fixed, tested and **deployed 2026-10-16** (server 01e76c2, app 23ce041; today's check-in limit reset for the 2 people the old login bonus had blocked):
  - **Check-in paid nothing.** Signing in gave a hidden 5 HC "login bonus" that used the check-in's one-a-day slot, so the check-in then failed to pay while the streak still moved. The login bonus is removed; the check-in is the one daily reward.
  - Daily limits now reset at midnight Nigeria time, not UTC, matching the streak (an 00:30 check-in used to count for the day before).
  - Check-in is all-or-nothing: if paying fails, the streak goes back so a retry works. Two taps at once can't both count.
  - **Rewards now show when they land**: the server tells the app after every payment and a "+N HuudCredit" card appears (posts, comments, deals, help, Lost & Found, tips…). Streak cards now say what they paid.
  - Streak cards and the check-in pop-up use the server's real next bonus day. They used to promise "+0" on days 100 and 365.
  - Complete-profile: "Claim 100 HuudCredit" shows only if it hasn't been paid yet (sign-up with a name already pays it). The success screen showed the whole balance labelled as the reward.
  - Achievement claims can't pay twice. Streak goals count your best run. "Earn N in total" goals and levels count what you've earned, so spending on an ad no longer lowers your level.
  - 15 achievements nobody could finish (no reward exists for attending events, follows, likes, ratings, safety reports, FYI, identity) are hidden until Phase 7.
  - Tips: limited to 500 HC a day (G-15 limit); a tip the recipient can't receive is refunded instead of vanishing.
  - Product likes were filed as comments and used up the comment limit. The wallet history was stuck on page 1. Rewards page "How to earn" now lists what the server really pays.
  - **Emergency reports pay on confirmation (owner, 2026-10-16):** 15 HC once neighbours confirm (3 "I'm nearby" or 5 confirms), not for posting; paid once per report; the reporter can't confirm or vote on their own post.
- Owner (2026-10-16): levels keep showing until the Phase 7 ladder replaces them.

- [x] G-01 (server 3113da2, deployed 2026-10-18) Separate **Impact** from HuudCredit in the database and API: impact_events ledger, once per action, with the area for leaderboards
- [x] G-02 (server 3113da2) 6-level ladder (New Neighbour → Huud Elder) with unlocks; migrated on production 2026-10-18: 58 users, 24 kept a higher level floor, 6 got Impact from past deals/help/returns/invites; nobody went down
- [ ] G-03 New earning table; **pay on confirmation** (safety reports, help, light updates). Done 2026-10-18: reports pay the reporter only once confirmed (also the old /safety/emergency/report, which paid 20 for posting), confirmers who were right get 2 HC + 5 Impact. Left: light updates, SOS on resolve, events with 5+ attending, listings/jobs pay on creation still
- [x] G-04 (2026-10-18) Remove coins for likes, follows and raw posts and comments (also acknowledge, cross-post, product likes/comments); post/comment achievements hidden until the new badges
- [x] G-05 (2026-10-18) Referral pays when the friend becomes active (their first Impact: confirmed report, help, deal, return): 50 HC each, +20 Impact to the inviter, max 10 a month; friends paid at signup under the old rule are not paid again
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

**Moved up (owner, 2026-10-12, inspired by Lagos Life):** map ads in all three formats, paid with HuudCredit or naira through **Bachs (bachs.io), not Paystack**. Server done (1d7abe1); app screens done 2026-10-12 (/ads hub, /ads/new booking, /ads/wall, /ads/mine, /admin/ads, billboards + sponsored pins layer `useMapAds`, design-kit demo). Billboards show on the map home (`/huud`) since 2026-10-15.

- [ ] 🟡 A-01 (server 1d7abe1: Ad model, 2 billboards / 3 sponsored pins per ~1 km cell, 12x12 wall per LGA, 30-min holds, moderation, expiry; app screens + map layer done 2026-10-12; on the map home 2026-10-15; left: Bachs keys + prices) Billboard spots on the map (limited per area), booking flow, moderation queue, "Ad" label, night glow; **ad wall of plots per area** (Lagos Life sea plots)
- [ ] 🟡 A-02 (server: HuudCredit atomic spend; Bachs hosted checkout + signed webhook; needs owner Bachs account + BACHS_API_KEY / BACHS_WEBHOOK_SECRET in Secrets Manager; prices to confirm) Pay for ads with HuudCredit or naira (**Bachs**)
- [ ] 🟡 A-07 **Feed ads, like X's promoted posts** (owner, 2026-10-15). Plan and status:
  - [x] New ad type **Feed post**: business name, up to 280 characters, optional picture (uploaded in the app; server only accepts our Cloudinary uploads), optional button (Visit / Shop now / Call / Book / Learn more, needs a link), reach **my area / my state / all Nigeria**
  - [x] Price (to confirm): ₦2,000 or 600 HuudCredit a week for your area; ×4 for your state (₦8,000); ×15 for all Nigeria (₦30,000)
  - [x] Server: `GET /ads/feed?lga&state` returns live feed posts for the area, state and Nigeria-wide, plus the **street ads** (billboards, sponsored pins) of the person's LGA, random order, max 6 per load; same booking, payment, review, refunds and expiry as map ads; tests
  - [x] App: sponsored cards in the feed (first after 3 posts, then every 6; each once; **never next to a safety or emergency post**); "Sponsored" label; hide (X) remembered on the device; one view per visit when half on screen, taps counted; booking screen, preview, moderator view, ads page
  - [x] Server deployed 2026-10-15 (ea98b5f): /ads/feed live, feed post prices live; event pins now open the event page
  - [x] Owner confirmed feed post prices (2026-10-15): ₦2,000 / ₦8,000 / ₦30,000 a week
  - [ ] Next: sponsored cards in Gist and Marketplace lists; "Report this ad"; per-person limit across visits; reach numbers on My ads
- [ ] A-03 Buy HuudCredit with naira (one way in)
- [ ] 🟡 A-04 (sponsored pins in Market/Work/Events done on the server) Sponsored pins, sponsored Gist cards, featured services, boosted events
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
| 2026-10-12 | Map ads in three formats (billboards, Ad Wall plots, sponsored pins); naira through **Bachs**, not Paystack |
| 2026-10-12 | Idea parked: HuudCredit as a discount coin (owner deferred; revisit before launch) |
| 2026-10-15 | Feed ads like X: sponsored posts (area / state / all Nigeria) and the area's street ads shown in the feed; never next to safety posts |
| 2026-10-15 | Bottom bar: floating light pill with raised ➕ (owner's reference); top bar clears the notch |
| 2026-10-15 | **Gist removed; Feed replaces it.** Feed top = the mockup's slim live sky; the hero, Pulse, greeting, Sentinel and report move to My Huud; swipe up on the map sheet for the Feed, down on the Feed's sky for the map |
| 2026-10-10 | No trading or selling HuudCredit between users; payouts only through the contributor programme, after legal review |
| 2026-10-10 | Safety reports never shared publicly and never paid in cash |
| 2026-10-10 | **PWA first**: no download needed; store apps later and optional |
| 2026-10-17 | iPhone home-screen app: the strip under the bottom bar stays (owner). It comes from iOS shrinking the app by the status-bar height; the only fixes are the full-screen status bar (white clock) or a store app (Phase 14) |
| 2026-10-10 | Fonts: **Nunito** (headings) + **Nunito Sans** (text), Noto Sans fallback. Snapchat's fonts (Avenir Next, Graphik) are paid; tested 19 free fonts for ₦ and Nigerian letters |
| 2026-10-10 | Phase 1 before Phase 2; AWS Region eu-west-2 (London) |
