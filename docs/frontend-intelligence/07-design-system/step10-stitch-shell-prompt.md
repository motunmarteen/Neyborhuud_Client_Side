# Step 10 — Stitch Prompt: NeyborHuud Application Shell

> Paste the prompt in the box below directly into Stitch (stitch.withgoogle.com) to generate the
> application shell — the persistent chrome (navigation, layout skeleton) that every screen sits
> inside. Do NOT ask Stitch for individual feature screens yet — that's Step 11. This step is only
> the shell: header/sidebar/content/bottom-nav structure and how it adapts across breakpoints.
>
> After Stitch generates results, bring screenshots/exports back here so we can review them against
> `design-system-spec.md` and `stitch-master-context.md` before moving to Step 11.

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
- Neumorphic (soft raised/inset depth, light backgrounds) for light-themed contexts
- Modern glass (backdrop-blur, translucent panels) for the main dark/feed-adjacent app shell
Visual pillars to blend throughout: organic/biomorphic softness, claymorphism (tactile floating
surfaces with real shadow weight), spatial UI (elevation, blur-on-overlay, layered depth — never
flat), and selective glassmorphism reserved specifically for floating panels, nav docks, and AI
surfaces (not applied everywhere).

## DESKTOP SHELL (≥1024px)
Three-column layout:
- Left sidebar: fixed width ~384px (24rem), neumorphic panel style (soft raised surface, not
  glass), persistent, houses primary navigation as a vertical list with icon + label per item,
  plus an ambient "sky" header area at the top of the sidebar that visually reflects current
  time-of-day and weather (soft gradient, subtle color shift — this is a living/reactive element,
  not a static image; see "ambient sky system" note below). Hidden entirely on mobile.
- Center: main scrollable content column, comfortably centered, does not stretch full-width even
  on very large screens (constrain to a readable max-width).
- Right sidebar (optional/contextual panel): secondary information surface, can be present or
  absent depending on the screen — design it as a flexible slot, not a mandatory fixed element.
- Top header bar: ~68px height, transparent/blended on primary screens, solid
  background (white, subtle 6% black bottom border) on secondary screens, brand wordmark
  bold/tight-tracking on the left, icon actions (search, notifications) on the right, all icon
  touch targets 44×44px minimum with fully rounded hit areas.

## MOBILE SHELL (<1024px)
- Top bar: ~68px height, same content rules as desktop (transparent on primary screens, solid
  elsewhere), safe-area aware (respect device notch/status bar inset at the top).
- Main content: full-width, scrollable, bottom padding reserved so content never sits under the
  bottom nav.
- Bottom navigation dock: floating, iOS-style dock, safe-area aware at the bottom. Soft shadow
  beneath it so it feels like it's floating above the content, not flush with the screen edge.
  Bottom nav inner height ~60px, plus safe-area inset below it.

  FIVE navigation slots, SOS is centered and visually distinct from the other four:
  1. Home (feed icon)
  2. Sentinel AI (shield icon — this is the safety/AI hub)
  3. SOS — CENTER SLOT, elevated above the dock's baseline (larger circular button, ~68px,
     floating slightly above the rest of the bar), always solid brand red (#FF0000), with a soft
     red glow ring around it at rest. This button must be the single most visually prominent
     element in the entire shell — impossible to miss, never de-emphasized. It gets a distinct
     ping/pulse glow animation concept when in an "active" state (design a visual affordance for
     this, e.g. a radiating ring).
  4. Messages (or a secondary content slot — design this as flexible, can represent chat/connect)
  5. Profile (user avatar, rounded)

  Active tab indicator: icon fills solid + brand green (#00D431) tint. Inactive: muted gray-green,
  not pure gray. Touch targets minimum 44×44px on every item including SOS (SOS itself should be
  meaningfully larger than the other four, as the priority action).

## AMBIENT SKY SYSTEM (signature feature — reflect this concept in the shell design)
Wherever a "sky" or ambient header surface appears (sidebar header on desktop, and conceptually
available for reuse elsewhere), design it as a living scene that could plausibly shift with time of
day and weather — not a flat solid color block. Show a soft gradient suggesting sky (e.g. warm
gold/orange tones for a "golden hour" example state, or a deep blue-green night tone as an
alternative example state) with a subtle celestial glow (sun or moon) and soft cloud/star shapes.
Treat this as reusable ambient chrome, not a one-off illustration — the visual language should feel
like it could smoothly shift to different weather/time states without changing its underlying
structure (gradient + glow + soft particle layer).

## SIDE DRAWER (secondary navigation, mobile)
A slide-in-from-left drawer for secondary navigation only (never the primary system): profile,
communities, saved posts, wallet, verification, settings, admin tools, moderation. Dark
translucent backdrop behind it. Should feel like a floating layered panel, spring-in motion
implied.

## Interaction/motion feel to convey in the static design
- Cards and buttons should look like they'd respond with a slight press-down/scale effect —
  convey tactile weight through shadow and elevation cues even in a static mockup.
- Floating, layered depth throughout — nothing should look flat or pasted onto the page.
- The overall palette should read as calm and uncluttered — clarity before decoration, generous
  whitespace, no visual noise competing with the SOS button's priority.

## Accessibility
Touch targets minimum 44×44px everywhere without exception. Sufficient contrast between text and
background at all times (WCAG AA, 4.5:1 minimum for body text).

## What NOT to include
- No feed posts, no marketplace cards, no chat bubbles, no actual content — placeholder/lorem
  blocks only in the content area.
- No colors outside the 6 listed brand colors.
- No flat/dashboard-style panels, no sharp enterprise geometry, no generic spinner iconography.
- Do not make Messages/Connect/Search/Gist compete visually with SOS for attention — SOS is always
  the dominant element in the bottom dock.

Deliver: a desktop shell view and a mobile shell view (including the bottom nav dock detail and the
side drawer state), each shown with realistic placeholder content in the main area.
```

---

## Notes for you before pasting

- This prompt deliberately does **not** ask Stitch to design the feed, Sentinel AI panel, or any
  other feature content — that's Step 11, one feature at a time, per the original plan. Keep it
  that way even if Stitch offers to "fill in" content — steer it back to shell-only if it drifts.
- The **5-slot bottom nav with a dedicated centered SOS button** reflects the decision you
  confirmed on 2026-08-28 (see `design-system-spec.md` §11) — this is a real structural change
  from what's currently shipped (`BottomNav.tsx` currently has 6 tabs and no SOS tab at all), so
  what Stitch generates here is the **target**, not a description of today's app.
- The "ambient sky system" paragraph is a deliberately soft, static-mockup-friendly description of
  the protected sky-hero feature (`design-system-spec.md` §14) — Stitch can't render live
  weather/time reactivity, so the prompt asks it to convey the *concept* (a living gradient scene)
  rather than a literal animation, so the visual language is compatible with the real reactive
  version once implemented in code.
- If Stitch's output drifts on brand colors, screen-type surface mixing (neu vs. glass), or touch
  target sizing, that's worth flagging back to me — those are the three things most likely to need
  a follow-up correction prompt.

## What to bring back after this step

- Screenshots or exported images of the desktop shell and mobile shell (including the bottom nav
  dock and side drawer states).
- Any Stitch share link, if it provides one.
- Your own read on whether it captured the feel right, even before I look — you know NeyborHuud's
  intended personality better than any spec document can fully capture.
