# Step 10 — Stitch Correction Prompt (round 2)

> Paste this into the SAME Stitch project (as a follow-up message, not a new project) to correct
> specific issues found in the first pass. Reference: the shell structure, phone-frame concept, and
> 5-slot SOS dock from the first pass are good and should stay — this is a targeted color and
> content-separation fix, not a redo.

---

## Prompt to paste into Stitch

```
Good structure overall — keep the phone-frame desktop presentation, the 5-slot bottom dock with the
centered red SOS button, and the overall drawer layout. I need three corrections:

## 1. Fix the color palette — you're missing half the brand colors and mislabeled one
The actual NeyborHuud brand system is exactly 6 colors, not 4. Rebuild the color tile with all 6,
correctly labeled:
- Primary (brand green): #00D431 — CTAs, active states, highlights
- Brand blue: #1A56FF — links, info, secondary actions, Sentinel AI
- Brand surface: #E9F6E6 — a light mint/sage background color, used for light card surfaces and
  light-mode backgrounds — this is NOT a shade of the primary green, it's its own distinct token
- Brand red: #FF0000 — RESERVED EXCLUSIVELY for SOS, danger, and destructive actions. Do not label
  this "Tertiary" and do not use it as a general accent anywhere else in the UI — only on the SOS
  button and destructive/error states.
- Brand green dark: #006F35 — deep accents, hover states, FABs
- Brand black: #1A1A1A — primary text color and near-black backgrounds (not a generic gray scale)

No other colors may appear anywhere in the shell — remove any additional grays/greens outside this
exact set.

## 2. The overall shell is too dark — it should be a light, airy app with dark accents, not an
almost-entirely-black/dark-green interface
Rebuild the mobile shell's DEFAULT light-mode appearance: light backgrounds using white and the
brand-surface color (#E9F6E6), dark brand-black (#1A1A1A) text, with the brand green (#00D431) and
brand blue (#1A56FF) used as accent colors against those light surfaces — not a dark theme
throughout. The desktop phone-frame's OUTER backdrop (the marketing panel behind the phone) can stay
dark/near-black as before — that part was correct — but the app screen INSIDE the phone frame, and
the drawer/sidebar content, should be light-mode by default.

## 3. Separate the navigation drawer from feed content — they got merged into one surface
In the "drawer open" view, the left navigation drawer should show ONLY navigation chrome: the sky
header (logo, Sentinel icon, user identity chip), the Local Huud rotating menu row, plain nav links
(My Huud, Communities, Saved), Local News row, Huud Economy row, Exchange Rates row, footer
(Settings, Help Center), and the bottom skyline silhouette. It should NOT contain actual feed posts
(no post cards, no user photos/captions like "Sarah Jenkins" or "Mike's Cafe" inside the drawer
itself) — that content belongs to the underlying feed page behind the drawer, not the drawer's own
surface. Please regenerate the drawer-open view as pure navigation chrome over a dimmed/blurred
backdrop of the feed behind it, not feed content rendered inside the drawer panel.

## Also fix
The wordmark logo in the phone-presentation view is rendering garbled/cut off with a black bar over
part of the text ("Neybor[blacked out]uud") — please regenerate it as a clean, fully legible
"NeyborHuud" wordmark.

Keep everything else from the first pass as-is: the phone-frame concept, the 5-slot bottom dock
shape and SOS prominence, the sky-gradient header concept, and the overall structural layout.
```

---

## What to bring back after this

Same as before — screenshots of the corrected views, or paste them directly into the chat.
