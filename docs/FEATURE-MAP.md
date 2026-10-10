# NeyborHuud Feature Map for the New Design

Every feature and screen in the app (taken from the code on 10 October 2026: `pwa/src/app`, the sidebar, the Create menu, the street-signal bar and the Sentinel components), and where each one lives in the new map-first design.

---

## The new structure

**Bottom bar (5):** 🏠 **My Huud** (the map) · 📰 **Gist** (the feed) · ➕ **Create** · 💬 **Chats** · 🛡️ **Sentinel** (safety)

**Always on the map:** top bar (logo, area, HuudCredit, notifications, your photo → Me), map layer chips, ⚡ Pulse ticker, Sentinel orb, Calm view, SOS button.

**Map layers (chips):** All · 🛡️ Safety · 🚗 Traffic · 💡 Light & water · 🛒 Market · 💼 Work · 🎉 Events · 🙋 Help. Every listing, job, service, event, FYI and help request with a location becomes a pin on its layer.

**Me (tap your photo):** profile, Huud Passport, HuudCredit and rewards, Huud Economy score, premium, saved, settings, help, and **Everything in NeyborHuud** (a grid of every hub).

---

## 1. Sentinel (safety): its own tab, plus the orb, SOS and alerts on the map

| Feature | Screen today | Where in the new design |
|---|---|---|
| SOS (hold to send, countdown, emergency contacts, guardians notified, drill) | `/sos`, `SosCountdownOverlay`, `EmergencyContactOverlay` | Red **SOS** button on every map screen; full SOS command centre at the top of the Sentinel tab |
| Floating SOS | `FloatingSosButton` | Same red button, always visible |
| Panic PIN (duress PIN, enter, practice) | `/safety/panic-pin`, `/enter`, `/practice` | Sentinel tab → Tools |
| Fake call | `/safety/fake-call` | Sentinel tab → Tools, plus a quick action in the SOS panel |
| Safe trips (start, active, escalation, auto-SOS, history, guardians watching) | `/safety/trips`, `/history`, `/watch/[userId]` | Sentinel tab → Protect; an **active trip pill** shows on the map while a trip runs |
| Emergency / kidnapping live tracking | `/safety/kidnapping-tracking`, `/watch/[sessionId]` | Sentinel tab → Protect; guardians watching see a live tracking panel |
| Safety zones (geofences, red-zone alerts) | `/safety/geofences`, `RedZoneAlertsContext` | Sentinel tab → Protect; red zones drawn on the map; red-zone alert slides down from the top |
| Guardians and circle (add, requests, accepted, live status, check-ins) | `/safety/manage`, dashboard panels, `GuardianAlertsContext` | Sentinel tab → Your network; incoming guardian alerts slide down over any screen |
| Live status sharing | `DashboardLiveStatusPanel` | Sentinel tab → Your network |
| Safety report / incident reports (witness, confirm, dispute) | `/incident-reports`, `/[id]`, `/safety/incident/[id]` | ➕ Create → Safety report; red 🚨 pins on the Safety layer; tap → "I see am too / Not true" |
| Report emergency | `/safety/emergency` | Sentinel tab → Tools, and SOS panel |
| Community emergency | `/community-emergency` | Sentinel tab → Tools; also an alert banner on the map when active |
| Sentinel watch settings (chats and scams, posts, market/jobs/events, location context, trust and reports) | `/safety/sentinel`, `/settings` | Sentinel tab → "What Sentinel watches" |
| Recent alerts near you (home and work) | `/safety/sentinel` | Sentinel tab → Alerts; also the orb's ring colour |
| Ask Sentinel (AI) | `AskMyHuudDrawer`, `/assistant` API | Sentinel orb, "Ask Sentinel" bar on the home panel, "Ask about this" on pins |
| Street Radar (signals by category) | `FeedSkyHero`, `StreetRadarView`, `/geo/radar` | The map itself: pins on the Safety, Traffic and Light layers |
| Sentinel map | `/map` | Merged into the home map |
| History (past trips, resolved incidents) | dashboard History | Sentinel tab → History |

## 2. Create (➕)

| Item | Today | New design |
|---|---|---|
| Post | Create menu | ➕ → Post |
| FYI alert (power, road, utility notice) | Create menu, `/fyi` | ➕ → FYI alert; 📢 pins on the Light & water layer; FYI tab in Gist |
| Safety report | Create menu | ➕ → Safety report (red, at the top) |
| Community poll | Create menu | ➕ → Poll; shows in Gist |
| Huud event | Create menu, `/events/create` | ➕ → Event; 🎉 pins on the Events layer |
| Help request (tool, ride, a hand) | Create menu, `/help-request` | ➕ → Help request; 🙋 pins on the Help layer |
| Marketplace item | Create menu, `/marketplace/create` | ➕ → Sell something; 🛒 pins on the Market layer |
| Job / gig | `/jobs/create` | ➕ → Post a job; 💼 pins on the Work layer |
| Service | `/services/create` | ➕ → Offer a service; 💼 pins on the Work layer |
| 1-tap street signals: no light, light don come, transformer fault, heavy gridlock, street flooded, gate locked, security checkpoint, suspicious movement, security disturbance, fire or hazard | `QuickSignalBar` | ➕ → "Quick signal" row at the top of the Create sheet (one tap, no typing) |

## 3. Map layers (things with a location)

| Feature | Today | New design |
|---|---|---|
| Marketplace (browse, item, my listings, my deals, edit) | `/marketplace/*` | 🛒 Market layer pins; tap → item panel (Buy am / Price am); full list under Everything → Market; my listings and deals under Me |
| Jobs (list, detail, my applications, saved) | `/jobs/*`, `/work` | 💼 Work layer pins; Everything → Jobs & gigs |
| Services (list, detail, my bookings, favourites) | `/services/*` | 💼 Work layer pins; "Need hand?" in Sentinel answers; Everything → Services |
| Events (nearby, detail, my events, edit) | `/events/*` | 🎉 Events layer pins; Everything → Events |
| Help requests | `/help-request/*` | 🙋 Help layer pins |
| FYI bulletins | `/fyi` | 📢 pins on the Light & water layer; FYI tab in Gist |
| Places (followed places, home, work) | `/settings/places` | Shown on the map; managed under Me → Settings |

## 4. Gist (the feed)

| Feature | Today | New design |
|---|---|---|
| Feed: For you, trending, news | `/feed`, `/explore`, `/popular` | Gist tab with sub-tabs: For you · FYI · Polls · News · Trending |
| Huud Gist | `/gist`, `/gist/[id]` | Gist tab |
| Local news | `/local-news/*` | Gist → News; headlines also in the ⚡ Pulse ticker |
| Exchange rates and weather forecast | `FeedNewsTicker`, weather | ⚡ Pulse ticker → "Today's Pulse" panel |
| My Huud page | `/neighborhood` | Becomes the map home |
| Media preview | `/feed/media-preview` | Unchanged, opens from posts |

## 5. Chats (💬)

| Feature | Today | New design |
|---|---|---|
| Inbox with All / Chats / Groups tabs | `/friendship?tab=dms`, `ChatsStream` | Chats tab |
| Conversation (voice notes, swipe to reply, edit, delete, forward, reactions, calls, live location, SOS share, trip share, polls, product, event, job and post shares, deals and escrow) | `/chat/[id]` | Chats → conversation |
| Communities (list, detail, join by code) | `/communities/*` | Chats → Groups tab, and Everything → Communities |
| Connect: near me, following, followers | `/friendship` tabs | Chats → "Find neighbours" |

## 6. Me (tap your photo)

| Feature | Today | New design |
|---|---|---|
| Profile, followers, following | `/profile/[username]/*` | Me |
| Huud Passport (verification, trust) | `/profile/passport` | Me → Passport |
| HuudCredit, wallet, rewards | `/huud-economy/*`, `/rewards`, `/gamification/*` | 🪙 in the top bar → wallet; Me → Rewards |
| Huud Economy score | `/huud-economy/score` | Me → Score |
| Premium | `/premium`, `/premium/success` | Me → Premium |
| Saved posts | `/saved` | Me → Saved |
| Notifications | `/notifications` | 🔔 in the top bar |
| Settings: location, places, password, payout, blocked | `/settings/*` | Me → Settings |
| Help and rules, privacy, terms, postcodes | `/info/*` | Me → Help |

## 7. Getting started (before the map)

Welcome, sign up, log in, verify email, forgot and reset password, complete profile, verify location, pick community, setup complete: `(marketing)/*`. Restyled in the new look, same order.

## 8. Admin

Admin home, reports, users: `/admin/*`. Restyled last; only admins see it (under Me).

---

## Not real screens (no redesign needed)

Redirects only: `/chat`, `/messages`, `/gossip`, `/popular`, `/premium`, `/gamification`, `/gamification/wallet`, `/safety/dashboard`, `/events/create`, `/jobs/create`, `/services/create`. Test or demo pages: `/chat/test-views`, `/demo`.

---

## Appendix: every page file (108) and its new home

| Page | New home |
|---|---|
| `(marketing)` | Getting started (restyled) |
| `(marketing)/complete-profile` | Getting started (restyled) |
| `(marketing)/demo` | Test/demo page: not redesigned |
| `(marketing)/forgot-password` | Getting started (restyled) |
| `(marketing)/login` | Getting started (restyled) |
| `(marketing)/pick-community` | Getting started (restyled) |
| `(marketing)/reset-password` | Getting started (restyled) |
| `(marketing)/setup-complete` | Getting started (restyled) |
| `(marketing)/signup` | Getting started (restyled) |
| `(marketing)/verify-email` | Getting started (restyled) |
| `(marketing)/verify-location` | Getting started (restyled) |
| `(marketing)/welcome` | Getting started (restyled) |
| `/admin` | Me → Admin (admins only) |
| `/admin/reports` | Me → Admin (admins only) |
| `/admin/users` | Me → Admin (admins only) |
| `/app-root` | Getting started: opening screen (restyled) |
| `/chat` | Redirect only: no screen |
| `/chat/[conversationId]` | Chats → conversation |
| `/chat/test-views` | Test/demo page: not redesigned |
| `/communities` | Chats → Groups / Everything → Communities |
| `/communities/[id]` | Chats → Groups / Everything → Communities |
| `/communities/join/[code]` | Chats → Groups / Everything → Communities |
| `/community-emergency` | Sentinel → Tools (+ map banner when active) |
| `/events` | Events layer on the map / Everything → Events / Me → My events |
| `/events/[id]` | Events layer on the map / Everything → Events / Me → My events |
| `/events/[id]/edit` | Events layer on the map / Everything → Events / Me → My events |
| `/events/create` | Redirect only: no screen |
| `/events/my-events` | Events layer on the map / Everything → Events / Me → My events |
| `/events/nearby` | Events layer on the map / Everything → Events / Me → My events |
| `/explore` | Gist tab |
| `/feed` | Gist tab |
| `/feed/media-preview` | Opens from posts (unchanged) |
| `/friendship` | Chats tab (inbox, find neighbours) |
| `/fyi` | Gist → FYI / Light & water layer |
| `/gamification` | Redirect only: no screen |
| `/gamification/wallet` | Redirect only: no screen |
| `/gist` | Gist → News / Pulse ticker |
| `/gist/[id]` | Gist → News / Pulse ticker |
| `/gossip` | Redirect only: no screen |
| `/help-request` | Help layer on the map / ➕ Help request |
| `/help-request/[id]` | Help layer on the map / ➕ Help request |
| `/huud-economy` | Me → HuudCredit, rewards, score (🪙 in top bar) |
| `/huud-economy/score` | Me → HuudCredit, rewards, score (🪙 in top bar) |
| `/huud-economy/wallet` | Me → HuudCredit, rewards, score (🪙 in top bar) |
| `/incident-reports` | Safety layer pins / Sentinel → Reports |
| `/incident-reports/[id]` | Safety layer pins / Sentinel → Reports |
| `/info/community-rules` | Me → Help & rules |
| `/info/nigeria-postal-codes` | Me → Help & rules |
| `/info/privacy-policy` | Me → Help & rules |
| `/info/terms-of-service` | Me → Help & rules |
| `/jobs` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
| `/jobs/[id]` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
| `/jobs/create` | Redirect only: no screen |
| `/jobs/my-applications` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
| `/jobs/saved` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
| `/local-news` | Gist → News / Pulse ticker |
| `/local-news/[id]` | Gist → News / Pulse ticker |
| `/local-news/gist/[id]` | Gist → News / Pulse ticker |
| `/map` | Merged into the home map |
| `/marketplace` | Market layer on the map / Everything → Market / Me → my listings & deals |
| `/marketplace/[id]` | Market layer on the map / Everything → Market / Me → my listings & deals |
| `/marketplace/[id]/edit` | Market layer on the map / Everything → Market / Me → my listings & deals |
| `/marketplace/create` | Market layer on the map / Everything → Market / Me → my listings & deals |
| `/marketplace/my-deals` | Market layer on the map / Everything → Market / Me → my listings & deals |
| `/marketplace/my-listings` | Market layer on the map / Everything → Market / Me → my listings & deals |
| `/messages` | Redirect only: no screen |
| `/messages/[conversationId]` | Chats → conversation |
| `/neighborhood` | Becomes the map home (My Huud) |
| `/notifications` | 🔔 in the top bar |
| `/popular` | Redirect only: no screen |
| `/premium` | Redirect only: no screen |
| `/premium/success` | Me → Premium |
| `/profile/[username]` | Me → profile, passport, followers |
| `/profile/[username]/followers` | Me → profile, passport, followers |
| `/profile/[username]/following` | Me → profile, passport, followers |
| `/profile/passport` | Me → profile, passport, followers |
| `/rewards` | Me → HuudCredit, rewards, score (🪙 in top bar) |
| `/safety` | Sentinel tab |
| `/safety/dashboard` | Redirect only: no screen |
| `/safety/emergency` | Sentinel → Tools → Report emergency |
| `/safety/fake-call` | Sentinel → Tools → Fake call |
| `/safety/geofences` | Sentinel → Protect → Safety zones (+ red zones on map) |
| `/safety/incident/[id]` | Safety layer pins / Sentinel → Reports |
| `/safety/kidnapping-tracking` | Sentinel → Protect → Emergency tracking |
| `/safety/kidnapping-tracking/watch/[sessionId]` | Sentinel → Protect → Emergency tracking |
| `/safety/manage` | Sentinel → Your network (guardians, circle) |
| `/safety/panic-pin` | Sentinel → Tools → Panic PIN |
| `/safety/panic-pin/enter` | Sentinel → Tools → Panic PIN |
| `/safety/panic-pin/practice` | Sentinel → Tools → Panic PIN |
| `/safety/sentinel` | Sentinel → What Sentinel watches / alerts |
| `/safety/sentinel/settings` | Sentinel → What Sentinel watches / alerts |
| `/safety/trips` | Sentinel → Protect → Safe trips (+ trip pill on map) |
| `/safety/trips/history` | Sentinel → Protect → Safe trips (+ trip pill on map) |
| `/safety/trips/watch/[userId]` | Sentinel → Protect → Safe trips (+ trip pill on map) |
| `/saved` | Me → Saved |
| `/services` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
| `/services/[id]` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
| `/services/create` | Redirect only: no screen |
| `/services/my-bookings` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
| `/services/my-favorites` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
| `/settings` | Me → Settings |
| `/settings/blocked` | Me → Settings |
| `/settings/location` | Me → Settings |
| `/settings/password` | Me → Settings |
| `/settings/payout` | Me → Settings |
| `/settings/places` | Me → Settings |
| `/sos` | SOS button everywhere / Sentinel → SOS |
| `/work` | Work layer on the map / Everything → Jobs & Services / Me → my applications, bookings, saved |
