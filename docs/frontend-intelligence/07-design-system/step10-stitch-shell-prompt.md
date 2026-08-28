# Step 10 — Stitch Prompt: NeyborHuud Application Shell

> Paste the prompt in the box below directly into Stitch (stitch.withgoogle.com) to generate the
> application shell — the persistent chrome (navigation, layout skeleton) that every screen sits
> inside. Do NOT ask Stitch for individual feature screens yet — that's Step 11. This step is only
> the shell: header/sidebar/content/bottom-nav structure and how it adapts across breakpoints.
>
> After Stitch generates results, bring screenshots/exports back here so we can review them against
> `design-system-spec.md` and `stitch-master-context.md` before moving to Step 11.
>
> **Revision note (2026-08-28):** the first version of this prompt was written from summarized
> notes, not a full read of every shell source file. A follow-up exhaustive, line-by-line audit of
> all 21 shell-related files (`components/navigation/*`, `components/feed/BottomNav.tsx`, plus
> `lib/shellRoutes.ts`/`lib/appShellGates.ts`/`app/layout.tsx`) found real, structurally important
> facts that were missing or wrong in that draft — most significantly, that desktop browsers on the
> app subdomain don't get a native responsive layout at all, they get a phone-simulator mockup. This
> version is rewritten from that full audit. See "What changed from the first draft" at the bottom.

---

## Prompt to paste into Stitch

```
Design the application shell for NeyborHuud — a hyperlocal safety-driven social platform that
layers realtime community events, incidents, conversations, alerts, and neighbourhood intelligence
over the physical world. Emotional target: "a living digital neighbourhood layered over the real
world." The experience must feel immersive, spatial, calm, intelligent, tactile, fluid, safe, and
community-centred — reference the interaction quality (not branding) of Instagram, TikTok, Apple
Music, Airbnb, Uber, Notion, and iOS system interactions. Avoid anything that reads as a traditional
web dashboard, a fintech admin panel, or a static website.

This is the SHELL ONLY — the persistent chrome every screen lives inside. Do not design feed
content, post cards, or feature-specific screens. Show the shell with placeholder/lorem content in
the main area so the chrome itself is the focus.

## Design tokens (exactly 6 brand colors — no others may appear)
- Primary (brand green): #00D431 — CTAs, active states, highlights
- Brand blue: #1A56FF — links, info, secondary actions, Sentinel AI
- Brand surface: #E9F6E6 — light backgrounds, card surfaces
- Brand red: #FF0000 — SOS, danger, destructive actions only
- Brand green dark: #006F35 — deep accents, hover states, FABs
- Brand black: #1A1A1A — primary text, near-black backgrounds

Typography: Plus Jakarta Sans. Spacing: 8px base scale. Two coexisting surface languages — do not
mix them within one shell instance:
- Neumorphic (soft raised/inset depth, light backgrounds) for the left navigation rail and light
  contexts
- Modern glass (backdrop-blur, translucent panels) for floating docks, menus, and AI surfaces
Visual pillars to blend throughout: organic/biomorphic softness, claymorphism (tactile floating
surfaces with real shadow weight), spatial UI (elevation, blur-on-overlay, layered depth — never
flat), and selective glassmorphism reserved specifically for floating panels, nav docks, and AI
surfaces (not applied everywhere).

## THE PRODUCT IS MOBILE-FIRST — DESKTOP IS A PHONE PRESENTATION, NOT A SEPARATE DESKTOP LAYOUT
Design ONE mobile app shell (the real product). For the desktop deliverable, present that SAME
mobile shell inside a realistic iPhone-style device frame (rounded bezel ~12px, dynamic-island-style
notch, thin status bar showing a clock/signal/wifi/battery glyphs), centered on a dark (#050706)
backdrop with two soft glow blobs (green top-left, blue bottom-right, both heavily blurred). Beside
the phone frame, add a glass info card ("Designed for Mobile" heading, one line of body copy about
NeyborHuud being built for real-time safety features, a placeholder QR code block, "SCAN TO INSTALL"
caption) — do not literally design a wide desktop web layout with a permanent full-width sidebar,
that is not how this product actually presents itself on desktop browsers.

## THE MOBILE APP SHELL ITSELF

### Top bar (~68px content height + safe-area inset above it)
- Default state on most routes: solid, near-opaque background (white/96%, dark-mode
  near-black/96%), soft blur, thin 5%-black bottom border, subtle shadow. Left side: a plain page
  title (bold, tight tracking). Right side: a single notification bell icon with a small red unread
  count badge (caps at "99+") — this is the ONLY icon action in the top bar, no search icon and no
  message icon here.
- Special state on the Home/Feed route only: fully transparent (no background, no border, no blur)
  while at the top of the page, so it blends into the feed's ambient sky background beneath it —
  becomes the solid style once the user scrolls down. On this route, the left side shows an animated
  wordmark logo with a small dropdown chevron instead of a plain title.
- Slides fully off-screen (translates upward) when the user scrolls down, slides back in when they
  scroll up — smooth 300ms transition.

### Feed-route dropdown mega-menu (opens from the top-bar chevron, feed route only)
A rounded-corner white/dark floating panel anchored just under the top bar, ~400px max width:
- Header row: user avatar clipped into a rounded map-pin/teardrop shape, plus a settings gear icon.
- A 3×2 grid of 6 quick-launch tiles, each a distinct accent color, Material-icon-style glyph +
  label: Marketplace (blue), Work (orange), Events (purple), FYI Bulletin (yellow), Help Request
  (green), Safety Alert (red) — sitting on a soft gray inset background.
- Footer row: "Help Center" link and a red "Logout" action.

### Left navigation rail — a mobile slide-out drawer (NOT a permanent desktop sidebar)
Width ~320px, slides in from the left over a blurred dark scrim backdrop, rounded right edge only,
soft drop shadow. From top to bottom:
1. An ambient "sky" header panel (~240px tall) — a living gradient scene (see "Ambient Sky System"
   below) containing the NeyborHuud wordmark + a small Sentinel AI shield icon at the top, and below
   that a compact user identity chip (avatar, name, @handle, chevron).
2. A single rotating "Local Huud" menu row at the very top of the nav list — icon + "Local Huud"
   label, with a subtitle that implies it cycles through short phrases like "Marketplace · Events ·
   Jobs · Services" (design it as one settled state, but the copy should hint at rotation).
3. Ordinary nav rows: My Huud, Communities, Saved.
4. A "Local News" nav row whose subtitle area implies a scrolling headline ticker.
5. Huud Economy nav row.
6. An "Exchange Rates" row styled identically to the other nav rows but showing a live-look currency
   figure as its subtitle (e.g. "1 USD = ₦1,500.00") — this is a real live FX ticker in the product,
   not a link to a converter page.
7. Footer section: Settings & Privacy, Help Center.
8. A thin decorative city-skyline silhouette strip at the very bottom of the panel.
- On days with rain/snow weather, a full-height column of falling particle effects (rain streaks or
  snowflakes) should visually run down the ENTIRE height of this drawer — through the sky header,
  behind the nav rows, fading out just above the skyline silhouette at the bottom. Show this as one
  example state (e.g. gentle rain) so the concept reads clearly.

### Bottom navigation — a floating capsule dock, not an edge-to-edge bar
A single fully-rounded pill/capsule, inset ~12px from both screen edges, capped at a comfortable
max-width, floating ~8px above the very bottom of the screen (safe-area aware) with a soft shadow
beneath it so it clearly floats above the content rather than sitting flush. Translucent
blurred-glass background (90% white / 85% near-black in dark mode).

**This is the TARGET redesigned dock (5 slots, SOS gets its own dedicated centered slot) — not the
current shipped 6-tab shape.** Inside the capsule:
1. **Home** (house icon) → feed
2. **Sentinel** (a custom shield glyph with two small sparkle/star accents inside it, signaling
   "AI-powered" — not a generic shield) → opens the safety/AI hub. Convey this tab as
   slightly special/interactive (it opens a menu rather than a plain link elsewhere in the product).
3. **SOS — CENTER SLOT, elevated above the dock's baseline** (larger circular button, ~68px,
   floating slightly above the rest of the bar), always solid brand red (#FF0000), with a soft red
   glow ring around it at rest. This must be the single most visually prominent element in the
   entire shell — impossible to miss, never de-emphasized. Give it a distinct pulsing/radiating-ring
   visual affordance suggesting an "active" alert state as a secondary example.
4. **Connect** (a stacked message-bubbles icon) → chat/friendship. Carries a small red unread-count
   badge in the top-right corner of the icon when there are unread messages.
5. **Profile** (user avatar, rounded) → the signed-in user's profile.

Active tab (except SOS, which is always red): icon fills solid + brand-green tinted. Inactive: muted
gray-green. Touch targets minimum 44×44px on every item; SOS itself should be meaningfully larger
than the other four, as the priority action. The other four tabs must never visually compete with
SOS for attention.

*(Note: today's shipped product actually has 6 tabs — Home/Search/Sentinel/Connect/Gist/Profile —
with no SOS tab at all. This prompt intentionally asks for the confirmed TARGET redesign instead, so
Search and Gist are folded out of the bottom dock for this pass; where they resurface — the side
drawer, a secondary row, etc. — is a decision for a later implementation step, not this shell design
pass.)*

### Right-side contextual panel (shown only as an optional/secondary panel concept, not primary)
When space allows (e.g. the phone-frame's info-card area, or conceptually as a tablet-width aside),
a secondary content column can include, top to bottom: an onboarding checklist card, a compact
ambient weather card (temperature + condition text over the same living sky-gradient system, with
its own small skyline silhouette at the bottom), an "Upcoming Events" list (2-3 items, each with a
date badge), and a small 2-column "Marketplace" preview grid (image + title + price). Treat this as
a flexible, optional slot — not mandatory chrome on every screen.

## AMBIENT SKY SYSTEM (signature feature — reflect this concept wherever a "sky" panel appears)
Design the sky panels (drawer header, weather widget) as a living gradient scene that could
plausibly shift with real time-of-day and live weather — never a flat solid color block. Show ONE
example state clearly (e.g. a warm dawn gradient — deep purple through coral through soft gold — with
a soft glowing sun disc and a couple of drifting cloud shapes), and in your description note that the
same panel would shift to other palettes at other times (a deep navy night version with a glowing
moon and small twinkling stars; a clear blue midday version; a stormy desaturated version with rain
streaks). The visual structure (gradient + glowing celestial body + soft cloud/star layer + optional
particle weather layer) should read as one reusable system, not a one-off illustration.

## Interaction/motion feel to convey in the static design
- Cards and buttons should look like they'd respond with a slight press-down/scale effect — convey
  tactile weight through shadow and elevation cues even in a static mockup.
- Floating, layered depth throughout — nothing should look flat or pasted onto the page.
- The overall palette should read as calm and uncluttered — clarity before decoration, generous
  whitespace.

## Accessibility
Touch targets minimum 44×44px everywhere without exception. Sufficient contrast between text and
background at all times (WCAG AA, 4.5:1 minimum for body text).

## What NOT to include
- No feed posts, no marketplace cards, no chat bubbles as main content — placeholder/lorem blocks
  only in the content area itself (the sidebar's own live widgets — weather, FX, news, events,
  marketplace preview — ARE part of the shell and should be shown).
- No colors outside the 6 listed brand colors.
- No flat/dashboard-style panels, no sharp enterprise geometry, no generic spinner iconography.
- Do not design a permanent wide desktop sidebar layout as if it were the primary desktop
  experience — the desktop deliverable is the phone-frame presentation described above.

Deliver: (1) the desktop/phone-frame presentation view, (2) the native mobile shell with the top bar
in its default state, (3) the mobile shell with the left drawer open (showing the sky header, live
widgets, and the rain/snow particle column example), (4) a close-up of the bottom nav capsule.
```

---

## Notes for you before pasting

- **The single biggest correction from the first draft**: the earlier version asked Stitch to design
  a classic three-column responsive desktop layout (fixed sidebar + centered content + optional right
  panel, all full-width). That is **not what the real product does**. Verified directly in
  `DesktopPhoneFrame.tsx`: on desktop browsers at the app subdomain, the whole app renders inside a
  same-origin iframe embedded in an iPhone-shaped device mockup next to a "Designed for Mobile" /
  QR-code install panel, with the outer marketing page's URL kept in sync with the inner app's route.
  A true wide-desktop responsive layout basically doesn't exist as the primary experience — this
  revision reflects that honestly instead of inventing a desktop shell that isn't real.
- **The bottom nav in this prompt is the TARGET 5-slot dock with a dedicated centered SOS
  button** (confirmed 2026-08-28, per `design-system-spec.md` §11) — not what's currently shipped.
  Confirmed directly in `BottomNav.tsx`, today's real dock is actually 6 tabs
  (Home/Search/Sentinel/Connect/Gist/Profile) with no SOS slot at all. You explicitly confirmed
  designing the target shape now rather than the current one, so Search and Gist are intentionally
  left out of this dock — where they resurface in the rebuilt IA (side drawer, elsewhere) is a later
  implementation decision, not part of this shell pass.
- **The left "sidebar" is a mobile slide-out drawer, not a persistent desktop rail** — it's genuinely
  richer than a plain nav list: a live weather/time sky header, a full-height rain/snow particle
  column, a live 3-second-polling FX ticker row, a live scrolling news-headline row, and a rotating
  "Local Huud" menu row cycling through 7 destinations. All of this is now reflected in the prompt.
- **`Sidebar.tsx`** (a different, X.com-style collapsible sidebar file found during the audit) **is
  dead code with zero usages anywhere in the app** — it was never referenced by the first draft, but
  flagging it here so it's never mistaken for the real shell in a future step.
- If Stitch's output drifts on brand colors, the phone-frame desktop framing, or touch target sizing,
  that's worth flagging back to me.

## What changed from the first draft (full list, from the exhaustive source audit)

1. Desktop reframed from "responsive 3-column layout" to "phone-simulator device frame" — the
   single largest correction, changes what "the desktop deliverable" even means.
2. Bottom nav confirmed as the **target** 5-slot-with-centered-SOS design (Home/Sentinel/SOS/
   Connect/Profile) rather than today's real 6-tab shape (Home/Search/Sentinel/Connect/Gist/Profile,
   no SOS tab) — you explicitly re-confirmed this when asked, so Search and Gist are intentionally
   left out of the dock for this pass.
3. Left sidebar's real contents added: ambient sky header (with exact composition), rotating Local
   Huud menu row, live FX ticker row, live news marquee row, full-height rain/snow particle column,
   bottom skyline silhouette strip — none of this was in the first draft, which only described a
   generic "vertical list with icon + label."
4. Right sidebar's real contents added (Onboarding Checklist → Weather widget → Events → Marketplace
   preview) — the first draft left this as a vague "optional contextual panel" with no real content.
5. Top bar's route-dependent behavior added: transparent-on-feed vs solid-elsewhere, the feed-only
   animated-logo + dropdown mega-menu, confirmed single notification-bell action (no search/message
   icons in the top bar, contradicting what might otherwise be assumed).
6. Sentinel tab's long-press-for-Fake-Call gesture and its "opens a menu, not a direct link" behavior
   added — this tab is meaningfully different from the other 5, which the first draft didn't capture.
7. Noted (but did not include as current UI) two components confirmed dead/unused during the audit —
   `Sidebar.tsx` (X.com-style alternate sidebar) and `LocalHuudBottomSheet.tsx` — so no future step
   mistakes them for real shell UI.
