# Prompt: Fully Responsive Header + Sidebar UI Enhancement (BDA)

You are working on **Bokaro Defence Academy (BDA)** — a Next.js 15 (App Router) + TypeScript + Tailwind CSS project. Icons use `lucide-react`. Reusable UI lives in `components/ui/*` (e.g. `Button`), layout chrome in `components/layout/*` and `components/dashboard/*`. The design system uses semantic Tailwind tokens: `bg-background`, `bg-surface`, `bg-surface-alt`, `border-border`, `text-foreground`, `text-muted`, plus brand scales `navy-*` (primary) and `rust-*` (accent). Dark mode is supported via the `dark:` variant. A `container-bda` utility sets the page gutter. Do **not** invent new colors — reuse these tokens so light/dark both work.

## Goal

Make the entire app **fully responsive with a polished, professional layout**. Fix the mobile navigation so it slides in from the side as a proper drawer, and make sure **no button ever breaks, wraps awkwardly, or overflows** at any breakpoint. Every interactive element must stay aligned and tap-friendly.

## Files in scope

- `frontend/components/layout/Header.tsx` — public marketing site header + mobile menu.
- `frontend/components/dashboard/DashboardShell.tsx` — student/admin dashboard chrome (sidebar + topbar).
- `frontend/components/ui/Button.tsx` — audit for responsive safety (see button rules).
- Any dashboard pages whose action rows currently break on mobile (audit and fix).

## Required behavior

### 1. Mobile navigation drawer (both Header and DashboardShell)

- The mobile menu must be a **drawer that slides in from the LEFT** (or right for the marketing header if that reads better), **not** a top-down `max-height` expansion. Use a transform-based transition: off-screen `-translate-x-full` → on-screen `translate-x-0`, with `transition-transform duration-300 ease-in-out`.
- Render a **dimmed backdrop** (`bg-black/40` / `backdrop-blur-sm`) behind the drawer that closes the drawer on click.
- The drawer panel itself: fixed, full viewport height, `w-72 max-w-[85vw]`, `bg-surface`, its own scroll (`overflow-y-auto`), and a header row containing the Logo + a single clearly-placed **close (X) button inside the panel** (remove the floating `X` that currently overlaps page content in `DashboardShell`).
- Close the drawer on: backdrop click, close-button click, route change (`usePathname` effect), and `Escape` keypress.
- Lock body scroll while the drawer is open (`document.body.style.overflow = 'hidden'` in an effect, restored on close/unmount).
- Add `aria-label`, `aria-expanded`, and `role="dialog"` / `aria-modal="true"` appropriately. The hamburger toggles; focus should move into the drawer when opened.
- Animate the hamburger ↔ close icon swap smoothly.

### 2. Desktop sidebar (DashboardShell)

- Keep the fixed `lg:` sidebar. Add an optional **collapse toggle** (expanded `w-64` ↔ collapsed `w-20` icon-only rail) persisted in `localStorage`; content area padding (`lg:pl-64` / `lg:pl-20`) must follow the state. When collapsed, show icon-only nav items with accessible `title`/tooltip labels.
- Active nav item stays visually distinct (`bg-navy-600 text-white`). Ensure the logout button pins to the bottom.

### 3. Button & alignment rules (apply everywhere)

- Buttons must **never break layout**: no horizontal overflow, no ugly text wrapping. Use `whitespace-nowrap`, `shrink-0` on icons, and let long labels truncate (`truncate`) rather than push siblings.
- Action rows (e.g. "New", search bars, filter + submit groups) must wrap gracefully with `flex flex-wrap items-center gap-2/gap-3`, and stack (`flex-col sm:flex-row`) on narrow screens where needed. Full-width buttons on mobile (`w-full sm:w-auto`) where it improves usability.
- All tap targets ≥ 40px high on mobile (`h-10`/`min-h-[40px]`), consistent icon sizing, and vertically centered icon+label (`inline-flex items-center gap-2`).
- Topbar (DashboardShell header): the right-side cluster (notifications, theme toggle, user, avatar) must never overflow — hide the name/role text on `sm:` and below, keep the avatar. Title should `truncate`.
- Audit `Button.tsx` size variants so `sm`/`md`/`lg` all keep icon+text aligned and don't collapse on small widths.

### 4. Breakpoint targets

Verify pixel-perfect, no-overflow layouts at **320px, 375px, 414px, 768px, 1024px, 1280px, 1536px**. Nothing should require horizontal scrolling at any width. Test both light and dark mode.

## Constraints

- Keep it a **client component** where interactivity is needed (`'use client'`), preserve existing props/exports (`DashboardNavItem`, etc.) so callers don't break.
- Reuse existing tokens and the `cn()` helper; no new dependencies, no inline hex colors.
- Keep accessibility: keyboard operable, visible focus rings (`focus:ring-2 focus:ring-navy-500`), correct ARIA.
- Don't regress SSR/hydration — guard `window`/`document`/`localStorage` access inside effects.
- After changes, run `npx tsc --noEmit` and `next build` and confirm zero errors.

## Deliverables

1. Refactored `Header.tsx` with a side-sliding mobile drawer + backdrop + body-scroll lock.
2. Refactored `DashboardShell.tsx` with an animated side drawer (no floating overlap X), collapsible desktop sidebar, and an overflow-safe topbar.
3. Any button/action-row fixes needed across dashboard pages for clean alignment.
4. A short note listing every file changed and what was fixed.
