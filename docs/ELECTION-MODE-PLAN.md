# Election mode: plan

**Owner approved building it on 2026-11-11.** Tracker item S-07.

- **Presidential and National Assembly election:** Saturday 16 January 2027
- **Governorship and State Assembly elections:** Saturday 6 February 2027
- **Today:** 66 days to go. Election mode has to be live and tested by **early January**.

**Goal:** on election day, NeyborHuud helps people vote safely and know what is really happening on
their street, without ever taking sides or announcing results.

---

## 1. The rules (fixed, not settings)

1. **Neutral, always.** No party, candidate or "who will win" content from NeyborHuud itself. Ask Huud
   already refuses to take sides (step 4 rules).
2. **Never results.** NeyborHuud never counts, collects, estimates or announces results, and doesn't
   let people post result sheets as "results". It links to INEC's result viewing portal (IReV) and
   INEC's own announcements.
3. **No political ads, no candidate polls,** until a lawyer has reviewed them. Ads and Polls refuse
   them automatically.
4. **Safety reports, not opinions.** Election reports are about what happened (violence, vote buying,
   late materials), never about who people support.
5. **Your polling unit is private.** It shows roughly where you live, so it's never shown to anyone,
   and is used only to tag your reports and show what's happening near your unit.
6. **Anonymous for the public, not for us.** People can hide their name on a report. NeyborHuud still
   knows who sent it, so false reports can be dealt with. The app says this plainly.

---

## 2. What people get

### A. Election hub (`/election`)
Linked from Sentinel, Ask Huud and a banner on My Huud and the Feed in the weeks before.
- **Countdown** to the next election day.
- **My polling unit:** you type the polling unit code and name from your voter's card (PVC), for
  example `24-01-05-003`, or skip it. There's a link to INEC's polling unit locator for people who
  don't know theirs.
- **What to bring and know:** your PVC; accreditation with the BVAS machine; voting hours; what not
  to do (no phones in the voting cubicle, no selling your vote). These are plain lines in English and
  Pidgin, checked against INEC's published guide before launch.
- **Official links:** INEC, IReV for results, and the INEC help line. Plus fact-checkers (Dubawa,
  Africa Check, FactCheckHub) for claims.

### B. Election incident reports
The same report flow NeyborHuud already has, with an **Election** type:
- **What happened:** violence or fighting, vote buying, intimidation or threats, ballot snatching,
  materials or officials late, BVAS not working, polling unit moved or closed, other.
- **Tagged to a polling unit:** your own, or the one you're at.
- **Evidence:** photo or video. Faces of bystanders aren't blurred automatically in this first
  version, so the app reminds people to film the incident, not voters.
- **Anonymous option** (rule 6). Only verified accounts can report, as today.
- **Neighbours confirm or dispute** (already built). A report shows "Confirmed by 3 neighbours" or
  "Disputed".
- **Moderators:** a review queue for election reports. Anything that names or accuses a party or
  candidate goes to review before it's shown.

### C. Election-day safety map and "avoid" alerts
- An **Election** layer on My Huud: reports near you, with polling units that have confirmed
  violence shown as **areas to avoid**. Locations are shown approximately, the same as other reports.
- **Avoid alert:** when 2+ neighbours confirm violence or ballot snatching near you, people within
  about 2 km get a push alert: "Avoid <area>: neighbours report fighting near a polling unit. Stay
  safe." It never says who did it.

### D. "I have voted, I'm safe"
- One button on the hub and on My Huud on election day. It sends **"I've voted and I'm safe"** to
  your guardians (the existing guardians and status updates), with an optional short note.
- People can also tap **"I'm safe, I didn't vote"** or **"I need help"**, which opens SOS.
- It never shows how anyone voted. It isn't a public count.

### E. "Is it true?" election rumour check
- Paste or type a claim ("They've moved the election", "INEC said you can vote without a PVC").
- Ask Huud first checks INEC's own news and NeyborHuud's labelled claims. Neighbours can add "I saw
  this" or "This is false". Moderators label a claim **Confirmed**, **False** or **Not known yet**,
  with a link to the source.
- Labelled claims show in the hub so the same rumour gets one clear answer.

---

## 3. What NeyborHuud never does
- Count, collect, estimate, predict or announce results, or let people post result sheets as
  "results".
- Show anyone's polling unit, or how anyone voted.
- Run or allow political ads or candidate polls (until a lawyer says how).
- Send people's names to anyone outside NeyborHuud.

---

## 4. Build order and dates

| Step | What | Ready by |
|---|---|---|
| E1 | Hub: countdown, my polling unit, what to bring, official links; political ads and candidate polls blocked | **29 Nov** |
| E2 | Election incident reports + moderator queue | **13 Dec** |
| E3 | Election map layer + avoid alerts (push) | **20 Dec** |
| E4 | "I have voted, I'm safe" + rumour check | **3 Jan** |
| E5 | Full test with test accounts, load check on the server, a written election-day plan (who watches the moderation queue, when) | **10 Jan** |

The governorship elections on 6 February reuse everything; only the date changes.

---

## 5. Owner decisions (2026-11-11)
1. **Polling unit:** people type the code from their voter's card, with a link to INEC's locator.
2. **Rumour check:** elections only for now; the general "Is it true?" (S-06) reuses it later.
3. **Moderators:** decide later. The review screen is built now; the owner names people before
   January.
4. **Political ads and candidate polls:** blocked until a lawyer reviews them.
