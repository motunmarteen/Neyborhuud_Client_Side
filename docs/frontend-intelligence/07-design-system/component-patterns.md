# Component Patterns -- Real UI Inventory

Step 8 of the frontend rebuild intelligence gathering. This document catalogues the
**actual, as-built** UI component patterns in `pwa/src/components/`, based on reading
every file in `components/ui/` and `components/shared/` in full, plus sampled real usage
from `feed/`, `chat/`, `safety/`/`sentinel/`, `marketplace/`, and `navigation/`.

The governing question for every section: is this a **TRUE shared component** (one file,
imported everywhere the pattern appears), or a **DE FACTO pattern** (the same look
achieved by independently copy-pasted className strings, with no shared component)?
That distinction is called out explicitly in every section because it determines what
the rebuild can literally reuse vs. what has to be extracted into a component for the
first time.

Evidence basis: `pwa/src/components/ui/*` (15 files, all read), `pwa/src/components/shared/*`
(1 file, read), plus full reads of `XPostCard.tsx`, `CreatePostModal.tsx`,
`DealStatusCard.tsx`, `OfferCard.tsx`, `EventRsvpCard.tsx`, `TopNav.tsx`, `BottomNav.tsx`,
`LeftSidebar.tsx`, `RightSidebar.tsx`, `SosCountdownOverlay.tsx`, `PanicPinKeypad.tsx`,
`SentinelBottomSheet.tsx`, `ProductForm.tsx`, `ProductCard.tsx`, `SellerBadge.tsx`,
`PostCardVerificationBadge.tsx`, `BadgeCard.tsx`, `XIcons.tsx`, `BrowseEmptyState.tsx`,
`PostSkeleton.tsx`, plus repo-wide grep counts for adoption verification.

---

## 1. Buttons

**Verdict: a real `Button` primitive exists (`components/ui/Button.tsx`) -- and it is
completely unused. Zero imports anywhere in the codebase.**

`ui/Button.tsx` is a well-built `forwardRef` component with 5 variants (`primary`,
`ghost`, `danger`, `outline`, `success`), 3 sizes, loading/icon slots, and proper
`focus-visible` rings. A `grep -rn "ui/Button"` across the entire `src/` tree returns
**zero matches**. It is dead code -- built, never adopted.

In practice every feature rolls its own button classNames inline. Concrete, materially
different examples found:

- **XPostCard action bar** (feed): class `post-card-action-bar__btn` (a bespoke CSS
  class defined in globals.css) combined with ad-hoc Tailwind hover/active states,
  unique to feed post cards.
- **DealStatusCard / OfferCard** (chat): pill buttons built from scratch per action,
  using raw Tailwind `slate-900`/`emerald-600`/`red-200` palette colors, not the app's
  `brand-*`/`status-*` design tokens, and not the `Button` component.
- **ProductForm** (marketplace) submit/cancel: a full custom gradient pill
  (`bg-gradient-to-r from-primary to-[#006F35]`, `shadow-[0_8px_24px_rgba(0,212,49,0.35)]`)
  unlike either the Button component or the chat pills above.
- **SosCountdownOverlay** (safety) Cancel button: white pill with red text and a large
  shadow, built independently.
- **CreatePostModal** header/back/close buttons: circular icon buttons built with inline
  `style={{ background: 'rgba(0,0,0,0.05)' }}` rather than any Tailwind class or shared
  component at all.

Two globally-defined *CSS class* button treatments do get reused across many features --
`mod-chip` / `mod-chip-active` (pill/chip toggle look, defined once in globals.css,
136 files reference `mod-*` classes) and `neu-*` variants -- but these are raw utility
classes applied ad hoc, not a component with a props API. A page can apply `mod-chip`
correctly or subtly wrong (missing a state class, wrong padding) with no compiler check.

**Rebuild implication:** `ui/Button.tsx` is a decent starting point structurally but was
never battle-tested against real usage (no variant matches the gradient-pill or
slate/emerald pill styles actually shipped). Treat it as a draft, not a proven primitive.

---

## 2. Cards

**Verdict: DE FACTO -- at least four incompatible visual "systems" coexist, each with its
own CSS-class family, and no single shared `Card` component wraps any of them consistently.**

`ui/PremiumCards.tsx` exports three components -- `GlassCard`, `NeumorphicCard`,
`NeumorphicInset`, `NeumorphicCircle` -- that look like a real shared library, but grep
shows these specific components are used in only a handful of places; the far more
common pattern is applying the underlying CSS classes directly without going through the
React components at all:

- **`neu-*` family** (neumorphic: soft-embossed / inset shadows) -- `neu-base`,
  `neu-card-sm`, `neu-card-raised`, `neu-socket`, `neu-input`, `neu-divider`. Used
  directly (not via `NeumorphicCard`) in `RightSidebar.tsx` (event/marketplace skeleton
  tiles), `PostCreationSuccessSheet.tsx`, `LocationPicker.tsx`. 33 `.tsx` files reference
  `neu-card*`/`neu-base`/`neu-socket`/`neu-input`/`neumorphic` classes.
- **`mod-*` family** (a distinct flatter "module card" look -- `mod-card`, `mod-card-hover`,
  `mod-card-elevated`, `mod-inset`, `mod-chip`) -- the single most-used card system by
  file count: **136 files** reference `mod-card`/`mod-chip`/`mod-inset`. Used in
  `BrowseInfoTip.tsx`, `BrowseSelect.tsx`'s menu panel, `BrowseEmptyState.tsx`,
  `BadgeCard.tsx` rarity chips, across almost every `browse/`-style list page.
- **`glass` / glassmorphism family** -- `GlassCard` component (`bg-white/10 backdrop-blur-sm`
  or `.glass` or `bg-white/40 ... backdrop-blur-2xl` depending on `intensity`), plus ad-hoc
  glass treatments that don't go through `GlassCard` at all: `BottomSheet.tsx`'s panel,
  `LongPressMenu.tsx`'s popup, `CreatePostModal.tsx`'s sheet (inline `style` with
  `backdropFilter: 'blur(50px) saturate(2)'` -- not even a Tailwind class). 56 files
  reference glass/backdrop-blur treatments, mostly independently.
- **"Doodle" surface family** -- `GlassFormPage.tsx` (`doodle-surface`, `doodle-modal-panel`,
  `doodle-modal-ambient`) -- a fourth, visually distinct centered-modal treatment with soft
  animated radial-gradient washes, used for the "offer-dialog family" of full-route modal
  shells. Only 4 files reference `doodle-modal`/`doodle-surface`, so this is the newest/most
  narrowly-scoped system.
- **Raw one-off cards with no system at all** -- `ProductCard.tsx` (marketplace) is a
  "Stake-style" full-bleed image card with its own bespoke gradient overlay and pill
  badges that matches none of the four families above. `DealStatusCard`/`OfferCard`/
  `EventRsvpCard` (chat) use plain `rounded-2xl bg-{color}-50` cards with raw Tailwind
  color names (`bg-blue-50`, `bg-purple-50`, `bg-amber-50`) that don't reference the
  app's design tokens (`brand-blue`, `status-warning`, etc.) at all -- a fifth ad-hoc
  style, and notably the only one using literal Tailwind palette colors instead of CSS
  custom properties.

This is the single clearest fragmentation finding in the whole audit: **five visually
and technically distinct "card" treatments** (neumorphic, mod-card, glass, doodle-modal,
and raw-Tailwind-color chat cards) are all live in production simultaneously, seemingly
by feature-team drift rather than deliberate multi-brand design (there is no code comment
or doc anywhere explaining why chat cards intentionally skip the shared systems).

---

## 3. Forms / Inputs

**Verdict: mixed -- two real shared primitives exist and are moderately adopted
(`PremiumInput`, `PremiumTextArea`), but most large forms (`CreatePostModal`) bypass them
entirely with fully bespoke inline-styled inputs.**

- **`PremiumTextArea`** (`ui/PremiumTextArea.tsx`) -- floating-label textarea with
  validation states (`idle|checking|valid|invalid|taken|error`), shares its
  `ValidationStatus` type with `PremiumInput`. Confirmed as a real shared primitive: used
  directly in `marketplace/ProductForm.tsx` for the Description field exactly as Step 6's
  commerce-journeys docs describe.
- **`PremiumInput`** (`ui/PremiumInput.tsx`) -- same floating-label/validation-state pattern
  for single-line inputs, password show/hide toggle, prefix support (e.g. `@` for
  usernames). Well-built, but **not used by `ProductForm.tsx`** -- that form's Title and
  Price fields use raw `<input>` with a different shared helper instead
  (`glassField`/`glassFieldError`/`glassLabel` from `@/lib/glass-form-styles`, a
  className-string helper, not a component). So even within one form, two different
  "shared" input strategies are mixed: a real component (`PremiumTextArea`) for one field
  and className constants for another.
- **`CreatePostModal.tsx`** (feed) -- the single largest, most complex form in the sampled
  domains -- uses **neither** `PremiumInput` nor `PremiumTextArea`. Every field (textarea,
  date/time inputs, text inputs) is hand-built with full inline `style={{...}}` objects
  and manual `onFocus`/`onBlur` handlers that swap border/background colors imperatively.
  It also builds its own **custom select replacement** (`PostFormSelect`, a roughly
  150-line local component using `createPortal`) rather than reusing `ui/BrowseSelect.tsx`,
  which already solves the identical "select must render in a portal so it is not clipped
  inside a bottom sheet" problem. Two independent portal-select implementations exist for
  the same problem.
- **`OTPInput`** (`ui/OTPInput.tsx`) -- genuinely shared, single-purpose, well-isolated
  6-digit code component with paste/backspace/auto-advance handling. No competing
  implementation found.
- **Checkboxes / toggles** -- no shared component. `ProductForm.tsx`'s negotiable checkbox
  is a raw `<input type="checkbox">` styled with plain Tailwind utility classes, with no
  reusable wrapper.
- **`window.prompt()` / `window.confirm()` anti-pattern -- confirmed, not hypothetical.**
  Direct grep hits:
  - `window.prompt(...)`: `components/chat/OfferCard.tsx` (counter-offer amount prompt),
    `app/(app)/incident-reports/[id]/PageClient.tsx`, `app/(app)/settings/page.tsx`.
    3 files.
  - `window.confirm(...)`: `app/(app)/settings/page.tsx`,
    `components/chat/CommunityInfoSheet.tsx`, `components/feed/CommentItem.tsx`,
    `components/sentinel/dashboard/DashboardCheckInsPanel.tsx`,
    `components/sentinel/tracking/LiveTrackingActivePanel.tsx`. 5 files.
  - `window.alert(...)`: none found.
  This confirms the commerce-journeys.md finding exactly: a core money-flow interaction
  (countering a marketplace offer) is gated behind a native, unstyled browser prompt
  dialog rather than any in-app input UI -- a real UX/brand-consistency gap the rebuild
  should close.

---

## 4. Modals / Sheets / Dialogs

**Verdict: DE FACTO with partial convergence -- three real shared overlay primitives
exist in `ui/` (`BottomSheet`, `BottomSheetOverlay`/`AppBottomSheet`, `LongPressMenu`),
but at least three more independently-built modal shells exist alongside them.**

Real shared primitives (all in `components/ui/`):
- **`BottomSheetOverlay.tsx`** -- the most complete: portal-rendered, focus-trap, Escape
  handling, drag-to-dismiss via `useBottomSheetDrag`/`useBottomSheetMount` hooks, scroll
  lock. **`AppBottomSheet.tsx`** wraps it with a fixed panel style (rounded-top, neu
  background) for convenience.
- **`BottomSheet.tsx`** -- a *second, independent* bottom-sheet implementation
  (framer-motion drag instead of the custom hook, its own focus-trap code duplicated
  nearly verbatim from `BottomSheetOverlay`'s). Both exist side by side in `ui/` with
  overlapping responsibility and near-identical accessibility code copy-pasted between
  them rather than shared.
- **`LongPressMenu.tsx`** -- anchored/centered popup menu (framer-motion), used for
  long-press context menus. Note: `XPostCard`'s own long-press flow does not call
  `LongPressMenu` directly -- it built its own `PostCardActionsSheet` on top of the
  bottom-sheet primitives instead, so even long-press menus have two code paths.

Independently-built modal shells found in the sampled domains, none reusing the above:
- **`CreatePostModal.tsx`** (feed) -- its own full bespoke bottom sheet: manual
  `createPortal` + `AnimatePresence` + `motion.div` with a hand-tuned spring transition
  and inline `style` (not `BottomSheet`/`AppBottomSheet`), duplicating the "iOS sliding
  sheet" pattern from scratch.
- **`GlassFormPage.tsx`** (`ui/`, but functions as a full-route modal, not a sheet) -- a
  centered, glass "offer-dialog family" modal shell that renders the entire app chrome
  (TopNav/sidebars/BottomNav) around itself; visually and structurally unrelated to both
  bottom-sheet primitives and to `GlassCard`.
- **`SentinelBottomSheet.tsx`** (safety) -- another bespoke bottom sheet: manual
  mount/unmount with `setTimeout`-based animation timing and its own transform
  transition, not using `useBottomSheetDrag`/`useBottomSheetMount` or framer-motion.
- **`PostCreationSuccessSheet.tsx`** (`shared/`) -- yet another bespoke bottom sheet,
  using Tailwind's `animate-in slide-in-from-bottom-4` utility classes instead of
  framer-motion or the shared hooks.

So there are at minimum **5 different bottom-sheet/modal implementations** doing
conceptually the same job (dim backdrop + slide-up panel + dismiss), with two of them
(`BottomSheet` vs `BottomSheetOverlay`) living in the same `ui/` folder without one
having been deprecated in favor of the other.

Centered (non-sheet) dialogs: `SosCountdownOverlay.tsx` (safety) is a full-screen
centered `alertdialog` with no shared wrapper -- built directly with `fixed inset-0`.

---

## 5. Navigation Chrome

**Verdict: TRUE shared components, single source of truth, with a working global/local
duality -- this is the most consistent category in the whole audit.**

- **`TopNav.tsx`** (`components/navigation/`) -- single component, rendered either
  directly by a page (`origin="page"`) or globally via **`AutoTopNav.tsx`**
  (`origin="global"`), which decides per-route whether to auto-mount it using
  `shouldRenderGlobalTopNav(pathname)` / `isOnboardingOrAuthRoute(pathname)` route-gate
  helpers. On `/feed` it shows a logo + dropdown mega-menu (marketplace/jobs/events/FYI/
  help-request/SOS grid, profile pin-avatar, settings, logout); on every other route it
  shows a plain route-derived title (via a `getRouteTitle()` map) plus a notifications
  bell with unread badge. No second TopNav implementation was found anywhere in the
  sampled domains -- `GlassFormPage.tsx` imports and reuses this same `TopNav`.
- **`BottomNav.tsx`** (`components/feed/`, not `navigation/` -- a naming/location
  inconsistency worth flagging for the rebuild) -- single component, 5 tabs (Home, Search,
  Sentinel, Connect, Gist/Profile depending on breakpoint), unread badge on Connect,
  special long-press-to-Fake-Call behavior on the Sentinel tab (600 ms timer), scroll-hide
  via `useScrollHideBottomNav`. Used identically by `GlassFormPage.tsx` and the main app
  shell -- one real shared component, no drift found.
- **`LeftSidebar.tsx`** -- single component with a `mode: 'desktop' | 'mobile' | 'both'`
  prop that controls whether it renders as a persistent aside (desktop breakpoint,
  CSS-driven via a `left-sidebar--desktop` class, not a JS media query) or a slide-in
  drawer (`left-sidebar--drawer`, toggled by a global `toggle-mobile-sidebar` window
  event dispatched from `TopNav`'s hamburger). **`AutoLeftSidebar.tsx`** is the global
  auto-mount wrapper (mirrors `AutoTopNav`'s route-gating pattern exactly). Contains
  profile lockup, "My Huud"/Communities/Saved links, a Sentinel shield shortcut, a
  weather/local-news widget, and a `LocalHuudMenu`.
- **`RightSidebar.tsx`** -- single component, `hidden lg:flex` (i.e. CSS breakpoint-gated,
  invisible below `lg`), shows onboarding checklist, weather widget, upcoming events
  (with its own inline skeleton -- see Section 6), marketplace picks, news panel. No
  companion Auto wrapper -- always rendered directly by consuming pages/layouts
  (confirmed via `GlassFormPage.tsx` importing it directly).

Breakpoint adaptation is real and CSS-driven (Tailwind responsive classes / custom
`left-sidebar--desktop`/`--drawer` classes toggled by component state), not duplicated
JSX per breakpoint -- this is a genuinely well-factored part of the system.

---

## 6. Empty / Loading / Error States

**Verdict: DE FACTO -- no app-wide shared `EmptyState`/`Skeleton`/`ErrorState` component.
Two components exist that look shared but are each scoped to one feature area; everywhere
else, every page hand-builds its own state markup.**

- **`BrowseEmptyState.tsx`** (`components/layout/`) -- the closest thing to a real shared
  empty-state component. Props: `icon`, `title`, `description`, `action`. Genuinely reused
  across **27 files** -- but exclusively within the "browse"-style list pages (communities,
  events, fyi, gist, help-request, jobs, marketplace, neighborhood, saved, sentinel
  dashboard panels, work). It is not used by feed, chat, or the core marketplace product
  grid empty states, which build their own inline "No results" markup instead (confirmed:
  18 files contain raw "No ... found" / "Nothing here" / "No results" strings outside the
  `BrowseEmptyState` call sites).
- **`PostSkeleton.tsx` / `FeedSkeleton`** (`components/feed/`) -- a real, well-built
  shimmer skeleton matching the exact XPostCard layout (avatar circle, two text lines,
  optional media block, 5-icon action bar), but scoped only to the feed. No equivalent
  skeleton exists for marketplace product grids, chat threads, or sentinel dashboards --
  those each build their own inline skeletons using the generic Tailwind `animate-pulse`
  utility directly (confirmed: **98 files** use `animate-pulse` directly, e.g.
  `RightSidebar.tsx`'s events/marketplace widget skeletons are hand-built divs with
  `animate-pulse` + `neu-card-sm`, unrelated to `PostSkeleton`'s shimmer implementation).
- **No `ErrorState` component exists anywhere in `ui/` or `shared/`.** No file matching
  `*ErrorState*`/`*error-state*` was found in the component tree. Error handling is
  presumably ad hoc per fetch (toasts via `sonner`, or silent `console.error`/swallowed
  catches, as seen in `LocationPicker.tsx` and `ProductForm.tsx`).

This is a genuine gap relative to what the original rebuild plan asked for: states are
the single least-systematized part of the current UI. The rebuild should treat
`EmptyState`/`Skeleton`/`ErrorState` as **net-new shared primitives to build**, using
`BrowseEmptyState` and `PostSkeleton` as reference implementations/visual starting points
rather than as existing infrastructure to simply promote.

---

## 7. Badges / Pills / Status Indicators

**Verdict: DE FACTO -- every domain that needs a badge has built its own, with no shared
`Badge` component and no shared color/shape convention between them.**

Concrete, materially different implementations found:
- **`SellerBadge.tsx`** (marketplace) -- trust-tier pill (New Seller / Vouched Seller),
  raw Tailwind emerald-50/amber-50 background+border+text triples, emoji prefix,
  optional "N more vouches" trailing text. Self-contained, fails silently.
- **`PostCardVerificationBadge.tsx`** (feed) -- renders a Material Symbols `verified`
  glyph (not a pill/chip at all) colored per verification tier via
  `getVerificationTierMeta()`, optionally overlaid on the avatar corner
  (badge-on-avatar composition). Structurally unlike `SellerBadge` (icon-only vs.
  pill-with-text).
- **`DEAL_STATUS_META`** (`lib/dealStatus.ts`, consumed by `ProductCard.tsx`) -- a third
  badge system: colored rounded-full pills with a Material Symbols icon plus label,
  distinct color logic from both `SellerBadge` and the chat cards' style maps below.
- **`DealStatusCard.tsx` / `OfferCard.tsx`** (chat) -- each defines its own local
  status-to-style lookup table (`ACTION_STYLE` and `STYLE` respectively) with emoji
  icons and raw Tailwind blue-50/amber-50/emerald-50 color pairs -- a fourth and fifth
  independent instance of "map a status enum to a colored badge," not deduplicated even
  between these two closely-related sibling components in the same folder.
- **`BadgeCard.tsx` / `BadgeIcon.tsx`** (gamification) -- rarity chips (common maps to
  `mod-chip`, legendary maps to `mod-chip` plus amber text) for achievement badges --
  yet another instance, this one at least using the shared `mod-chip` CSS class rather
  than raw Tailwind colors.
- **`SocialProofBadge.tsx`** (landing) -- unrelated marketing-page badge, not part of the
  in-app badge vocabulary at all.

No shared `Badge`/`Pill`/`StatusChip` component or even a shared status-to-color utility
was found. Every one of the roughly six badge concepts above (trust tier, verification,
deal status, offer status, RSVP status via `EventRsvpCard`'s own `CHOICES` array, badge
rarity) reimplements its own enum-to-style lookup table with different color systems
(some raw Tailwind palette, some CSS custom properties, some `mod-chip`).

---

## 8. Icons

**Verdict: confirmed -- a real two-icon-system split, both genuinely shared but for
different purposes; no third competing icon system found.**

- **Material Symbols (Google's variable icon font)** -- the dominant system by far.
  `material-symbols-outlined` spans the codebase: a search for that className returns
  **218 files**. Used via a plain span with the ligature name as text content (e.g.
  `location_on`, `verified`, `close`, `chevron_right`), frequently with
  `style={{ fontVariationSettings: '"FILL" 1' }}` to toggle the filled variant for
  "active" states (seen in `SentinelBottomSheet.tsx`, `LeftSidebar.tsx`'s `fill-1` class,
  `BadgeCard.tsx`). This is a global font loaded once (not a React component per icon) --
  any string is renderable whether or not it is a real Material Symbol name, so there is
  no compile-time safety here.
- **`lucide-react`** -- a proper React icon-component library, used more sparingly:
  **10 files** import from `lucide-react` directly (e.g. `TopNav.tsx`'s Menu, X,
  Settings, ChevronDown icons; `LeftSidebar.tsx`'s Shield icon; `Button.tsx`'s Loader
  for the loading spinner).
- **`components/icons/XIcons.tsx`** -- a real, deliberate shared wrapper: thin typed
  components (`XReplyIcon`, `XRepostIcon`, `XLikeIcon`, `XViewIcon`, `XBookmarkIcon`,
  `XShareIcon`, `XThumbUpIcon`, `XHelpIcon`) around specific `lucide-react` icons, adding
  a consistent size/filled/className prop contract for the X/Twitter-style feed action
  bar. This is genuinely reused (confirmed via `XPostCard.tsx` importing 6 of its 8
  exports) -- the one place in the icon system with real componentization rather than
  raw strings.

So: Material Symbols is the de facto default for "any icon anywhere," `lucide-react` is
used for a handful of chrome/utility icons, and `XIcons.tsx` is the sole example of a
properly wrapped, typed icon component family -- scoped only to feed post actions. The
rebuild should decide on one strategy (most likely keep Material Symbols as the bulk
system given its 218-file footprint, but formalize more `XIcons.tsx`-style typed
wrappers for icons that carry interactive state like `filled`).

---

## Design system fragmentation

Consolidated list of every place this audit found genuinely different, incompatible
visual systems live for the same UI concept -- the specific finding this document exists
to catch:

1. **Cards -- 5 incompatible systems, all live simultaneously:** neumorphic (`neu-*`,
   33 files), mod-card (`mod-*`, 136 files, the most-used), glassmorphism (`glass`/
   `GlassCard`/ad-hoc `backdrop-blur`, 56 files), doodle-modal (`doodle-*`, 4 files,
   newest), and raw-Tailwind-color chat/commerce cards (`bg-blue-50`, `bg-emerald-50`,
   `bg-purple-50` -- bypass CSS custom properties/design tokens entirely). None of these
   five share a base component; a developer choosing "how do I make a card" today has
   five equally-precedented answers with no guidance on which is canonical.

2. **Buttons -- a real shared `Button` component exists and is imported nowhere.**
   Every sampled domain (feed, chat, marketplace, safety) independently invented its own
   button className strings -- three different pill-button color systems alone (chat's
   slate/emerald/red, marketplace's primary-gradient, safety's white-on-red) plus one
   dead component.

3. **Modals/sheets -- 5+ independent bottom-sheet/dialog implementations**, including
   two inside `ui/` itself (`BottomSheet.tsx` vs. `BottomSheetOverlay.tsx`) with
   near-duplicate focus-trap code, plus three more built fresh in feed
   (`CreatePostModal`), safety (`SentinelBottomSheet`), and shared
   (`PostCreationSuccessSheet`) -- each with a different animation engine
   (framer-motion vs. custom hook vs. setTimeout vs. Tailwind animate-in).

4. **Badges/status pills -- 6 independent status-to-color lookup tables**, each
   reinvented per feature (`SellerBadge`, `PostCardVerificationBadge`,
   `DEAL_STATUS_META`, `DealStatusCard`'s `ACTION_STYLE`, `OfferCard`'s `STYLE`,
   `BadgeCard`'s `RARITY_CHIP`), split between raw Tailwind palette colors and
   CSS-custom-property/`mod-chip` tokens with no consistent rule for which to use.

5. **Selects -- 2 independent custom-portal-select implementations** solving the
   identical "native select gets clipped inside a bottom sheet" problem:
   `ui/BrowseSelect.tsx` (shared, used across browse pages) and `CreatePostModal`'s
   local `PostFormSelect` (bespoke, roughly 150 lines, feed-only) -- built without
   either author apparently being aware of the other.

6. **Color vocabulary split** -- most of the system references CSS custom properties /
   Tailwind design tokens (`var(--neu-text)`, `brand-blue`, `status-danger`), but the
   entire chat deal/offer/RSVP card family (`components/chat/*.tsx`) opts out and uses
   raw Tailwind palette classes (`bg-blue-50`, `text-emerald-700`, `bg-purple-50`)
   instead -- meaning a rebrand or dark-mode fix that touches only design tokens would
   silently miss every chat system-message card.

7. **Anti-pattern confirmed:** native `window.prompt()` (3 files, including the
   marketplace counter-offer flow in `OfferCard.tsx`) and `window.confirm()` (5 files)
   are used in place of any in-app modal/input component, breaking visual consistency
   and accessibility for exactly the flows (money, safety check-ins, community
   moderation) where trust in the UI matters most.

---

## Summary

The `ui/` folder contains several genuinely good, well-built shared primitives --
`BottomSheetOverlay`, `PremiumInput`/`PremiumTextArea`, `OTPInput`, `BrowseSelect`,
`InteractiveMap`/`LocationPicker`, and navigation chrome (`TopNav`/`BottomNav`/sidebars)
-- but adoption is inconsistent: `Button.tsx` has zero real usages, and
`CreatePostModal` (one of the app's most important flows) bypasses nearly every shared
primitive in favor of one-off inline-styled markup. Cards, badges, and modals each have
4-6 independently invented visual systems doing the same job with different colors,
shadows, and code paths -- genuine unintentional drift, not deliberate multi-brand
design, since nothing documents an intended split. `window.prompt()`/`window.confirm()`
are confirmed as live anti-patterns in commerce and safety flows. Empty/loading/error
states have no app-wide shared components at all (`BrowseEmptyState` and `PostSkeleton`
are feature-scoped, not universal). Material Symbols is the dominant icon system
(218 files); `lucide-react` and the typed `XIcons.tsx` wrapper are secondary. The
rebuild should treat most `ui/` primitives as reusable, but must consolidate
cards/badges/modals/buttons from scratch using the real variations documented here as
requirements, not assume any single existing implementation is canonical.
