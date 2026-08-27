# NeyborHuud Design System Specification

> Step 8 (Design System Specification) — the decision layer on top of `design-tokens.md` and
> `component-patterns.md`. Those two documents extracted what exists; this one picks a canonical
> answer for every fragmentation point they found, with the reasoning stated so any call can be
> revisited.
>
> This is the document Stitch and any implementation agent should be given as the design
> constitution — it is deliberately opinionated where the extraction found ambiguity.

## ⚠️ Reconciliation with `pwa/DESIGN.md` (2026-08-28)

After this document's first pass and the user's initial sign-off, a pre-existing design document
was found at `pwa/DESIGN.md` (925 lines) — the team's own prior attempt at exactly this
specification, declaring itself "the single source of truth" for the current app. It was not part
of the original `docs/frontend-intelligence/` audit trail and had not been read before this
document's first draft.

**Since this is a ground-up rebuild, not a patch, the governing question was: what's the right
design system for the new frontend — not "which document wins."** Both sources were checked
against real source (`globals.css`, `component-patterns.md`'s actual file reads) and reconciled:

- **Where DESIGN.md's stated intent is confirmed correct and already real in `globals.css`**
  (the 4-variant `.btn-glass-*`/`.btn-secondary`/`.btn-ghost` button system, the neu/mod
  screen-type split, `BottomSheet.tsx` as canonical) — **DESIGN.md wins**, and this document's
  original conclusion is corrected below. DESIGN.md is the team's own deliberate intent; my prior
  "most-adopted file-count wins" heuristic was a reasonable default in the absence of a real spec,
  but a real spec beats an inferred one.
- **Where DESIGN.md's specific values are stale versus what's actually shipped** (`--brand-blue`
  is `#1A56FF` "refined cobalt" in `globals.css`, not DESIGN.md's `#0000FF`; DESIGN.md's tech
  stack names `zustand`/`@use-gesture/react`/`react-spring`, none of which are installed per
  Step 7's verified `package.json` check) — **the verified source wins**, since these are
  drift/staleness in DESIGN.md itself, not a design decision.
- **Where DESIGN.md's own roadmap (§28) claims a phase is "✅ Done" but `component-patterns.md`'s
  direct source read shows it is not** (`Button.tsx` has zero real imports despite Phase 8
  claiming a bulk button migration ran; both `mod-btn`/`neu-btn` still appear live per
  `component-patterns.md` despite being marked "migrated") — **this is flagged as an interrupted
  migration to finish during the rebuild, not evidence against DESIGN.md's intent.** The
  fragmentation `component-patterns.md` found is best understood as *drift from a plan that was
  started and abandoned partway*, not organic multi-team drift as originally described.
- **DESIGN.md contains substantial, genuinely new material this document didn't cover at all**
  (emotional design direction, the four-layered visual-design-pillar philosophy, gesture system,
  page transitions, map experience, Sentinel AI interface, SOS experience, feed-type tone,
  notification priority tiers) — **all incorporated below**, since Stitch needs this to design
  screens that feel like one product, not just to apply consistent tokens.

Sections below marked **(revised per DESIGN.md)** replace this document's original conclusion.
Sections marked **(new, from DESIGN.md)** did not exist in the first draft.

---

## 1. Color

**Canonical: the 6-color brand palette, using the current `globals.css` values (design-tokens.md
§1.1) — confirmed the more current source over `DESIGN.md`'s copy of the same table.**

| Token | Value | Use |
|---|---|---|
| `--primary` (`--neon-green`) | `#00D431` | Primary actions, brand accent |
| `--brand-blue` | `#1A56FF` | Links, informational accents, Sentinel AI |
| `--brand-surface` | `#E9F6E6` | Light backgrounds |
| `--brand-red` | `#FF0000` | Danger, SOS, destructive |
| `--brand-green-dark` | `#006F35` | Deep accents, hover states, FABs |
| `--brand-black` | `#1A1A1A` | Primary text (light mode) |

**Note on `--brand-blue`**: `DESIGN.md` documents this as `#0000FF`; `globals.css` has since
refined it to `#1A56FF` ("refined cobalt," per the file's own inline comment). This is DESIGN.md
drifting out of date on a value, not a live design decision to revisit — use `#1A56FF`.

**DESIGN.md's enforcement language is adopted verbatim** — it states this more forcefully than the
original draft of this document did, and its migration table is a direct, immediately-usable
artifact for the rebuild:

> There are exactly 6 official brand colours. No other colour may appear anywhere in the product
> UI — not Tailwind defaults, not arbitrary hex values, not social brand colours.

| Old / forbidden | Replace with |
|---|---|
| `green-400/500/600`, `#008751`, `#059669` | `primary` / `brand-green-dark` |
| `blue-400/500/600`, `#4A90D9`, `#3b82f6` | `brand-blue` |
| `red-400/500/600`, `#E74C3C`, `#ef4444` | `brand-red` |
| `gray-*`, `slate-*`, `#64748B`, `#94A3B8` | `var(--neu-text-muted)` or `var(--neu-text-secondary)` |
| `purple-*`, `#8E6FBF`, `#9F7AEA`, `#8b5cf6` | `brand-blue` |
| `amber-*`, `orange-*`, `#F5A623`, `#f59e0b` | `primary` |
| `cyan-*`, `#00C2FF` | `brand-blue` |

This table directly targets every off-brand hardcoded color `design-tokens.md` §8 found still
live in `globals.css` itself (the slate scale, `#4a90d9`/`#f5a623`, `#e53935`, `#92400e`,
`#b8f0ff`) — those are not new findings requiring a new decision, they're exactly what this
pre-existing migration table already prescribes fixing.

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

## 2. Typography **(revised per DESIGN.md — a real conflict found and resolved)**

**Conflict found**: `globals.css` defines an 8-step named scale (`--text-caption` 9px through
`--text-display` 26px, `design-tokens.md` §2.2). `DESIGN.md` §5 independently defines a
*different*, simpler 8-step scale mapped directly to Tailwind's default utilities
(`text-xs`=12px through `text-3xl`=30px), with no reference to the `--text-*` custom properties at
all. Both are real, both are 8 steps, and they don't line up (9/10/12/13/15/17/20/26 vs.
10/12/14/16/18/20/24/30).

**Decision: adopt DESIGN.md's scale as canonical for the rebuild.** Reasoning: it maps directly
onto Tailwind's own default type scale (`text-xs`/`text-sm`/`text-base`/`text-lg`/`text-xl`/
`text-2xl`/`text-3xl`), which means every size is usable with zero custom CSS and works correctly
with Tailwind's `rem`-based font scaling out of the box (a real accessibility requirement DESIGN.md
§24 states explicitly: "Font scaling — Respect system font size — use `rem` units"). The
`--text-*` custom-property scale in `globals.css` requires either a `.type-*` utility class or a
raw `var()` call, both of which `design-tokens.md` §2.3 found are barely used in practice anyway —
so canonicalizing on the scale nobody has to opt into (Tailwind's own defaults) removes the
adoption problem entirely rather than trying to fix it through discipline.

| px | Tailwind class | Usage |
|---|---|---|
| 10px | `text-[10px]` | Badges, timestamps, micro labels |
| 12px | `text-xs` | Secondary captions, helper text |
| 14px | `text-sm` | Body text, list items, input values |
| 16px | `text-base` | Default body, card descriptions |
| 18px | `text-lg` | Section headings, card titles |
| 20px | `text-xl` | Modal titles, page sub-headings |
| 24px | `text-2xl` | Page titles (mobile) |
| 30px | `text-3xl` | Hero text, onboarding titles |

The old `--text-*`/`.type-*` system in `globals.css` should be treated as deprecated during the
rebuild, not extended further.

**CTA label style, always** (from DESIGN.md §5, a concrete rule the original draft didn't have):
```
font-black uppercase tracking-[0.18em] text-sm
```

Font family stays `Plus Jakarta Sans` (confirmed loaded via `next/font`, token `--font-jakarta`)
with Material Symbols self-hosted for icons — locate and preserve the `next/font` loader call in
whatever layout file injects `--font-jakarta` when the rebuild touches the root layout. Weight
convention unchanged from the original draft: numeric weights, no token, 800/900 dominant for
headings/brand/emphasis. Headings must use semantic HTML (`h1`/`h2`/`h3`), not large text on
`div`s — body copy is `font-normal`/`font-medium`, never `font-bold` for long paragraphs (both
DESIGN.md §5 rules, adopted as-is).

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

## 4. Cards **(revised per DESIGN.md — the split is by screen type, not by content-vs-control)**

**Decision: two systems stay — `neu-*` and `mod-*` — split by screen type per DESIGN.md §10's
explicit rule, not by content-vs-control as the original draft proposed.**

> Three surface systems exist. **Never mix them on the same screen.**
> - **Neumorphic (`.neu-*`)** — light screens, onboarding, auth
> - **Modern Glass (`.mod-*`)** — feed, dark screens

This is a real, deliberate, already-declared product decision (not something inferred from file
counts) and is adopted as canonical over the original draft's "mod-card for content, neu for
controls" split, which was a reasonable inference in the absence of a real spec but is now
superseded by one. The practical difference: a single screen like `/marketplace/create` (light,
form-heavy, onboarding-adjacent) should be **entirely** `neu-*` — its cards, inputs, and buttons
all pull from the same embossed-surface family — while `/feed` should be **entirely** `mod-*`.
This is a stricter, more valuable rule for Stitch specifically, since it means "which system for
this screen" becomes a single decision made once per screen rather than a per-component judgment
call that can go inconsistent within one screen.

**A third system exists for auth specifically** (DESIGN.md §10, "Auth — landing-aligned flows"):
`AuthFlowPage`/`auth-btn-*` shared primitives (`AuthFlowBackdrop`, `SignupBottomSheet`,
`AuthFlowHero`, `AuthSheetStageHeader`, `AuthFlowLoading`), used on `/login`, `/signup`,
`/forgot-password`, `/reset-password`, `/verify-email`, the post-auth gates
(`/pick-community`, `/verify-location`, `/complete-profile`, `/setup-complete`), and `/info/*`
legal pages. This is consistent with `design-tokens.md` §7.3's independent finding that
`.landing-*`/`.auth-*` are permanently dark-themed regardless of system preference — the auth
system is its own third visual family by design, not a stray variant of `neu`/`mod`. Session
routing for these pages goes through `authService`/`apiClient`/`authSession.ts`, never raw
`fetchAPI` (DESIGN.md's own engineering rule, worth preserving).

**Fix the two conflicting `--neu-*` token definitions first** (§1, decision 1) before treating
`neu-*` as ready to use everywhere it's now scoped to.

**Doodle-modal (4 files)** — keep, scoped only to its documented purpose (the "offer-dialog
family" full-route modal shell). This wasn't addressed by DESIGN.md directly; the original
draft's conclusion (keep, don't expand) stands.

**Raw-Tailwind-color chat cards (`DealStatusCard`, `OfferCard`, `EventRsvpCard`)** — still must
migrate off raw Tailwind colors during the rebuild (§1's token-compliance rule applies
regardless of which surface system a screen uses), but now the target is whichever of `neu-*`/
`mod-*` the *screen* they live on (the chat conversation view) is assigned to under the new
screen-type rule — chat is a feed-adjacent, real-time, socket-driven surface, so **`mod-*`** is
the correct target, not a case-by-case choice.

**Card interaction rule (new, from DESIGN.md §10)**: all card variants must respond to touch —
`active:scale-[0.98]` plus a spring animation via Framer Motion. "Cards should feel alive, not
static." This applies regardless of which of the three systems a card belongs to.

---

## 5. Buttons — wire `Button.tsx` to the 4 already-built `.btn-glass-*` classes

**⚠️ Revised 2026-08-28 after DESIGN.md reconciliation — this REVERSES the original decision below
(kept struck through for record; do not implement the struck-through version).**

DESIGN.md §8 declares a closed 4-variant button system — `.btn-glass-primary` (single most important
action per screen, `font-black uppercase tracking-[0.18em] text-sm text-white`, full-width on
mobile), `.btn-glass-danger` (destructive/emergency only), `.btn-secondary` (supporting action),
`.btn-ghost` (lowest emphasis) — and explicitly deprecates `mod-btn`, `neu-btn`, and raw
`bg-primary`/`bg-red-500` Tailwind buttons.

**Verified against source, not taken on DESIGN.md's word alone:**
- All 4 classes are real and fully built in `globals.css` (`.btn-glass-primary`/`.btn-glass-danger`
  at lines 6692-6791, `.btn-secondary` at 6793-6835, `.btn-ghost` at 6837-6856) — not aspirational.
- Adoption check (`grep -rl` across `pwa/src`, 2026-08-28): `btn-secondary` in 11 files, `btn-ghost`
  in 5 files, `mod-btn` in **0** files, `neu-btn` in **0** files. The deprecation of the two old
  systems is genuinely complete — DESIGN.md's roadmap claim holds up here, unlike some of its other
  "✅ Done" claims. `btn-glass-primary` (1 file) and `btn-glass-danger` (0 files) are real but barely
  adopted yet — this is an **interrupted migration to finish**, not evidence the system is wrong.

**Revised decision: `ui/Button.tsx` should be rebuilt as a thin wrapper over these 4 existing CSS
classes (`variant: 'primary' | 'danger' | 'secondary' | 'ghost'`), not given a new variant set
invented from usage patterns.** This is narrower and less work than the original plan — the design
decisions (color, weight, casing, tracking, per-screen "max one primary" rule) are already made and
already partially shipped; the job is finishing adoption, not designing.

- The `contextual`/tone-driven variant idea (from the original draft, for `DealStatusCard`/
  `OfferCard`'s slate/emerald/red triad) is still needed but should be layered as a `tone` prop
  *on top of* `.btn-secondary`/`.btn-glass-danger`, not as a fifth independent CSS system.
- The `icon`-only circular treatment (`CreatePostModal` header) is a `size`/`shape` prop, same as
  originally planned — orthogonal to which of the 4 variants is used.
- Finish migrating every remaining `btn-glass-primary`/`btn-glass-danger` candidate (any primary CTA
  or destructive action not yet on these classes) as part of the rebuild, per DESIGN.md's explicit
  "NOT acceptable" list (no raw `bg-primary`/`bg-red-500` buttons, no bare `mod-btn`/`neu-btn`).

`.mod-chip`/`.mod-chip-active` (136-file adoption) remains correct for pill-style toggle/filter
buttons — a different UI concept (selection state, not action triggering) — unaffected by this
revision.

<details>
<summary>Original 2026-08-28 decision (superseded, kept for record)</summary>

Decision: `ui/Button.tsx` is a legitimate component to keep and finish, but its current variant
set does not match what's actually shipped, which is why nothing imports it. `component-patterns.md`
§1 found the existing component has 5 variants (`primary`, `ghost`, `danger`, `outline`, `success`)
but zero real usage sites — every sampled domain independently built its own button styling instead.
The plan was to derive an all-new variant set from a fuller cross-domain usage sweep before
finalizing `Button.tsx`. This is superseded because DESIGN.md already specifies (and `globals.css`
already implements) a closed, deliberate 4-variant system — no new sweep-derived variant set should
be invented when a real, partially-adopted canonical system already exists.

</details>

---

## 6. Modals / Sheets — canonicalize on `BottomSheet.tsx`

**⚠️ Revised 2026-08-28 after DESIGN.md reconciliation — this REVERSES the original decision below,
and also REVERSES confirmed sign-off decision #1 in §15 (original: "delete `BottomSheet.tsx`"). This
specific reversal must be flagged back to the user before implementation — see the note at the end of
this section.**

DESIGN.md §14 specifies bottom sheets as "a core interaction pattern for the platform — not a
fallback," with a 4-point snap system (Peek 25vh / Half 50vh / Expanded 90vh / Full 100vh),
finger-drag with spring physics, rubber-band stretch near limits, and progressive background blur —
used across at least 9 surfaces (comments, event previews, incident details, marketplace previews,
Sentinel AI, map point details, profile previews, contextual actions, notification details).

**Checked directly against both components' actual code, not assumed from either document:**
- `BottomSheet.tsx` (`components/ui/BottomSheet.tsx:3,11,22,25`) uses Framer Motion drag
  (`useDragControls`, `PanInfo`) with a **configurable numeric `snapPoints` prop**
  (`snapPoints?: number[]`, defaulting to `[0.55, 0.92]`) — the same snap-point *concept* DESIGN.md
  specifies, already partially there (2 of the 4 target points), just needing the prop extended to
  `[0.25, 0.5, 0.9, 1.0]` and spring/rubber-band tuning to match §14's behavior rules.
- `BottomSheetOverlay.tsx` (+ `useBottomSheetDrag` hook) has **no snap-point concept at all** — it's
  a single-position dismiss-on-drag sheet, not a multi-stop one.

**Revised decision: `BottomSheet.tsx` is canonical, extended to implement the full 4-point snap
system from DESIGN.md §14. `BottomSheetOverlay.tsx`/`AppBottomSheet.tsx` should be deleted instead —
the reverse of the original call — with their genuinely good parts (portal rendering, focus-trap,
Escape handling, scroll lock from `component-patterns.md` §4) ported into `BottomSheet.tsx` rather
than lost.** This is a "most-adopted" exception: `BottomSheetOverlay` was originally preferred for
being more complete on accessibility plumbing, but DESIGN.md's explicit multi-snap-point requirement
is a real product behavior that only `BottomSheet.tsx`'s architecture already supports — completeness
on one axis (a11y) doesn't outrank correctness on the axis that actually matters here (the sheet must
snap to 4 heights, which only one of the two candidates is built to do).

**⚠️ Flag back to user:** this reopens confirmed sign-off decision #1 (§15), which said the opposite
(delete `BottomSheet.tsx`, keep `BottomSheetOverlay`). Do not treat this reversal as approved for
implementation the way the original 5 decisions were — surface it explicitly and get a fresh
confirmation before any deletion happens.

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

## 11. Navigation Chrome — no changes needed, but ⚠️ one safety-relevant conflict flagged

**Decision: `TopNav`/`BottomNav`/`LeftSidebar`/`RightSidebar` are already correct — the one category
in the entire audit needing zero canonicalization.**

`component-patterns.md` §5 calls this "the most consistent category in the whole audit": single
source of truth per component, a working `Auto*` global-mount pattern (`AutoTopNav`,
`AutoLeftSidebar`) with route-gating, and CSS-driven (not JS-media-query, not duplicated-JSX)
breakpoint adaptation. The only note carried forward is cosmetic: `BottomNav.tsx` lives in
`components/feed/` rather than `components/navigation/` — a location inconsistency worth fixing
during the rebuild's file-move pass, not a design decision.

**⚠️ Real conflict found during DESIGN.md reconciliation (2026-08-28), NOT auto-resolved —
needs user input:** DESIGN.md §13a specifies a 5-tab dock (Home / Sentinel AI / **SOS — centered,
elevated, always red, always accessible** / Messages / Profile), with SOS getting its own dedicated,
permanently-visible tab and a long-press-for-silent-SOS gesture on that tab specifically. Checked
directly against `components/feed/BottomNav.tsx`: the real, shipped tab list is **6 tabs — Home /
Search / Sentinel / Connect / Gist / Profile** (`BottomNav.tsx:83-88`) — there is no SOS tab at all
(confirmed via grep, zero matches for "sos" in the file), no Messages tab, and the 600ms long-press
gesture DESIGN.md assigns to SOS is actually wired to the **Sentinel** tab, triggering Fake Call
(`BottomNav.tsx:63-69`), not SOS.

This is different in kind from the Button/Modal conflicts above — those were "which existing
component is more complete," resolvable from source alone. This one is safety-critical (SOS
reachability) and the two documents describe materially different navigation structures, not just
different implementations of the same idea. **Not resolving this unilaterally.** Two real
possibilities: (a) DESIGN.md's 5-tab/dedicated-SOS-button spec is the intended direction and the
current 6-tab dock is the thing that needs to change in the rebuild, or (b) the current 6-tab
structure (with SOS reachable via the existing `SosContext`/global SOS entry points documented in
`architecture-spec.md`, not the bottom dock) is the real, deliberate design and DESIGN.md's §13a is
stale/aspirational like several of its other roadmap claims. Needs explicit user direction before
this section can be finalized — everything else in this section (no changes needed to Top/Left/Right
nav) stands regardless of how this is resolved.

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

**Reconciled against DESIGN.md §23 (2026-08-28):** its dark-mode token table (`#0D1A0F` background,
`#132218` surface, `#0A1209` surface-base, `#1E3A22` border, `#8FBC8F` text-secondary) was checked
directly against `globals.css` (`--background-dark`/`--surface-dark`/`--surface-base-dark`/
`--border-dark`/`--text-secondary-dark`, lines 60-65, duplicated at the `@theme` block lines
147-153) — **values match exactly, no conflict.** No changes needed to this section from the
reconciliation.

**Also resolved by DESIGN.md §24 (Accessibility) — the focus-ring bug flagged in
`design-tokens.md` §8:** two conflicting global `*:focus-visible` rules exist in `globals.css`
(line 5343: `outline: 2px solid #00D431`, green; line 7674: `outline: 2px solid var(--brand-blue)`,
blue) — the second silently wins in practice via cascade order since it's defined later in the same
file. DESIGN.md §24 states explicitly: "Focus rings — `*:focus-visible` outlines set to `#00D431`
in `globals.css`," confirming the **green rule (line 5343) is the intended one**. Fix for the
rebuild: delete the later blue rule at line 7674; it's the unintended override, not the other way
around.

---

## 13. Motion / Animation

**Decision: keep the existing "Motion Design System" (`design-tokens.md` §6.1) as canonical —
it's well-designed (GPU-composited-only rule, correctly gated behind `prefers-reduced-motion`) and
needs no redesign, only a bug fix.**

**Fix required:** the duplicate `dance-*` keyframes (§1, decision + `design-tokens.md` §6.2/§8.5)
— one defined as plain `@keyframes`, one inside a `@theme` block, with different transform curves
for the same animation names. Pick one (recommend keeping the `@theme`-block version since Tailwind
v4's theme-driven approach is the more forward-compatible pattern) and delete the other.

**Reconciled against DESIGN.md §22 (2026-08-28):** it supplies the concrete duration/easing
guidance the original decision said wasn't needed — this was too hasty; DESIGN.md's numbers are
specific enough to be worth formalizing as the rebuild's actual convention, not just "informal":
- **Durations:** micro 100-150ms (button presses, toggles), standard 200-300ms (sheet/modal
  open-close, card transitions), cinematic 400-600ms (page transitions, onboarding).
- **Spring physics over ease curves** for all interactive motion (drag, press, sheet drag) —
  matches `design-tokens.md`'s existing GPU-composited-only rule, additive not conflicting.
- **`transform`/`opacity` only** — never animate `top`/`left`/`width`/`height`/`padding`/`margin`;
  never `transition: all`. This is a stricter, more explicit version of the existing informal rule
  and should be adopted as a hard lint-able rule during the rebuild, not left informal.
- **`animate-ping` reserved for SOS/emergency only** — never decorative. Worth calling out
  explicitly since it's an easy rule to accidentally violate (any developer reaching for a generic
  "pulse" effect might grab `animate-ping` without knowing it's semantically reserved).

Revised conclusion: adopt DESIGN.md §22's duration tiers and hard `transform`/`opacity`-only rule
as named, documented conventions (not necessarily new CSS custom properties/tokens — Tailwind
arbitrary values or utility classes are sufficient) — the original "no new tokens needed" call
stands, but "no formalized guidance needed" was wrong.

---

## 14. Protected Feature — Feed Ambient Sky-Hero (weather + time driven)

**⚠️ This is a signature, must-preserve feature per explicit user instruction (2026-08-28): "there is
a design in the feed page that changes when weather changes, that changes when time changes, in the
hero of this project. I want you to retain the design idea, this is one of the projects beauty that I
still want to remain." This section exists to make sure the rebuild cannot accidentally lose or
genericize it — do not simplify, flatten, or drop any of the mechanics below without explicit
user sign-off.**

### What it is

The feed's hero area is not a static banner — it's a live ambient scene that changes in real time
along two independent axes, combined into one rendered theme:

1. **Time of day**, recomputed every 60 seconds (`FeedSkyHero.tsx`, `setInterval(60_000)` driving
   `getTimePeriod(currentHour)`), producing named periods (at minimum morning/day/evening/night, per
   `isDark = timePeriod === 'night' || timePeriod === 'evening'`).
2. **Live weather**, via `useAmbientWeather()` and converted through `wmoToAmbient(weather.wmoCode)`
   (WMO weather codes are the wire format from the weather API).

Both axes feed into a single `getSkyTheme(timePeriod, ambientWeather)` call (sourced from
`components/navigation/AmbientProfileCard.tsx`) that returns one `SkyTheme` object driving every
visual: `skyGradient`, `horizonGlow`, `showStars`/`showClouds`/`showRain`/`showSnow`/`showFog` flags,
`celestialSize`/`celestialColor`/`celestialGlow`/`isMoon`, `cloudColor`, `silhouetteColor`, `textColor`.
This is the core idea to preserve: **one theme function, driven by two live inputs, fans out to every
visual layer** — not a set of independently-hardcoded weather states.

### Rendered layers (bottom to top)

- **Sky gradient background** (`skyGradient`) — the base color wash for the current time/weather combo.
- **Horizon glow** (`horizonGlow`) — a secondary light effect near the bottom of the hero.
- **City silhouette** (`<CitySilhouette color={theme.silhouetteColor} />`) — a skyline shape tinted per-theme.
- **Stars** (`Stars` sub-component) — 30 stars at deterministic (not `Math.random()`) index-based
  positions, each twinkling via the `ambient-twinkle` keyframe; only rendered when `showStars` is true
  (night/clear conditions).
- **Celestial body** (`CelestialBody`) — renders sun or moon (`isMoon` flag) with glow rings, size
  (`celestialSize`), color (`celestialColor`/`celestialGlow`), and moon-specific crater details;
  animated via the `ambient-pulse` keyframe.
- **Clouds** (`CloudShape`/`AnimatedClouds`) — 3 clouds, colored per-theme (`cloudColor`), animated via
  `ambient-float`; gated by `showClouds`.
- **Weather particles** (`SkyWeatherEffects.tsx`, composed in as `size="hero"`) — rain (`SkyRainDrops`),
  snow (`SkySnowflakes`), fog (`SkyFogMist`), each independently gated by its own `show*` flag and
  early-returning `null` when no weather flag is set. Rain renders as angled linear-gradient streaks
  with light/dark variants; snow as glowing circles drifting horizontally via a `--snow-drift` CSS
  custom property; fog as 3 layered mist divs. Particle counts are size-tiered (`hero`: 25
  rain/32 snow; `compact`: 14/18; `mini`: 10/14) and positions are deterministic pseudo-random
  (index-based modulo arithmetic, memoized) — reproducible layout, not re-randomized every render.
- **Text content** — personalized greeting (`getGreeting`) and an expressive, weather-aware line
  (`getExpressiveWeatherLine`) that references the user's own neighborhood name (via
  `useHuudDisplayName`), colored using the theme's `textColor` so it stays legible against whichever
  sky is currently showing. An optional 3-day forecast can also display here. A `WeatherText`
  sub-component auto-detects text overflow and marquees the condition text when it doesn't fit.
- **Composer placeholder** — a typewriter-animated cycle through 8 prompts (45ms type / 22ms delete /
  2200ms pause-full / 300ms pause-empty timing, with auto-scroll and a blinking cursor) sits inside the
  hero as the entry point into posting.
- **`below` slot** — `FeedSkyHero` accepts a `below` prop so other content (ticker, Sentinel AI
  surface) can render visually *inside* the sky atmosphere rather than breaking out of it into a plain
  white/dark panel below.

### Reuse beyond the feed hero

The same theme engine and particle system are deliberately shared, not feed-exclusive:
- `components/ambient/SkyWeatherEffects.tsx` exposes a `variant` prop (`'contained'` vs `'column'`,
  the latter using distinct `ambient-rain-sidebar`/`ambient-snow-sidebar` animations and its own
  particle counts) specifically so a narrow vertical surface can host the same weather effects.
- `components/navigation/SidebarSkyHeader.tsx` and `components/navigation/AmbientProfileCard.tsx` both
  consume the same `getTimePeriod`/`getSkyTheme` engine for a profile-card/sidebar presentation.

**Rebuild rule:** keep this as one shared theme engine + reusable particle-layer component consumed by
multiple surfaces (feed hero, sidebar header, profile card) — do not fork it into per-surface
reimplementations. If the rebuild changes visual language (new color tokens, new card system), the sky
engine's *output* (gradients, particle colors, silhouette color) should be re-themed to match, but the
mechanic itself — live time + live weather → one theme → multi-layer render — must remain intact.

### Also protected: News and Forex (added 2026-08-28, per explicit user instruction)

The user separately confirmed: *"Are you also aware of the news and forex feature that we have,
please retain them as well but I dont knw whow you will place them"* — both are confirmed
must-preserve, verified directly from source below, with a placement recommendation for the rebuild.

**News** — local/community news, route `/local-news` (`app/(app)/local-news/page.tsx`, 458 lines),
tabs for Nigeria/International/Huud Gist driven by URL query params, plus `/local-news/[id]` article
detail and `/local-news/gist/[id]` thread detail. Main row component `components/news/
NewsArticleRow.tsx`: thumbnail, source chip, date, title, snippet, external link — styled with
`mod-*` classes (`mod-card`/`mod-inset`/`mod-chip`) plus `var(--neu-text*)` variables, consistent with
§4's "mod-* for feed-adjacent content" split. Data comes from `services/news.service.ts`
(`/news/articles` server-parsed RSS, with a client-side raw-XML `DOMParser` fallback via
`/news/feed?source=`) — no dedicated hook, called directly from the page. Notable: infinite-scroll
Huud Gist pagination, `mod-inset animate-pulse` skeletons during load (relevant to §9's skeleton
consolidation — this is one more site that should adopt the new shared `Skeleton` primitive rather
than keep its own `animate-pulse` usage).

**Forex** — not a standalone page; a live exchange-rate widget appearing in **three places**, all
sharing one data source (`hooks/useExchangeRates.ts`, no backend call — fetches directly from public
APIs with 3-provider fallback and a hardcoded final fallback, refetches every 30 min, NGN-per-USD/GBP/
EUR/JPY/CNY):
1. `components/news/NewsFxStrip.tsx` — header strip atop `/local-news`, horizontally scrollable pill
   row, own `.news-fx-strip__*` CSS family (`globals.css:8400-8527`).
2. `components/feed/FeedNewsTicker.tsx` — marquee embedded inside `FeedSkyHero`'s `below` slot on the
   feed page (`app/(app)/feed/page.tsx:430-436`) — i.e. **already living inside the protected sky-hero
   atmosphere described above**, interleaving 3 headlines : 1 FX rate, true CSS marquee (350s linear,
   pauses on hover/touch, respects `prefers-reduced-motion`), own `.feed-news-ticker__*` glassmorphism
   family (`globals.css:8532-8627`).
3. `components/navigation/SidebarFxWidget.tsx` — rotating single-rate display in `LeftSidebar`
   (cross-fades every 3s), reuses `left-sidebar__link-sub--rotate` rather than its own CSS family.

**Placement recommendation for the rebuild:** keep all three anchor points as-is rather than
consolidating into one location — they're serving three different jobs, not three copies of the same
one: the ticker is ambient/incidental (glanceable inside the feed hero, matching that surface's
"living scene" character and reusing its `below`-slot mechanism), the strip is contextual (foregrounded
specifically on the news page where currency context is directly relevant to Nigeria/International
business stories), and the sidebar widget is persistent/peripheral (always-available on desktop/wide
layouts without needing its own screen real estate). This mirrors the sky-hero's own reuse pattern
(§14 above: one engine, multiple surface-appropriate presentations) — same principle applies here:
one data hook (`useExchangeRates`), three presentation components, each kept. The one real
consolidation opportunity is styling, not placement: `.news-fx-strip__*` and `.feed-news-ticker__*`
are two independent bespoke CSS families for visually related content (a currency pill/badge) — during
the rebuild, derive both from one shared `FxRateBadge`/`FxPill` primitive (following the same
"formalize a typed wrapper" approach as §10's `XIcons.tsx` rule) rather than keeping two parallel
hand-rolled implementations, while leaving `SidebarFxWidget`'s existing rotation styling alone since it
already reuses shared sidebar classes.

---

## 15. Summary — sign-off decisions

Everything above defaults to "most-adopted pattern wins," per the user's instruction. The
following specific calls involved deleting/replacing something rather than just formalizing an
existing winner, and were reviewed individually rather than accepted as a batch.

**⚠️ Decision #1 REOPENED 2026-08-28** after the `pwa/DESIGN.md` reconciliation pass found that
`BottomSheet.tsx` (not `BottomSheetOverlay.tsx`) is the component actually capable of DESIGN.md's
required 4-point snap system — see §6 for the full verified reasoning. This decision needs a fresh
user confirmation before implementation; it is NOT currently approved. Decisions #2-5 are unaffected
by the DESIGN.md reconciliation and remain approved as originally confirmed 2026-08-28:

1. **⚠️ REOPENED, NOT CURRENTLY APPROVED — originally "delete `BottomSheet.tsx`, keep only
   `BottomSheetOverlay`/`AppBottomSheet`"; §6 now recommends the reverse** (keep/extend
   `BottomSheet.tsx`, delete `BottomSheetOverlay`/`AppBottomSheet`) to satisfy DESIGN.md's 4-point
   snap requirement. Needs explicit user re-confirmation before implementation.
2. **CONFIRMED — Delete `CreatePostModal`'s local `PostFormSelect`**, migrate to `BrowseSelect` (§7).
3. **CONFIRMED — Migrate `DealStatusCard`/`OfferCard`/`EventRsvpCard` off raw Tailwind colors**
   onto `mod-card` + design tokens (§4, §1) — these are high-traffic, high-value components per
   Step 6's commerce journeys; proceed, but test carefully given the regression risk noted.
4. **CONFIRMED, SCOPE NARROWED 2026-08-28 — wire `Button.tsx` to the 4 existing `.btn-glass-primary`/
   `.btn-glass-danger`/`.btn-secondary`/`.btn-ghost` CSS classes** rather than inventing a new variant
   set from a usage sweep — see §5's reconciliation. The underlying "finish `Button.tsx`, don't delete
   it" call is unchanged; only the source of the variant API changed (DESIGN.md's already-built
   4-class system instead of a from-scratch sweep).
5. **CONFIRMED — Replace all 8 `window.prompt()`/`window.confirm()` call sites** with real in-app
   UI (§7), all 8 in one pass rather than prioritizing only the 3 highest-stakes ones. Scope the two
   new primitives (in-app confirm dialog, counter-offer form) as their own small implementation
   tasks, not bundled silently into unrelated feature work.

Decisions #2, #3, #5 (and #4 in its narrowed form) are approved for the implementation phase
(Steps 10+) — no further confirmation needed before acting on them. **Decision #1 is the one
exception and must be re-confirmed with the user before any `BottomSheet*` deletion happens.**

---

## 16. Tech Stack — resolving DESIGN.md §26 against verified `package.json`

**Conflict:** DESIGN.md §26 names the stack as including **Zustand** (state management),
**`@use-gesture/react` + `react-spring`** (gesture system), and **Mapbox GL JS or MapLibre GL JS**
(maps). Checked directly against `pwa/package.json` (2026-08-28): `zustand`, `@use-gesture/react`,
`react-spring`, and `mapbox-gl` are **not installed**. What is actually installed and in real use:
`@tanstack/react-query` (server state — already confirmed canonical, `architecture-spec.md`),
`framer-motion` (animation — already confirmed canonical, §13), `maplibre-gl` (maps — the "or
MapLibre" half of DESIGN.md's either/or is the one that's real), `socket.io-client` (real-time,
wrapped by the `socketService` singleton per `architecture-spec.md`).

**Resolution, following the same "interrupted migration" framing already applied elsewhere in this
reconciliation:**
- **State management:** Zustand is **not adopted** — treat DESIGN.md's naming of it as
  aspirational/never-started, not as an interrupted migration to finish. React Query already
  correctly covers server state, and `architecture-spec.md` already found Context is the deliberate,
  working pattern for the 8 app-wide client-state cases (`SosContext`, `GuardianAlertsContext`,
  etc.). Introducing Zustand now would mean adding a second, redundant state-management dependency
  with no real migration debt driving it — **do not adopt Zustand for the rebuild.** If a genuine
  need for shared client state beyond Context's current 8 cases emerges during implementation,
  evaluate it then against what actually exists, not against this stale spec line.
- **Gesture system:** `@use-gesture/react`/`react-spring` are also not installed, but unlike
  Zustand, DESIGN.md's Gesture System (§12) describes real, specific, still-needed product behavior
  (swipe feed-tab switching, long-press contextual menus, pull-to-refresh, drag) that the app
  genuinely doesn't have a dedicated system for yet today — this is a real gap, not a redundant
  addition. Since `framer-motion` is already the installed, canonical animation library (§13) and
  natively supports drag (`useDragControls`, already used by `BottomSheet.tsx` per §6),
  **pan/press gestures (`whileTap`, `whileDrag`)**, do not add a second animation/gesture library
  for this. Build the gesture system on Framer Motion's own gesture primitives instead of adopting
  `@use-gesture/react` + `react-spring` — same physics-based feel DESIGN.md asks for, zero added
  dependency surface.
- **Maps:** no real conflict — DESIGN.md already frames this as an "or," and `maplibre-gl` is the
  half that's actually installed and in use. Canonical as-is.

This section exists so the rebuild's dependency choices are traceable to a verified decision rather
than silently drifting from either document.
