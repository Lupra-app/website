# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

Official marketing/landing site for Lupra, an Agent-as-a-Service platform, live at lupra.app.
Single-page site (no additional routes yet) built with Next.js App Router, TypeScript, and
Tailwind CSS v4.

## Commands

- `npm run dev` — start the dev server (Turbopack) at http://localhost:3000
- `npm run build` — production build (also type-checks via `tsc` as part of the Next build)
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, `eslint-config-next`)

There is no test suite configured.

## Architecture

- **Single page, component-composed**: `src/app/page.tsx` assembles the whole landing page from
  section components in `src/components/` in order: `Nav`, `Hero`, `HowItWorks`, `Features`,
  `EarlyAccess`, `Footer`. `src/app/layout.tsx` owns fonts, SEO metadata, and wraps everything in
  `SmoothScroll`. There's no routing/state layer beyond this.
- **Brand mark is hand-authored inline SVG, not an asset file.** The logo (open ring + indigo dot,
  gap at top-right) is redrawn as inline `<svg>` in `src/components/Logo.tsx` (static nav/footer
  version) and again in `src/components/Hero.tsx` (animated hero version, same path/circle
  coordinates). If the mark ever needs to change, update the geometry in both places — it is not
  sourced from `Brands/lupra-icon.svg` at build time; that file is just the design reference.
- **Animation stack**: GSAP + `@gsap/react`'s `useGSAP` (registered once in `src/lib/gsap.ts`,
  which also exports `prefersReducedMotion()`) for all scroll-triggered reveals, the hero's
  stroke-draw + dot-drop sequence, and the feature cards' magnetic hover (`gsap.quickTo`). Lenis
  drives smooth scrolling via `src/components/SmoothScroll.tsx`, which ticks Lenis off
  `gsap.ticker` and syncs `ScrollTrigger.update` — see that file before touching scroll behavior.
  Every animated component checks `prefersReducedMotion()` before building a timeline (Hero,
  HowItWorks, Features) and `SmoothScroll` uses `useSyncExternalStore` on the media query to
  decide whether to mount Lenis at all (not `useState`+`useEffect` — that trips the
  `react-hooks/set-state-in-effect` lint rule; keep the external-store pattern if you touch this).
- **Theming is CSS-variable-based, not `tailwind.config`**: Tailwind v4's CSS-first config means
  brand tokens (`--color-bg`, `--color-accent`, `--color-accent-light`, `--color-muted`,
  `--color-ring-faint`, `--font-heading`, `--font-body`) live in the `@theme inline` block in
  `src/app/globals.css` and are consumed as Tailwind utilities (`bg-bg`, `text-accent-light`,
  `font-heading`, etc.) throughout components. There is no `tailwind.config.ts`.
- **`BackgroundRings`** (`src/components/BackgroundRings.tsx`) renders the giant faint
  corner-cropped rings used behind the Hero, with a slow scroll-scrubbed parallax; reuse it rather
  than hand-rolling new decorative rings elsewhere.
- **Early access form is intentionally stubbed**: `EarlyAccess.tsx` only `console.log`s the
  submitted email (see the `TODO` there) — there is no `/api/early-access` route yet.
- Copy is Turkish throughout; keep new user-facing strings consistent with that (see the existing
  section components for tone/terminology).

## Brand assets (`Brands/`)

- `lupra-icon*.svg` / `lupra-lockup-*.svg` — vector logo marks (icon-only vs. full lockup) with
  light/dark variants. These are the design reference for the inline SVG mark described above, not
  something the app imports directly.
- `favicon*.png`, `favicon.ico` — favicons at multiple sizes; the ones actually wired into the app
  live under `src/app/` (`icon.png`, `apple-icon.png`, `favicon.ico`) and `public/og-image.png`.
- `app-icon-1024.png` — source app icon.
- `banner-*.png` — pre-sized social banners for LinkedIn, X, and YouTube.
- `wallpaper-*.png` — desktop and mobile wallpapers (including a "minimal" mobile variant).

## Brand assets (`Brands/`)

- `lupra-icon*.svg` / `lupra-lockup-*.svg` — vector logo marks (icon-only vs. full lockup) with
  light/dark variants
- `favicon*.png`, `favicon.ico` — favicons at multiple sizes
- `app-icon-1024.png` — source app icon
- `banner-*.png` — pre-sized social banners for LinkedIn, X, and YouTube
- `wallpaper-*.png` — desktop and mobile wallpapers (including a "minimal" mobile variant).

Treat these as the canonical brand source files — reuse them rather than regenerating logos/icons
when building out the site.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
