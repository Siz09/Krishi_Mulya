# Implementation Plan — Krishi Mulya (कृषि मूल्य)

> **Status:** ✅ Final for MVP — confirmed after discussion.
>
> **Audience:** Human developer + AI coding agents (e.g. Antigravity).
> This file defines **what to build, in what order, and how to know when
> each task is done**. It is the primary execution reference.
>
> **This plan is clean-slate.** The earlier scaffold (pre-planning) is
> treated as reference only — do not migrate from it. Build from scratch
> following the architecture confirmed in the other five docs.
>
> **Related docs (read these first):**
> - `tech-stack.md` — all technology choices and versions
> - `prd.md` — what is and is not in scope
> - `app-flow.md` — sitemap, page states, locale routing
> - `frontend-guidelines.md` — components, formatting, i18n conventions
> - `backend-structure.md` — schema, views, scraper, queries, actions

---

## Implementation Principles

These apply to every task in every phase. An AI coding agent must treat
these as constraints, not suggestions.

1. **Use real data as early as possible.** The scraper runs before any UI
   is built. Pages consume live database data from day one — no mocks, no
   hardcoded price arrays.
2. **Server Components by default.** Add `"use client"` only when a
   component requires browser interactivity (search input typing, chart
   rendering, language toggle). Data fetching always happens server-side.
3. **Avoid client-side state unless necessary.** Search state lives in the
   URL (`?q=`). Language preference lives in a cookie. No `useState` for
   data that could live in the URL or on the server.
4. **Do not introduce functionality outside the PRD.** The PRD's Non-Goals
   section (`prd.md` §6) is a hard boundary — no marketplace features, no
   farming advisory content, no sort UI in v1, no native app.
5. **Complete one end-to-end vertical slice before expanding.** Each phase
   must reach its "Done When" state before the next phase begins. Do not
   build Phase 5 UI while Phase 3 (scraper) is still untested.
6. **One source of truth per concern.** Scraping logic: `lib/scraper.ts`
   only. Types: `lib/supabase.ts` only. i18n strings: `dictionaries/`
   only. Do not duplicate.
7. **Every page must handle its error and empty states.** The dashboard
   with no data, a commodity page with one day of history, a failed scrape
   — these are real launch conditions, not edge cases to defer.

---

## Phase Overview

| Phase | Focus | Key Milestone |
|---|---|---|
| 1 | Project Foundation | Repo runs locally with correct structure |
| 2 | Database | Schema fully deployed in Supabase |
| 3 | Scraper & Data Pipeline | Manual scrape populates real data |
| 4 | Data Access Layer | Pages can consume typed query functions |
| 5 | Core UI (English only) | User can browse live prices end-to-end |
| 6 | Internationalization | Full app works in both `en` and `ne` locales |
| 7 | SEO | All public pages generate correct metadata |
| 8 | Alerts Interest Capture | Email signups are stored in the database |
| 9 | Production Readiness | App is deployed, cron is live, launch states verified |

---

## Phase 1 — Project Foundation

### Task 1.1 — Initialize Next.js project

**Goal:** create a working Next.js 14 app with the correct configuration.

**Files/Folders created:**
```
web/
  app/
    layout.tsx
    globals.css
  next.config.js
  tsconfig.json
  tailwind.config.js
  postcss.config.js
  package.json
  .eslintrc.json
```

**Steps:**
```bash
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

**Done When:**
- `cd web && npm run dev` starts without errors
- `http://localhost:3000` serves the default Next.js page

---

### Task 1.2 — Install dependencies

**Goal:** install all confirmed packages from `tech-stack.md`.

```bash
cd web
npm install @supabase/supabase-js recharts lucide-react nepali-date-converter
npm install axios cheerio
npm install --save-dev tsx
```

**Done When:**
- `npm install` completes with no unresolved peer dependency errors
- `package.json` reflects all installed packages

---

### Task 1.3 — Configure environment variables

**Goal:** establish the env var pattern used by all subsequent tasks.

**Files created:**
- `.env.example` (repo root — committed to git)
- `web/.env.local` (local only — gitignored)

**`.env.example` contents** (see `tech-stack.md` §12 for full list):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
SPARROW_SMS_TOKEN=
SPARROW_SMS_FROM=
```

**Done When:**
- `.env.example` committed to git
- `web/.env.local` exists locally (not committed) with real Supabase values
- `.gitignore` at repo root excludes `.env.local`, `.env`

---

### Task 1.4 — Set up folder structure

**Goal:** create the full directory skeleton so subsequent tasks have
correct locations.

**Folders to create** (files will be added per-task):
```
web/
  app/
  components/
    layout/
    commodity/
    shared/
    alerts/
  lib/
    queries/
    actions/
  dictionaries/
  scripts/
docs/
supabase/
```

**Done When:**
- All directories exist
- `web/lib/supabase.ts` is created with the Supabase client + shared
  TypeScript types (from `backend-structure.md` §2)

---

## Phase 2 — Database

### Task 2.1 — Deploy schema to Supabase

**Goal:** all tables, indexes, constraints, and RLS policies from
`backend-structure.md` §2 and §4 are live in Supabase.

**File created:**
- `supabase/schema.sql`

**Schema must include:**
- `commodities` table
- `daily_prices` table (with unique constraint on `commodity_id, market, price_date`)
- `alert_interest` table (unique on `email`)
- Phase 2+ tables reserved (`price_alerts`, `alert_log`, `organizations`,
  `organization_members`) — present in schema, unused by v1 code
- All indexes
- All RLS policies per `backend-structure.md` §4

**How to deploy:**
1. Create a new project at supabase.com (free tier)
2. Go to SQL Editor → New Query
3. Paste `supabase/schema.sql` and run

**Done When:**
- All tables visible in Supabase Table Editor
- Supabase anon key **cannot** read `alert_interest`
- Supabase service-role key **can** read/write all tables

---

### Task 2.2 — Deploy views to Supabase

**Goal:** both computed views from `backend-structure.md` §3 are live.

**Add to `supabase/schema.sql`** (or run separately as a migration):
- `price_changes` view (LAG-based window functions)
- `latest_prices_with_changes` view (joins commodities + price_changes,
  computes `change_1d_pct` and `change_7d_pct`)

**Done When:**
- Both views visible in Supabase
- `select * from latest_prices_with_changes` returns zero rows (no data
  yet — confirms the view is valid SQL, not that data exists)

---

## Phase 3 — Scraper & Data Pipeline

### Task 3.1 — Build commodity map

**Goal:** TypeScript source-of-truth mapping of all ~98 Kalimati
commodity names.

**File created:**
- `web/lib/commodityMap.ts`

**Contents:** a typed array of commodity objects:
```ts
export type CommodityDef = {
  name_ne: string;  // exact string as it appears in the Kalimati table (after stripping unit suffix)
  name_en: string;
  slug: string;
  unit: "kg" | "dozen" | "piece";
  category: "vegetable" | "fruit" | "fish";
};

export const COMMODITIES: CommodityDef[] = [ ... ];
```

All ~98 entries validated against the live `kalimatimarket.gov.np/price`
table. Source: the earlier scaffold's `commodityMap.js` is a valid
reference but must be converted to TypeScript with the type above.

**Slug immutability rule** (from `backend-structure.md` §4):
Slugs are generated once and never regenerated — even if `name_en` or
`name_ne` changes later. The slug is the permanent public URL identifier.
Do not generate slugs dynamically from names at runtime.

**Done When:**
- Running the unit test below returns zero mismatches:
```ts
// Quick inline validation (no test framework needed)
const names = new Set(COMMODITIES.map(c => c.name_ne));
// names.size should equal COMMODITIES.length (no duplicates)
// All slugs unique
```

---

### Task 3.2 — Build core scraper

**Goal:** implement `runScrape()` as the single scraping entry point.

**File created:**
- `web/lib/scraper.ts`

**Must implement:**
1. `fetchPriceTable()` — fetches `kalimatimarket.gov.np/price` via axios,
   parses the HTML table with cheerio, returns raw rows
2. `devanagariToNumber(raw: string): number | null` — converts Devanagari
   numerals to standard numbers (validated in scaffold: "रू ६३.७५" → 63.75)
3. `normaliseCommodityName(raw: string): string` — strips unit suffix
   (e.g., "(के.जी.)", "(दर्जन)") from Nepali commodity name
4. `runScrape(opts?: { date?: string }): Promise<ScrapeResult>` — full
   pipeline: fetch → parse → match → upsert to `daily_prices`

**Key behaviors:**
- Uses `SUPABASE_SERVICE_ROLE_KEY` (service-role client, bypasses RLS)
- Upserts with `onConflict: "commodity_id,market,price_date"` (idempotent)
- `opts.date` overrides stored `price_date`; does not change which page
  is fetched (live source only serves today's data)
- Logs all unmatched commodity names (name in table not found in
  `commodityMap.ts`) — does not throw, returns them in `ScrapeResult`
- Throws if zero commodities matched (indicates site structure changed)

**Done When:**
- `npx tsx scripts/scrape.ts` runs without errors
- `daily_prices` table in Supabase has rows
- `latest_prices_with_changes` view returns ~98 rows
- No persistent "unmatched" commodities in the log

---

### Task 3.3 — Build local scraper script

**Goal:** CLI entry point for manual/local scrape runs.

**File created:**
- `web/scripts/scrape.ts`

```ts
import { runScrape } from "../lib/scraper";

const dateArg = process.argv.includes("--date")
  ? process.argv[process.argv.indexOf("--date") + 1]
  : undefined;

runScrape({ date: dateArg })
  .then(result => { console.log(result); process.exit(0); })
  .catch(err => { console.error(err); process.exit(1); });
```

**Done When:**
- `npx tsx scripts/scrape.ts` populates today's data
- `npx tsx scripts/scrape.ts --date 2026-06-01` stores data under that
  date (useful for re-runs and testing)

---

### Task 3.4 — Build cron route handler

**Goal:** thin Vercel Cron trigger that calls `runScrape()`.

**File created:**
- `web/app/api/cron/route.ts`

**Must implement:**
- Auth check: `Authorization: Bearer <CRON_SECRET>` header required
- Returns `401` if auth fails
- Calls `runScrape()` and returns `ScrapeResult` as JSON
- `export const dynamic = "force-dynamic"` and `export const maxDuration = 60`

**File created:**
- `web/vercel.json`
```json
{
  "crons": [{ "path": "/api/cron", "schedule": "45 0 * * *" }]
}
```
(UTC `00:45` = approximately `06:30 NPT`)

**Done When:**
- `curl -H "Authorization: Bearer <CRON_SECRET>" http://localhost:3000/api/cron`
  returns `{ ok: true, date: "...", matchedCount: 98, unmatched: [] }`
- Returns `401` when called without the header

---

## Phase 4 — Data Access Layer

### Task 4.1 — Build price query functions

**Goal:** typed, reusable query functions consumed by all pages — pages
never write raw Supabase queries directly.

**File created:**
- `web/lib/queries/prices.ts`

**Must implement** (see `backend-structure.md` §6 for signatures):
```ts
getLatestPrices(opts?: { category?, search? }): Promise<LatestPriceWithChange[]>
getCommodityWithChange(slug: string): Promise<LatestPriceWithChange | null>
getCommodityHistory(slug: string, days?: number): Promise<{ commodity, history }>
```

**TypeScript types** (in `web/lib/supabase.ts`):
```ts
type LatestPriceWithChange = {
  commodity_id: number;
  slug: string;
  name_en: string;
  name_ne: string;
  unit: string;
  category: "vegetable" | "fruit" | "fish";
  market: string;
  price_date: string;
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  change_1d_pct: number | null;
  change_7d_pct: number | null;
};
```

**Done When:**
- Each function can be called in a Server Component and returns correctly
  typed data
- `getLatestPrices({ category: "vegetable" })` returns only vegetables
- `getLatestPrices({ search: "tomato" })` returns English-matching results
- `getLatestPrices({ search: "गोलभेडा" })` returns Nepali-matching results
- `getCommodityWithChange("invalid-slug")` returns `null` (not an error)

---

### Task 4.2 — Build formatting utilities

**Goal:** single source of truth for all price/date display logic.

**File created:**
- `web/lib/format.ts`

**Must implement** (see `frontend-guidelines.md` §4):
```ts
formatPrice(value: number | null, unit: string, locale: "en" | "ne"): string
// "Rs. 125/kg" | "रु 125/केजी" | "—"

formatChange(pct: number | null): { text: string; direction: "up" | "down" | "none" }
// "+3.2%", "up" | "-1.8%", "down" | "—", "none"
// Always Arabic numerals regardless of locale

formatBSDate(dateStr: string, locale: "en" | "ne"): string
// "2083-03-15 BS" (en) | "२०८३-०३-१५" (ne)
// Uses nepali-date-converter
```

**Done When:**
- `formatPrice(125, "kg", "en")` → `"Rs. 125/kg"`
- `formatPrice(125, "kg", "ne")` → `"रु 125/केजी"`
- `formatChange(3.2)` → `{ text: "+3.2%", direction: "up" }`
- `formatChange(null)` → `{ text: "—", direction: "none" }`
- `formatBSDate("2026-06-16", "ne")` → Devanagari digits BS equivalent

---

## Phase 5 — Core UI (English Only)

> Build all pages and components in English only. i18n comes in Phase 6.
> Use `"en"` hardcoded as the locale until then. Real data from Phase 3
> must be running before starting this phase.

### Task 5.1 — Root layout and header

**Goal:** global layout with navigation and footer.

**Files created:**
- `web/app/layout.tsx` — root layout, loads Noto Sans + Noto Sans
  Devanagari via `next/font/google`, sets `<html lang="en">` (hardcoded
  for now)
- `web/components/layout/Header.tsx` — logo, category nav links, language
  switcher placeholder
- `web/components/layout/Footer.tsx` — data attribution, last updated

**Done When:**
- Header renders on all pages
- Footer renders on all pages with correct attribution text
- Category nav links point to `/vegetables`, `/fruits`, `/fish`

---

### Task 5.2 — Shared components

**Goal:** build reusable components before pages that consume them.

**Files created:**
- `web/components/commodity/PriceChangeBadge.tsx`
  - Props: `pct: number | null`, `size?: "sm" | "md"`
  - Renders: `▲ +3.2%` (amber-600) | `▼ -1.8%` (blue-600) | `—` (gray-500)
  - Symbol + text always — never color only
- `web/components/shared/SearchBar.tsx`
  - Client Component (`"use client"`)
  - Controlled by URL `?q=` param
  - Updates URL via `router.replace` on input, debounced 300ms
- `web/components/commodity/PriceTable.tsx`
  - Props: `prices: LatestPriceWithChange[]`, `locale: string`
  - Renders: `<table>` with columns: name (EN + NE), avg, min, max, unit,
    1d change badge
  - Each row links to `/[locale]/commodity/[slug]`
  - Applied class: `hidden md:block`
- `web/components/commodity/PriceCardList.tsx`
  - Props: same as `PriceTable`
  - Renders: list of commodity cards
  - Card content: name (primary locale), avg price (large), change badge;
    min/max/unit as secondary text
  - Applied class: `md:hidden`

**Done When:**
- `PriceChangeBadge` renders all three states correctly
- `PriceTable` and `PriceCardList` render with mocked props without errors
- `SearchBar` updates URL `?q=` param as user types

---

### Task 5.3 — Dashboard page

**Goal:** the main price listing page (`/`).

**File created:**
- `web/app/page.tsx` (temporary — will move to `app/[locale]/page.tsx` in
  Phase 6; keep flat for now)

**Must implement:**
- `export const revalidate = 1800`
- Calls `getLatestPrices({ search: searchParams.q })`
- Renders `<PriceCardList className="md:hidden" />` and
  `<PriceTable className="hidden md:block" />` with same data
- Renders `<SearchBar />` above the table/cards
- Renders category filter links (All / Vegetables / Fruits / Fish)
- Handles all states from `app-flow.md` §4.1:
  - Loaded (normal)
  - Stale data notice
  - Empty (no data yet)

**Done When:**
- Dashboard shows real Kalimati price data
- Search filters results as user types
- Cards visible on narrow viewport, table on wide viewport
- All three page states render correctly

---

### Task 5.4 — Category pages

**Goal:** three filtered views with unique titles.

**Files created:**
- `web/app/vegetables/page.tsx`
- `web/app/fruits/page.tsx`
- `web/app/fish/page.tsx`

Each calls `getLatestPrices({ category: "...", search: searchParams.q })`.
Category pages sorted by `avg_price DESC` (see `frontend-guidelines.md`
§6).

**Done When:**
- Each category page shows only the correct commodity category
- Search works within category
- Page titles are unique per category
- Correct empty state when a category has no data

---

### Task 5.5 — Commodity detail page

**Goal:** per-commodity page with chart and stats.

**Files created:**
- `web/app/commodity/[slug]/page.tsx`
- `web/components/commodity/PriceChart.tsx`
- `web/components/commodity/CommodityStats.tsx`

**`PriceChart`:**
- Client Component (`"use client"`)
- Uses Recharts `LineChart` with three `Line` series: Min (blue-600), Avg
  (leaf-600), Max (amber-600)
- X-axis: `price_date` (MM-DD format)
- Y-axis: price in Rs
- Single data point state: replaces chart with "Price history will appear
  here as data accumulates — check back tomorrow."

**`CommodityStats`:**
- Shows: latest avg, latest min/max, price_date (Gregorian)
- Shows `PriceChangeBadge` for 1-day and 7-day change

**`page.tsx`:**
- Calls `getCommodityWithChange(slug)` — 404 if null
- Calls `getCommodityHistory(slug, 90)`
- Renders breadcrumb: Home > [Category] > [Commodity Name]
- `export const revalidate = 1800`

**Files created:**
- `web/components/layout/Breadcrumbs.tsx`

**Done When:**
- Commodity page renders with live chart and stats
- Invalid slug returns 404 (via `notFound()`)
- Single data point shows "check back tomorrow" message, not a broken chart
- Both 1-day and 7-day change badges show (or "—" if no history)

---

## Phase 6 — Internationalization

### Task 6.1 — Dictionary setup

**Goal:** i18n string source-of-truth.

**Files created:**
- `web/dictionaries/en.json`
- `web/dictionaries/ne.json`
- `web/lib/dictionary.ts`

`getDictionary(locale)` loads and returns the typed JSON for the given
locale. See `frontend-guidelines.md` §3 for the full dictionary structure
and all required keys.

**Done When:**
- `getDictionary("en")` and `getDictionary("ne")` return correctly typed
  objects
- No untranslated strings in `ne.json` (all keys present with Nepali
  values)

---

### Task 6.2 — Locale-aware routing

**Goal:** restructure pages under `app/[locale]/`, add middleware.

**Files created/moved:**
- `web/app/[locale]/layout.tsx` — replaces root layout as the locale-
  aware wrapper; receives `params.locale`; sets `<html lang={locale}>`
- `web/app/[locale]/page.tsx` — dashboard (moved from `app/page.tsx`)
- `web/app/[locale]/vegetables/page.tsx`
- `web/app/[locale]/fruits/page.tsx`
- `web/app/[locale]/fish/page.tsx`
- `web/app/[locale]/commodity/[slug]/page.tsx`
- `web/middleware.ts`

**Middleware must:**
1. On first visit to `/`, detect preferred locale via `Accept-Language`
   header
2. Set `NEXT_LOCALE` cookie
3. Redirect to `/en` or `/ne`
4. On subsequent visits to `/`, read `NEXT_LOCALE` cookie and redirect to
   remembered locale
5. Pass through all other routes unchanged

**TypeScript convention:**
```ts
type Locale = "en" | "ne";

// Validate locale param in every page:
if (!["en", "ne"].includes(params.locale)) notFound();
```

**Done When:**
- `http://localhost:3000` redirects to `/en` or `/ne`
- `/en` and `/ne` both serve the dashboard in correct language
- `/en/vegetables` and `/ne/vegetables` serve correct content
- `/fr` returns 404
- `NEXT_LOCALE` cookie is set on first visit and respected on subsequent visits
- Language switcher in header navigates between locales preserving path

---

### Task 6.3 — Language switcher

**Goal:** interactive locale toggle in the header.

**File updated:**
- `web/components/layout/LanguageSwitcher.tsx`

**Must implement:**
- Client Component
- Reads current path, replaces locale segment:
  `/en/commodity/slug` → `/ne/commodity/slug`
- Updates `NEXT_LOCALE` cookie on switch
- `aria-label` in both languages (e.g. "Switch to Nepali" / "नेपालीमा बदल्नुहोस्")

**Done When:**
- Toggle navigates between `/en/...` and `/ne/...` preserving the full path
  and `?q=` param
- Cookie is updated on switch
- Screen reader label is present

---

### Task 6.4 — Apply translations and Nepali formatting

**Goal:** all pages consume dictionary strings; formatters produce locale-
appropriate output.

**Pages updated:** all pages receive `params.locale`, call
`getDictionary(locale)`, and pass translated strings to components as
props (not via context or client-side i18n). Components never call
`getDictionary` — they receive strings as props.

**Formatters updated:**
- `formatPrice(value, unit, locale)` — Nepali unit abbreviation for `"ne"`
- `formatBSDate(dateStr, "ne")` — Devanagari digits for BS date (English
  AD date as secondary label)
- Prices and percentages: Arabic numerals in both locales (confirmed,
  `frontend-guidelines.md` §4)

**Done When:**
- Switching to `/ne` shows all UI labels in Nepali script
- Commodity names shown in Nepali (`name_ne`) on Nepali pages
- Price values remain in Arabic numerals on both locales
- BS dates in Devanagari digits on Nepali locale

---

## Phase 7 — SEO

> SEO is a primary acquisition channel (PRD §1). This is not a polish
> phase — these tasks are required for the project to meet its stated goals.

### Task 7.1 — Per-page metadata

**Goal:** every public page generates a unique, descriptive `<title>` and
`<meta name="description">`.

**Pattern** (Next.js App Router):
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const dict = await getDictionary(params.locale);
  // return locale-appropriate title + description
}
```

**Required pages and example metadata:**

| Page | English title | Nepali title |
|---|---|---|
| Dashboard | "Today's Kalimati Market Prices — Krishi Mulya" | "आजको कालीमाटी बजार मूल्य — कृषि मूल्य" |
| `/vegetables` | "Today's Vegetable Prices in Nepal — Kalimati Market" | "आजको तरकारी मूल्य — कालीमाटी बजार" |
| `/fruits` | "Today's Fruit Prices in Nepal — Kalimati Market" | "आजको फलफूल मूल्य — कालीमाटी बजार" |
| `/fish` | "Today's Fish Prices in Nepal — Kalimati Market" | "आजको माछा मूल्य — कालीमाटी बजार" |
| `/commodity/[slug]` | "[Commodity Name] Price Today — Kalimati Market" | "[नेपाली नाम] को आजको मूल्य" |

**Done When:**
- Every public page has a unique `<title>` in the correct language
- Every public page has a `<meta name="description">` in the correct language
- No two pages share the same title

---

### Task 7.2 — Canonical and hreflang tags

**Goal:** search engines understand the relationship between `/en/` and
`/ne/` versions of each page.

**In `[locale]/layout.tsx`** (or per-page `generateMetadata`):
```ts
alternates: {
  canonical: `https://krishimulya.com/${locale}/${rest}`,
  languages: {
    "en": `https://krishimulya.com/en/${rest}`,
    "ne": `https://krishimulya.com/ne/${rest}`,
    "x-default": `https://krishimulya.com/en/${rest}`,
  },
}
```

**Done When:**
- Every `/en/...` page has `hreflang="ne"` pointing to `/ne/...` equivalent
- Every `/ne/...` page has `hreflang="en"` pointing to `/en/...` equivalent
- Every page has `hreflang="x-default"` pointing to its `/en/...` version
- Every page is self-canonical

---

### Task 7.3 — XML sitemap

**Goal:** all public pages discoverable by search engine crawlers.

**File created:**
- `web/app/sitemap.ts`

**Must include:**
- `/en` and `/ne` (dashboard)
- `/en/vegetables`, `/ne/vegetables`
- `/en/fruits`, `/ne/fruits`
- `/en/fish`, `/ne/fish`
- `/en/commodity/[slug]` and `/ne/commodity/[slug]` for all active
  commodities (fetched from Supabase at build/request time)

**Exclusions:** `?q=` search result URLs must not appear in the sitemap.

**Done When:**
- `http://localhost:3000/sitemap.xml` returns valid XML
- All commodity slugs × 2 locales × categories are present
- No search/query URLs included

---

### Task 7.4 — Robots.txt

**File created:**
- `web/app/robots.ts`

```ts
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/*?q=" },
    sitemap: "https://krishimulya.com/sitemap.xml",
  };
}
```

**Done When:**
- `http://localhost:3000/robots.txt` is accessible and correct
- `?q=` search URLs are disallowed

---

### Task 7.5 — Structured data (JSON-LD)

**Goal:** enable rich results for commodity price pages.

**Target schema:** `Dataset` or `ItemList` — not a perfect fit for
commodity prices but the closest standard type. At minimum, add basic
`WebPage` / `WebSite` JSON-LD for the dashboard.

**File created:**
- `web/components/shared/JsonLd.tsx` — renders a `<script
  type="application/ld+json">` block, used in page layouts

**Done When:**
- Dashboard has `WebSite` JSON-LD with `potentialAction: SearchAction`
- Commodity pages have a `WebPage` schema with the commodity name and
  current average price

---

### Task 7.6 — Open Graph metadata

**Goal:** clean link previews when pages are shared on WhatsApp, Facebook,
Twitter.

**In `generateMetadata`:**
```ts
openGraph: {
  title: "...",
  description: "...",
  url: "https://krishimulya.com/en/commodity/tomato-big-nepali",
  siteName: "Krishi Mulya",
  locale: "en_US", // or "ne_NP"
}
```

**Done When:**
- Sharing a commodity URL on WhatsApp generates a clean preview with
  title and description (test via meta tag debugger)

---

## Phase 8 — Alerts Interest Capture

### Task 8.1 — Server Action

**Goal:** store alert interest signups in the database.

**File created:**
- `web/lib/actions/alerts.ts`

```ts
"use server";

export async function submitAlertInterest(
  locale: "en" | "ne",
  sourcePage: string,
  formData: FormData
) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "invalid_email" };

  const { error } = await supabase
    .from("alert_interest")
    .upsert(
      { email, locale, source_page: sourcePage },
      { onConflict: "email", ignoreDuplicates: true }
    );

  if (error) return { error: "db_error" };
  return { success: true };
}
```

**Done When:**
- Submitting a valid email inserts a row in `alert_interest`
- Resubmitting the same email + locale is a no-op (no duplicate row)
- Invalid email format returns error without touching the DB

---

### Task 8.2 — AlertSignupForm component

**Goal:** UI for the alert interest capture.

**File created:**
- `web/components/alerts/AlertSignupForm.tsx`

**Must implement:**
- Client Component
- Props: `locale`, `sourcePage`, `dict` (translated strings)
- States:
  - Default: email input + submit button
  - Success: form replaced with "Thanks! We'll notify you when alerts
    launch."
  - Error: inline error message, form remains interactive
- Email format validated client-side before submit (basic — `@` present)
- Calls `submitAlertInterest` Server Action on form submit

**Placements (from `app-flow.md` §4.4):**
1. Dashboard — full section with heading
2. Commodity detail pages — compact inline CTA with commodity name in
   the heading (e.g. "Get notified when Tomato prices change")

**Done When:**
- Email submission stores a row in `alert_interest` with correct
  `source_page` value
- Success state renders after submission
- Form handles network/DB error gracefully
- Form is present in both dashboard and commodity detail pages

---

## Phase 9 — Production Readiness

### Task 9.1 — Vercel deployment

**Goal:** app is live on Vercel.

**Steps:**
1. Push repo to GitHub
2. Import project in Vercel — set Root Directory to `web/`
3. Add all environment variables from `.env.example` in Vercel Project
   Settings
4. Deploy
5. Verify cron job visible in Vercel → Project → Cron Jobs tab

**Done When:**
- Production URL resolves
- `/en` and `/ne` both serve correctly in production
- Vercel Cron shows scheduled job at `00:45 UTC`

---

### Task 9.2 — Trigger and verify first production scrape

**Goal:** confirm the cron route works in production, not just locally.

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" \
  https://your-app.vercel.app/api/cron
```

**Done When:**
- Response: `{ ok: true, date: "...", matchedCount: 98, unmatched: 0 }`
- Production dashboard shows real price data

---

### Task 9.3 — Verify all launch states

**Goal:** confirm the app handles real-world launch conditions, not just
the happy path.

| State | How to verify |
|---|---|
| No previous-day comparison | On day 1, all `change_1d_pct` values are null — dashboard shows "—" badges, not errors |
| Single data point on chart | Day 1 commodity pages show "check back tomorrow" message, not a broken chart |
| Stale data (scrape skipped) | Manually set `price_date` to yesterday; verify dashboard shows "last updated [date]" notice, not a blank page |
| Empty category | If a category has zero rows, page shows correct empty state |
| Invalid commodity slug | `/en/commodity/nonexistent-slug` returns the Next.js 404 page |
| Alert form duplicate | Submit same email twice; second submit shows success (no error to the user) |

**Done When:**
- All six states verified manually in production

---

### Task 9.4 — Error logging check

**Goal:** scrape failures are detectable without checking manually.

**Minimum viable approach for MVP:**
- Vercel Functions logs are already available in the Vercel dashboard
- `/api/cron` logs unmatched commodities and any thrown errors
- A Vercel log alert (free feature) can notify via email when a function
  errors

**Optional enhancement:** add a simple `/api/health` route that returns
the date of the most recent `daily_prices` row — allows external uptime
monitors (e.g. UptimeRobot free tier) to alert if data goes stale.

**Done When:**
- Vercel log alerts configured for cron function errors
- (Optional) `/api/health` returns `{ latestDate: "...", staleDays: 0 }`

---

## Appendix: File Creation Order

For AI coding agents: create files in this order to avoid import errors.

```
1.  supabase/schema.sql
2.  web/ (Next.js init)
3.  web/lib/supabase.ts          (types + client)
4.  web/lib/commodityMap.ts
5.  web/lib/format.ts
6.  web/lib/scraper.ts
7.  web/lib/queries/prices.ts
8.  web/lib/actions/alerts.ts
9.  web/lib/dictionary.ts
10. web/dictionaries/en.json
11. web/dictionaries/ne.json
12. web/scripts/scrape.ts
13. web/app/api/cron/route.ts
14. web/middleware.ts
15. web/components/layout/Header.tsx
16. web/components/layout/Footer.tsx
17. web/components/layout/LanguageSwitcher.tsx
18. web/components/layout/Breadcrumbs.tsx
19. web/components/shared/SearchBar.tsx
20. web/components/shared/JsonLd.tsx
21. web/components/commodity/PriceChangeBadge.tsx
22. web/components/commodity/PriceTable.tsx
23. web/components/commodity/PriceCardList.tsx
24. web/components/commodity/PriceChart.tsx
25. web/components/commodity/CommodityStats.tsx
26. web/components/alerts/AlertSignupForm.tsx
27. web/app/[locale]/layout.tsx
28. web/app/[locale]/page.tsx
29. web/app/[locale]/vegetables/page.tsx
30. web/app/[locale]/fruits/page.tsx
31. web/app/[locale]/fish/page.tsx
32. web/app/[locale]/commodity/[slug]/page.tsx
33. web/app/sitemap.ts
34. web/app/robots.ts
35. web/vercel.json
```
