# NeyborHuud Design System

> **This document is the single source of truth for every visual decision on the platform.**
> Before writing any UI code, check here first. If something is not covered, add it here before implementing it.

---

## 1. Brand Colours

There are **exactly 6 official brand colours**. No other colour may be used anywhere in the product UI — not Tailwind defaults, not arbitrary hex values, not social-brand colours.

| Token | Hex | Tailwind utility | Role |
|---|---|---|---|
| `--primary` / `--neon-green` | `#00D431` | `text-primary`, `bg-primary` | Main brand — CTAs, active states, highlights |
| `--brand-blue` | `#0000FF` | `text-brand-blue`, `bg-brand-blue` | Links, info, secondary actions, Sentinel AI |
| `--brand-surface` | `#E9F6E6` | `bg-brand-surface` | Light backgrounds, card surfaces |
| `--brand-red` | `#FF0000` | `text-brand-red`, `bg-brand-red` | SOS, danger, errors, destructive actions |
| `--brand-green-dark` | `#006F35` | `text-brand-green-dark`, `bg-brand-green-dark` | Deep accents, hover states, FABs, footers |
| `--brand-black` | `#1A1A1A` | `text-brand-black` | Primary text, near-black backgrounds |

### Opacity variants
Use Tailwind opacity modifiers with the token classes:
```
bg-primary/10   bg-primary/20   bg-primary/80
text-brand-red/60   border-brand-blue/30
```

### What is NOT allowed
- ❌ Tailwind palette colours (`red-500`, `blue-400`, `green-600`, `gray-300`, `amber-*`, etc.)
- ❌ Arbitrary hex values (`#8b5cf6`, `#f59e0b`, `#22c55e`, `#3b82f6`, etc.)
- ❌ Old brand colours (`#008751`, `#4A90D9`, `#E74C3C`, `#8E6FBF`, `#F5A623`)
- ❌ Social brand colours in UI chrome (WhatsApp green, Facebook blue, etc. are only acceptable inside dedicated share sheets)

### Mapping old → new for migration
| Old | Replace with |
|---|---|
| `green-400`, `green-500`, `green-600`, `#008751`, `#059669` | `primary` / `brand-green-dark` |
| `blue-400`, `blue-500`, `blue-600`, `#4A90D9`, `#3b82f6` | `brand-blue` |
| `red-400`, `red-500`, `red-600`, `#E74C3C`, `#ef4444` | `brand-red` |
| `gray-*`, `slate-*`, `#64748B`, `#94A3B8` | `var(--neu-text-muted)` or `var(--neu-text-secondary)` |
| `purple-*`, `#8E6FBF`, `#9F7AEA`, `#8b5cf6` | `brand-blue` (no purple in palette) |
| `amber-*`, `orange-*`, `#F5A623`, `#f59e0b` | `primary` (no amber in palette) |
| `cyan-*`, `#00C2FF` | `brand-blue` |

---

## 2. Typography

**Font family:** Plus Jakarta Sans (loaded via Google Fonts in `layout.tsx`)

### Scale
| Size | Tailwind | Usage |
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
| `font-bold` | Section headings, button labels (standard) |
| `font-black` | Marketing labels, CTA buttons (uppercase, wide tracking) |

### CTA label style
Primary CTA buttons always use:
```
font-black uppercase tracking-[0.18em] text-sm
```

### Rules
- ❌ Never use arbitrary font sizes (`text-[1.3rem]`, `text-[9px]`) — use the scale above
- ❌ Never mix font families — Plus Jakarta Sans only
- ✅ Headings must use semantic HTML (`h1`, `h2`, `h3`) — not just large `text-*` classes on `div`s

---

## 3. Spacing

All spacing uses the **Tailwind default 4px base scale**. Never use arbitrary values like `p-[14px]` or `gap-[11px]`.

### Common layout values
| Role | Value |
|---|---|
| Page horizontal padding (mobile) | `px-4` or `px-5` |
| Page horizontal padding (wide) | `px-6` |
| Card inner padding | `p-4` or `p-5` |
| Section gap | `gap-4` or `gap-6` |
| Tight list gap | `gap-2` or `gap-3` |
| Bottom nav clearance | `pb-20` |
| Safe area bottom | `safe-area-bottom` class |

---

## 4. Border Radius

| Context | Value |
|---|---|
| Full circles (icons, avatars) | `rounded-full` |
| Cards, modals, panels | `rounded-2xl` |
| Inputs, chips | `rounded-xl` |
| Buttons (standard) | `rounded-2xl` |
| Buttons (pill/small) | `rounded-full` |
| Neumorphic raised card | `rounded-[2.5rem]` |

---

## 5. Button System

There are **4 button variants**. Use the CSS class from `globals.css`, not hand-rolled Tailwind strings.

### 5a. Primary CTA — `.btn-glass-primary`
The signature button of the platform. Used for the **single most important action** on a screen.

```html
<button class="btn-glass-primary">Enable Notifications</button>
<button class="btn-glass-primary">Confirm Huud</button>
<button class="btn-glass-primary">Post</button>
```

Visual: Solid `#00D431` background, radial gradient for depth, specular highlight, `#006F35` drop shadow.

**Rules:**
- Maximum **one** primary CTA per screen/modal
- Always `font-black uppercase tracking-[0.18em] text-sm text-white`
- Full width on mobile (`w-full`), auto width on desktop

### 5b. Danger CTA — `.btn-glass-danger`
For destructive, emergency, or irreversible actions only.

```html
<button class="btn-glass-danger">Trigger SOS</button>
<button class="btn-glass-danger">Delete Post</button>
```

Visual: Same construction as primary but `#FF0000` → `#B30000` gradient.

### 5c. Secondary — `.btn-secondary`
Supporting action alongside a primary CTA.

```html
<button class="btn-secondary">Cancel</button>
<button class="btn-secondary">Go back</button>
```

Visual: Neumorphic raised, `var(--neu-bg)`, muted text.

### 5d. Ghost — `.btn-ghost`
Lowest-emphasis action. Inline text links, "skip", "view all".

```html
<button class="btn-ghost">Skip for now</button>
<button class="btn-ghost">View all →</button>
```

Visual: No background, no border, `var(--neu-text-muted)`.

### What NOT to use for buttons
- ❌ `mod-btn` — use `btn-secondary` or `btn-ghost` instead
- ❌ `neu-btn` — replaced by the new system above
- ❌ Raw `bg-primary text-white rounded-2xl` — always use `.btn-glass-primary`
- ❌ Tailwind `bg-red-500` for destructive — use `.btn-glass-danger`

---

## 6. Icon System

**Only Material Symbols Outlined** is used for UI chrome.

```html
<span class="material-symbols-outlined">home</span>
<span class="material-symbols-outlined fill-1">home</span>  <!-- filled / active state -->
```

Bootstrap Icons (`bi-*`) are **only permitted** in the onboarding slides (`src/app/page.tsx`). Everywhere else use Material Symbols.

### Size scale
| Context | Size |
|---|---|
| Navigation bar | `text-[30px]` |
| Card / list icon | `text-[24px]` or `text-2xl` |
| Inline / label icon | `text-[20px]` or `text-xl` |
| Hero / feature icon | `text-[44px]` |
| Onboarding sphere | `4.5rem` – `5rem` via inline style |

---

## 7. Card & Surface System

Three surface types exist. Never mix them on the same screen.

### Neumorphic (`.neu-*`) — light screens, onboarding, auth
Used on light backgrounds (`--neu-bg`). Creates soft raised/inset depth.

| Class | Role |
|---|---|
| `.neu-card-raised` | Standard raised card |
| `.neu-card-sm` | Lower elevation card |
| `.neu-socket` | Inset circular socket |
| `.neu-input` | Form input shell |
| `.neu-modal` | Modal / dialog |
| `.neu-nav` | Bottom navigation bar |
| `.neu-panel` | Sidebar panel |
| `.neu-inset` | Inset surface (same as neu-socket, non-circular) |
| `.neu-flat` | Flat surface, no shadow |
| `.neu-track` | Indicator / progress track |
| `.neu-chip` | Tag / chip |
| `.neu-fab` | Floating action button |

### Modern Glass (`.mod-*`) — feed, dark screens, modals
Used on the main feed and dark/blurred surfaces.

| Class | Role |
|---|---|
| `.mod-card` | Standard feed card |
| `.mod-card-elevated` | Elevated modal/menu |
| `.mod-inset` | Inset section container |
| `.mod-btn` | ⚠️ Deprecated — migrate to `btn-*` classes |
| `.mod-chip` | Chip/filter tag |
| `.mod-fab` | Green floating action button |
| `.mod-divider` | 1px divider |
| `.mod-modal` | Full modal dialog |

### Auth Glass — auth flows only
Frosted glass panels used exclusively in `/login`, `/signup`, `/forgot-password`.
Pattern: `bg-white/[0.94] backdrop-blur-2xl border border-white/85 rounded-2xl`

---

## 8. Form Inputs

Always use the `PremiumInput` component (`src/components/ui/PremiumInput.tsx`).

```tsx
<PremiumInput
  label="Email address"
  type="email"
  icon="mail"
  placeholder="you@example.com"
/>
```

- ✅ Uses `.neu-input` shell automatically
- ✅ Handles focus glow, validation states, error messages
- ❌ Never use raw `<input className="border ...">` outside of PremiumInput

---

## 9. Onboarding Slides (`/`)

Each slide renders:
1. Outer `.neu-card-raised rounded-[2.5rem] w-56 h-56` — the "device/screen" shell
2. Inner polished glass circle `w-36 h-36 rounded-full` with:
   - `radial-gradient(circle at 38% 32%, {color}CC, {color}, {color}CC)`
   - `box-shadow: 0 10px 40px {color}55, inset 0 1px 0 rgba(255,255,255,0.22)`
   - Glass specular highlight div `top-3 left-5 w-14 h-7`
3. White icon (Bootstrap on onboarding only, `fontSize: 4.5rem`)

**SOS slide is the exception** — uses a deeper red radial gradient (`#FF4D4D → #FF0000 → #B30000`) with stronger shadow (`rgba(255,0,0,0.55)`).

Slide colour mapping:
| Slide | Accent |
|---|---|
| One-Tap SOS | `#FF0000` |
| Sentinel AI | `#0000FF` |
| Hyperlocal Feed | `#00D431` |
| Your Voice Matters | `#006F35` |
| Identity is Power | `#0000FF` |

---

## 10. Navigation

### BottomNav
- Shell: `.neu-nav safe-area-bottom`
- Icons: Material Symbols `text-[30px]`
- Active: `text-primary fill-1`
- Touch targets: `min-w-[44px] min-h-[44px]` always
- SOS button: red treatment (`text-brand-red`, glow ring) — **never change this**

### TopNav
- Transparent on `/feed` and `/profile/*`
- `bg-white border-b border-black/[0.06]` on all other pages
- Brand name: `font-black tracking-tight text-xl`

### LeftSidebar
- Desktop: `.neu-panel` fixed, `w-96`
- Mobile: drawer with `bg-brand-black/50` backdrop
- Quick action accent colours must use **only the 6 brand colours**

---

## 11. Dark Mode

- Background: `#0D1A0F` (deep forest dark)
- Surface: `#132218`
- Text: `#E9F6E6`
- Borders: `#1E3A22`
- All neumorphic shadows recalculate automatically via `--neu-shadow-dark` / `--neu-shadow-light` tokens

---

## 12. Animations

| Name | Class | Usage |
|---|---|---|
| Float | `.animate-neu-float` | Onboarding icon cards |
| Soft float | `.animate-soft-float` | Profile card elements |
| Ping | `animate-ping` | SOS active state only |
| Fly out | `.animate-fly-out` | Post send animation |

**Rules:**
- `animate-ping` is **reserved for SOS/emergency states only** — never use it for decorative purposes
- Respect `prefers-reduced-motion` — all animations are disabled automatically via the media query in `globals.css`

---

## 13. Redesign Roadmap

Track progress here as we migrate screens to the new design system.

### Phase 1 — Foundation ✅ Done
- [x] Lock official 6-colour palette in `globals.css`
- [x] Redesign onboarding slides (glassy 3D icons)
- [x] Fix notification permission prompt
- [x] Add `.btn-glass-primary` and `.btn-glass-danger` CSS classes

### Phase 2 — Auth flows 🔜 Next
- [ ] `/login` — migrate CTA to `.btn-glass-primary`, replace hex colours
- [ ] `/signup` — same
- [ ] `/forgot-password` — same
- [ ] `/verify-email` — same

### Phase 3 — Core feed
- [ ] `XPostCard` — replace Tailwind colour scale with brand tokens
- [ ] `CreatePostModal` — migrate `neu-btn` to `btn-*` system
- [ ] `BottomNav` — replace `red-500` with `brand-red`
- [ ] `FeedTabs` — migrate filter chips

### Phase 4 — Navigation & sidebars
- [ ] `LeftSidebar` — replace hex quick-action accents with brand tokens
- [ ] `TopNav` — audit icon and colour usage
- [ ] `RightSidebar` — audit

### Phase 5 — Safety & SOS flows
- [ ] `/sos` — already well-styled, light audit
- [ ] `/safety` — tile icon colours → brand tokens

### Phase 6 — All remaining pages
- [ ] All other `src/app/**` pages

---

## 14. File Locations

| What | Where |
|---|---|
| All CSS variables, tokens, utility classes | `src/app/globals.css` |
| Tailwind config (v4 — via `@theme inline`) | `src/app/globals.css` |
| Button component (future) | `src/components/ui/Button.tsx` |
| Input component | `src/components/ui/PremiumInput.tsx` |
| Onboarding | `src/app/page.tsx` |
| Bottom navigation | `src/components/feed/BottomNav.tsx` |
| Top navigation | `src/components/navigation/TopNav.tsx` |
| Left sidebar | `src/components/navigation/LeftSidebar.tsx` |
| Design doc (this file) | `DESIGN.md` |
