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
- **Early access form is live**: `EarlyAccess.tsx` POSTs to `/api/early-access`, which rate-limits
  by IP and inserts into Supabase. Duplicate emails (`23505`) are treated as success — the visitor
  is on the list either way.

## Accounts (`src/app/(auth)/`, `src/app/profil/`)

- **Two user classes, one auth system.** Anyone can sign up (GitHub, Google, or email+password)
  at `/kayit`; `/giris` is the single sign-in page. Being an *admin* is a separate question,
  answered only by the `admin_users` allowlist. `requireUser()` gates `/profil`, `requireAdmin()`
  gates `/admin` — never substitute one for the other. `UserSession.isAdmin` exists to show the
  "Yönetim paneli" link and must not be used to make an authorization decision.
- **`/auth/callback` no longer signs anyone out.** It used to, because the only accounts were
  admin accounts. With public signup that logic would eject every new user on the spot.
- **Profile writes never accept a user id from the client.** Every action in
  `src/app/profil/actions.ts` targets `session.userId` from `requireUser()`. Same for avatar
  uploads: the storage path is built from the session id, so one user cannot overwrite another's
  file. `src/lib/profile-data.ts` takes a `userId` parameter and callers must only ever pass the
  session's.
- **Email confirmation is ON in Supabase** (`mailer_autoconfirm: false`), so `signUp()` returns a
  user but *no session* — the signup form has to end on a "check your email" screen. The built-in
  Supabase mailer is heavily rate-limited; production needs real SMTP.
- **Auth errors are deliberately vague.** "Wrong email or password" rather than "no such user",
  and password reset always reports success — otherwise the form becomes a way to enumerate which
  addresses have accounts.
- `scripts/auth-security-test.mjs` creates a real non-admin user, signs in for real, and asserts
  that session cannot reach any `/admin` route. Run it after touching auth.

## Admin panel (`src/app/admin/`)

- **Reads go through the service-role key, not the user's session.** All four tables have RLS
  enabled with **no policies**, which is deliberate: nothing but the service-role key can touch
  them. Postgres denies by default and PostgREST reports that denial as an *empty result, not an
  error* — so reading with the anon client silently returns `[]` and every error state stays
  quiet. That exact bug left the panel showing zeros for weeks. Never read admin data with
  `getSupabaseServer()`.
- **Two files own all authorization and data access:**
  - `src/lib/dal.ts` — `requireAdmin()` (pages/layouts/server actions, redirects), `requireAdminApi()`
    (route handlers, returns a 401 `Response` because `redirect()` emits a method-preserving 307),
    `isAdminEmail()`, `getAdminSession()`. All memoized with React `cache()` so one request costs
    one `auth.getUser()` round trip.
  - `src/lib/admin-data.ts` — every admin read query. **Contract: each exported function's first
    line is `await requireAdmin()`.** Since the database no longer answers "may this user see
    this row", authorization lives entirely here; do not write raw Supabase queries in admin pages.
- **Every page, action and route handler re-checks auth itself.** The layout check is not enough:
  layouts don't re-render on navigation and server actions never pass through them. `requireAdmin()`
  also reaches `cookies()`, which is what keeps admin routes dynamic — without it Next would try
  to statically prerender them and freeze empty data into the build.
- **Errors are thrown, not swallowed.** `admin-data.ts` throws on query failure so `app/admin/error.tsx`
  can distinguish "no records" from "broken query". Returning `[]` on error is what hid the original bug.
- **Forms use `useActionState`**, and actions return `{ error }` instead of redirecting on failure —
  a redirect is a full navigation that wipes uncontrolled inputs (previously destroying up to 100k
  characters of markdown). Keep inputs uncontrolled (`defaultValue`) and never put a changing `key`
  on the form, or the remount brings the data loss back. `redirect()` only on success.
- **Audit log** (`src/lib/audit-log.ts`) must use `getSupabaseAdmin()`. Passing the service-role key
  to `@supabase/ssr`'s `createServerClient` does *not* work — `_getAccessToken()` prefers the
  session JWT over the key, so writes go as `authenticated` and RLS rejects them. Action codes live
  in `AUDIT_ACTIONS`; the type union means a new action without a Turkish label fails to compile.
- **Bootstrap:** the first admin row must be inserted by hand in the Supabase SQL Editor (see
  `.env.example`); `/admin/admins` manages everyone after that. Self-removal and last-admin removal
  are blocked both in the action and by a database trigger.
- **Dates** always go through `src/lib/format.ts` (`Europe/Istanbul`). Bare `toLocaleDateString`
  uses the server's zone — correct locally, three hours off on Vercel.

## Content system (projects + blog)

- **One block model, two content types.** `src/lib/blocks.ts` defines every block type; both
  `projects.blocks` and `posts.blocks` are JSONB arrays of it, edited with the same `BlockEditor`
  and rendered by the same `BlockRenderer`. Adding a block type lights it up in both places.
  `parseBlocks()` is the **security boundary** — blocks arrive as client-authored JSON in a hidden
  input, so it rebuilds them from a whitelist (unknown fields dropped, lengths clamped, URL schemes
  checked). Never trust a block field that did not come through it.
- **Three block types exist for machine readers, not humans**: `tldr` (answer-first, because LLMs
  read a passage out of context), `table` (structured comparisons get cited far more often), and
  `faq` (rendered in full *and* emitted as FAQPage JSON-LD). They come straight from the SEO/GEO
  research in `Umut/Brain/wiki/seo/`. Don't "simplify" them into plain text.
- **Public blog reads live in `src/lib/blog-data.ts`, not `admin-data.ts`.** The two files have
  opposite contracts: every `admin-data.ts` function starts with `requireAdmin()`, every
  `blog-data.ts` function is unauthenticated and must therefore filter `status = 'published'`
  itself. Keeping them apart is what stops one rule leaking into the other.
- **Comments are moderated by default.** Anonymous comments attract spam, so `/api/comments`
  always writes `status = 'pending'`, and only `approved` rows are ever rendered. Visitor text is
  printed as plain text on both the public page and in the admin queue — never as markdown or HTML.
- **Signup/comment context stores no IP.** Only a country code from Vercel's `x-vercel-ip-country`
  header, and device/browser/OS *derived* from the user agent (the raw string is discarded — it is
  fingerprint-grade). Rate limiting uses the IP in memory but never persists it.
- **`published_at` is written once**, on first publish. Later edits must not push it forward or
  every correction would re-date the post.
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
