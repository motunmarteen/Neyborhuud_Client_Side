# NeyborHuud Design Tokens — Extracted from globals.css

> Step 8 (Design System Specification) deliverable. Source: `pwa/src/app/globals.css` (9,630
> lines, Tailwind v4, `@theme`/`:root` custom properties). Read in full, sequentially, no
> sampling. All line numbers below are independently checkable against that file. This document
> is the source of truth for the app's real, shipped visual design system — a rebuild that
> follows it should be pixel-consistent with what's already in production.

---

## 1. Color System

### 1.1 Official brand palette (the canonical 6 colors)
Declared explicitly at lines 33-43 as a comment: *"NeyborHuud Official Brand Palette — 6 colours only. Never use a colour outside this set."*

| Token | Value | Purpose |
|---|---|---|
| `--primary` / `--neon-green` / `--color-primary` | `#00D431` | Main brand, CTAs, highlights |
| `--brand-blue` / `--color-brand-blue` | `#1A56FF` | Links, info, secondary actions |
| `--brand-surface` / `--color-brand-surface` | `#E9F6E6` | Light backgrounds, cards |
| `--brand-red` / `--color-brand-red` | `#FF0000` | Danger, SOS, errors, destructive |
| `--brand-green-dark` / `--color-brand-green-dark` | `#006F35` | Deep accents, FABs, hover |
| `--brand-black` / `--color-brand-black` | `#1A1A1A` | Primary text, dark backgrounds |

Defined at `:root` (lines 44-50) and mirrored into Tailwind utilities via `@theme inline` (lines 112-118).

### 1.2 Light/dark surface & text tokens (lines 52-108)
| Token | Light | Dark |
|---|---|---|
| `--background` | `#F6FAF6` (`--background-light`) | `#0D1A0F` (`--background-dark`) |
| `--surface` | `#EDF5EA` (`--surface-light`) | `#132218` (`--surface-dark`) |
| `--surface-base-dark` | — | `#0A1209` |
| `--border` | `#D4E8D0` (`--border-light`) | `#1E3A22` (`--border-dark`) |
| `--text-primary-*` | `#1A1A1A` | `#E9F6E6` |
| `--text-secondary-*` | `#3D5A3E` | `#8FBC8F` |
| `--foreground` | maps to `--text-primary-light` | maps to `--text-primary-dark` |

Dark mode is applied via a `.dark` class override block (lines 94-108) that redefines `--background`, `--foreground`, `--border`, and legacy aliases (`--charcoal`, `--deep-text`, `--soft-bg`).

### 1.3 Semantic state tokens (lines 67-73, mirrored in `@theme inline` 128-134)
| Token | Value |
|---|---|
| `--status-success` | `#00D431` (same as primary) |
| `--status-warning` / `--status-pending` | `#F59E0B` |
| `--status-danger` | `#E8271A` (note: distinct from `--brand-red` `#FF0000`) |
| `--status-info` | `#1A56FF` |
| `--status-neutral` | `#6B7280` |

### 1.4 Neumorphic ("neu-") tokens — TWO conflicting definitions
This is a notable inconsistency (see §8). There are **two separate `:root` blocks** defining neu tokens with **different values**:

**Block A** — lines 85-92 (root defaults) / lines 101-107 (`.dark` override):
- Light: `--neu-bg:#F6FAF6; --neu-text:#1A1A1A; --neu-text-secondary:#2E502E; --neu-text-muted:#5A825A; --neu-shadow-dark:#C8DFCA; --neu-shadow-light:#FFFFFF;`
- Dark: `--neu-bg:#132218; --neu-text:#E9F6E6; --neu-text-secondary:#8FBC8F; --neu-text-muted:#6B9A6B; --neu-shadow-dark:#060E07; --neu-shadow-light:#1A2820;`

**Block B** — lines 5763-5771 (a second `:root`) / lines 5773-5780 (a second `.dark`), under the header "NEUMORPHIC DESIGN SYSTEM":
- Light: `--neu-bg:#F2F8F2; --neu-shadow-dark:#C8DFCA; --neu-shadow-light:#FFFFFF; --neu-text:#1A1A1A; --neu-text-secondary:#2E502E; --neu-text-muted:#5A825A;`
- Dark: `--neu-bg:#0D1A0F; --neu-shadow-dark:#060E07; --neu-shadow-light:#162218; --neu-text:#E9F6E6; --neu-text-secondary:#8FBC8F; --neu-text-muted:#4A6B4A;`

Because CSS cascade order applies, Block B (later in file) wins for `--neu-bg` (`#F2F8F2` vs `#F6FAF6`), dark `--neu-bg` (`#0D1A0F` vs `#132218`), dark `--neu-shadow-light` (`#162218` vs `#1A2820`), and dark `--neu-text-muted` (`#4A6B4A` vs `#6B9A6B`) — a real, silent divergence between two "canonical" definitions of the same tokens.

Also `--neu-accent: #00D431` defined separately at line 6372-6373 for both `:root` and `.dark` (identical in both modes).

### 1.5 Content-type accent colors (lines 6601-6608)
Used for post-type indicator gradients (`.accent-line-*`):
| Class | Color |
|---|---|
| `.accent-line-post`, `.accent-line-event` | `#00D431` |
| `.accent-line-fyi`, `.accent-line-gossip`, `.accent-line-help_request` | `#1A56FF` |
| `.accent-line-job`, `.accent-line-marketplace` | `#006F35` |
| `.accent-line-emergency` | `#FF0000` |

### 1.6 Landing-page-scoped palette (lines 1376-1384)
A separate local token set defined on `.landing-page` (not global `:root`), only usable within that component tree:
```
--landing-bg: #060908;
--landing-green: #00d431;
--landing-green-deep: #006f35;
--landing-green-soft: rgba(0, 212, 49, 0.28);
--landing-green-deep-soft: rgba(0, 111, 53, 0.42);
--landing-blue: #1a56ff;
--landing-blue-whisper: rgba(26, 86, 255, 0.08);
--landing-text-on-green: #0a1a0f;
```
These are used as fallback defaults (`var(--landing-green, #00d431)`) throughout auth/signup/profile components even outside `.landing-page`, effectively acting as a shadow color system parallel to the brand tokens.

### 1.7 Off-palette / hardcoded colors found elsewhere in the file
Despite the "6 colours only" rule, greps across the full file found many hardcoded hex values that are neither brand tokens nor semantic tokens (see §8 for full detail): `#64748b`/`#475569`/`#334155`/`#f1f5f9`/`#e2e8f0` (Tailwind slate scale, chat-attach-trigger and connect-map-pin), `#4a90d9` and `#f5a623` (blue/amber, `.auth-signup-sheet__bar` progress gradient), `#d1d9e6`/`#0F0F1A`/`#252538` (blue-gray neumorphic shadow colors, legacy `.neumorphic` class), `#e53935` (a red distinct from both `--brand-red` #FF0000 and `--status-danger` #E8271A, used as fallback in several `var(--brand-red, #e53935)` declarations), `#92400e` (amber-900, pwa install warning text), `#b8f0ff` (light cyan, chat read-tick color).

---

## 2. Typography

### 2.1 Font family
- Body font: `'Plus Jakarta Sans', sans-serif` (line 202, `body` rule).
- Display font token: `--font-display: var(--font-jakarta)` (line 156) and `--font-jakarta` is referenced throughout (e.g. lines 480, 1312, 1319, 1653, 9550) but **never defined inside globals.css** — it is a CSS variable injected by Next.js's `next/font` loader elsewhere (e.g. in a layout/root file), which is expected but worth flagging since it's an external dependency not visible in this file.
- Material Symbols Outlined is self-hosted via `@font-face` (lines 246-252) — no Google Fonts CDN dependency.

### 2.2 Named type-scale tokens (lines 179-186, `@theme inline`)
A deliberate 8-step named scale ("6 named type roles" per the comment, though 8 tokens are actually defined):
| Token | rem | px | Intended use |
|---|---|---|---|
| `--text-caption` | 0.5625rem | 9px | badges, chip labels, eyebrows |
| `--text-label` | 0.625rem | 10px | secondary meta, timestamps |
| `--text-body-sm` | 0.75rem | 12px | compact body, list items |
| `--text-body` | 0.8125rem | 13px | default body copy |
| `--text-subheading` | 0.9375rem | 15px | section subheadings |
| `--text-heading` | 1.0625rem | 17px | page/card headings |
| `--text-title` | 1.25rem | 20px | section titles |
| `--text-display` | 1.625rem | 26px | hero/SOS/event headings |

Mapped to utility classes `.type-caption` through `.type-display` (lines 223-230), each with its own line-height (1.15–1.55) and, for `.type-title`/`.type-display`, negative letter-spacing (-0.01em / -0.02em).

### 2.3 Ad-hoc font sizes elsewhere
Despite the named scale existing, the vast majority of component-specific classes (auth, sidebar, chat, sentinel, etc.) use **raw rem values inline** rather than the type-scale tokens — e.g. `.auth-signup-sheet__title { font-size: 1.125rem }`, `.chat-room__input { font-size: 0.9375rem }`, `.sentinel-bar__title { font-size: 0.875rem }`. The named type tokens (`--text-caption` etc.) appear to be used almost exclusively via the `.type-*` utility classes, and those utility classes are not widely applied across the component-specific CSS — most components hardcode their own sizes instead. This means the "typography scale" is more aspirational than consistently enforced.

### 2.4 Font weights
No named weight tokens exist; weights are hardcoded per-rule as plain numbers: 400 (body default), 500, 600, 700, 800, 900 all appear extensively (e.g. `.left-sidebar__link-label { font-weight: 800 }`, `.chat-attach-tile__label { font-weight: 600 }`). 800/900 is the dominant weight for headings, brand wordmarks, and emphasis text throughout.

### 2.5 Letter-spacing
No tokenized scale; negative tracking values recur as conventions rather than variables: `-0.01em` to `-0.055em` for headings/brand type (tightest on `.landing-headline` at `-0.055em`), and positive tracking (`0.06em`–`0.18em` uppercase) for eyebrow/label text (e.g. `.auth-signup-identity-card__eyebrow`, `.left-sidebar__section-label`).

---

## 3. Spacing

### 3.1 Named spacing scale (lines 189-198, `@theme inline`)
An 8px-base scale is defined but used sparingly:
```
--space-1: 0.25rem (4px)
--space-2: 0.5rem  (8px)
--space-3: 0.75rem (12px)
--space-4: 1rem    (16px)
--space-5: 1.25rem (20px)
--space-6: 1.5rem  (24px)
--space-8: 2rem    (32px)
--space-10: 2.5rem (40px)
--space-12: 3rem   (48px)
--space-16: 4rem   (64px)
```
`var(--space-N)` is not directly referenced elsewhere in the file via grep — the scale appears to be declared for Tailwind's arbitrary-value/utility generation (Tailwind v4 auto-derives spacing utility classes from `--space-*` theme tokens) rather than consumed directly in custom CSS. Custom component classes instead hardcode rem spacing values directly and inconsistently (0.375rem, 0.625rem, 0.875rem, 1.25rem, etc. appear constantly, many of which don't align cleanly to the 8px/4px scale — e.g. `0.35rem`, `0.15rem`, `0.65rem` recur throughout chat/auth/sidebar components).

### 3.2 App-shell layout spacing tokens (lines 158-176)
Separate from the spacing scale, a set of mobile-app-shell-specific dimension tokens exists for chrome sizing:
```
--app-height: 100svh;
--safe-top / --safe-bottom / --safe-left / --safe-right: env(safe-area-inset-*)
--app-bottomnav-inner-height: 3.75rem;
--app-bottomnav-sos-size: 4.25rem;
--app-bottomnav-sos-icon-size: 2rem;
--app-topnav-height: 4.25rem;
--app-topnav-icon-size: 2rem;
--app-topnav-text-size: 1.125rem;
--app-topnav-logo-size: 1.4375rem;
--app-topnav-logo-tracking: -0.05em;
--app-nav-bottom: calc(4.25rem + var(--safe-bottom));
--app-scroll-bottom: calc(var(--app-nav-bottom) + var(--viewport-bottom-inset));
--app-topnav-offset: calc(var(--app-topnav-height) + var(--safe-top));
```
These are consistently reused across the top nav, bottom nav, and scroll-area padding rules — this is the most disciplined token usage in the file.

### 3.3 Landing-page local spacing tokens (lines 1386-1396, with responsive overrides at 1413-1441)
`clamp()`-based fluid spacing scoped to `.landing-page`, adjusted at three breakpoints (`max-height: 680px`, `max-height: 600px`, `min-height: 820px`) — a well-structured but component-local system, not shared globally.

---

## 4. Border Radius, Shadows, and Visual Primitives

### 4.1 Elevation shadow scale (lines 121-126, `@theme inline`)
A 5-step named shadow scale, explicitly for "cards, sheets, modals, nav":
```
--shadow-xs: 0 1px 2px rgba(0,0,0,0.04);
--shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 6px rgba(0,0,0,0.04);
--shadow-md: 0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
--shadow-lg: 0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06);
--shadow-xl: 0 16px 48px rgba(0,0,0,0.13), 0 4px 16px rgba(0,0,0,0.07);
```
Actually consumed in a handful of places (e.g. `.mod-card`/`.mod-card-hover`/`.mod-card-elevated` light-mode overrides at lines 6614-6630 use `var(--shadow-sm/md/lg)`), but the overwhelming majority of shadows throughout the file (hundreds of `box-shadow` declarations) are bespoke inline `rgba(...)` compositions, not references to this scale.

### 4.2 Border radius
No custom radius tokens/scale exists — Tailwind's default radius scale is used implicitly, and most custom classes hardcode radius in rem or `9999px`/`50%` for pills/circles. Common recurring values: `0.75rem`, `0.875rem`, `1rem`, `1.125rem`, `1.25rem`, `1.5rem`, `1.75rem` for cards/sheets, and `9999px` or `50%` for pills/avatars/badges — a soft, rounded aesthetic throughout but not formalized as tokens.

### 4.3 Neumorphic shadow primitives (the actual visual signature of the app)
The `.neu-*` system (lines 5757–6005) defines a strict dual-shadow (light+dark) soft-UI depth system, all built from `var(--neu-shadow-dark)` / `var(--neu-shadow-light)`:
- Raised card: `10px 10px 20px var(--neu-shadow-dark), -10px -10px 20px var(--neu-shadow-light)`
- Inset socket: `inset 6px 6px 14px ..., inset -6px -6px 14px ...`
- Buttons/pills/chips/FAB/avatar/dots each have their own offset+blur pairing at decreasing scale (2px/5px for chips and dots up to 16px/32px for modals) — a genuinely well-structured depth scale even though it isn't expressed as named CSS custom properties beyond the two shadow-color variables.

### 4.4 Glass/blur primitives
`backdrop-filter: blur(Npx)` recurs constantly with no shared token — observed values: 1px, 3px, 4px, 6px, 8px, 10px, 12px, 16px, 20px, 24px — each hardcoded per-component (e.g. top nav `blur(40px) saturate(200%)`, `.glass` utility `blur(20px)`, `.mod-card` `blur(16px)`, `.mod-card-elevated`/`.mod-modal` `blur(24px)`).

---

## 5. Named Component Classes

The file defines roughly **1,187 top-level CSS class rule blocks** and **57 `@keyframes`** — this is a large, bespoke component-class system, not utility-only Tailwind composition. Below are the systemic, widely-reused ones (grouped by family) versus one-offs.

### 5.1 Neumorphic system (`.neu-*`) — core, widely reused
Lines 5757–6435 + earlier legacy versions at 5709–5755. Visual description: soft dual-shadow "pressed/raised" surfaces on the app's off-white/dark-green background, using `var(--neu-bg)` fill with light+dark shadow pairs.
- `.neu-base`, `.neu-flat` — flat fill, no shadow
- `.neu-card-raised`, `.neu-card-sm` — raised cards at two elevations
- `.neu-socket`, `.neu-inset` — inset/pressed surfaces (form fields, sockets)
- `.neu-btn`, `.neu-btn-pill`, `.neu-btn-active` — buttons with raised/pressed/hover states
- `.neu-input` — text input with inset shadow + animated bottom-line glow on focus (`focus-line-in` keyframe, lines 5924-5955)
- `.neu-chip`, `.neu-avatar`, `.neu-fab`, `.neu-divider`, `.neu-track`, `.neu-dot`/`.neu-dot-active`, `.neu-modal`, `.neu-nav`, `.neu-panel` — full family of matching primitives
- Legacy duplicate: `.neumorphic`, `.neumorphic-inset`, `.neumorphic-btn` (lines 5709-5734) — explicitly commented "Legacy neumorphic compat — kept for pages not yet migrated," and using a **different, blue-gray hardcoded shadow palette** (`#d1d9e6`/`#ffffff` light, `#0F0F1A`/`#252538` dark) instead of the `--neu-shadow-*` tokens — a direct visual mismatch with the rest of the neu system.

This is the single most load-bearing visual pattern in the app — used across onboarding, forms, buttons, modals, chips, and navigation.

### 5.2 "Modern" glass system (`.mod-*`) — core, widely reused
Lines 6436–6683, explicitly documented as a second design system: *"MODERN DESIGN SYSTEM — Glass, borders & subtle depth — ultra-modern flat UI."* Visual description: translucent white/black surfaces (`rgba(255,255,255,0.035–0.1)`) with `backdrop-filter: blur(16–24px)` and thin `rgba(255,255,255,0.07–0.1)` borders, distinct from the neu shadow-based depth.
- `.mod-card`, `.mod-card-elevated`, `.mod-card-hover` — glass cards at two elevations
- `.mod-inset` — dark inset well
- `.mod-btn`, `.mod-btn-active`, `.mod-chip`, `.mod-chip-active` — buttons/chips
- `.mod-fab` — gradient FAB with green glow shadow
- `.mod-divider`, `.mod-modal`
- Has a full **light-mode override block** (lines 6610-6682, `html:not(.dark) .mod-*`) that substantially changes these from translucent-dark-glass to translucent-white/off-white — meaning `.mod-*` is dark-mode-native by default and only "corrected" for light mode via override, an inverted pattern versus the rest of the file (which is light-first).

Given that `.neu-*` and `.mod-*` are two parallel, differently-implemented "card/button/chip" systems both actively used, this is a structural duplication worth flagging for the rebuild — two full sets of primitives doing the same job with different visual languages.

### 5.3 Segmented tabs (`.segmented-tab`) — core, canonical per its own comment
Lines 6525-6566, explicitly documented: *"the canonical app-wide tab/toggle style... Used by BrowseTabStrip, FeedTabs, friendship tabs, auth steppers — every segmented control in the product."* Active state = green gradient pill (`linear-gradient(140deg, #00D431 0%, #00B82A 55%, #009922 100%)`) + white text; inactive = transparent + muted text.

### 5.4 Glass buttons (`.btn-glass-primary`, `.btn-glass-danger`) — core CTA system
Lines 6684-6790, explicitly documented as referencing an external `DESIGN.md §5` (`pwa/DESIGN.md` exists in the repo but was not read as part of this task — noted for cross-reference). Radial-gradient pill buttons with a specular highlight pseudo-element (`::before`), used for primary/destructive CTAs app-wide. Also `.btn-secondary` (raised neumorphic-adjacent surface) and `.btn-ghost` (text-only) round out a 4-variant button family, plus `.btn-lift`/`.btn-lift-ghost`/`.btn-lift-danger` hover-lift mixins (lines 7735-7776) layered on top.

### 5.5 App chrome — core, single-instance-per-page but structurally critical
- `.app-topnav*` (lines 357-606) — fixed top nav with "solid" vs "sky" (transparent-over-hero) variants, blurred glass backdrop
- `.app-bottomnav*` (608-1056) — floating pill dock + separate glass FAB for the SOS button, with per-icon tap-spring keyframe animations (`app-nav-tap-*`, 8 distinct keyframes for search/create/bell/menu/home/shield/connect/back/sos)
- `.left-sidebar*` (4194-5258) and `.app-sidebar*` (6007-6326) — **two parallel desktop/drawer sidebar implementations** with substantial visual overlap (both use the green-tinted link-hover-gradient pattern, both have browse-grid variants) — likely one is legacy/being migrated to the other, worth confirming with engineering during rebuild.

### 5.6 Auth/signup flow (`.auth-*`) — large, feature-scoped family, heavily reused within that flow
Lines 1817-3511+: `.auth-brand-header`, `.auth-stepper`/`.auth-step`, `.auth-btn-primary`/`.auth-btn-secondary`, `.auth-signup-bottom-sheet` (draggable sheet with `--auth-sheet-bg` theme-aware custom properties), `.auth-signup-identity-card`, `.auth-flow-hero-card`, `.auth-flow-notice` (error/success/info variants). This is a cohesive, well-structured sub-system but scoped only to auth/signup/login pages.

### 5.7 Chat room (`.chat-*`) — large, feature-scoped family
Lines 6909-7615: full chat UI — `.chat-room`, `.chat-bubble` (in/out/priority variants with a distinctive out-bubble gradient `linear-gradient(145deg, #006f35 0%, #00a83f 55%, #00d431 100%)` defined as a local `--chat-bubble-out` var), `.chat-attach-*` sheet, `.chat-reactions-*`, `.chat-room__input*`. Uses `color-mix(in srgb, ...)` (modern CSS, lines 6911, 6980, 7138) — notable as the only place this technique appears alongside the more common plain `rgba()` approach.

### 5.8 Post/feed cards (`.post-card-*`, `.feed-*`) — large, core feed family
Media slider (`.post-card-media-slider*`, lines 7820-8072), quoted/repost embed (`.quoted-post-embed*`), actions sheet (`.post-card-actions-sheet*`), sky hero weather scene (`.feed-sky-scene*`, lines 3536-3819) with an ambient day/night gradient system and weather marquee.

### 5.9 One-off / narrow-scope classes (lower reuse)
`.radial-dial*` (category picker FAB, 8691-8847), `.sentinel-bar*`/`.sentinel-grid*`/`.sentinel-sheet*` (safety/SOS command center, three near-duplicate implementations — a `sentinel-bar`+`sentinel-grid` inline-expand pattern AND a separate `.sentinel-sheet` modal pattern coexist, 8853-9421), `.news-fx-strip*` and `.feed-news-ticker*` (two separate FX-rate-display implementations that appear to serve overlapping purposes), `.pwa-install-*` (install prompt sheet, has light/dark variants), `.landing-*` (single-page landing hero, large but single-use), `.connect-map-pin*`/`.connect-map-cluster*` (map pins, uses hardcoded `#e2e8f0`/`#475569`/`#00d431`/`#64748b` rather than tokens).

### 5.10 Toast system (`.nh-toast*`)
Lines 9514-9625 — a well-documented, single-purpose Sonner-integration toast pill (dark capsule, `rgba(24,24,27,0.88)` background), with extensive inline comments explaining a specific Sonner positioning workaround.

---

## 6. Animation / Transition Tokens

No named easing-curve custom properties exist (no `--ease-*` tokens) — cubic-bezier values are repeated as literals throughout. The most common recurring easing curves (by inspection) are:
- `cubic-bezier(0.4, 0, 0.2, 1)` — standard "material" ease, used for most transitions
- `cubic-bezier(0.34, 1.56, 0.64, 1)` and `cubic-bezier(0.34, 1.2, 0.64, 1)` — bouncy/spring overshoot, used for tap/pop feedback (badge-pop, success-pop, like-burst, SOS button)
- `cubic-bezier(0.22, 1, 0.36, 1)` — used for sheet/card entrance (card-enter, sheet-up, local-huud-sheet-up)
- `cubic-bezier(0.175, 0.885, 0.32, 1.1)` — used for the radial dial and sentinel sheet spring-out

No duration tokens either; durations are hardcoded per-rule, ranging from 120ms (micro-interactions) to 6s (ambient float/shimmer loops) to 200s/350s (marquee/ticker scroll loops).

### 6.1 The "Motion Design System" (lines 5433-5568)
Explicitly documented block: *"All animations use GPU-composited properties only (transform + opacity). Never animate layout properties."* Defines the app-wide reusable animation utility classes:
`.animate-soft-float`, `.animate-fly-out`, `.animate-card-enter`, `.animate-like-burst`, `.animate-sheet-up`, `.animate-success-pop`, `.animate-error-shake`, `.animate-shimmer`, `.animate-fade-in`, `.animate-scale-in`, `.animate-badge-pop` — all correctly gated behind a single `@media (prefers-reduced-motion: reduce)` block (lines 5552-5568) that disables them.

### 6.2 A second `@theme` block for Tailwind-native animations (lines 9469-9512)
A separate `@theme { ... @keyframes ... }` block near the end of the file defines `--animate-dance-like`, `--animate-dance-comment`, `--animate-dance-repost`, `--animate-dance-save`, `--animate-dance-share` as Tailwind v4 theme-driven animation utilities — **but these duplicate** the plain `@keyframes dance-like` / `dance-comment` / `dance-repost` / `dance-save` / `dance-share` already defined earlier at lines 8312-8347 (used via `.group:hover .group-hover\:animate-dance-*` rules). The two keyframe definitions for the same names have **different transform curves** (e.g. `dance-like` at 8313 goes `scale(1)→scale(1.25) rotate(-12deg)→scale(0.9) rotate(8deg)→...`, while the `@theme` version at 9476 goes `scale(1)→scale(1.3) rotate(-15deg)→scale(0.9) rotate(10deg)→...`) — a genuine duplicate-with-drift.

### 6.3 Global reduced-motion enforcement (lines 8862-8871)
A second, broader `prefers-reduced-motion` block globally forces `animation-duration: 0.01ms !important; transition-duration: 0.01ms !important` on `*` — this is a good universal safety net, applied in addition to the more surgical per-animation opt-outs listed above.

### 6.4 Reused domain-specific keyframes
Weather/ambient (`ambient-rain`, `ambient-snow`, `ambient-fog-drift`, `ambient-twinkle`, `ambient-pulse`, plus `-sidebar` variants) for the sky-hero and sidebar backgrounds; nav tap-springs (9 keyframes, one per icon); SOS-specific (`app-sos-shimmer`, `app-sos-icon-float`, `app-bottomnav-sos-pulse`, `sentinel-pulse`, `sentinel-blink`).

---

## 7. Dark Mode Implementation

### 7.1 Mechanism
Dark mode is implemented via a class-based strategy: `@custom-variant dark (&:where(.dark, .dark *));` (line 4) and `html.dark`/`.dark` selectors throughout, NOT via `prefers-color-scheme` media queries for the primary theme switch (one narrow exception: `@media (prefers-color-scheme: light) { :root:not(.dark) .nh-toast {...} }` at line 9561, used only to lighten the toast bar background).

### 7.2 Explicitly disabled for most of the app
Line 3 states outright: **"Dark variant exists, but the app is forced to light theme."** And `html { color-scheme: light; }` / `html.dark { color-scheme: dark; }` (lines 6-7) shows the dark path exists structurally but per the code comment is not the active default — implying dark mode is either a future/toggleable feature or reserved for specific contexts (the file does still fully implement `.dark` overrides throughout, so it is functional, just not the shipped default per this comment).

### 7.3 Coverage — thorough in some subsystems, absent in others
- **Fully dark-aware**: brand background/surface/border/text tokens (§1.2), neu tokens (§1.4), `.mod-card`/`.mod-btn`/`.mod-chip` family (has explicit light-mode override block, so functions correctly in both), sidebar link/hover states, chat bubbles, sentinel bar/grid, doodle pattern backgrounds (swaps to `doodle-pattern-dark.svg`).
- **Partially dark-aware**: `.pwa-install-sheet` has an explicit `--light` variant class (suggesting manual mode selection rather than automatic `.dark` cascade in that one component) — a different pattern (component-variant-class) than the rest of the file's parent-selector `.dark` pattern.
- **NOT dark-aware / light-only, hardcoded**: `.landing-page` and all `.landing-*`/`.auth-signup-*`/`.auth-map-chrome*`/`.profile-auth-*` classes are permanently dark-background-only (`background-color:#060908 !important` forced regardless of theme, lines 1356-1366, 1970-1974, 2017-2021) — these flows do not respond to light/dark toggling at all, by design (cinematic dark UI). `.connect-map-pin`/`.connect-map-cluster` use flat hardcoded colors with no `.dark` variant. `.sentinel-sheet__title`/`__sub` reference undefined tokens (see §8).

### 7.4 Summary
Dark mode is comprehensively wired for the core app shell (nav, feed, sidebar, chat, cards, buttons) but is explicitly bypassed for the landing/auth/onboarding flows (which are permanently dark-themed regardless of user preference) and is inconsistently applied in a handful of newer/narrower components (map pins, some sentinel-sheet text).

---

## 8. Inconsistencies Found (only actually observed, not speculated)

1. **Duplicate `:root`/`.dark` neu-token definitions with different values** (§1.4). Lines 85-92/101-107 vs 5763-5771/5773-5780 define `--neu-bg`, dark `--neu-shadow-light`, and dark `--neu-text-muted` differently. The second block wins by cascade order, silently overriding the first — anyone editing the first block (which appears first and looks like "the" definition) would see no effect.

2. **Legacy `.neumorphic`/`.neumorphic-inset`/`.neumorphic-btn` use a completely different, off-brand shadow palette** (lines 5709-5734): `#d1d9e6`, `#ffffff`, `#0F0F1A`, `#252538` (blue-gray) instead of the green-tinted `var(--neu-shadow-dark/light)` tokens used by every other `.neu-*` class. Explicitly commented as legacy/unmigrated, but still present and could be applied to any element.

3. **Two conflicting global `*:focus-visible` outline-color rules.** Line 5344: `outline: 2px solid #00D431` (hardcoded hex). Line 7674 (much later, "GLOBAL FOCUS-VISIBLE — WCAG 2.1 AA" section): `outline: 2px solid var(--brand-blue)`. Because both target the same universal selector, the second silently overrides the first for all elements not more specifically targeted — green vs blue focus rings depending on cascade position, not evidently intentional.

4. **Two `.skip-to-content` definitions** (lines 6875-6895 and 7653-7671) with different colors (`var(--primary, #00D431)` vs `var(--brand-blue)`) and slightly different focus behavior (`:focus` vs `:focus-visible`, one sets `outline: 2px solid #ffffff`, the other `outline: none`).

5. **Duplicate dance-animation keyframes with drifted values** (§6.2): `dance-like`/`dance-comment`/`dance-repost`/`dance-save`/`dance-share` are defined once as plain `@keyframes` (lines 8312-8347, used by `.group-hover\:animate-dance-*` classes) and again inside a `@theme { @keyframes ... }` block (lines 9469-9512, generating `--animate-dance-*` Tailwind theme tokens) with different transform values for the same animation names.

6. **Undefined CSS custom properties consumed with no fallback.** `.sentinel-sheet__title { color: var(--text-primary); }` and `.sentinel-sheet__sub { color: var(--text-secondary); }` (lines 9382, 9390) reference `--text-primary`/`--text-secondary`, which are **never defined anywhere in the file** (the real tokens are `--text-primary-light`/`--text-primary-dark`/`--text-secondary-light`/`--text-secondary-dark`). With no fallback value and no defined variable, these declarations resolve to the CSS-wide `unset` behavior — likely rendering as inherited/default text color rather than the intended themed color. This looks like a genuine bug (probably a naming mismatch introduced when the theme tokens were split into light/dark variants but this component wasn't updated).

7. **Off-brand hardcoded colors throughout**, despite the explicit "6 colours only" rule at the top of the file (§1.1, §1.7): Tailwind slate scale (`#64748b`, `#475569`, `#334155`, `#f1f5f9`, `#e2e8f0`) in `.chat-attach-trigger`/`.connect-map-pin`; blue/amber (`#4a90d9`, `#f5a623`) in `.auth-signup-sheet__bar`'s progress-bar gradient; a distinct red `#e53935` used as the fallback value in `var(--brand-red, #e53935)` across several auth-flow classes, differing from both the true `--brand-red` (#FF0000) and `--status-danger` (#E8271A); amber `#92400e` in `.pwa-install-callout-warn`; cyan `#b8f0ff` for chat read-ticks.

8. **Inconsistent hex casing for the same brand color**, indicating copy-paste from multiple sources rather than token reuse: `#00D431` appears 22 times and `#00d431` appears 24 times (same color, different case) — grep confirms both cased variants are used side-by-side rather than the token `var(--primary)`/`var(--neon-green)` being referenced. Similarly `#006F35` (8×) vs `#006f35` (44×), `#1A1A1A` (10×) vs `#1a1a1a` (11×). This strongly suggests large amounts of the file's component CSS were hand-written with the literal hex value rather than the design-token variable, even though the token existed at time of writing.

9. **Two parallel "card/button" design systems coexist**: `.neu-*` (soft-shadow neumorphism) and `.mod-*` (translucent glass, explicitly labeled a separate "MODERN DESIGN SYSTEM" in its section header, lines 6436-6440) both implement cards, buttons, chips, dividers, and modals, with different visual languages (soft dual-shadow depth vs. glass blur+border). Both are actively used elsewhere in the codebase per their reuse notes; a rebuild needs to decide whether both are intentionally still in use for different surfaces or whether one is meant to be phased out.

10. **Two parallel sidebar implementations**: `.left-sidebar*` (4194-5258, ~1000 lines) and `.app-sidebar*` (6007-6326, ~320 lines) both implement a full drawer/desktop sidebar with near-identical hover-gradient link styling, browse-grid patterns, and mobile-bar headers — strongly suggestive of an in-progress migration from one to the other rather than two intentionally distinct components.

11. **Two parallel safety/SOS command-center patterns**: `.sentinel-bar` + `.sentinel-grid` (inline expand/collapse strip, lines 8853-9106) and `.sentinel-sheet` (separate full bottom-sheet modal, lines 9315-9421) appear to serve overlapping "safety status" purposes with different interaction models (inline expand vs. modal sheet).

12. **Two parallel FX/news-rate display patterns**: `.news-fx-strip*` (8400-8527, horizontal scrollable rate pills) and `.feed-news-ticker*` (8532-8686, marquee-scrolling ticker that also embeds FX items via `.feed-news-ticker__item--fx`) both render currency exchange rate data in the feed header area, with different visual treatments and animation mechanisms.

13. **Duplicated feed-card entrance-animation comment/logic** — line 9116 explicitly notes: *"feed-posts-stream entrance animation already defined above (~line 2716) — no duplicate needed"* — evidence that the author caught and prevented one duplication, but the presence of the comment shows this kind of near-duplication was a recurring risk/pattern being actively managed rather than structurally prevented.

14. **`--font-jakarta` referenced but not defined in this file** — used at lines 156, 480, 1312, 1319, 1653, 9550, but never declared via `@font-face` or `:root` custom property inside globals.css. This is very likely because `next/font/google` (or a local font loader) injects this variable via a `className`/`style` on `<html>`/`<body>` in a layout file outside this stylesheet — expected in a Next.js app, but worth flagging as an external dependency invisible from globals.css alone, and something the rebuild must locate and preserve (likely in `src/app/layout.tsx`).

15. **No dead/commented-out CSS blocks of substance were found.** The file has many inline explanatory comments (some quite long, e.g. lines 5298-5304 explaining a removed `backdrop-filter`, lines 9520-9533 explaining Sonner toast positioning), but no large commented-out rule blocks or obviously dead selectors were found during the full read — the file is verbose but not littered with abandoned code, aside from the explicitly-labeled "Legacy neumorphic compat" section (#2 above) which is dead-adjacent (still live but explicitly deprecated) and the duplicate `dance-*` keyframes (#5 above).

---

## Summary

Read the complete `globals.css` file (all 9,630 lines, sequential chunks, no sampling) plus verification greps. The app uses Tailwind v4 with a strict "6 official brand colors" rule (`#00D431`, `#1A56FF`, `#E9F6E6`, `#FF0000`, `#006F35`, `#1A1A1A`), light/dark theme tokens, and two large parallel component systems: neumorphic (`.neu-*`, soft dual-shadow) and glass-modern (`.mod-*`, blurred translucency) — roughly 1,187 custom CSS classes and 57 keyframe animations total. Dark mode is class-based (`.dark`) and thorough for the app shell but explicitly disabled/bypassed for landing and auth flows. Real inconsistencies found: duplicate `--neu-*` token definitions with silently different values, two conflicting global focus-ring rules, undefined `--text-primary`/`--text-secondary` variables consumed with no fallback, drifted duplicate `dance-*` keyframes, and pervasive off-brand hardcoded hex colors (Tailwind slate, stray blue/amber) despite the "6 colours only" rule.
