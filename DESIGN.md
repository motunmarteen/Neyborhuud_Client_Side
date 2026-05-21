# NeyborHuud — Design System & Implementation Guide

> **This is the single source of truth for every visual, interaction, and engineering decision on the platform.**
> Before writing any UI code — check here first. If something is not covered, add it here before implementing it.

---

## Table of Contents

1. [Product Identity](#1-product-identity)
2. [Emotional Design Direction](#2-emotional-design-direction)
3. [Visual Design Pillars](#3-visual-design-pillars)
4. [Brand Colours](#4-brand-colours)
5. [Typography](#5-typography)
6. [Spacing](#6-spacing)
7. [Border Radius](#7-border-radius)
8. [Button System](#8-button-system)
9. [Icon System](#9-icon-system)
10. [Card & Surface System](#10-card--surface-system)
11. [Form Inputs](#11-form-inputs)
12. [Interaction & Gesture System](#12-interaction--gesture-system)
13. [Navigation Systems](#13-navigation-systems)
14. [Bottom Sheet System](#14-bottom-sheet-system)
15. [Page Transitions](#15-page-transitions)
16. [Feed System](#16-feed-system)
17. [Map Experience](#17-map-experience)
18. [Sentinel AI Interface](#18-sentinel-ai-interface)
19. [SOS Experience](#19-sos-experience)
20. [Notification System](#20-notification-system)
21. [Loading & Skeleton System](#21-loading--skeleton-system)
22. [Animation System](#22-animation-system)
23. [Dark Mode](#23-dark-mode)
24. [Accessibility](#24-accessibility)
25. [Performance Standards](#25-performance-standards)
26. [Tech Stack](#26-tech-stack)
27. [Onboarding Slides](#27-onboarding-slides)
28. [Redesign Roadmap](#28-redesign-roadmap)
29. [File Locations](#29-file-locations)

---

## 1. Product Identity

**NeyborHuud is not a traditional social media application.**

It is a **hyperlocal safety-driven social platform** that layers realtime community events, incidents, conversations, alerts, and neighbourhood intelligence over the physical world.

The product combines:
- Hyperlocal social networking
- Realtime event mapping
- Safety awareness systems
- Community intelligence
- Neighbourhood communication
- AI-assisted local awareness (Sentinel AI)
- Marketplace & community commerce
- Immersive map interactions

The platform must emotionally feel like:

> *"A living digital neighbourhood layered over the real world."*

---

## 2. Emotional Design Direction

### What the experience MUST feel
| Quality | Meaning |
|---|---|
| **Immersive** | Users feel inside the neighbourhood, not looking at a dashboard |
| **Spatial** | UI elements exist in layers and depth, not on a flat page |
| **Calm** | Never visually overwhelming — clarity before decoration |
| **Intelligent** | The interface anticipates actions and surfaces relevant context |
| **Tactile** | Every interaction has physical weight and feedback |
| **Fluid** | Transitions feel like physics, not code |
| **Safe** | Users trust the interface with their safety and location |
| **Community-centred** | Every screen reinforces belonging to a real place |

### Reference experiences (interaction quality only — do NOT copy branding)
Instagram · TikTok · Apple Music · Airbnb · Uber · Notion · iOS system interactions

### What to AVOID
- ❌ A traditional web dashboard
- ❌ An old-style web application
- ❌ A noisy social media feed
- ❌ A fintech admin panel
- ❌ A static website
- ❌ Hard page cuts and instant jumps
- ❌ Generic loading spinners
- ❌ Harsh geometry and sterile enterprise visuals

---

## 3. Visual Design Pillars

The visual system combines four design languages. They are **layered together** — not used in isolation.

### 3a. Organic / Biomorphic
- Soft organic shapes and rounded forms
- Environmental depth and nature-inspired layering
- Calm gradients rooted in the brand palette
- Ambient textures (the doodle background pattern)
- The UI feels **human and grounded**

### 3b. Claymorphism
- Soft floating surfaces with real tactile weight
- Rounded elements that feel squeezable
- Subtle depth through layered shadow systems
- The UI feels **touchable and spatial**
- Avoid excessive cartoon styling

### 3c. Spatial UI
- Components **float, elevate, expand, and collapse**
- Backgrounds blur when overlays appear
- Visual depth is always preserved
- Users feel like they are **navigating a living environment**, not switching static pages

### 3d. Glassmorphism (selective)
Use glass effects **only for**:
- Floating panels and bottom sheets
- Contextual menus
- AI overlays (Sentinel)
- Navigation docks
- Alert systems

Glass treatment: `backdrop-blur`, translucent backgrounds, ambient borders, layered transparency.

**Do not** apply glass effects to every screen. Glass signals *elevation and priority*.

---

## 4. Brand Colours

There are **exactly 6 official brand colours**. No other colour may appear anywhere in the product UI — not Tailwind defaults, not arbitrary hex values, not social brand colours.

| Token | Hex | Tailwind utility | Role |
|---|---|---|---|
| `--primary` / `--neon-green` | `#00D431` | `text-primary`, `bg-primary` | Main brand — CTAs, active states, highlights |
| `--brand-blue` | `#0000FF` | `text-brand-blue`, `bg-brand-blue` | Links, info, secondary actions, Sentinel AI |
| `--brand-surface` | `#E9F6E6` | `bg-brand-surface` | Light backgrounds, card surfaces |
| `--brand-red` | `#FF0000` | `text-brand-red`, `bg-brand-red` | SOS, danger, errors, destructive actions |
| `--brand-green-dark` | `#006F35` | `text-brand-green-dark`, `bg-brand-green-dark` | Deep accents, hover states, FABs |
| `--brand-black` | `#1A1A1A` | `text-brand-black` | Primary text, near-black backgrounds |

### Opacity variants
```
bg-primary/10   bg-primary/20   bg-primary/80
text-brand-red/60   border-brand-blue/30   bg-brand-surface/50
```

### NOT allowed
- ❌ Tailwind palette colours (`red-500`, `blue-400`, `green-600`, `gray-300`, `amber-*`, etc.)
- ❌ Arbitrary hex values (`#8b5cf6`, `#f59e0b`, `#22c55e`, `#3b82f6`, etc.)
- ❌ Old brand colours (`#008751`, `#4A90D9`, `#E74C3C`, `#8E6FBF`, `#F5A623`)
- ❌ Social brand colours in UI chrome (only acceptable inside dedicated share sheets)

### Migration table — old → new
| Old | Replace with |
|---|---|
| `green-400/500/600`, `#008751`, `#059669` | `primary` / `brand-green-dark` |
| `blue-400/500/600`, `#4A90D9`, `#3b82f6` | `brand-blue` |
| `red-400/500/600`, `#E74C3C`, `#ef4444` | `brand-red` |
| `gray-*`, `slate-*`, `#64748B`, `#94A3B8` | `var(--neu-text-muted)` or `var(--neu-text-secondary)` |
| `purple-*`, `#8E6FBF`, `#9F7AEA`, `#8b5cf6` | `brand-blue` |
| `amber-*`, `orange-*`, `#F5A623`, `#f59e0b` | `primary` |
| `cyan-*`, `#00C2FF` | `brand-blue` |

---

## 5. Typography

**Font family:** Plus Jakarta Sans only — loaded via Google Fonts in `layout.tsx`.

### Scale
| px | Tailwind | Usage |
|---|---|---|
| 10px | `text-[10px]` | Badges, timestamps, micro labels |
| 12px | `text-xs` | Secondary captions, helper text |
| 14px | `text-sm` | Body text, list items, input values |
| 16px | `text-base` | Default body, card descriptions |
| 18px | `text-lg` | Section headings, card titles |
| 20px | `text-xl` | Modal titles, page sub-headings |
| 24px | `text-2xl` | Page titles (mobile) |
| 30px | `text-3xl` | Hero text, onboarding titles |

### Weight
| Weight | Usage |
|---|---|
| `font-normal` | Body copy, descriptions |
| `font-medium` | Secondary labels, captions |
| `font-semibold` | Card titles, list item names |
| `font-bold` | Section headings, standard button labels |
| `font-black` | Marketing labels, CTA buttons (uppercase, wide tracking) |

### CTA label style — always
```
font-black uppercase tracking-[0.18em] text-sm
```

### Rules
- ❌ Never use arbitrary font sizes outside the scale above
- ❌ Never mix font families — Plus Jakarta Sans only
- ✅ Headings must use semantic HTML (`h1`, `h2`, `h3`), not large `text-*` on `div`s
- ✅ Body copy is `font-normal` or `font-medium` — never `font-bold` for long paragraphs

---

## 6. Spacing

All spacing uses the **Tailwind default 4px base scale**. Never use arbitrary values (`p-[14px]`, `gap-[11px]`).

| Role | Value |
|---|---|
| Page horizontal padding (mobile) | `px-4` or `px-5` |
| Page horizontal padding (wide) | `px-6` |
| Card inner padding | `p-4` or `p-5` |
| Section gap | `gap-4` or `gap-6` |
| Tight list gap | `gap-2` or `gap-3` |
| Bottom nav clearance | `pb-20` |
| Safe area bottom | `.safe-area-bottom` class |

---

## 7. Border Radius

| Context | Value |
|---|---|
| Full circles — icons, avatars | `rounded-full` |
| Cards, modals, panels | `rounded-2xl` |
| Inputs, chips | `rounded-xl` |
| Buttons (standard) | `rounded-2xl` |
| Buttons (pill / small) | `rounded-full` |
| Neumorphic raised card (onboarding) | `rounded-[2.5rem]` |
| Bottom sheets | `rounded-t-3xl` |

---

## 8. Button System

There are **4 button variants**. Always use the CSS class — never hand-roll button styles.

### 8a. Primary CTA — `.btn-glass-primary`
The signature button. Used for the **single most important action** on a screen.

```html
<button class="btn-glass-primary w-full">Confirm Huud</button>
<button class="btn-glass-primary w-full">Post</button>
```

- Maximum **one** per screen / modal
- Always `font-black uppercase tracking-[0.18em] text-sm text-white`
- Full width on mobile (`w-full`)

### 8b. Danger CTA — `.btn-glass-danger`
Destructive or emergency actions only.

```html
<button class="btn-glass-danger w-full">Trigger SOS</button>
<button class="btn-glass-danger">Delete Post</button>
```

### 8c. Secondary — `.btn-secondary`
Supporting action alongside a primary CTA.

```html
<button class="btn-secondary">Cancel</button>
<button class="btn-secondary">Go back</button>
```

### 8d. Ghost — `.btn-ghost`
Lowest emphasis. Skip links, "view all", inline text actions.

```html
<button class="btn-ghost">Skip for now (not recommended)</button>
<button class="btn-ghost">View all →</button>
```

### NOT acceptable
- ❌ `mod-btn` — migrate to `btn-secondary` or `btn-ghost`
- ❌ `neu-btn` — replaced by the new system
- ❌ Raw `bg-primary text-white rounded-2xl` — use `.btn-glass-primary`
- ❌ `bg-red-500` for destructive — use `.btn-glass-danger`

---

## 9. Icon System

**Material Symbols Outlined only** for all UI chrome.

```html
<span class="material-symbols-outlined">home</span>
<span class="material-symbols-outlined fill-1">home</span>  <!-- active/filled -->
```

Bootstrap Icons (`bi-*`) are **only permitted** in the onboarding slides (`src/app/page.tsx`).

### Icon size scale
| Context | Size |
|---|---|
| Navigation bar | `text-[30px]` |
| Card / list icon | `text-2xl` |
| Inline / label icon | `text-xl` |
| Hero / feature icon | `text-[44px]` |
| Onboarding sphere | `4.5rem` – `5rem` (inline style) |

---

## 10. Card & Surface System

Three surface systems exist. **Never mix them on the same screen.**

### Neumorphic (`.neu-*`) — light screens, onboarding, auth
Soft raised / inset depth on light backgrounds.

| Class | Role |
|---|---|
| `.neu-card-raised` | Standard raised card |
| `.neu-card-sm` | Lower elevation card |
| `.neu-socket` | Inset circular socket |
| `.neu-inset` | Inset surface (rectangular) |
| `.neu-input` | Form input shell |
| `.neu-modal` | Modal / dialog |
| `.neu-nav` | Bottom navigation bar |
| `.neu-panel` | Sidebar panel |
| `.neu-flat` | No shadow, flat surface |
| `.neu-track` | Indicator / progress track |
| `.neu-chip` | Tag / chip |
| `.neu-fab` | Floating action button |

### Modern Glass (`.mod-*`) — feed, dark screens
Used on the main feed and dark / blurred surfaces.

| Class | Role |
|---|---|
| `.mod-card` | Standard feed card |
| `.mod-card-elevated` | Elevated modal / menu |
| `.mod-inset` | Inset section container |
| `.mod-chip` | Chip / filter tag |
| `.mod-fab` | Green floating action button |
| `.mod-divider` | 1px divider line |
| `.mod-modal` | Full modal dialog |
| `.mod-btn` | ⚠️ Deprecated — migrate to `btn-*` |

### Auth Glass — `/login`, `/signup`, `/forgot-password` only
```
bg-white/[0.94] backdrop-blur-2xl border border-white/85 rounded-2xl
```

### Card interactions (all variants)
Cards must respond to touch with:
- Slight scale on press (`active:scale-[0.98]`)
- Spring animation via Framer Motion
- Cards should feel **alive**, not static

---

## 11. Form Inputs

Always use `PremiumInput` (`src/components/ui/PremiumInput.tsx`).

```tsx
<PremiumInput
  label="Email address"
  type="email"
  icon="mail"
  placeholder="you@example.com"
/>
```

- ✅ Uses `.neu-input` shell automatically
- ✅ Handles focus glow, validation, error messages
- ❌ Never use raw `<input className="border ...">` outside PremiumInput

---

## 12. Interaction & Gesture System

Gestures are a **core navigation pattern** — not an enhancement.

### 12a. Swipe Navigation
Used for: switching feed tabs, switching communities, media browsing, map layer switching.
- Implement via `@use-gesture/react` + `react-spring`
- Spring physics — not CSS ease curves

### 12b. Long Press (Contextual Menu)
Activated by 500ms+ press.
- Background softly blurs
- Selected item slightly enlarges
- Glass-style menu fades in with layered depth
- Used for: save post, report incident, share, moderation, quick reply, profile actions
- Menu must feel **premium and tactile**

### 12c. Pull to Refresh
- Ambient custom animation — **never a generic spinner**
- Progressive reveal as the user pulls
- Spring snap-back on release

### 12d. Drag
Used for: bottom sheets, map overlays, expandable cards.
- Follows finger naturally with spring resistance
- Stretches slightly near boundary limits

### 12e. Haptic-style feedback
Use Framer Motion `scale` and `opacity` micro-animations to simulate haptic weight on:
- Button presses
- Toggle switches
- Icon taps
- Reaction selections

### Rules
- All gesture interactions must feel **native**, not web-like
- `@use-gesture/react` is the library for gesture detection
- `react-spring` or Framer Motion for physics-based response
- Never use CSS `:hover` alone as the only interactive state on mobile

---

## 13. Navigation Systems

### 13a. Bottom Navigation Dock
The primary navigation surface. Feels like an **iOS-style floating dock**.

- Shell: `.neu-nav safe-area-bottom`
- Float slightly above content (soft shadow beneath)
- Icons: Material Symbols `text-[30px]`
- Active: `text-primary fill-1`
- Inactive: `var(--neu-text-muted)`
- Touch targets: `min-w-[44px] min-h-[44px]` always
- Active tab: spring scale animation + glow pulse

**Primary tabs:**
1. Home (feed)
2. Sentinel AI (safety hub)
3. **SOS** (centre — elevated, always red, always accessible)
4. Messages
5. Profile

**SOS button rules:**
- Always `text-brand-red` with glow ring — **never change this**
- `animate-ping` reserved for active SOS state only
- Long-press (600ms) triggers silent SOS — short tap navigates to `/sos`

### 13b. Top Navigation
- Transparent on `/feed` and `/profile/*`
- `bg-white border-b border-black/[0.06]` on all other pages
- Brand name: `font-black tracking-tight text-xl`
- Icon buttons: 44px touch targets, `rounded-full`

### 13c. Side Drawer — secondary navigation only
Used **only** for secondary navigation — never as the primary system.

Contents: Profile · Communities · Saved Posts · Wallet · Verification · Settings · Admin Tools · Moderation

Behaviour:
- Slide-in from left with spring animation
- `bg-brand-black/50` blurred backdrop
- Floating layered effect (content appears to sit above the dimmed screen)
- Swipe-left gesture to close

### 13d. Left Sidebar (desktop)
- Shell: `.neu-panel` fixed, `w-96`
- Quick action accent colours must use **only the 6 brand colours**
- Hidden on mobile (replaced by drawer)

---

## 14. Bottom Sheet System

Bottom sheets are a **core interaction pattern** for the platform — not a fallback.

### Snap points
| Point | Height | Usage |
|---|---|---|
| Peek | 25vh | Preview — event pin, map marker |
| Half | 50vh | Default content — comments, details |
| Expanded | 90vh | Full content — post details, incident report |
| Full | 100vh | Immersive — media viewer, SOS overlay |

### Behaviour rules
- Follows finger drag naturally
- Spring physics — `react-spring` or Framer Motion
- Stretches slightly near limits (rubber-band effect)
- Background blurs progressively as sheet expands
- Gesture continuity — no snap jumps without drag intent

### Used for
Comments · Event previews · Incident details · Marketplace previews · Sentinel AI assistant · Map point details · Profile previews · Contextual actions · Notification details

### Implementation
```tsx
// Shell pattern
<div className="fixed inset-x-0 bottom-0 z-[9999] rounded-t-3xl bg-white/95 backdrop-blur-xl shadow-2xl">
  <div className="w-10 h-1 rounded-full bg-gray-300 mx-auto mt-3 mb-4 cursor-grab" />
  {/* content */}
</div>
```

---

## 15. Page Transitions

All navigation must preserve **spatial continuity**. Users should feel like they are moving through a place, not loading pages.

### Transition rules
- Slide softly — forward content enters from right, back exits to right
- Fade gradually — opacity blend during route change
- Preserve context — previous screen remains visible briefly during transition
- **No hard cuts** — never instant page jumps

### Implementation
- Use Framer Motion `AnimatePresence` + `motion.div` for route transitions
- Shared element transitions for card → detail flows (post card → post detail)
- Layered motion — background dims, foreground content rises

### NOT acceptable
- ❌ Instant page jumps (default Next.js Link behaviour without animation)
- ❌ Full-page reloads
- ❌ Abrupt colour flashes during navigation

---

## 16. Feed System

The feed must feel **structured, intelligent, and neighbourhood-aware** — never chaotic.

### Feed types

#### FYI Feed
Purpose: utility updates, local announcements, road alerts, safety information, neighbourhood notices.
Tone: clean, informational, lightweight. Cards use minimal visual weight.
Accent: `brand-blue`

#### GossipLocale Feed
Purpose: local gist, discussions, social content, neighbourhood conversations.
Tone: energetic, expressive, socially engaging.
Accent: `primary`

#### Owambeh Feed
Purpose: marketplace, buying/selling, local events, community commerce.
Tone: vibrant, visual-first, premium cards.
Accent: `brand-green-dark`

### Feed UX rules
- Swipe horizontally to switch feed tabs
- Each feed type has a distinct but subtle visual personality (accent line colour only — never background colour changes)
- Pull-to-refresh with ambient animation — no generic spinner
- Infinite scroll with staged skeleton loading
- Contextual long-press menu on every card

---

## 17. Map Experience

The map is one of the **most important systems** on the platform. It is the living intelligence surface of the neighbourhood.

### The map must feel
- Alive — markers pulse and react to activity
- Immersive — fills the viewport, not a box inside a page
- Intelligent — layers communicate risk, density, events
- Community-aware — markers feel local, not generic

### Layers
| Layer | Visual |
|---|---|
| Danger zones | `brand-red/20` heatmap overlay |
| Safe zones | `primary/15` overlay |
| Event density | `brand-blue/20` cluster glow |
| Emergency alerts | `brand-red` pulsing marker |
| Commerce hotspots | `brand-green-dark/20` overlay |
| User location | `brand-blue` dot with accuracy ring |

### Marker behaviour
- Pulse subtly when representing active events
- Scale up on activity spike
- Visually prioritise danger levels (red > amber > primary)
- Cluster at low zoom, expand at high zoom
- Tap opens a bottom sheet (snap to 50vh) with details

### Map interactions
- Smooth zoom (GPU-accelerated)
- Swipe-to-pan (native gesture)
- Tap marker → bottom sheet preview
- Long-press map → "Report incident here" context menu
- Floating contextual cards appear over the map for selected events

### Tech
- Mapbox GL JS or MapLibre GL JS
- Real-time layer updates via WebSocket

---

## 18. Sentinel AI Interface

Sentinel AI is the ambient intelligence layer of the neighbourhood.

### It must feel
- Calm and observant — not robotic or alarming
- Ambient — present without demanding attention
- Trustworthy — data presented clearly, never sensationalised

### Visual language
- Floating glass panels — `.mod-card-elevated` with `backdrop-blur`
- Soft glow accents in `brand-blue`
- Conversational cards — not data tables
- Predictive suggestion chips
- Contextual awareness indicators

### Sentinel must appear as
> *An ambient intelligence layer inside the neighbourhood — not a dashboard.*

### Interactions
- Swipe cards to dismiss or act
- Tap to expand detail in a bottom sheet
- AI suggestions appear as floating chips that can be accepted/dismissed
- Never interrupts the user — suggestions surface contextually

---

## 19. SOS Experience

This is the **highest-priority interaction system** on the platform. It must be flawless.

### The SOS flow must feel
- Immediate — zero delay from intent to action
- Serious — visually distinct from all other UI
- Trustworthy — the user must have 100% confidence it worked
- Emotionally clear — the screen communicates urgency without panic

### SOS Floating Button (BottomNav)
- Always `text-brand-red` — never change this colour
- Softly pulsing glow in active SOS state only (`animate-ping`)
- 44px minimum touch target
- Visually separated from normal navigation items
- Impossible to miss

### SOS Activation Flow
1. Long-press begins (600ms threshold)
2. Circular radial progress animation fills around button
3. Haptic-style scale animation feedback
4. Emergency overlay transition — full screen
5. Live location activation indicator
6. Emergency network escalation UI

### SOS Page (`/sos`)
- Large polished red glass button (centre of screen)
- Red radial gradient: `#FF4D4D → #FF0000 → #B30000`
- Glass specular highlight on button
- Deep red shadow: `0 10px 40px rgba(255,0,0,0.55)`
- Countdown display (cancellable)
- Silent mode toggle
- Emergency services toggle

### Rules
- `animate-ping` is **exclusively reserved** for active SOS states
- The SOS button must always be reachable from any screen (BottomNav)
- Never reduce the visual weight of the SOS button for aesthetic reasons

---

## 20. Notification System

Notifications must **prioritise importance**, not volume.

### Priority levels
| Level | Visual treatment | Sound |
|---|---|---|
| Emergency (SOS, active incident) | Full-screen overlay, `brand-red` | Alert |
| Safety alert (geofence, late check-in) | Banner + badge, `brand-red/80` | Notification |
| Community update (post, reply) | Badge only, `primary` | Silent |
| System (app update, tip) | Subtle banner, muted | Silent |

### Rules
- Emergency notifications **override normal visual hierarchy** — they appear on top of everything
- Group notifications intelligently — never stack 10 individual items
- Ambient animations — soft fade-in, never flash or strobe
- Contextual stacking — related notifications collapse into one
- ❌ Never show notification prompts on auth/onboarding pages (see `NotificationPermissionPrompt`)

---

## 21. Loading & Skeleton System

**Never use a generic spinner.** The app must always feel responsive.

### Patterns
| Context | Pattern |
|---|---|
| Feed cards | Skeleton placeholder matching card shape |
| Profile | Skeleton avatar + lines |
| Map | Map tiles load progressively — no blank screen |
| Data lists | Shimmer skeleton rows |
| Images | `bg-brand-surface/40` placeholder with fade-in |
| Page navigation | Route prefetching — no loading state visible |

### Shimmer animation
```css
/* Use the existing ambient shimmer via Tailwind animate-pulse on skeleton containers */
.skeleton { @apply animate-pulse bg-brand-surface/60 rounded-xl; }
```

### Rules
- Staged loading — show structure first, then fill content
- Progressive rendering — never a blank screen
- ❌ No spinner icons (`loading...` text or rotating circles)

---

## 22. Animation System

### Defined classes (in `globals.css`)
| Class | Behaviour | Usage |
|---|---|---|
| `.animate-neu-float` | Slow 6s vertical float | Onboarding icon cards |
| `.animate-soft-float` | Gentle horizontal drift | Profile card ambient elements |
| `.animate-fly-out` | Fast slide-right + fade | Post send animation |
| `animate-ping` | Radiating pulse | **SOS active state only** |
| `animate-pulse` | Opacity pulse | Skeleton loaders |

### Framer Motion — use for
- Page transitions (`AnimatePresence`)
- Bottom sheet drag physics
- Card press states (`whileTap`)
- Contextual menu appearance
- Shared element transitions

### Motion principles
- **Spring physics** over ease curves for all interactive motion
- **Duration:** micro (100–150ms), standard (200–300ms), cinematic (400–600ms)
- Motion mimics real-world physics — things have weight
- **Reduced motion:** all animations respect `prefers-reduced-motion` via the media query in `globals.css`

### Rules
- `animate-ping` is **reserved for SOS/emergency** — never decorative
- Animations must run at **60fps minimum** — use `transform` and `opacity` only (GPU-accelerated), never `top`/`left`/`width`/`height`
- ❌ No CSS `transition: all` — always specify the property

---

## 23. Dark Mode

| Token | Light | Dark |
|---|---|---|
| Background | `#FFFFFF` | `#0D1A0F` |
| Surface | `#E9F6E6` | `#132218` |
| Surface base | — | `#0A1209` |
| Border | `#C8E8C8` | `#1E3A22` |
| Text primary | `#1A1A1A` | `#E9F6E6` |
| Text secondary | `#3D5A3E` | `#8FBC8F` |
| Neumorphic shadow dark | `#C2DEC2` | `#060E07` |
| Neumorphic shadow light | `#FFFFFF` | `#162218` |

All neumorphic shadows recalculate automatically via `--neu-shadow-dark` / `--neu-shadow-light` tokens.

---

## 24. Accessibility

Accessibility is mandatory — never sacrificed for aesthetics.

| Requirement | Standard |
|---|---|
| Touch targets | Minimum `44×44px` everywhere |
| Colour contrast | WCAG AA minimum (4.5:1 for body text) |
| Reduced motion | All animations disabled via `prefers-reduced-motion` in `globals.css` |
| Font scaling | Respect system font size — use `rem` units |
| Semantic HTML | `h1`/`h2`/`h3`, `nav`, `main`, `button`, `aria-label` on icon buttons |
| Emergency actions | SOS must be reachable via keyboard and assistive technology |
| Focus rings | `*:focus-visible` outlines set to `#00D431` in `globals.css` |
| Skip link | `.skip-to-content` class available in `globals.css` |

---

## 25. Performance Standards

The app must feel **fast, smooth, and native**.

| Standard | Target |
|---|---|
| Animation frame rate | 60fps minimum |
| Animation properties | `transform` + `opacity` only (GPU-accelerated) |
| Gesture response | < 16ms (one frame) |
| Route transitions | Prefetched — no loading state |
| Images | Lazy loaded, `next/image` always |
| Bundle | Code-split per route — no monolithic JS |
| Service worker | PWA offline shell via `next-pwa` |

### Rules
- ❌ Never animate `top`, `left`, `width`, `height`, `padding`, `margin`
- ✅ Always use `transform: translate()` and `opacity` for motion
- ✅ Use `will-change: transform` only on actively animating elements
- ✅ Lazy-load all images and heavy components with `next/dynamic`

---

## 26. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (latest stable) |
| Language | TypeScript |
| Styling | TailwindCSS v4 (via `@theme inline` in `globals.css`) |
| Animation | Framer Motion |
| Gesture system | `@use-gesture/react` + `react-spring` |
| Maps | Mapbox GL JS or MapLibre GL JS |
| PWA | `next-pwa` |
| State management | Zustand |
| Server state | TanStack Query (React Query) |
| Real-time | WebSocket via Socket.io |
| API | REST (existing) — GraphQL compatible architecture |
| Icons | Material Symbols Outlined (Google Fonts) |
| Auth | JWT via `apiClient` / `authService` |

### Architecture requirements
- Scalable, modular, reusable component system
- Mobile-first, responsive
- Production-ready folder structure
- PWA-compatible (offline shell, push notifications, installable)

---

## 27. Onboarding Slides (`/`)

Each slide renders:
1. Outer `.neu-card-raised rounded-[2.5rem] w-56 h-56` — the "device/screen" shell
2. Inner polished glass circle `w-36 h-36 rounded-full` with:
   - `radial-gradient(circle at 38% 32%, {color}CC, {color}, {color}CC)`
   - `box-shadow: 0 10px 40px {color}55, inset 0 1px 0 rgba(255,255,255,0.22)`
   - Glass specular highlight `absolute top-3 left-5 w-14 h-7`
3. White Bootstrap icon (`fontSize: 4.5rem`) — Bootstrap only on this file

**SOS slide exception:** deeper red radial gradient + stronger shadow.

| Slide | Accent colour |
|---|---|
| One-Tap SOS | `#FF0000` |
| Sentinel AI | `#0000FF` |
| Hyperlocal Feed | `#00D431` |
| Your Voice Matters | `#006F35` |
| Identity is Power | `#0000FF` |

---

## 28. Redesign Roadmap

### Phase 1 — Foundation ✅ Done
- [x] Lock official 6-colour palette in `globals.css`
- [x] Redesign onboarding slides (glassy 3D icons)
- [x] Fix notification permission prompt
- [x] Add `.btn-glass-primary`, `.btn-glass-danger`, `.btn-secondary`, `.btn-ghost`
- [x] Fix missing `.neu-inset`, `--neu-accent` tokens
- [x] Write `DESIGN.md`

### Phase 2 — Auth flows ✅ Done
- [x] `/login` — `.btn-glass-primary`, replace hardcoded hex colours
- [x] `/signup` — same
- [x] `/forgot-password` — same
- [x] `/verify-email` — same
- [x] `/reset-password` — same

### Phase 3 — Core feed ✅ Done
- [x] `XPostCard` — replace Tailwind colour scale with brand tokens
- [x] `CreatePostModal` — migrate primary CTAs to `btn-*` system (chips retain `mod-chip`)
- [x] `BottomNav` — replace `red-500` with `brand-red`
- [x] `FeedTabs` — migrate filter chips

### Phase 4 — Navigation & sidebars ✅ Done
- [x] `LeftSidebar` — replace hex quick-action accents with brand tokens
- [x] `TopNav` — audit icon and colour usage
- [x] `RightSidebar` — audit and align

### Phase 5 — Safety & SOS flows ✅ Done (brand token pass)
- [x] `/sos` — brand-red tokens via migration script
- [x] `/safety` — tile icon colours → brand tokens

### Phase 6 — Motion & interaction layer ✅ Done
- [x] Add Framer Motion page transitions (`PageTransition` in providers)
- [x] Implement bottom sheet system (`BottomSheet` component)
- [x] Long-press contextual menus (`LongPressMenu` + `useLongPress` on `XPostCard`)
- [x] Swipe gesture for feed tab switching (`useFeedTabSwipe` on `/feed`)

### Phase 7 — Map experience ✅ Done
- [x] Migrate `InteractiveMap` from Google Maps to MapLibre (OSM tiles)
- [x] Migrate `GeofenceMap` from Leaflet to MapLibre
- [x] Map overlay layers: danger heatmap, safe zones, event density, emergency pulse, commerce (`MapOverlay` on `InteractiveMap`)
- [x] Long-press map → incident report hook (`onLongPressMap` prop)
- [x] Shared map style + geofence colours (`src/lib/map-style.ts`)

### Phase 8 — All remaining pages ✅ Done
- [x] Bulk brand-colour migration (`scripts/migrate-brand-colors.mjs`, 220+ file passes)
- [x] `neu-btn` / `mod-btn` → `mod-chip` / `btn-*` migration (`scripts/migrate-neu-btn.mjs`, 54 files)
- [x] Vitest + brand-styles unit tests

---

## 29. File Locations

| What | Where |
|---|---|
| All CSS variables, tokens, utility classes | `src/app/globals.css` |
| Tailwind config (v4 via `@theme inline`) | `src/app/globals.css` |
| Glass button classes | `src/app/globals.css` — Glass Button System section |
| Button component (future) | `src/components/ui/Button.tsx` |
| Input component | `src/components/ui/PremiumInput.tsx` |
| Brand style maps (badges, spheres) | `src/lib/brand-styles.ts` |
| Page transitions | `src/components/ui/PageTransition.tsx` |
| Bottom sheet | `src/components/ui/BottomSheet.tsx` |
| Interactive map (MapLibre) | `src/components/ui/InteractiveMap.tsx` |
| Geofence map (MapLibre) | `src/components/safety/GeofenceMap.tsx` |
| Map style tokens | `src/lib/map-style.ts` |
| Long-press menu | `src/components/ui/LongPressMenu.tsx` |
| Feed tab swipe | `src/hooks/useFeedTabSwipe.ts` |
| Onboarding | `src/app/page.tsx` |
| Top navigation | `src/components/navigation/TopNav.tsx` |
| Left sidebar | `src/components/navigation/LeftSidebar.tsx` |
| Notification prompt | `src/components/NotificationPermissionPrompt.tsx` |
| Design doc (this file) | `DESIGN.md` |
