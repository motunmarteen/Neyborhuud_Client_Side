# Ask Huud: the NeyborHuud assistant (plan, 2026-10-19)

**Owner's goal:** Ask Huud is the "ChatGPT of NeyborHuud" and the core feature of the platform. It knows
everything that is public on NeyborHuud and can act on it. It answers questions like:

- "Where can I buy a generator?"
- "Find me a carpenter"
- "Which event is happening on Sunday?"
- "When is the Diamond Estate meeting this month?"
- "Which feature helps me do this?" (and opens the feature)
- "What's going on in the country?"
- "Will it rain today?" (in plain, human words)

It also learns from what people post.

**Names (owner 2026-10-19):**

- **Sentinel** = all the safety features (SOS, safe trips, check-ins, guardians, alerts, incident reports).
- **Ask Huud** = the assistant.

**Budget: ₦0 while bootstrapping.** It must still feel solid, like a paid product.

---

## 1. How it stays free and still solid

The trick: **most answers don't need a paid AI at all.** "Where can I buy a generator?" is really a search with
the right words, the right area and a clear answer. A paid model is only needed to chat about open-ended
things. So Ask Huud is built in three layers. The first two are free forever and run on the server we
already pay for.

| Layer | What it does | Cost |
|---|---|---|
| **1. Understand** | Works out what you want (buy, find a service, event, meeting, news, weather, safety, "which feature", open a feature), plus what, where and when ("Sunday", "this month", "Ikeja", "Diamond Estate"). Uses English, Pidgin and common Yoruba/Hausa/Igbo words. | ₦0: rules + word lists we write |
| **2. Find** | Searches NeyborHuud's own data: posts, market, services, jobs, events, communities and estate notices, FYI, safety reports. A small free "meaning" model on our server matches words that mean the same thing ("carpenter" ↔ "furniture maker", "gen" ↔ "generator"). Also news (our news sources) and weather (free weather service we already use). | ₦0: runs on the current server |
| **3. Say it well** | Writes the answer in plain English or Pidgin, with result cards and buttons ("Message seller", "Open Safe trip", "Set reminder"). For open questions only, it can use a **free AI tier**, trying one provider, then the next, then falling back to layer 1–2 answers. | ₦0: free tiers + our own wording |

**Free AI tiers we can use (no card, daily limits).** These change, so I'll confirm each one's current terms
before wiring it in:

- Google Gemini (AI Studio free tier)
- Groq (free Llama models)
- Cloudflare Workers AI (free daily allowance)
- OpenRouter's free models

One switch in the server settings picks the order. If all are busy, Ask Huud still answers from layers 1–2, so
it never just fails.

**What makes it feel paid:**

- Fast answers.
- Real results with buttons, not vague text.
- Answers about *your* area first.
- It remembers the conversation for follow-ups ("and on Saturday?").
- It always says where an answer came from ("from 3 listings in Ikeja").
- It caches common questions per area for a few minutes, so popular questions are instant and use no AI quota.

**Honest limits:**

- Free AI tiers have daily caps. Ask Huud is built to work without them, so heavy days still work, with
  less chatty wording.
- Some free tiers may learn from what we send them. We only ever send the question and public NeyborHuud
  data, never private messages or personal details, and the privacy policy will say so.
- When NeyborHuud grows big, a paid model becomes worth it. Switching is a settings change, not a rebuild.

---

## 2. What Ask Huud can answer (and where the answer comes from)

| Ask | Answer from |
|---|---|
| Buy something ("where can I buy…", "who dey sell…") | Market listings near you, then posts mentioning it; price, distance, "Message seller" |
| Find a service or person for a job ("carpenter", "plumber", "tailor") | Services + jobs + people who list that skill; ratings; "Book" / "Message" |
| Events ("what's on Sunday", "owambe this weekend") | Events in your area for that day/date range; "I'm going", "Remind me" |
| Estate and community meetings ("when is Diamond Estate meeting") | Community/estate posts, events and notices for that estate; the next date |
| "Which feature helps me…?" / "How do I…?" | A feature guide we write (every feature: what it does, other words for it, how to open it). Answer + an "Open it" button |
| Open a feature ("start a safe trip", "report a fire", "post a job") | The same guide; opens the screen, already filled in where possible |
| News ("what's going on in the country", "news about fuel") | Our news sources (Punch, Vanguard, Channels…), summarised in plain words with links |
| Weather ("will it rain", "is it hot today", harmattan) | Free weather service, explained like a person would ("Rain likely after 4pm, carry umbrella") |
| Safety ("is my area safe", "any wahala for Ikorodu road") | Sentinel reports, alerts and traffic near you. Emergencies go straight to Sentinel SOS |
| Search anything on NeyborHuud | All of the above, grouped (people, places, posts, market, events…) |
| Open questions ("how do I start a small business?") | Free AI tier when available; else a short honest answer + related NeyborHuud results |

---

## 3. Learning from people

- **New content becomes answerable at once:** every new post, listing, service, event and estate notice is
  added to Ask Huud's index when it's created.
- **Feedback:** "Did this help? 👍👎" on answers. Unanswered or 👎 questions go to an admin list, so we see
  what people want and fill the gaps (a missing feature, a missing word).
- **Ask your neighbours:** when Ask Huud has nothing, it offers to turn the question into a post for your
  area. The replies then teach it.
- **Fans-Out link:** what's trending in your area (see Fans-Out) is something Ask Huud can tell you about:
  "What's happening around me?"

---

## 4. Privacy and safety rules (built in, not optional)

- **Only public data**, and only what the asker is allowed to see (area-only posts stay in their area).
- **Never:** private chats, anyone's exact location, home address, phone number (unless they put it in a public
  listing), blocked people, children's details.
- **Emergencies first:** "help", "fire", "they're following me" and similar → straight to Sentinel SOS and
  emergency numbers, before any chat.
- **No made-up facts:** if NeyborHuud has nothing, it says so and offers to ask neighbours.
- Questions are treated as questions, never as instructions that change Ask Huud's rules.

---

## 5. Where it lives in the app

- The **search / ask box** at the top of the app and on the My Huud card becomes **"Ask Huud anything…"**.
- **Ask Huud** opens as a full chat screen: conversation, result cards and buttons.
- The **Sentinel tab** becomes safety only: SOS, trips, check-ins, guardians, alerts. A small
  "Ask Huud about safety" link keeps them connected.

---

## 6. Build order

1. **Names + feature guide:** rename the assistant to Ask Huud everywhere. Write the feature guide (every
   feature, other words for it, how to open it). Make the Sentinel tab safety only.
2. **Understand + find:** intent and what/where/when rules (English + Pidgin first). Structured search across
   market, services, jobs, events, communities and estates, posts, FYI and safety. News and weather answers in
   plain words. Result cards with action buttons.
3. **Meaning matching:** the free small model on our server, so similar words match, plus indexing every new
   item as it's created.
4. **Chat:** follow-up questions, the free AI tier chain with fallback, caching per area, and daily fairness
   limits per person.
5. **Learning loop:** 👍👎, the unanswered-questions list for admins, and "Ask your neighbours".
6. **Yoruba, Hausa, Igbo** word lists, with a native speaker's help.

Each step ships on its own and is useful by itself.

---

## Fans-Out (owner 2026-10-19)

"Trends on X", but for your area. A dedicated **Fans-Out** page shows what is happening around you right now:
the posts, safety reports, market activity, events, jobs and services that neighbours are talking about most,
ranked by how fast they're growing in your area.

- Notifications go out when something takes off near you.
- Tapping a trend opens everything about it.

To be specified and built after this plan is approved. It shares the indexing from steps 2–3 above.
