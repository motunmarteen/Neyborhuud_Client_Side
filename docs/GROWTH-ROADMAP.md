# NeyborHuud Growth Roadmap

Ideas parked on 9 October 2026 to work through later. Sparked by how fast the Lagos Life game spread (launched 1 October 2026; it claimed 5 million players within days, not independently verified).

**Goal:** make NeyborHuud something people open every day, that their neighbours need, and that they naturally invite others to join.

**Positioning:** *the operating system for your neighbourhood.* Safety brings people in, everyday usefulness makes them stay, and community participation spreads it.

Three outcomes to design around:
- **Protect:** people, families and streets.
- **Connect:** neighbours, groups and local services.
- **Improve:** neighbourhood life and local opportunity.

> Agree priorities, pilot budget and success metrics with the owner before committing engineering time.

---

## 0. Before anything else

- [ ] **Bring the API server back on AWS.** Nothing here can be piloted while login is down.
- [ ] Lock former team members out of every service (domain registrar, MongoDB Atlas, Cloudinary, Firebase, Vercel).
- [ ] Replace the leaked secrets.
- [ ] Fix GitHub Actions billing so the server tests run again.

---

## 1. Speak like Nigerians across the whole platform

**Goal:** every greeting, prompt, button and explanation should sound the way Nigerians actually talk ("Good morning o", "Wetin dey happen for your street?", "Buy am", "Price am", "You don reach?"), not textbook English. Plain Nigerian English that people understand at once and act on, with local expressions where they help, and full Pidgin, Yoruba, Igbo and Hausa options.

**Where we are:** `pwa/src/lib/i18n.tsx` already supports `en`, `pcm` (Pidgin), `yo`, `ig` and `ha`, but only about 50 phrases each, used on 5 screens. Most text is written directly in the components (about 465 screen files), and server messages, notifications, emails and SMS are all in generic international English.

Steps:
- [ ] **Language guide** (`docs/LANGUAGE.md`): the words and expressions NeyborHuud uses. Warm, direct, respectful, familiar Nigerian phrasing ("Your Huud", "neighbours", "estate", "gate man", "light don come"), naira formatting (₦), Nigerian place names and examples (Lekki, Ikeja, Yaba, Surulere, Abuja, Port Harcourt). What to avoid: stiff corporate English, Americanisms ("apartment", "zip code", "cell phone"), jokes in serious moments.
- [ ] **Safety copy stays crystal clear.** SOS, kidnapping, emergency and payment screens use short, plain English first, with no slang. Slang must never slow someone down in an emergency.
- [ ] **Rewrite the English (`en`) copy** screen by screen in Nigerian English: onboarding, feed, chat, marketplace, safety, profile, settings, errors, empty states and toasts.
- [ ] **Server-side messages:** error messages, push notifications, emails and SMS (Termii) in the same voice.
- [ ] **Move text into the language system** so every screen can switch language, not just the current 5.
- [ ] **Complete Pidgin first** (the widest reach across the country), then Yoruba, Hausa and Igbo.
- [ ] **Native-speaker review** of every translation before release. No machine-only translations for safety text.
- [ ] Language picker during onboarding (currently only in Settings), defaulting to Nigerian English.

---

## 2. Feature ideas

### Huud Live: the pulse of every neighbourhood (high priority)
Your Huud shows what is happening around you right now: road closures, flooding, power and water outages, verified safety advisories, lost and found, missing pets, events, new businesses and resident updates confirmed by neighbours.
- Reports carry a clear status: unverified → corroborated → verified → resolved.
- Sensitive safety reports must never become an uncontrolled rumour feed.
- *Already have:* incident reports with witness, confirm and dispute, plus automatic status updates.

### Street Radar: a map that's useful every day
A live neighbourhood layer: road hazards, flooding, blocked routes, clinics, pharmacies, artisans, notices, events, and safety advisories with time and confidence.
- Shareable, time-sensitive map links for WhatsApp groups.
- Exact incident locations, vulnerable people's movements and sensitive security details stay restricted.

### Huud Identity: trusted participation made visible
Privacy-respecting reputation earned for confirming real information, helping resolve problems, joining clean-ups and events, giving services that receive verified feedback, and being a reliable community representative.
- Build on TrustOS and the Trust Graph.
- Reputation comes from evidence, never popularity. Guard against fake accounts, coordinated endorsements and retaliation.

### Huud Circles: a home for every community
Street, estate, compound, residents' association and interest groups, each with announcements, moderated discussion, verified admins, membership rules, polls, events, maintenance requests, a shared issue tracker (open and resolved) and an opt-in emergency contact tree.
- *Already have:* hub communities with invite codes, join requests, admin and moderator roles, and group chat.
- *Missing:* issue tracker, structured announcements, emergency contact tree.

### Huud Market: useful beyond safety
Find plumbers, electricians, cleaners and mechanics; discover nearby shops and food vendors; local jobs; recommendations from trusted neighbours; legitimate items for sale.
- *Already have:* marketplace with escrow, services, jobs, and blocking of prohibited items and scams.

### Huud Guardian: family safety as a daily habit
One-tap "I don reach" arrival confirmations, opt-in trip sharing, check-in reminders, a simple emergency escalation, and guardians acknowledging alerts and coordinating help.
- Must work on poor connections and say clearly what needs internet.
- Never promise emergency response NeyborHuud can't actually provide.
- *Already have:* SOS, guardians, safe trips, kidnapping tracking.

### Huud Challenges: community improvement that feels like a game
Seven-day improvement challenges, clean-up campaigns, tracking unresolved infrastructure problems, welcoming new residents, local business discovery week, first-aid and preparedness drills. Contribution points, badges and recognition.
- Reward real outcomes, not post volume.
- Never reward manufactured incidents or exposing private information.

### Huud Impact: visible progression
Proposed levels: **Neighbour** → **Contributor** → **Trusted Contributor** → **Community Champion**.
- Users can see why recognition was earned and appeal mistakes.
- Neighbourhood milestones: first 25 residents, first 10 businesses, first completed project, first 100 confirmed helpful contributions, a month of steady participation.
- *Already have:* HuudCredit, streaks, badge catalogue.

**Strategic priority:** Huud Circles connected to Huud Live. A new resident should immediately find their estate, an announcement from a recognised admin, a nearby road update, a recommended local service, an upcoming meeting and a way to help. Never fabricate activity: an empty area shows useful public information and an honest invitation to set up the community.

---

## 3. Growth mechanisms

- [ ] **Fix referral rewards (real gap).** Coins currently go to the inviter the moment someone signs up with their code (`auth.controller.ts` → `applyReferralRewards`), which invites fake-account farming. Pay out only once the invitee does something real (verified address or first useful contribution).
- [ ] **Neighbourhood Launch Kit.** A guided "set up your estate" flow for chairmen, organisers and residents' associations: create a Circle, set rules, invite residents, publish first announcements. Shareable link plus a printable **QR code** for gates, noticeboards and meetings.
- [ ] **Neighbourhood Pulse Card.** A shareable, privacy-safe summary from real data only: issues resolved, upcoming events, new local services, verified advisories. Never fabricated stats or sensational crime.
- [ ] **Neighbour invites.** Simple personal links; measure activated invitees, not registrations.
- [ ] **Community Ambassador programme.** A few trusted representatives per pilot area, with training, moderation tools and a support channel. They are not security authorities.
- [ ] **Local business loop.** Business profiles, legitimate offers and recommendations; businesses invite customers. A sustainable revenue path that never puts core safety behind a paywall.
- [ ] **Honest empty-neighbourhood screen.** Since demo content was removed (correctly), empty areas need a useful first view.

---

## 4. Product experience

- **First session:** understand the value, find or set up your neighbourhood, browse, and join a Circle before being hit with permissions.
- **Home screen:** neighbourhood summary, relevant updates, quick SOS, your Circles. Emergency stays prominent without making the whole screen alarming.
- **Speed:** fast on ordinary Nigerian networks and modest phones (image delivery work already done; continue with maps, caching and low-data mode).
- **Sentinel AI with a defined job:** classify reports, spot duplicates and stale information, summarise activity, route to human review. It never labels anyone a criminal or confirms an emergency on its own.
- **Notifications worth getting:** relevant, time-sensitive, per-neighbourhood, with category controls, quiet hours and frequency limits.
- **Privacy as a feature:** careful location permissions, protection for children and vulnerable people, restricted sensitive incident details, live trip locations only for authorised guardians.
- **Tech:** build on the current Next.js, Node/Express and MongoDB stack; use Redis and BullMQ for notifications, digests, report processing and moderation queues. Test SOS, location, moderation, rate limits, audit logs and abuse prevention before scaling acquisition.

---

## 5. 90-day plan

| Days | Phase | Work | Deliverable |
|---|---|---|---|
| 1–14 | Audit and foundation | Audit features, journeys and security; find onboarding drop-off; turn Your Huud into a useful local feed; improve Circle creation and admin; add activation, retention and referral analytics; recruit 5–10 community organisers | Prioritised backlog and working pilot |
| 15–30 | One-neighbourhood pilot | Real residents and organisers; Circles and announcements; test Street Radar verification; onboard local businesses; test invites and the Pulse Card; interview those who stay, leave or never finish onboarding | Evidence of repeat use and why |
| 31–60 | Retention and referrals | Huud Impact and milestones; better notifications; ambassadors in more areas; find which invite sources produce active residents; events, digests and issue tracking | A repeatable way to activate and keep neighbourhoods |
| 61–90 | Expand what works | Neighbouring streets and estates with active organisers; business partnerships; real impact stories with consent; stronger moderation and incident handling; invest in channels that retain | A measured expansion playbook |

These are milestones to test, not guarantees. Expand only on pilot results.

---

## 6. Numbers to watch

| Metric | What it tells us |
|---|---|
| Activation rate | New users reaching a meaningful first outcome |
| Day 1, 7 and 30 retention | Whether it stays useful |
| Weekly active residents per neighbourhood | Whether each community is alive |
| Invitation conversion | Whether users bring others in |
| Organic acquisition share | Growth without paid ads |
| Useful contributions per active resident | Real community value |
| Issue resolution rate and time | Real outcomes |
| Safety alert quality | Accurate, well-handled, timely reports |

Pilot hypotheses (to test, not benchmarks): 40% of sign-ups complete a meaningful first action; 25% of activated users return in week two; at least 20% of new active users come through invites.

**Gap:** analytics today only records raw events (`POST /analytics/track`). None of the metrics above are computed yet.

---

## 7. What not to do

- Build everything at once.
- Buy downloads or fake engagement.
- Turn safety reports into viral content (panic, defamation, real-world danger).
- Put core emergency features behind a subscription.
- Expand across Lagos before single neighbourhoods work.
- Add AI everywhere just as a label.

---

## 8. Suggested first build after the server is back

"Neighbourhood Launch" sprint, roughly 1–2 weeks:
1. Referral rewards paid on real activity, not signup.
2. Set-up-your-estate flow with invite link and QR code.
3. Honest empty-neighbourhood screen.
4. Activation, retention and invite-conversion tracking.
5. Nigerian language: language guide plus rewritten greetings, onboarding and home-screen text (see section 1).
