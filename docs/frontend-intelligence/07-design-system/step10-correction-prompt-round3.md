# Step 10 — Stitch Correction Prompt (round 3)

> Paste into the SAME Stitch project as a follow-up message. Two of the three round-2 fixes landed
> well (the light-mode standalone mobile shell, and the navigation drawer no longer containing feed
> posts) — keep both exactly as they are. This round targets only what's still wrong.

---

## Prompt to paste into Stitch

```
Good progress — the light-mode "Mobile Shell" view and the corrected navigation drawer (chrome only,
no feed posts inside it) are both exactly right now, keep those as-is. Two things from last round
still need fixing, both isolated to the "Desktop - Corrected Phone Presentation View":

## 1. The screen INSIDE the phone frame is still dark — it should match the light-mode shell you
already got right in the separate "Mobile Shell - Light Mode Default" view
Right now the phone frame still shows a near-black background with dark-green post cards inside it.
Replace the content inside the phone screen with the SAME light-mode treatment already correct in
the standalone "Mobile Shell - Light Mode Default" view: white/light backgrounds, brand-surface
(#E9F6E6) card tints, dark (#1A1A1A) text, brand green (#00D431) and brand blue (#1A56FF) as accents.
The dark backdrop OUTSIDE the phone (the marketing panel with "Designed for Mobile" and the QR code)
should stay dark as it already is — only the app screen inside the device frame needs to switch to
light mode.

## 2. The wordmark logo is still garbled
In the phone-presentation view, the top-left logo still renders as "Neybor" followed by a black bar
covering the rest of the word, instead of a clean "NeyborHuud" wordmark. Please regenerate this as
fully legible text — green "Neybor" + black or dark "Huud" (or however the brand wordmark is
supposed to split), no rendering artifacts or overlapping black boxes.

## Also
There's a small rendering glitch in the bottom-left corner of the navigation drawer image — some
raw CSS-looking text is bleeding into the visible render ("repeat-x bottom left; background-size:
contain;"). Please make sure that's not visible in the final image — it looks like a background
pattern property leaking into the rendered output instead of being applied invisibly.

Everything else — the drawer content and structure, the light-mode shell, the bottom nav capsule
with the centered red SOS button, the overall phone-frame concept — is correct, don't change it.
```

---

## What to bring back after this

Screenshots of the corrected phone-presentation view, pasted directly into the chat. If this round
lands cleanly, Step 10 (Application Shell) is essentially done and we can move to Step 11
(feature-by-feature Stitch designs).
