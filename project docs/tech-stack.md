# Tech Stack — Krishi Mulya (Nepal Agriculture Price Intelligence)

> **Status:** ✅ Final — confirmed for MVP. Changes should be discussed and
> this doc updated before implementation diverges from it.
>
> **Audience:** Human developer + AI coding agents (e.g. Antigravity) working
> in this repo. Treat this file as the source of truth for *what* technology
> to use and *why* — implementation details live in `implementation-plan.md`.

---

## Table of Contents

1. [Project Summary](#1-project-summary)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Stack at a Glance](#3-stack-at-a-glance)
4. [Frontend](#4-frontend)
5. [Backend / API](#5-backend--api)
6. [Database & Auth](#6-database--auth)
7. [Hosting & Scheduling](#7-hosting--scheduling)
8. [Data Source & Scraping](#8-data-source--scraping)
9. [Alerts (Phase 2)](#9-alerts-phase-2)
10. [Dev Tooling & Conventions](#10-dev-tooling--conventions)
11. [Repo / Folder Structure](#11-repo--folder-structure)
12. [Environment Variables](#12-environment-variables)
13. [Costs Summary](#13-costs-summary)
14. [Upgrade Paths (Future)](#14-upgrade-paths-future)
15. [Decisions Log](#15-decisions-log)

---

## 1. Project Summary

**Krishi Mulya (कृषि मूल्य)** is a web platform that scrapes daily wholesale
vegetable, fruit, and fish prices from Nepal's official **Kalimati Fruits &
Vegetable Market** government website, stores historical data, and presents
it as searchable tables, trend charts, and (later) SMS/email price alerts —
targeting farmers, traders, cooperatives, and agri-businesses.

Built and maintained by a **solo developer**, on **free-tier infrastructure**,
with a path to paid B2B features (cooperative dashboards, data API, SMS
alerts).

---

## 2. High-Level Architecture

```
                     daily, ~06:45 NPT (once/day — Vercel Hobby limit)
   ┌──────────────────────────────────────────┐
   │              Vercel Cron                  │
   │   GET /api/cron  (Next.js Route Handler)  │
   └────────────────────┬─────────────────────┘
                         │ fetch + parse HTML table
                         ▼
        kalimatimarket.gov.np/price  (Govt. of Nepal, public, no API key)
                         │
                         ▼
   ┌──────────────────────────────────────────┐
   │           Supabase (Postgres)             │
   │  - commodities                            │
   │  - daily_prices     ← upsert daily        │
   │  - price_alerts     (Phase 2)             │
   │  - alert_log        (Phase 2)             │
   │  - organizations / organization_members   │
   │  - Auth (email/phone OTP)                 │
   │  - Row Level Security (RLS)               │
   └────────────────────┬─────────────────────┘
                         │ read via anon key (RLS-protected)
                         ▼
   ┌──────────────────────────────────────────┐
   │         Next.js 14 App (Vercel)           │
   │  - "/"                 today's prices     │
   │  - "/commodity/[slug]" 90-day trend chart │
   │  - "/api/cron"          scraper endpoint  │
   │  - "/api/*"             future API routes │
   └────────────────────────────────────────────┘
```

**Why this shape:**
- **Single deployable unit.** Frontend, API, and the scraper cron job all
  live in one Next.js app on Vercel. One repo, one deploy, one dashboard to
  monitor.
- **No server to maintain.** Vercel + Supabase are both fully managed.
  Nothing for a solo dev to patch, reboot, or back up manually.
- **SSR-first.** Pages are server-rendered for SEO — critical, since organic
  search ("kalimati tomato price today") is the main acquisition channel.

---

## 3. Stack at a Glance

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR + API routes in one |
| Language | **TypeScript** | Strict mode on |
| Styling | **Tailwind CSS** | Utility-first, no separate CSS files |
| Charts | **Recharts** | Price trend line charts |
| Icons | **lucide-react** | Lightweight, tree-shakeable |
| Nepali dates | **nepali-date-converter** | BS ↔ AD conversion |
| Database | **Supabase (Postgres)** | Free tier |
| Auth | **Supabase Auth** | Email/phone OTP |
| Hosting | **Vercel (Hobby)** | Frontend + API + Cron |
| Scheduling | **Vercel Cron** (1×/day) | Triggers scraper |
| Scraping | **axios + cheerio** | Parses govt. HTML table |
| SMS (Phase 2) | **Sparrow SMS** | Pay-as-you-go, Nepal-based |
| Email (Phase 2) | **Resend** or Supabase email | TBD in implementation plan |
| Package manager | **npm** | |
| Node version | **20 LTS** | Matches Vercel default |
| Linting | **ESLint + Prettier** | Next.js default config |
| Testing | **None for MVP** | Revisit post-MVP |
| Version control | **GitHub** | Connected to Vercel for CI/CD |
| Repo structure | **Single repo**, `/web` + `/scraper` | No monorepo tooling |

---

## 4. Frontend

- **Framework:** Next.js 14, **App Router** (not Pages Router). All pages
  are React Server Components by default; use `"use client"` only for
  interactive pieces (search/filter inputs, charts).
- **Language:** TypeScript, `strict: true` in `tsconfig.json`.
- **Styling:** Tailwind CSS only. No CSS Modules, no styled-components, no
  global stylesheets beyond `app/globals.css` (Tailwind directives +
  font-family base).
- **Charts:** `recharts` — `LineChart` for price trends (min/avg/max series).
  Keep chart components as small client components (`"use client"`),
  receiving already-fetched data as props.
- **Icons:** `lucide-react` — import individual icons (e.g.
  `import { Search } from "lucide-react"`), never the full icon set.
- **Dates:** `nepali-date-converter` for displaying Bikram Sambat dates
  alongside Gregorian (e.g. "२०८३ असार २ — June 16, 2026"). Use this on
  commodity pages and the dashboard header. Store all dates in Postgres as
  **Gregorian (AD)** — only convert for *display*.
- **Rendering strategy:**
  - `/` (dashboard) and `/commodity/[slug]` use `export const revalidate =
    1800` (30 min) — data changes once daily, so this avoids unnecessary
    rebuilds while keeping pages reasonably fresh.
  - Avoid client-side data fetching (`useEffect` + fetch) for initial page
    data — fetch in Server Components via `lib/supabase.ts` helpers.

---

## 5. Backend / API

- **No separate backend service.** All server logic lives in Next.js **Route
  Handlers** under `web/app/api/`.
- **Current routes:**
  - `GET /api/cron` — runs the daily scraper (called by Vercel Cron, secured
    with `CRON_SECRET`)
- **Future routes (see implementation plan for sequencing):**
  - `GET /api/v1/prices` — public read API for NGOs/partners (Phase 5)
  - `POST /api/alerts` — create/update a user's price alert (Phase 2)
  - `GET /api/check-alerts` — second daily cron, evaluates alerts and sends
    SMS/email (Phase 2)
- **Convention:** keep Route Handlers thin — validation + calling a function
  from `lib/`. Business logic (scraping, parsing, alert evaluation) belongs
  in `lib/` so it's testable and reusable between the Next.js route and the
  standalone `/scraper` CLI script.

---

## 6. Database & Auth

- **Provider:** Supabase, free tier (500MB DB, 50K MAU — far beyond MVP
  needs).
- **Why Supabase over plain Postgres (e.g. Neon):** bundled Auth + Row Level
  Security means the browser can query Postgres directly via the anon key,
  with RLS policies enforcing who can read/write what. No separate auth
  service or API layer needed for user-facing features.
- **Core tables** (full schema lives in `supabase/schema.sql`):
  - `commodities` — master list (~98 items), Nepali/English names, slug,
    unit, category
  - `daily_prices` — one row per commodity/market/day (min/max/avg)
  - `price_alerts`, `alert_log` — Phase 2
  - `organizations`, `organization_members` — Phase 4 (cooperative accounts)
- **RLS policy pattern:**
  - `commodities` and `daily_prices`: public **read** access (this is the
    core product value — no login required to see prices)
  - `price_alerts`, `organizations`: scoped to `auth.uid()`
- **Auth method:** Supabase Auth, email or phone OTP (no passwords to
  manage). Only needed once Phase 2 (alerts) begins — the MVP dashboard
  requires no login.
- **Clients:**
  - `lib/supabase.ts` — browser/server client using `NEXT_PUBLIC_*` anon key
    (RLS-protected, safe for client components)
  - `scraper/supabaseClient.js` — server-only client using
    `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS — **never** expose this key to
    the browser or commit it to git)

---

## 7. Hosting & Scheduling

- **Provider:** Vercel, **Hobby (free) plan**.
- **Known constraint:** Hobby plan is positioned for non-commercial/personal
  use, and Cron jobs on Hobby are limited to **once per day**. Both are
  acceptable for MVP:
  - Our scrape cadence is naturally once/day (the market publishes once
    daily)
  - We'll **upgrade to Pro ($20/mo)** once the project starts generating
    revenue (see [Upgrade Paths](#14-upgrade-paths-future))
- **Cron config:** `web/vercel.json` defines the schedule (UTC time —
  remember Nepal is UTC+5:45, so account for the offset when picking the
  cron expression).
- **Deployment:** GitHub → Vercel auto-deploy on push to `main`. Preview
  deployments on PRs (free on Hobby).
- **Environment variables:** set in Vercel Project Settings, mirrored
  locally via `.env.local` (see [Environment Variables](#12-environment-variables)).

---

## 8. Data Source & Scraping

- **Source:** `https://kalimatimarket.gov.np/price` — official daily
  wholesale price table from the Kalimati Fruits & Vegetable Market
  Development Board (Government of Nepal). Public, no authentication or API
  key.
- **Format:** HTML `<table>` with ~98 rows, 4 columns: commodity name
  (Nepali, with unit suffix like "(के.जी.)"), min price, max price, average
  price — all values in **Devanagari numerals** with a "रू" prefix.
- **Libraries:** `axios` (HTTP fetch) + `cheerio` (HTML parsing, jQuery-like
  API).
- **Parsing pipeline** (implemented in `lib/scraper.ts`, shared by
  `/api/cron` and the standalone `scraper/index.js`):
  1. Fetch HTML
  2. Extract table rows via `cheerio`
  3. Strip unit suffix from commodity name (regex)
  4. Convert Devanagari digits → standard numbers
  5. Match cleaned Nepali name → `commodityMap.ts` entry (English name,
     slug, unit, category)
  6. Upsert into `daily_prices`, keyed on `(commodity_id, market,
     price_date)`
- **Commodity map:** `commodityMap.ts` — hand-built mapping of all ~98
  commodity names, **validated against the live site** (0 unmatched as of
  initial build). If the market board adds new items, the scraper logs them
  as "unmatched" — add them here.
- **Etiquette:** scrape **once per day only**. This is public government
  infrastructure — don't poll it frequently.

---

## 9. Alerts (Phase 2)

> Not part of MVP — documented here so the stack choice is recorded ahead of
> time.

- **SMS:** Sparrow SMS (sparrowsms.com) — Nepal-based, pay-as-you-go
  (~NPR 1.50/SMS), no monthly subscription. Good fit for low initial volume.
- **Email:** TBD between Resend (generous free tier, good DX) and Supabase's
  built-in email sending — decide during Phase 2 implementation planning.
- **Trigger mechanism:** a second Vercel Cron route (`/api/check-alerts`),
  running after `/api/cron`, evaluates `price_alerts` against the day's new
  `daily_prices` and sends notifications, logging to `alert_log` to prevent
  duplicate sends.

---

## 10. Dev Tooling & Conventions

- **Package manager:** npm (no yarn/pnpm — keep it simple, single app).
- **Node version:** 20 LTS — pin via `.nvmrc` and `engines` in
  `package.json`.
- **Linting/formatting:** ESLint (Next.js default config:
  `next/core-web-vitals`) + Prettier. Run on save; no separate CI lint step
  needed for MVP but can be added cheaply later (GitHub Actions, free for
  public/small private repos).
- **Testing:** none for MVP. TypeScript's type checking is the primary
  safety net. Revisit (Vitest for unit tests on `lib/scraper.ts` parsing
  logic) once alert/payment logic is added — those are the highest-risk
  areas for silent bugs.
- **Git workflow:** trunk-based, direct commits to `main` are fine for a
  solo dev; Vercel preview deployments on feature branches/PRs if you want
  to review before merging.
- **Naming conventions:**
  - Files/folders: `kebab-case` (routes), `PascalCase.tsx` (components),
    `camelCase.ts` (lib modules)
  - Database: `snake_case` (Postgres convention)
  - TypeScript types mirror DB tables 1:1 where possible (see
    `lib/supabase.ts` types)

---

## 11. Repo / Folder Structure

```
nepal-agri-price/
├── supabase/
│   └── schema.sql              # Run in Supabase SQL editor
├── scraper/                     # Standalone CLI scraper (manual/local runs)
│   ├── index.js
│   ├── commodityMap.js
│   ├── supabaseClient.js
│   └── package.json
├── web/                          # Next.js app (deployed to Vercel)
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── commodity/[slug]/page.tsx
│   │   ├── api/cron/route.ts     # Scraper cron endpoint
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── PriceTable.tsx
│   │   └── PriceChart.tsx
│   ├── lib/
│   │   ├── supabase.ts           # Client + data fetchers + types
│   │   ├── scraper.ts            # Shared parsing logic (Phase: refactor)
│   │   └── commodityMap.ts       # TS version of commodity map
│   ├── vercel.json               # Cron schedule
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── next.config.js
├── docs/
│   ├── tech-stack.md             # This file
│   ├── prd.md
│   ├── app-flow.md
│   ├── frontend-guidelines.md
│   ├── backend-structure.md
│   └── implementation-plan.md
└── .env.example
```

> **Note for coding agents:** the original scaffold duplicated scraper logic
> between `scraper/index.js` and `web/app/api/cron/route.ts`. The
> `implementation-plan.md` should address consolidating shared logic into
> `web/lib/scraper.ts`, imported by both the Route Handler and a thin
> `scraper/index.js` CLI wrapper — avoid maintaining two copies of the
> parsing logic.

---

## 12. Environment Variables

| Variable | Used by | Sensitivity |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Web app (browser + server) | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web app (browser + server) | Public (RLS-protected) |
| `SUPABASE_URL` | Scraper, `/api/cron` | Server-only |
| `SUPABASE_SERVICE_ROLE_KEY` | Scraper, `/api/cron` | **Secret** — bypasses RLS |
| `CRON_SECRET` | `/api/cron` | **Secret** — verifies Vercel Cron calls |
| `SPARROW_SMS_TOKEN` | Alerts (Phase 2) | **Secret** |
| `SPARROW_SMS_FROM` | Alerts (Phase 2) | Config |

Full template in `.env.example`. Never commit `.env.local` or `.env`.

---

## 13. Costs Summary

| Item | Cost (MVP) |
|---|---|
| Vercel (Hobby) | NPR 0 |
| Supabase (Free tier) | NPR 0 |
| Domain (optional, `.com.np`) | ~NPR 1,000–3,000/year |
| Sparrow SMS (Phase 2, pay-as-you-go) | ~NPR 1.50/SMS sent |
| **Total fixed monthly cost** | **NPR 0** |

---

## 14. Upgrade Paths (Future)

These are **not** decisions for now — recorded so future-you (or an AI
agent) understands the intended trajectory:

- **Vercel Hobby → Pro ($20/mo):** once the project earns revenue (even one
  paying cooperative), to stay compliant with Vercel's commercial-use terms
  and to lift the once-daily cron limit if a second cron (alerts) is needed
  at a different cadence.
- **Supabase Free → Pro (~$25/mo):** only if DB size exceeds 500MB or
  concurrent connection limits are hit — unlikely for years at current data
  volume (~98 rows/day).
- **Multi-market data:** schema already supports a `market` column on
  `daily_prices` — adding Pokhara/Butwal/Biratnagar data sources doesn't
  require a schema change.
- **Data API for partners (Phase 5):** add API-key-based rate limiting via a
  new `api_keys` table — no new infrastructure required.

---

## 15. Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06 | Next.js 14 (App Router) + TypeScript | SSR for SEO, type safety as schema grows |
| 2026-06 | Supabase over Neon+separate auth | Bundled Auth + RLS reduces moving parts |
| 2026-06 | Vercel Hobby (with planned Pro upgrade) | Zero-cost start; daily cron sufficient for MVP |
| 2026-06 | Single repo, no monorepo tooling | Solo dev, one app — Turborepo would be overhead |
| 2026-06 | No formal testing for MVP | TypeScript + manual testing sufficient at this scale |
| 2026-06 | nepali-date-converter included | Low-cost differentiator — BS date display |
| 2026-06 | Sparrow SMS for alerts (Phase 2) | Nepal-based, pay-as-you-go, no subscription |
