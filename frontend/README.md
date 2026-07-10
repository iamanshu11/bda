# Bokaro Defence Academy — Frontend

Modern, responsive, SEO-optimized frontend for **Bokaro Defence Academy (BDA)**, built with Next.js 15 (App Router), TypeScript and Tailwind CSS. This package currently ships the fully componentized, animated **homepage**; the architecture is set up so additional pages (Courses, Results, Faculty, Gallery, Contact) and the Node/Express + PostgreSQL backend can be added incrementally.

## Tech Stack

- **Next.js 15** (App Router, Server Components)
- **TypeScript** (strict)
- **Tailwind CSS** with a military-inspired token system + dark/light mode
- **Framer Motion** — scroll reveal animations
- **Swiper** — Hall of Fame carousel
- **Lucide** — icons
- **React Query** + **Axios** — data layer (ready for the backend)
- **React Hook Form** + **Zod** — forms & validation (ready for auth/contact)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.local.example .env.local

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Lint |
| `npm run type-check` | TypeScript check, no emit |

## Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx        # Root layout: fonts, providers, header/footer, JSON-LD
│   ├── page.tsx          # Homepage — composes section components
│   ├── globals.css       # Tailwind + design tokens (light/dark CSS vars)
│   ├── providers.tsx     # ThemeProvider + React Query
│   ├── robots.ts         # Generated robots.txt
│   ├── sitemap.ts        # Generated sitemap.xml
│   └── not-found.tsx     # 404
├── components/
│   ├── layout/           # Header, Footer, Logo
│   ├── home/             # Hero, Stats, About, ExamCategories, FeaturedCourses,
│   │                     #   HallOfFame, StudyResources, Facilities (+ barrel)
│   ├── theme/            # ThemeProvider, ThemeToggle
│   ├── ui/               # Button, Container, SectionHeading, Reveal, Counter
│   └── JsonLd.tsx        # Structured-data injector
├── constants/            # site.ts (site config), navigation.ts
├── frontend-data/        # home.ts — homepage content (mirrors future API shape)
├── lib/                  # seo.ts (metadata + JSON-LD), utils.ts
├── types/                # Shared TypeScript interfaces
├── public/               # logo.png, og-image.jpg, favicon
├── middleware.ts         # Auth-gate placeholder (dashboard/admin)
├── tailwind.config.ts
├── next.config.mjs
└── tsconfig.json
```

## SEO — how it scales to new pages

All SEO lives in **`lib/seo.ts`**. Every page builds its metadata through one helper so titles, canonical URLs, Open Graph and Twitter cards stay consistent:

```ts
// app/courses/nda/page.tsx
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'NDA Coaching',
  description: 'Best NDA coaching in Bokaro with expert faculty...',
  path: '/courses/nda',
  keywords: ['NDA coaching Bokaro'],
});
```

`buildMetadata()` automatically produces the canonical URL, OG/Twitter tags, robots directives and keyword merge. For dynamic pages, call it inside `generateMetadata()` with fetched data.

Structured data helpers are also included: `organizationJsonLd()`, `websiteJsonLd()` (both already injected site-wide in the root layout) and `breadcrumbJsonLd()` for inner pages. `robots.ts` and `sitemap.ts` generate `/robots.txt` and `/sitemap.xml` — add new routes to the `staticRoutes` array (or fetch slugs) as pages ship.

## Theming

Colors are defined as CSS variables in `globals.css` (`--bg`, `--surface`, `--fg`, etc.) and mapped to semantic Tailwind classes (`bg-background`, `text-foreground`, `bg-surface-alt`…). Dark mode is class-based; an inline script in the layout applies the saved/system theme before hydration to avoid flashing. Toggle logic lives in `components/theme/`.

## Connecting the backend later

- Point `NEXT_PUBLIC_API_BASE_URL` at the Express API.
- The content in `frontend-data/home.ts` matches the shape the APIs will return, so each section can switch from static import to a React Query fetch with minimal change.
- `middleware.ts` is ready to gate `/dashboard` and `/admin` once JWT cookies exist.

## Design

The homepage matches the provided BDA design: sticky header with dark-mode toggle and Call/Enroll CTAs, hero, animated stats counters, About, filterable Exam Categories, Featured Courses, Hall of Fame carousel, Study Resources, Facilities and a footer with map and social links. Replace the placeholder `public/logo.png` and Unsplash image URLs in `frontend-data/home.ts` with real BDA assets.
