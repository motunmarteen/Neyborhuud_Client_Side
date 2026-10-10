# Gamification Review and Redesign

Review of the current coins, levels, badges, achievements, streaks, leaderboard, trust and referrals (from the server code on 10 October 2026: `modules/gamification`, `huudcoin.ledger.ts`, `gamification.catalogue.ts`, `referral.service.ts`, `trust.routes.ts` and every `awardHuudCoins` / `spendHuudCoins` call), and a proposal to make it simpler, fairer and built to spread, the way Lagos Life did.

---

## 1. What exists today

| Part | How it works now |
|---|---|
| **HuudCoins** | Earned for actions; spent on boosts, pinning posts (100 for 1 day, 300 for 7), tipping (50 / 100 / 200 / 500), creating a community, event, job, product and service boosts |
| **Points and levels** | 20 levels on a points total: Level 2 at 100, Level 10 at **100,000**, Level 20 at **2,000,000** |
| **Badges** | **50** badges across onboarding, posts, social, market, jobs, events, services, safety, streaks, FYI, gossip, chat, news, trust, vouching, referrals, levels, legendary |
| **Achievements** | **41** achievements that pay coins when claimed (25 to 1,500) |
| **Streak** | Daily check-in: 5 coins; 7, 30 and 100-day achievements |
| **Leaderboard** | Weekly or all-time, by points, **for the whole platform** (not per area) |
| **Trust** | Trust score (300 to 1000) plus TrustOS stages: Seedling → Sapling → Tree → Baobab; vouching |
| **Referral** | Coins to inviter and new user **at signup** |
| **Huud Economy** | Separate "score" and wallet screens |
| **Penalty** | −1,000 coins when moderation upholds a report against you |

What earns coins today (amount, daily cap): post 10 (5 a day), FYI 8 (3), comment 2 (20), like 1 (20), follow 2 (10), share 3 (10), list item 10 (3), deal completed 20 (5), event 15 (2), attend 5 (3), job post 10 (2), apply 5 (5), book service 10 (3), rate 8 (3), **safety report 20 (3)**, emergency report 15 (2), help/SOS help 20 (3), daily login 5, referral 20 (10), sign up 20, verify email 10, complete profile 100.

---

## 2. What's wrong with it

1. **Too many scores.** Coins, points, levels, trust score, TrustOS stage, Huud Economy score, 50 badges and 41 achievements. Nobody can say what they are "working towards". People ignore systems they can't explain in one sentence.
2. **Levels people can never reach.** At realistic earning (30 to 60 coins a day), Level 10 takes years and Level 20 is effectively impossible. Most users will sit at Level 2 to 4 forever, which feels like failing.
3. **It pays for noise, not help.** Coins for every post, comment and like (up to 20 likes a day), and badges like "Always Online" (100 messages) and "Prolific Poster" (100 posts). That rewards spam and lowers the quality of the feed.
4. **It pays for safety reports before they're true.** 20 coins per report, 3 a day, paid immediately. That **encourages fake or exaggerated safety reports**, the most dangerous thing on a safety platform.
5. **Referrals pay on signup.** One person can farm coins with throwaway accounts.
6. **The leaderboard is national.** A new user in Somolu competes with the most active people in all of Nigeria and will never appear on it. No local pride, no reason to share.
7. **Coins have nothing exciting to buy for ordinary users.** Boosts and pins are for sellers. A regular resident earns coins with nothing they want to spend them on, so coins stop meaning anything.
8. **Nothing is shareable.** Levels, badges and rankings live inside the app. Lagos Life spread because people **posted their status** ("I'm Nepo", "I'm Governor this week").
9. **Inconsistent names:** "NeyburH", "Huud Regular", "Community Elder", "Baobab" and "Level 15" all describe the same idea differently.

---

## 3. The redesign: two meters, one ladder

### Rule 1: Only two numbers

- **⭐ Impact**: your standing in your area. **Earned only by real outcomes. Can't be bought or spent.** Drives your level.
- **🪙 HuudCoins**: spending money inside the app. Earned with Impact, also given in challenges and rewards, spent on fun and useful things.

Trust stays, but as a **verification tick** (✅ verified, 🏠 address verified, 🤝 vouched), not another score on screen.

### Rule 2: One ladder everyone can climb (merges levels and TrustOS)

| Level | Name | Roughly | What it unlocks |
|---|---|---|---|
| 1 | 🌱 **New Neighbour** | Joined | See and post |
| 2 | 🌿 **Neighbour** | First week, verified | Sell in the market, vote in polls |
| 3 | 🤝 **Helper** | ~1 month active | Confirm reports (your confirmation counts more) |
| 4 | 🏅 **Trusted Neighbour** | ~3 months, vouched | Create events, verified-seller badge |
| 5 | 🌳 **Area Champion** | ~6 months | Moderate local reports, start community challenges |
| 6 | 🌲 **Huud Elder (Baobab)** | 1 year+, top of area | Run for Area Champion of the Week, special map marker |

Every level is reachable in months, not years. Each level **gives a new power**, not just a number. That matches "reward useful outcomes" in the growth roadmap.

### Rule 3: Pay for outcomes, not activity

| Action | Impact | Coins | When it pays |
|---|---|---|---|
| Safety report | 30 | 20 | **Only after 2+ neighbours confirm it**; nothing if disputed |
| Confirm someone's report correctly | 5 | 2 | When the report is later verified |
| Light / road / FYI signal | 10 | 5 | After 1 confirmation |
| Helped someone (help request closed as "helped") | 25 | 15 | When the person marks you as their helper |
| Responded to an SOS | 50 | 30 | When the case is resolved |
| Completed marketplace deal (both sides) | 15 | 10 | On delivery confirmation |
| Event hosted (5+ attended) | 30 | 20 | After the event |
| Job filled / service completed with 4★+ | 20 | 15 | After the rating |
| Neighbour invited **who becomes active** | 20 | 50 | After their first verified post or deal |
| Post that neighbours found useful | 5 | 2 | At 5 "useful" reactions (max 3 a day) |
| Daily check-in (opening Today's Pulse) | — | 2 | Daily; streak bonuses below |

**Removed:** coins for likes, follows, raw posts and comments, and the "Always Online" and "Prolific Poster" style badges.

### Rule 4: Coins worth wanting (sinks)

- **For everyone:**
  - **Map skins**: Detty December lights, Eyo Festival sky, Independence Day green-white-green, Rainy Season.
  - **Profile frames and your marker on the map.**
  - **Shout-outs**: thank a helper publicly with 50 coins.
  - **Tip a neighbour.**
- **For sellers and organisers:** boost a listing, pin a post or event, feature a service (these already exist).
- **Later, with partners and anti-fraud checks:** **airtime and data** (very motivating in Nigeria) and **discounts at local businesses** on NeyborHuud. Only for verified users at Level 3+, with monthly limits, and checked with a lawyer first. Cash-like rewards attract fraud, and prize draws can count as lotteries under Nigerian regulation.

### Rule 5: Badges people are proud to share (50 → 16)

Firsts: **Founding Neighbour** (first 25 in a street), **First Helper**, **First Sale**, **Event Host**.
Safety: **Street Guardian** (5 verified reports), **SOS Responder**, **Light Watch** (20 confirmed light updates).
Community: **Good Neighbour** (helped 5), **Community Hero** (helped 25), **Trusted Seller** (10 deals at 4.5★), **Local Employer**.
Growth: **Ambassador** (5 active invites), **Area Builder** (25 active invites).
Rare: **Area Champion of the Week**, **Huud Elder**, **NeyborHuud OG** (first 10,000 users).

Every badge has a **share card** with the sky-and-map scene.

---

## 4. Built to go viral (what Lagos Life teaches)

| Lagos Life mechanic | NeyborHuud version (real, positive) |
|---|---|
| "@Franka is Governor this week" | **Area Champion of the Week**: the neighbour with the most Impact in each area that week. Their face appears on their area's map with a crown, and a share card is made for them automatically. |
| Weekly law ("Minimum wage raise is law this week") | **Huud of the Week challenge** for all of Lagos: "Light Watch Week", "Clean Gutter Saturday", "Welcome a New Neighbour Week". It shows in the Pulse ribbon; areas that hit the goal get a badge on their map. |
| 400 homes, sea plots (claim your place) | **Founding Neighbour**: the first 25 people in each street get a permanent badge and their name on the street's founder list. Limited slots create urgency and invites ("Only 6 founder spots left on Adeyemi Street"). |
| Nepo vs Lapo identity | **Area pride**: Somolu vs Bariga vs Yaba. Weekly **Most Helpful Huud in Lagos** ranking by verified help, resolved reports and active neighbours. Shareable: "Somolu is #3 in Lagos this week 🔥". |
| Live counters ("91k online") | "312 neighbours in Somolu · 38 active now" on the map and in every share card. |
| Billboards (ads) | **Local business boards** on the map: verified businesses buy a sign on their real location. A revenue line that fits the map. |

### Share moments (made automatically, one tap to post)

- **Daily:** "Today in Somolu"
- **On achievement:** new level, new badge
- **Weekly:** Area Champion of the Week; your area's ranking
- **Events and items:** event invite, item for sale
- **Invites:** your invite card with code (pays only when the friend becomes active)

Safety reports are never made into public share cards.

### Streaks that don't punish

- 7-day streak: +10 coins. 30-day streak: map skin unlocked.
- **Streak saver**: one missed day a week is forgiven (data and network problems are real in Nigeria).

---

## 5. Leaderboards

- **My area this week** (default): top 10 neighbours in your area, weekly reset, so new people can win.
- **Lagos areas this week**: area vs area.
- **Friends**: people you follow.
- No national individual leaderboard (it only rewards a handful of power users).

---

## 6. Protection against abuse

- Coins for safety and help only after confirmation by **different, verified** neighbours; confirmers who repeatedly back false reports lose confirmation weight.
- Referral rewards only after the invitee's **first verified action**; detect device and phone overlap; cap at 10 a month.
- Daily caps stay; the −1,000 penalty for upheld abuse stays.
- Cash-like rewards (airtime, vouchers) only for Level 3+, verified phone, monthly limit, manual review of unusual patterns.

---

## 7. Moving existing users over

- Current **coin balances stay**.
- **Level** is recalculated from verified history (badges, deals, reports confirmed, help given). Nobody goes down; anyone whose old level is higher keeps a "Legacy" mark.
- Existing badges map to the 16 new ones where they match; the rest become "Legacy" badges on the profile, so nothing earned is taken away.

---

## 8. Build order

1. **Server:** two meters (Impact separate from coins), new earning table with "pay on confirmation", referral-on-activation, 6-level ladder, area leaderboards.
2. **Share cards:** level-up, badge, Area Champion, "Today in Somolu", area ranking.
3. **Founding Neighbour** slots per street and the weekly **Area Champion**.
4. **Huud of the Week** challenges (admin-set weekly theme, shown in Pulse).
5. **Coin shop:** map skins, frames, shout-outs.
6. **Later:** airtime and data and local-business rewards with partners, after legal and anti-fraud checks.
