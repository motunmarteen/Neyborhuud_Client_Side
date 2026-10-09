# NeyborHuud — Stitch Master Design Context

> Step 9 deliverable. A condensed, prompt-ready design brief for Google Stitch (or any AI UI
> generation tool) to use when generating or restyling screens for the rebuild. This is NOT a
> replacement for `design-system-spec.md` — it's a distillation of it, plus the DESIGN.md material
> that spec deliberately left for this document (emotional direction, visual pillars, gesture
> system, page transitions, map/Sentinel/SOS experience specifics, feed tone, notification tiers).
> When Stitch needs more precision than this doc gives on any point (exact hex values, exact class
> names, the reasoning behind a decision), go to `design-system-spec.md` — this doc trades precision
> for something pasteable into a single prompt.
>
> Every rule below is either (a) sourced from `pwa/DESIGN.md`'s deliberate intent, cross-checked
> against real source where a conflict existed, or (b) a decision already confirmed in
> `design-system-spec.md`. Nothing here is invented fresh for this document.

---

## 1. What this product is

NeyborHuud is a **hyperlocal safety-driven social platform** — not a traditional social app. It
layers realtime community events, incidents, conversations, alerts, and neighbourhood intelligence
over the physical world. It combines hyperlocal social networking, realtime event mapping, safety
awareness systems, community intelligence, neighbourhood communication, AI-assisted local awareness
(Sentinel AI), marketplace/community commerce, and immersive map interactions.

**Emotional target:** *"A living digital neighbourhood layered over the real world."*

## 2. The experience must feel

| Quality | Meaning |
|---|---|
| Immersive | Users feel inside the neighbourhood, not looking at a dashboard |
| Spatial | UI elements exist in layers and depth, not on a flat page |
| Calm | Never visually overwhelming — clarity before decoration |
| Intelligent | The interface anticipates actions and surfaces relevant context |
| Tactile | Every interaction has physical weight and feedback |
| Fluid | Transitions feel like physics, not code |
| Safe | Users trust the interface with their safety and location |
| Community-centred | Every screen reinforces belonging to a real place |

**Reference experiences (interaction quality only, never copy branding):** Instagram, TikTok, Apple
Music, Airbnb, Uber, Notion, iOS system interactions.

**Avoid:** a traditional web dashboard, an old-style web app, a noisy social media feed, a fintech
admin panel, a static website, hard page cuts/instant jumps, generic loading spinners, harsh
geometry and sterile enterprise visuals.

## 3. Visual design pillars — 4 languages, layered together

- **Organic/Biomorphic** — soft organic shapes, rounded forms, environmental depth, calm
  brand-rooted gradients, ambient doodle-pattern textures. Feels human and grounded.
- **Claymorphism** — soft floating surfaces with tactile weight, squeezable rounded elements,
  layered shadow depth. Feels touchable and spatial. Avoid excessive cartoon styling.
- **Spatial UI** — components float, elevate, expand, collapse; backgrounds blur when overlays
  appear; depth is always preserved. Users navigate a living environment, not static pages.
- **Glassmorphism (selective only)** — `backdrop-blur` + translucency + ambient borders, reserved
  for floating panels/bottom sheets, contextual menus, AI overlays (Sentinel), navigation docks,
  alert systems. Never apply to every screen — glass signals elevation and priority specifically.

## 4. Color — exactly 6 brand colors, strictly enforced

| Token | Hex | Role |
|---|---|---|
| `--primary` | `#00D431` | Main brand — CTAs, active states, highlights |
| `--brand-blue` | `#1A56FF` *(verified-current value — DESIGN.md's `#0000FF` is stale)* | Links, info, secondary actions, Sentinel AI |
| `--brand-surface` | `#E9F6E6` | Light backgrounds, card surfaces |
| `--brand-red` | `#FF0000` | SOS, danger, errors, destructive actions |
| `--brand-green-dark` | `#006F35` | Deep accents, hover states, FABs |
| `--brand-black` | `#1A1A1A` | Primary text, near-black backgrounds |

No other color may appear anywhere in the UI — no Tailwind palette defaults (`red-500`, `blue-400`,
`gray-300`, `amber-*`...), no arbitrary hex values, no old brand colors. Opacity variants are fine
(`bg-primary/10`, `text-brand-red/60`, etc.). Full old→new migration table lives in
`design-system-spec.md` §1.

## 5. Typography

Font: **Plus Jakarta Sans** only. Use Tailwind's native type scale (`text-xs` 10px through `text-3xl`
30px) rather than the legacy custom `--text-*`/`.type-*` CSS scale — this gets `rem`-based
accessibility font scaling for free and needs zero custom CSS. CTA/button label style:
`font-black uppercase tracking-[0.18em] text-sm`.

## 6. Spacing / Radius / Shadow

8px spacing scale (`--space-1` through `--space-16`). Standard Tailwind radius scale. 5-step shadow
elevation scale, driving the neumorphic and claymorphism depth. See `design-system-spec.md` §3 for
exact values.

## 7. Surfaces — 3 systems, never mixed on one screen

- **Neumorphic (`.neu-*`)** — light screens, onboarding, auth. Soft raised/inset depth on light
  backgrounds. Classes: `.neu-card-raised`, `.neu-card-sm`, `.neu-socket`, `.neu-inset`,
  `.neu-input`, `.neu-modal`, `.neu-nav`, `.neu-panel`, `.neu-flat`, `.neu-track`, `.neu-chip`,
  `.neu-fab`.
- **Modern Glass (`.mod-*`)** — feed, dark/blurred screens. Classes: `.mod-card`,
  `.mod-card-elevated`, `.mod-inset`, `.mod-chip`, `.mod-fab` (green FAB), `.mod-divider`,
  `.mod-modal`.
- **Auth family (`AuthFlowPage`, `auth-btn-*`)** — `/login`, `/signup`, `/forgot-password`,
  `/reset-password`, `/verify-email`, post-auth gates, `/info/*` legal pages. Permanently dark
  regardless of system theme, mirrors landing-page visual language.

**Split rule is by screen type, not by content type**: a whole screen commits to one system.
Cards respond to touch: `active:scale-[0.98]` + Framer Motion spring — cards feel alive, never
static.

## 8. Buttons — 4 variants only

`.btn-glass-primary` (max 1 per screen, the single most important action, `font-black uppercase
tracking-[0.18em] text-sm text-white`, full-width on mobile) · `.btn-glass-danger` (destructive/
emergency only) · `.btn-secondary` (supporting action) · `.btn-ghost` (lowest emphasis — skip
links, "view all"). Never hand-roll button styles; never use raw `bg-primary`/`bg-red-500`.

## 9. Modals / Bottom sheets — a core pattern, not a fallback

4-point snap system: **Peek 25vh** (preview — event pin, map marker) · **Half 50vh** (default —
comments, details) · **Expanded 90vh** (full content — post details, incident report) ·
**Full 100vh** (immersive — media viewer, SOS overlay). Canonical component: `BottomSheet.tsx`,
extended to this full snap system (confirmed 2026-08-28; supersedes an earlier, reversed decision to
delete it). Behavior: follows finger drag naturally, spring physics, rubber-band stretch near
limits, background blurs progressively as the sheet expands, no snap jumps without drag intent. Used
for comments, event previews, incident details, marketplace previews, Sentinel AI, map point
details, profile previews, contextual actions, notification details.

## 10. Forms

Always `PremiumInput`/`PremiumTextArea`/`OTPInput` — never a raw `<input>` outside these. Selects use
`BrowseSelect` (portal-rendered, doesn't clip inside sheets).

## 11. Gestures — a core navigation pattern, not an enhancement

Build on **Framer Motion's own gesture primitives** (`whileTap`, `whileDrag`, `useDragControls`) —
already the installed, canonical animation library and already used this way by `BottomSheet.tsx`.
Do not add `@use-gesture/react`/`react-spring` as a second dependency; get the same physics-based
feel from what's already there.

- **Swipe** — switching feed tabs, switching communities, media browsing, map layer switching.
- **Long press (500ms+)** — contextual menu: background softly blurs, selected item slightly
  enlarges, glass-style menu fades in with layered depth. Used for save post, report incident,
  share, moderation, quick reply, profile actions. Must feel premium and tactile.
- **Pull to refresh** — ambient custom animation, never a generic spinner; progressive reveal while
  pulling; spring snap-back on release.
- **Drag** — bottom sheets, map overlays, expandable cards. Follows finger naturally with spring
  resistance, stretches slightly near boundary limits.
- **Haptic-style feedback** — `scale`/`opacity` micro-animations simulating haptic weight on button
  presses, toggle switches, icon taps, reaction selections.
- Never rely on CSS `:hover` alone as the only interactive state on mobile.

## 12. Page transitions

Spatial continuity — users should feel like they're moving through a place, not loading pages.
Slide softly (forward enters from right, back exits to right), fade gradually, previous screen stays
briefly visible during transition. No hard cuts, no instant page jumps, no full-page reloads, no
abrupt color flashes. Use Framer Motion `AnimatePresence` + `motion.div`; shared-element transitions
for card→detail flows (post card → post detail); layered motion (background dims, foreground rises).

## 13. Motion / Animation

- **Durations:** micro 100-150ms (button presses, toggles) · standard 200-300ms (sheet/modal
  open-close, card transitions) · cinematic 400-600ms (page transitions, onboarding).
- Spring physics over ease curves for all interactive motion.
- `transform`/`opacity` only — never animate `top`/`left`/`width`/`height`/`padding`/`margin`; never
  `transition: all`.
- `animate-ping` is **exclusively reserved for active SOS state** — never decorative.
- All animation respects `prefers-reduced-motion`.

## 14. Feed system

Feels structured, intelligent, neighbourhood-aware — never chaotic. Three feed types, each a subtle
accent-only personality shift (never a background-color change):

| Feed | Purpose | Tone | Accent |
|---|---|---|---|
| FYI | Utility updates, local announcements, road alerts, safety info | Clean, informational, lightweight | `brand-blue` |
| GossipLocale | Local gist, discussions, social content | Energetic, expressive | `primary` |
| Owambeh | Marketplace, buying/selling, local events, commerce | Vibrant, visual-first, premium cards | `brand-green-dark` |

Swipe horizontally between feed tabs. Pull-to-refresh with ambient animation. Infinite scroll with
staged skeleton loading. Contextual long-press menu on every card.

### ⭐ Protected feature: the feed's ambient sky-hero (must preserve, do not genericize)

The feed hero is a **live scene, not a static banner** — driven by two real-time inputs combined
into one theme: **time of day** (recomputed every 60s) and **live weather** (via WMO weather codes).
One `getSkyTheme(timePeriod, weather)` call fans out to every visual layer: sky gradient, horizon
glow, city silhouette, 30 deterministically-positioned twinkling stars (night), sun-or-moon with glow
rings, 3 animated clouds, and weather particles (rain/snow/fog, each independently gated, index-based
deterministic positioning not `Math.random()`). Text content (greeting, weather line) uses the
theme's own text color so it stays legible against whichever sky is showing. This same engine and
particle system is reused in a sidebar header and a profile card — one shared theme engine, multiple
surface-appropriate presentations, never forked per-surface. See `design-system-spec.md` §14 for the
full technical breakdown. **When generating the feed screen, this hero must be depicted as alive and
reactive — not a fixed illustration.**

### Also protected: News and Forex

A local/community **news** feature (`/local-news`, tabs for Nigeria/International/Huud Gist, RSS-fed
article rows) and a **forex** exchange-rate feature (no standalone page — a live rate widget in three
places: a header strip on the news page, a marquee ticker living *inside* the feed sky-hero's
atmosphere, and a rotating single-rate display in the desktop sidebar) are both confirmed
must-preserve. See `design-system-spec.md` §14 "Also protected: News and Forex" for full detail and
placement reasoning.

## 15. Map experience

One of the most important systems on the platform — the living intelligence surface of the
neighbourhood. Must feel alive (markers pulse and react to activity), immersive (fills the viewport,
not boxed inside a page), intelligent (layers communicate risk/density/events), community-aware
(markers feel local, not generic).

**Layers:** danger zones (`brand-red/20` heatmap) · safe zones (`primary/15` overlay) · event density
(`brand-blue/20` cluster glow) · emergency alerts (`brand-red` pulsing marker) · commerce hotspots
(`brand-green-dark/20` overlay) · user location (`brand-blue` dot with accuracy ring).

**Markers:** pulse subtly for active events, scale up on activity spikes, visually prioritize danger
(red > amber > primary), cluster at low zoom / expand at high zoom, tap opens a bottom sheet snapped
to 50vh with details.

**Interactions:** smooth GPU-accelerated zoom, swipe-to-pan, tap marker → bottom sheet preview,
long-press map → "Report incident here" context menu, floating contextual cards over the map for
selected events. Real-time layer updates via WebSocket. Tech: **MapLibre GL JS** (the installed,
real option — not Mapbox).

## 16. Sentinel AI interface

The ambient intelligence layer of the neighbourhood — must feel calm and observant (never robotic or
alarming), ambient (present without demanding attention), trustworthy (data presented clearly, never
sensationalized). Appears as *"an ambient intelligence layer inside the neighbourhood — not a
dashboard."*

**Visual language:** floating glass panels (`.mod-card-elevated` + `backdrop-blur`), soft glow
accents in `brand-blue`, conversational cards (not data tables), predictive suggestion chips,
contextual awareness indicators.

**Interactions:** swipe cards to dismiss/act, tap to expand detail in a bottom sheet, AI suggestions
as floating chips that can be accepted/dismissed, never interrupts — suggestions surface
contextually.

## 17. SOS experience — the highest-priority system on the platform, must be flawless

Must feel immediate (zero delay from intent to action), serious (visually distinct from all other
UI), trustworthy (100% user confidence it worked), emotionally clear (urgency without panic).

**Bottom nav SOS button** (confirmed 2026-08-28: gets its own dedicated, centered tab in the
rebuild — see `design-system-spec.md` §11): always `text-brand-red`, never any other color; softly
pulsing glow (`animate-ping`) only in active SOS state; 44px minimum touch target; visually separated
from normal nav items; impossible to miss.

**Activation flow:** long-press begins (600ms threshold) → circular radial progress animation fills
around the button → haptic-style scale feedback → full-screen emergency overlay transition → live
location activation indicator → emergency network escalation UI.

**`/sos` page:** large polished red glass button centered on screen, red radial gradient
`#FF4D4D → #FF0000 → #B30000`, glass specular highlight, deep red shadow
`0 10px 40px rgba(255,0,0,0.55)`, cancellable countdown display, silent-mode toggle, emergency
services toggle.

**Hard rules:** `animate-ping` exclusively reserved for active SOS states; the SOS button must always
be reachable from any screen via BottomNav; never reduce its visual weight for aesthetic reasons.

## 18. Notification system

Prioritizes importance, not volume.

| Priority | Visual treatment | Sound |
|---|---|---|
| Emergency (SOS, active incident) | Full-screen overlay, `brand-red` | Alert |
| Safety alert (geofence, late check-in) | Banner + badge, `brand-red/80` | Notification |
| Community update (post, reply) | Badge only, `primary` | Silent |
| System (app update, tip) | Subtle banner, muted | Silent |

Emergency notifications override normal visual hierarchy — always render on top of everything. Group
notifications intelligently (never stack 10 individual items; related notifications collapse into
one). Ambient fade-in only, never flash/strobe. Never show notification permission prompts on
auth/onboarding pages.

## 19. Loading, empty, and error states

Never a generic spinner. Staged loading (structure first, then fill content), progressive rendering
(never a blank screen). Skeleton placeholders matching the eventual content shape (card shape for
feed cards, avatar+lines for profile, shimmer rows for lists). Route navigation should feel instant
via prefetching, not a visible loading state. Build shared `EmptyState`/`Skeleton`/`ErrorState`
primitives (currently a real gap — see `design-system-spec.md` §9) rather than per-feature
reimplementation.

## 20. Icons

Material Symbols Outlined for all UI chrome (the default for "any icon, anywhere" — no build step
per new icon). `lucide-react` scoped to chrome/utility icons in navigation only. Size scale:
navigation bar `text-[30px]`, card/list icon `text-2xl`, inline/label icon `text-xl`, hero/feature
icon `text-[44px]`.

## 21. Dark mode

App shell is fully dark-aware (class-based `.dark`, not OS-preference-driven). Landing and auth flows
are permanently dark regardless of system theme — a deliberate product decision (cinematic dark
onboarding, light-default app), not an inconsistency. Dark token table (verified to match source
exactly): background `#0D1A0F`, surface `#132218`, surface-base `#0A1209`, border `#1E3A22`, text
primary `#E9F6E6`, text secondary `#8FBC8F`. Neumorphic shadows recalculate automatically via
`--neu-shadow-dark`/`--neu-shadow-light` tokens.

## 22. Accessibility (non-negotiable)

Touch targets minimum 44×44px everywhere. Color contrast WCAG AA minimum (4.5:1 body text). All
animation respects `prefers-reduced-motion`. Font scaling via `rem` units, respecting system font
size. Semantic HTML (`h1`/`h2`/`h3`, `nav`, `main`, `button`, `aria-label` on icon buttons). SOS must
be reachable via keyboard and assistive technology. Focus rings: `*:focus-visible` outline
`#00D431` (green) — a duplicate, conflicting blue focus-ring rule exists in current source and must
not be carried into the rebuild; green is the correct, intended rule.

## 23. Performance standards

60fps minimum on all animation. Only `transform`/`opacity` animated (GPU-accelerated) — never
`top`/`left`/`width`/`height`/`padding`/`margin`. Gesture response under 16ms (one frame). Route
transitions prefetched, no visible loading state. Images lazy-loaded via `next/image` always. Code
split per route, no monolithic JS bundle. `will-change: transform` only on actively-animating
elements.

## 24. Tech stack (verified against `package.json`, not assumed)

Next.js, TypeScript, Tailwind v4 (`@theme inline` in `globals.css`, no JS config file), **Framer
Motion** (animation + gestures — do not add `@use-gesture/react`/`react-spring`), **MapLibre GL JS**
(maps — not Mapbox), **TanStack Query / React Query** (server state — do not add Zustand; Context
already covers the 8 real app-wide client-state cases), `next-pwa` (offline shell), Socket.IO via a
single shared `socketService` singleton (real-time), Material Symbols Outlined (icons, Google
Fonts), JWT via `apiClient`/`authService` (auth).

---

**For Stitch prompts on a specific screen**, combine: this document's relevant sections (always
include §1-13 as baseline context) + the screen-specific section (§14 Feed, §15 Map, §16 Sentinel,
§17 SOS, etc.) + any component-level detail needed from `design-system-spec.md`.
