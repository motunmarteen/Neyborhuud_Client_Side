# NeyborHuud Landing Page - AI Implementation Prompt

> **Context for AI Assistants:** You are building the official marketing landing page for NeyborHuud, the "Operating System for the Neighborhood". This document outlines the exact implementation plan, design system, and rules you must follow when generating code for this repository.

## 1. Product Overview
NeyborHuud is a hyperlocal safety-driven social platform combining realtime event mapping, AI-assisted local awareness (Sentinel AI), community commerce, and hyper-local communication. 

**Core URL:** The main CTA on this landing page must always link to the live app at: `https://app.neyborhuud.com/`

## 2. Implementation Blueprint & Structure
You must build a single-page marketing structure in Next.js/React that walks users through the problem, the solution, trust elements, and the CTA.

### Required Sections (in order):
1. **Hero Section:** Headline: "The Operating System for Your Neighborhood." Must include the CTA linking to `https://app.neyborhuud.com/`. Use interactive mockups/floating notifications to show the app in action (e.g., Safe Trip Check-in).
2. **The Problem:** Agitate pain points—slow emergency response, fear of online scams, and missing out on local news due to digital noise.
3. **The 4 Pillars:** 
   - *Zero-Lag Safety* (Sentinel AI)
   - *Hyperlocal Feed* (Cascading Radius)
   - *Marketplace* (Verified Neighbor Trading)
   - *100% Verified Trust* (TrustOS with NIN/BVN)
4. **Use Cases (Personas):** Show how it works for Parents (safety), Hustlers (gigs/marketplace), and everyone (staying informed).
5. **The Fortress (Security):** Highlight NDPR compliance, local data residency, and TrustOS logic to build trust.
6. **Gamification:** Explain HuudCoins and the Trust Score system.
7. **Final CTA:** A prominent push to `https://app.neyborhuud.com/`.
8. **Footer:** Secondary navigation and legal links.

## 3. Design System & Visual Guidelines
You must align the landing page strictly with the NeyborHuud PWA design language.

### Typography
- **Font Family:** `Plus Jakarta Sans` only (loaded via Google Fonts).
- **CTA Labels:** Always uppercase, heavy tracking (`font-black uppercase tracking-[0.18em] text-sm`).

### Brand Colors
You must use EXACTLY these 6 brand colors. Do not use generic Tailwind defaults (like `red-500` or `blue-400`).
- `--primary` (Neon Green): `#00D431` (Main brand, active states, CTA buttons)
- `--brand-blue`: `#0000FF` (Links, Sentinel AI themes)
- `--brand-surface`: `#E9F6E6` (Light backgrounds, card surfaces)
- `--brand-red`: `#FF0000` (SOS, danger, destructive actions)
- `--brand-green-dark`: `#006F35` (Deep accents, hover states)
- `--brand-black`: `#1A1A1A` (Primary text, near-black backgrounds)

### UI Styles & Aesthetic Pillars
- **Immersive & Spatial:** Elements float, elevate, expand, and collapse. Use overlapping elements to create depth.
- **Glassmorphism:** Use `backdrop-blur` and translucent backgrounds for floating panels, nav bars, and AI overlay mockups.
- **Claymorphism / Neumorphism:** Soft, tactile weight. Use rounded elements that feel squeezable (`rounded-2xl` or `rounded-[2.5rem]`).
- **Organic Shapes:** Soft organic shapes, nature-inspired layering, and ambient textures.
- **Animations:** Use `react-spring` or `framer-motion` for physics-based spring animations. No static hover states; use haptic-style scale effects on hover/tap. No generic spinners (use shimmer/pulse effects).

### Button System
- **Primary CTA:** `.btn-glass-primary` - Use for the "Join Now" or "Claim Address" buttons linking to the app. Must be bold, uppercase, and visually prominent.

## 4. Technical Constraints
- **Framework:** Next.js (App Router), React, standard CSS or Tailwind configured exactly to the color palette above.
- **Responsiveness:** Must be perfectly optimized for mobile screens (since the primary app is a PWA) and scale elegantly to desktop.
- **Performance:** 60fps minimum for animations. Lazy-load heavy assets/mockups.

## Final Directive
When prompted to build or update sections, ALWAYS reference the exact colors, typography, and structural guidelines in this document. Ensure every CTA directs the user to `https://app.neyborhuud.com/`.
