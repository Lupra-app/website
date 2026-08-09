# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repository is pre-development. It currently contains no application source code — only brand
assets and repo scaffolding:

- `Brands/` — logos, favicons, app icon, and social/wallpaper images (PNG/SVG) for Lupra
- `README.md`, `LICENSE` (MIT), `.gitignore`

There is no package.json, build tooling, or framework code yet, so there are no build/lint/test
commands to run. The `.gitignore` is a generic Node.js template that already anticipates a
Next.js-based app (it ignores `.next` and `out`), which is a signal for the likely stack once
development starts, but nothing has been scaffolded.

When the actual website codebase is added, update this file with real build/lint/test commands and
the project's architecture.

## Repository purpose

Official website for Lupra, an Agent-as-a-Service platform, to be live at lupra.app.

## Brand assets (`Brands/`)

- `lupra-icon*.svg` / `lupra-lockup-*.svg` — vector logo marks (icon-only vs. full lockup) with
  light/dark variants
- `favicon*.png`, `favicon.ico` — favicons at multiple sizes
- `app-icon-1024.png` — source app icon
- `banner-*.png` — pre-sized social banners for LinkedIn, X, and YouTube
- `wallpaper-*.png` — desktop and mobile wallpapers (including a "minimal" mobile variant)

Treat these as the canonical brand source files — reuse them rather than regenerating logos/icons
when building out the site.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
