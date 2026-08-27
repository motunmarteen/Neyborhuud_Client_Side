# NeyborHuud Design System Specification

> Step 8 (Design System Specification) — the decision layer on top of `design-tokens.md` and
> `component-patterns.md`. Those two documents extracted what exists; this one picks a canonical
> answer for every fragmentation point they found, with the reasoning stated so any call can be
> revisited. Default rule used throughout: **the most-adopted real pattern wins**, unadopted or
> dead patterns get rebuilt, and every decision cites the adoption evidence it's based on.
>
> This is the document Stitch and any implementation agent should be given as the design
> constitution — it is deliberately opinionated where the extraction found ambiguity.

---

## 1. Color

**Canonical: the 6-color brand palette already declared in `globals.css` (design-tokens.md §1.1),
enforced for real this time.**

| Token | Value | Use |
|---|---|---|
| `--primary` (`--neon-green`) | `#00D431` | Primary actions, brand accent |
| `--brand-blue` | `#1A56FF` | Links, informational accents |
| `--brand-surface` | `#E9F6E6` | Light backgrounds |
| `--brand-red` | `#FF0000` | Danger, SOS, destructive |
| `--brand-green-dark` | `#006F35` | Deep accents, hover states, FABs |
| `--brand-black` | `#1A1A1A` | Primary text (light mode) |

Plus the semantic layer already defined (`--status-success`, `--status-warning`, `--status-danger`,
`--status-info`, `--status-neutral`) and the light/dark surface/text/border tokens
(`--background-*`, `--surface-*`, `--border-*`, `--text-primary-*`, `--text-secondary-*`).

**Decision — stop using raw Tailwind palette colors for any UI that ships.** `design-tokens.md`
§8 and `component-patterns.md` §2/§7 both independently found the same violation from different
angles: chat's `DealStatusCard`/`OfferCard`/`EventRsvpCard` and several badge components use raw
`bg-blue-50`/`bg-emerald-600`/`bg-purple-50`/`bg-amber-50` instead of the token set. This is the
single most consequential color decision for the rebuild: **any component using a literal Tailwind
palette class instead of a `brand-*`/`status-*`/`text-*` token is non-compliant**, full stop. This
resolves `component-patterns.md`'s fragmentation finding #6 directly.

**Fix the two silent bugs found in `design-tokens.md` §8 before reusing these tokens elsewhere:**
1. Two `:root`/`.dark` blocks define `--neu-*` tokens with different values (lines 85-92/101-107
   vs 5763-5771/5773-5780) — delete the first (dead) block, keep the second as the single
   definition.
2. `--text-primary`/`--text-secondary` are referenced (in `sentinel-sheet` CSS) but never defined
   — either alias them to `--text-primary-light`/`-dark` or fix the two call sites to use the real
   token names.

**Casing rule:** always lowercase hex in new code (`#00d431`, not `#00D431`) — design-tokens.md §8
found both cases used interchangeably for the same brand color, which is meaningless to a browser
but signals copy-paste rather than token reuse to a future reader.

---

## 2. Typography

**Canonical: the existing 8-step named scale (`design-tokens.md` §2.2), actually enforced.**

| Token | Size | Role |
|---|---|---|
| `--text-caption` | 9px | Badges, chip labels, eyebrows |
| `--text-label` | 10px | Secondary meta, timestamps |
| `--text-body-sm` | 12px | Compact body, list items |
| `--text-body` | 13px | Default body copy |
| `--text-subheading` | 15px | Section subheadings |
| `--text-heading` | 17px | Page/card headings |
| `--text-title` | 20px | Section titles |
| `--text-display` | 26px | Hero/SOS/event headings |

**Decision:** this scale already exists and is well-designed (a genuine 6-9 role naming
convention, not an arbitrary px ramp) — the problem `design-tokens.md` §2.3 found is adoption, not
design. New/rebuilt components must use the `.type-caption` → `.type-display` utility classes (or
their token equivalents) instead of hardcoded rem values. Font family stays `Plus Jakarta Sans`
(confirmed loaded via `next/font`, token `--font-jakarta`) with Material Symbols self-hosted for
icons — no change needed here, just locate and preserve the `next/font` loader call in whatever
layout file injects `--font-jakarta` when the rebuild touches the root layout.

**Font weight:** no token exists today and none is needed — keep using plain numeric weights
(400/500/600/700/800/900), with 800/900 as the established convention for headings/brand
wordmarks/emphasis. Formalizing this as a token would add indirection without adding value.

---

## 3. Spacing, Radius, Shadow

**Spacing — canonical: the existing 8px-based scale (`--space-1` through `--space-16`,
`design-tokens.md` §3.1), genuinely adopted this time.** The scale is well-formed; the problem is
that `var(--space-N)` is essentially never referenced directly in custom CSS today — components
hardcode rem values that often don't even land on the scale's own steps (`0.35rem`, `0.15rem`,
`0.65rem` were found). **Rule for the rebuild:** any new spacing value must be one of the 10 scale
steps (or a Tailwind default spacing utility, which is derived from the same steps in Tailwind v4)
— no more one-off rem values invented per component.

**App-shell layout tokens** (`--app-topnav-height`, `--app-bottomnav-*`, `--app-nav-bottom`, etc.,
`design-tokens.md` §3.2) are correctly used already — `design-tokens.md` calls this out as "the
most disciplined token usage in the file." Keep this pattern exactly as-is; it's the reference
example for how the spacing scale *should* be used everywhere else.

**Radius — no scale exists; create one.** Recurring values found (`0.75rem`, `0.875rem`, `1rem`,
`1.125rem`, `1.25rem`, `1.5rem`, `1.75rem`, plus `9999px`/`50%` for pills/avatars) should become a
named scale: `--radius-sm` (0.75rem), `--radius-md` (1rem), `--radius-lg` (1.25rem), `--radius-xl`
(1.5rem), `--radius-pill` (9999px), `--radius-circle` (50%). This is new — nothing today enforces
consistency here, and it's a small, low-risk addition.

**Shadow — canonical: the existing 5-step elevation scale (`--shadow-xs` through `--shadow-xl`,
`design-tokens.md` §4.1)** for any *flat* elevation need (e.g. `.mod-card`'s shadow already
references it). **For neumorphic depth specifically**, keep the dedicated `--neu-shadow-dark`/
`--neu-shadow-light` dual-shadow system (§4.3) — it's a different visual technique (soft dual-tone
emboss, not a single drop shadow) and shouldn't be forced into the flat elevation scale.

---

## 4. Cards — canonicalize on `mod-card`

**Decision: `.mod-card` (the "glass/modern" system) is canonical for new/rebuilt card surfaces.**

Adoption evidence from `component-patterns.md` §2: `mod-card`/`mod-chip`/`mod-inset` — **136
files**, by far the largest of the five competing systems (neumorphic 33 files, glassmorphism 56
files, doodle-modal 4 files, raw-Tailwind chat cards uncounted-but-clearly-minority). `mod-card`
is also already the pattern used across almost every `browse/`-style list page — the single
largest page category in the app (Step 5 confirmed ~86 real content pages, most of them list/browse
surfaces).

**What happens to the other four systems:**
- **Neumorphic (`neu-*`, 33 files)** — do not delete. It remains the canonical system for
  **form-adjacent, "socket/inset" surfaces specifically** (inputs, toggles, sliders) where the
  pressed/embossed metaphor communicates interactivity that a flat glass card doesn't. This is a
  deliberate two-system split, not indecision: `mod-card` for *content* containers, `neu-*` for
  *interactive control* surfaces. Fix the two conflicting token definitions first (§1, decision 1).
- **Glassmorphism (ad-hoc, 56 files)** — mostly overlaps with `mod-card`'s own blur/translucency
  approach already. Consolidate: any component using a bespoke inline `backdropFilter` style
  (e.g. `CreatePostModal`'s `blur(50px) saturate(2)`) should migrate to `.mod-card`/`.mod-modal`
  instead of inventing its own blur value.
- **Doodle-modal (4 files)** — smallest footprint, newest per its scoping. Keep it, but only for
  its actual documented purpose (the "offer-dialog family" full-route modal shell) — do not expand
  its usage; if a future modal needs this treatment, evaluate whether `mod-modal` could serve
  instead first.
- **Raw-Tailwind-color chat cards (`DealStatusCard`, `OfferCard`, `EventRsvpCard`)** —
  **must be migrated to `mod-card` + token colors during the rebuild.** This is not optional; it's
  the same violation flagged in §1. These three components are high-value (they carry the entire
  deal/offer/RSVP fulfillment UI per Step 6's commerce journeys) and currently the least
  token-compliant surfaces in the app.

---

## 5. Buttons — rebuild `Button.tsx`, informed by real usage

**Decision: `ui/Button.tsx` is a legitimate component to keep and finish, but its current variant
set does not match what's actually shipped, which is why nothing imports it.**

`component-patterns.md` §1 found the existing component has 5 variants (`primary`, `ghost`,
`danger`, `outline`, `success`) but **zero real usage sites** — every sampled domain (feed, chat,
marketplace, safety) independently built its own button styling instead. Cross-referencing the
real button treatments found across those domains against the existing variant names:

| Real treatment found | Where | Maps to |
|---|---|---|
| Gradient pill (`from-primary to-[#006F35]`, glow shadow) | `ProductForm` submit | `primary` — but the current `primary` variant's actual CSS must be checked against this gradient and corrected if it doesn't match |
| Slate/emerald/red pill triad | `DealStatusCard`/`OfferCard` | New variant needed: `contextual` (color driven by a `tone` prop: `neutral`/`success`/`danger`) rather than fixed per-variant colors |
| White-pill/red-text | `SosCountdownOverlay` Cancel | `outline` or a new `safety-cancel` variant — decide based on whether this treatment recurs elsewhere in the safety cluster once checked |
| Circular icon button, `rgba(0,0,0,0.05)` fill | `CreatePostModal` header | Needs an `icon`-only size/shape mode, not currently distinct from `outline`/`ghost` sizing |

**Process for the rebuild:** before finalizing `Button.tsx`'s variant API, do one more pass reading
every button treatment found in `component-patterns.md` plus a broader sweep of the remaining 32
`components/<domain>/` folders not sampled in that document, and derive the variant set from that
full picture — do not assume the 4 examples above are exhaustive. This spec commits to *rebuilding*
`Button.tsx` from real usage rather than either keeping it as-is (wrong, unadopted) or deleting it
(wasteful, the `forwardRef`/loading/icon-slot scaffolding is sound).

`.mod-chip`/`.mod-chip-active` (136-file adoption) remains the correct choice for pill-style
toggle/filter buttons specifically — this is a different UI concept (selection state, not action
triggering) from what `Button.tsx` should cover, and no change is needed here.

---

## 6. Modals / Sheets — canonicalize on `BottomSheetOverlay`

**Decision: `BottomSheetOverlay.tsx` (+ its `AppBottomSheet.tsx` wrapper) is canonical for
bottom-sheet UI. `BottomSheet.tsx` should be deleted, not kept as an alternative.**

Reasoning from `component-patterns.md` §4: the two components solve the identical problem and live
in the same folder with no deprecation marker on either. `BottomSheetOverlay` is described as "the
most complete" — portal rendering, real focus-trap, Escape handling, scroll lock, and a proper
drag-to-dismiss hook pair (`useBottomSheetDrag`/`useBottomSheetMount`). `BottomSheet.tsx` duplicates
the focus-trap code "nearly verbatim" using framer-motion instead — functionally redundant, not a
meaningfully different approach worth preserving as a second option.

**Every bespoke bottom-sheet reimplementation found must migrate to `BottomSheetOverlay`/
`AppBottomSheet` during the rebuild:**
- `CreatePostModal`'s manual `createPortal` + `AnimatePresence` sheet
- `SentinelBottomSheet`'s `setTimeout`-based mount/unmount
- `PostCreationSuccessSheet`'s Tailwind `animate-in` sheet

This consolidates 4 implementations into 1, per `component-patterns.md`'s fragmentation finding #3.
`LongPressMenu.tsx` (anchored popup, not a sheet) is a genuinely different UI pattern and stays
separate — but `XPostCard`'s own `PostCardActionsSheet` should be checked during implementation for
whether it can call `LongPressMenu` directly instead of maintaining a parallel code path.

**`GlassFormPage.tsx`'s full-route modal shell and `SosCountdownOverlay`'s full-screen alertdialog**
are structurally different from a bottom sheet (they replace the whole viewport, not slide up from
the bottom) and are correctly left as their own pattern — not everything needs to consolidate into
one component.

---

## 7. Forms / Inputs — canonicalize on `PremiumInput` / `PremiumTextArea` / `OTPInput`

**Decision:** these three are real, working shared primitives (`component-patterns.md` §3) — keep
them as the canonical text-entry components. The problem is adoption, not design: `ProductForm`
mixes `PremiumTextArea` for one field with a separate `glassField`/`glassLabel` className helper
for others, and `CreatePostModal` — the app's most complex form — uses neither, hand-building every
field with inline styles.

**Rebuild rule:** every new/touched form must use `PremiumInput`/`PremiumTextArea` for all text
entry, full stop — no more mixing a real component with className-string helpers within the same
form (the `ProductForm` split found is exactly the kind of inconsistency to eliminate).

**Selects:** `ui/BrowseSelect.tsx` is canonical (already solves the "must render in a portal, not
clipped inside a bottom sheet" problem correctly). `CreatePostModal`'s local `PostFormSelect`
(~150 lines, solving the identical problem independently) must be deleted and replaced with
`BrowseSelect` during the rebuild.

**Checkboxes/toggles:** no shared component exists today (confirmed gap, not a fragmentation —
nothing to canonicalize between). **New primitive to build**: a `Checkbox`/`Toggle` component
matching the neumorphic input aesthetic (`.neu-socket` inset styling), since form controls are the
category §4 assigns to the neumorphic system.

**Eliminate `window.prompt()`/`window.confirm()` — confirmed live in 8 files total**
(`component-patterns.md` §3, cross-referencing `fix-list-safety-commerce.md` #50, #53, #65 and
`fix-list-social-community.md`'s notification-adjacent findings): `OfferCard.tsx` (counter-offer
amount — a money flow), `incident-reports/[id]/PageClient.tsx`, `settings/page.tsx`,
`CommunityInfoSheet.tsx`, `CommentItem.tsx`, `DashboardCheckInsPanel.tsx`,
`LiveTrackingActivePanel.tsx`. Every one of these needs a real in-app input (a `BottomSheetOverlay`
form for the prompt cases, an in-app confirmation dialog component — new, doesn't exist yet — for
the confirm cases) during the rebuild. This is not cosmetic: three of these are money/safety-critical
flows where a native browser dialog breaking the app's visual chrome is a real trust signal problem.

---

## 8. Badges / Status Pills — build one `Badge` component

**Decision: none of the 6 existing status-to-color lookup tables becomes canonical as-is — build
one new `Badge`/`StatusPill` component that all 6 use cases migrate to.**

Unlike cards (clear adoption winner) or modals (clear completeness winner), `component-patterns.md`
§7 found no single existing badge implementation is a good template — each of the 6
(`SellerBadge`, `PostCardVerificationBadge`, `DEAL_STATUS_META`, `DealStatusCard`'s `ACTION_STYLE`,
`OfferCard`'s `STYLE`, `BadgeCard`'s rarity chips) solves a genuinely different shape problem
(icon-only vs. pill-with-text vs. pill-with-emoji), which is why none dominates by adoption the way
`mod-card` does.

**Required API surface for the new `Badge` component**, derived from the 6 real use cases so it
doesn't repeat `Button.tsx`'s mistake of being designed without reference to real usage:
- A `tone` prop (`neutral`/`success`/`warning`/`danger`/`info`) mapping to the `--status-*` tokens
  — this replaces every raw-Tailwind-color instance found.
- Support for both icon-only (verification badge) and icon+label (deal status, RSVP status)
  rendering modes.
- Support for an optional emoji prefix (seller trust tier used this; keep it as an option, not a
  default).
- A `size` prop matching at minimum the two sizes observed (compact chip vs. larger status pill).

Once built, all 6 sites migrate to it — this directly resolves `component-patterns.md`'s
fragmentation finding #4.

---

## 9. Empty / Loading / Error States — build all three as app-wide primitives

**Decision: this is a genuine gap, not a fragmentation to resolve — build net-new, using the two
existing feature-scoped components as reference implementations.**

`component-patterns.md` §6 confirms no app-wide `EmptyState`/`Skeleton`/`ErrorState` exists.
`BrowseEmptyState` (27 files) and `PostSkeleton` (feed-only) are good visual starting points but
neither is built to be domain-agnostic — 18 files hand-build their own "no results" markup outside
`BrowseEmptyState`, and 98 files use raw `animate-pulse` instead of any shared skeleton.

**Rebuild requirement, directly matching the original plan's own emphasis on states** (per the plan
pasted at the start of this project): every page needs Default/Loading/Empty/Error/Offline states
handled by three new shared primitives:
1. `EmptyState` — generalize `BrowseEmptyState`'s existing `icon`/`title`/`description`/`action`
   props to be usable outside browse-style pages (feed, chat, marketplace product grid).
2. `Skeleton` — a generic shimmer primitive (extract `PostSkeleton`'s shimmer technique, not its
   feed-specific layout) that individual features compose into their own layout shapes, replacing
   the 98 files' worth of raw `animate-pulse` divs.
3. `ErrorState` — genuinely new, nothing to extract from. Needs at minimum a retry action slot and
   distinct copy for network-error vs. permission-denied cases (relevant given
   `fix-list-safety-commerce.md` #47's finding that Incident Replay's failure state doesn't
   distinguish a 403 from a generic failure — this new component should make that distinction easy
   to get right by default).

---

## 10. Icons — keep Material Symbols as primary, formalize the `XIcons.tsx` pattern

**Decision: no consolidation needed between systems — they serve genuinely different purposes and
should both stay.**

Material Symbols (218 files) is correctly the default for "any icon, anywhere" — it's a font, so
any new icon is free to add with no build step. `lucide-react` (10 files) is correctly scoped to
chrome/utility icons in navigation components. Keep this split as-is per `component-patterns.md`
§8's own conclusion.

**Do formalize `XIcons.tsx`'s pattern going forward**: any icon that carries interactive/toggled
state (filled vs. outline, like `XLikeIcon`) should get a typed wrapper component following
`XIcons.tsx`'s contract (`size`/`filled`/`className` props), rather than inline
`fontVariationSettings` toggling repeated per call site (as currently done ad hoc in
`SentinelBottomSheet.tsx`, `LeftSidebar.tsx`, `BadgeCard.tsx`). This is a small, additive rule, not
a rebuild of the icon system.

---

## 11. Navigation Chrome — no changes needed

**Decision: `TopNav`/`BottomNav`/`LeftSidebar`/`RightSidebar` are already correct — the one category
in the entire audit needing zero canonicalization.**

`component-patterns.md` §5 calls this "the most consistent category in the whole audit": single
source of truth per component, a working `Auto*` global-mount pattern (`AutoTopNav`,
`AutoLeftSidebar`) with route-gating, and CSS-driven (not JS-media-query, not duplicated-JSX)
breakpoint adaptation. The only note carried forward is cosmetic: `BottomNav.tsx` lives in
`components/feed/` rather than `components/navigation/` — a location inconsistency worth fixing
during the rebuild's file-move pass, not a design decision.

---

## 12. Dark Mode Policy

**Decision: preserve the existing scope exactly — app shell fully dark-aware, landing/auth flows
permanently dark-themed regardless of system preference.**

`design-tokens.md` §7 confirms this is a deliberate choice (`html { color-scheme: light; }` with an
explicit code comment: "the app is forced to light theme" for the general shell, while
`.landing-page`/`.auth-*` force a permanent dark background via `!important`). This is a real,
working product decision (cinematic dark onboarding, light-default app), not an inconsistency to
resolve. The two things to actually fix during the rebuild:
- `.pwa-install-sheet`'s manual `--light` variant class should be converted to the standard `.dark`
  parent-selector pattern used everywhere else, for consistency.
- `.connect-map-pin`/`.connect-map-cluster` and `.sentinel-sheet__title`/`__sub` need real
  dark-mode coverage (the latter is also the undefined-variable bug from §1).

---

## 13. Motion / Animation

**Decision: keep the existing "Motion Design System" (`design-tokens.md` §6.1) as canonical —
it's well-designed (GPU-composited-only rule, correctly gated behind `prefers-reduced-motion`) and
needs no redesign, only a bug fix.**

**Fix required:** the duplicate `dance-*` keyframes (§1, decision + `design-tokens.md` §6.2/§8.5)
— one defined as plain `@keyframes`, one inside a `@theme` block, with different transform curves
for the same animation names. Pick one (recommend keeping the `@theme`-block version since Tailwind
v4's theme-driven approach is the more forward-compatible pattern) and delete the other.

No new easing/duration tokens are needed — the existing informal conventions (documented in
`design-tokens.md` §6) are consistent enough in practice that formalizing them as named tokens
would be process for its own sake, not a fix for a real problem found in the audit.

---

## 14. Summary — sign-off decisions (all confirmed 2026-08-28)

Everything above defaults to "most-adopted pattern wins," per the user's instruction. The
following specific calls involved deleting/replacing something rather than just formalizing an
existing winner, and were reviewed individually rather than accepted as a batch. **All five
confirmed as specified, no changes requested:**

1. **CONFIRMED — Delete `BottomSheet.tsx`**, keep only `BottomSheetOverlay`/`AppBottomSheet` (§6).
2. **CONFIRMED — Delete `CreatePostModal`'s local `PostFormSelect`**, migrate to `BrowseSelect` (§7).
3. **CONFIRMED — Migrate `DealStatusCard`/`OfferCard`/`EventRsvpCard` off raw Tailwind colors**
   onto `mod-card` + design tokens (§4, §1) — these are high-traffic, high-value components per
   Step 6's commerce journeys; proceed, but test carefully given the regression risk noted.
4. **CONFIRMED — Rebuild `Button.tsx`'s variant set** from a fuller usage sweep before finalizing
   (§5) — do the broader research pass across all 37 `components/<domain>/` folders before locking
   the variant API; the 4 examples in this document are illustrative, not exhaustive.
5. **CONFIRMED — Replace all 8 `window.prompt()`/`window.confirm()` call sites** with real in-app
   UI (§7), all 8 in one pass rather than prioritizing only the 3 highest-stakes ones. Scope the two
   new primitives (in-app confirm dialog, counter-offer form) as their own small implementation
   tasks, not bundled silently into unrelated feature work.

These five items are now approved for the implementation phase (Steps 10+) — no further
confirmation needed before acting on them when that work begins.
