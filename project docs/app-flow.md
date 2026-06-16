# App Flow — Krishi Mulya (कृषि मूल्य)

> **Status:** ✅ Final for MVP — confirmed after discussion.
>
> **Audience:** Human developer + AI coding agents (e.g. Antigravity)
> working in this repo. This file maps **screens, navigation, states, and
> user journeys**. Technology choices live in `tech-stack.md`; feature
> scope/rationale lives in `prd.md`; component-level conventions live in
> `frontend-guidelines.md`; data layer lives in `backend-structure.md`.

---

## Table of Contents

1. [Locale Routing Strategy](#1-locale-routing-strategy)
2. [Sitemap](#2-sitemap)
3. [Navigation Structure](#3-navigation-structure)
4. [Page Flows & States](#4-page-flows--states)
   - [4.1 Dashboard `/[locale]`](#41-dashboard-locale)
   - [4.2 Category Pages `/[locale]/[category]`](#42-category-pages-localecategory)
   - [4.3 Commodity Detail `/[locale]/commodity/[slug]`](#43-commodity-detail-localecommodityslug)
   - [4.4 Alerts Signup](#44-alerts-signup)
5. [Search & Filter Flow](#5-search--filter-flow)
6. [Language Switching Flow](#6-language-switching-flow)
7. [Price Change Indicator Logic](#7-price-change-indicator-logic)
8. [Data Flow (System-Level)](#8-data-flow-system-level)
9. [Error & Edge Cases](#9-error--edge-cases)
10. [Decisions Log](#10-decisions-log)

---

## 1. Locale Routing Strategy

- **Locale codes:** `en` (English), `ne` (Nepali) — ISO 639-1 language
  codes, not country codes.
- **Default locale:** `en`.
- **Root `/`:** middleware detects locale via `Accept-Language` header on
  first visit, redirects to `/en` or `/ne`, and sets a persistent cookie
  (e.g. `NEXT_LOCALE`). Subsequent visits to `/` redirect based on the
  cookie, skipping re-detection.
- **Canonical & hreflang:** every page is self-canonical. Each
  `/en/...` page declares `hreflang="ne"` → its `/ne/...` counterpart (and
  vice versa), plus `hreflang="x-default"` → the `/en/...` version.
- **Shared slugs across locales:** commodity slugs (`tomato-big-nepali`)
  and category slugs (`vegetables`, `fruits`, `fish`) are **identical**
  under both `/en/` and `/ne/` — only page *content* (UI strings, commodity
  names shown) changes with locale, not the URL path segments.

---

## 2. Sitemap

```
/                                    → redirect to /en or /ne (cookie/header-based)

/en                                  → Dashboard (English)
/en/vegetables                       → Vegetables category
/en/fruits                           → Fruits category
/en/fish                             → Fish category
/en/commodity/[slug]                 → Commodity detail (English)

/ne                                  → Dashboard (Nepali)
/ne/vegetables                       → Vegetables category (Nepali content)
/ne/fruits                           → Fruits category (Nepali content)
/ne/fish                             → Fish category (Nepali content)
/ne/commodity/[slug]                 → Commodity detail (Nepali content)
```

Query parameters (not separate routes, not indexed):

```
/en?q=tomato                         → Dashboard filtered by search term
/en/vegetables?q=carrot              → Category page filtered by search term
```

---

## 3. Navigation Structure

**Header** (present on all pages, part of `[locale]/layout.tsx`):

- Logo / brand name ("Krishi Mulya")
- Category nav links: All (dashboard) · Vegetables · Fruits · Fish — active
  category highlighted
- Language switcher (top-right) — see [Section 6](#6-language-switching-flow)

**Footer** (present on all pages):

- Data attribution: "Source: Kalimati Fruits & Vegetable Market Development
  Board, Government of Nepal" (per Non-Goals — always transparent about
  data source)
- Last updated date (Gregorian + Bikram Sambat)

**Breadcrumbs** (commodity detail pages only):

```
Home (Dashboard) > [Category] > [Commodity Name]
```

Breadcrumbs serve two purposes: (1) UX — since most visitors land directly
on commodity pages via search, breadcrumbs orient them; (2) SEO —
breadcrumb structured data (`BreadcrumbList` JSON-LD) is a low-cost rich
result enhancement.

---

## 4. Page Flows & States

### 4.1 Dashboard `/[locale]`

**Purpose:** show today's prices for all ~98 commodities; entry point for
browsing by category or searching.

| State | Trigger | What's shown |
|---|---|---|
| **Loaded** (normal) | Data exists for today (or most recent scrape) | Full price table: commodity name (both languages), min/max/avg, unit, price change badge |
| **Stale data** | Latest `price_date` is older than today (scrape failed/skipped) | Table still shown, but with a visible "Data last updated: [date]" notice — never hide stale data, just label it |
| **Empty** | No rows in `daily_prices` at all (pre-launch only) | Friendly message: "Price data will appear here once the first daily update runs." |
| **Search active** (`?q=...`) | User typed in search box | Table filtered to matches; "no results" message if zero matches |

**User actions:**
- Type in search box → URL updates to `?q=...` (see [Section 5](#5-search--filter-flow))
- Click a category nav link → navigate to `/[locale]/[category]`
- Click a commodity row → navigate to `/[locale]/commodity/[slug]`

### 4.2 Category Pages `/[locale]/[category]`

**Purpose:** SEO-targeted filtered views ("Today's Vegetable Prices in
Nepal"), independently indexable per locale.

- Same table/states as Dashboard, pre-filtered server-side by category
  (`vegetable` | `fruit` | `fish`)
- Unique `<title>` and meta description per category × locale (e.g., "Today's
  Vegetable Prices in Nepal | Kalimati Market" vs "आजको तरकारी मूल्य |
  कालीमाटी बजार")
- Search (`?q=...`) further filters within the category
- Active category highlighted in header nav

### 4.3 Commodity Detail `/[locale]/commodity/[slug]`

**Purpose:** primary SEO landing page. Must stand alone — most visitors
arrive here directly from search, not via the dashboard.

| State | Trigger | What's shown |
|---|---|---|
| **Full history** | ≥2 days of price data exist | Line chart (min/avg/max over time), current stats, price change badge vs. previous day/week, BS + AD dates |
| **Single data point** (launch state) | Only 1 day of data exists | Current stats shown normally; chart area replaced with a message: "Price history will appear here as data accumulates — check back tomorrow." Price change badge shows "—" |
| **Invalid slug** | Slug doesn't match any commodity | Standard Next.js 404 page |

**User actions:**
- Breadcrumb navigation back to category or dashboard
- Language switcher (preserves slug — see [Section 6](#6-language-switching-flow))
- Alerts CTA (see [4.4](#44-alerts-signup)) — compact, commodity-specific

### 4.4 Alerts Signup

Per PRD section 4.5 — interest capture only, no actual alert sending in v1.

**Two placements:**
1. **Dashboard** — full section: "Get notified about price changes
   (coming soon)" with email input
2. **Commodity detail pages** — compact inline CTA: "Get notified when
   [Tomato Big (Nepali)] prices change" with email input

Both placements feed the same table, differentiated by `source_page`,
which gives signal on which commodities/pages drive the most signup
interest.

**Flow:**

```
User enters email
      ↓
Client-side format validation
      ↓
Server Action: insert into alert_interest
  (email, locale, source_page, created_at)
  — ON CONFLICT (email) DO NOTHING (avoid duplicate rows on resubmission)
      ↓
Success state: form replaced with
  "Thanks! We'll notify you when alerts launch."
```

`source_page` values: `"dashboard"`, `"vegetables"`, `"fruits"`, `"fish"`,
or `"commodity/[slug]"`.

---

## 5. Search & Filter Flow

- Search state lives in the **URL query string** (`?q=...`), not hidden
  client state — enables shareable URLs, working browser back/forward, and
  cleaner analytics.
- Search input is a client component that updates the URL via
  `router.replace` (no scroll reset) as the user types (debounced ~300ms).
- The page component reads `searchParams.q` server-side and filters the
  commodity list before rendering — search works even with JS disabled
  (progressive enhancement via a `<form method="get">` fallback is a nice-
  to-have, not required for v1).
- Search is **not** a separate indexed route — `?q=` URLs are excluded from
  the sitemap and marked `noindex` (or simply not linked anywhere
  crawlable) to avoid thin-content duplicate pages.
- Search works in combination with category pages: `/en/vegetables?q=carrot`
  filters within the vegetables category.

---

## 6. Language Switching Flow

- Switcher swaps **only the locale segment** of the current path, preserving
  the rest of the path and query string:

```
/en/commodity/tomato-big-nepali?q=foo
      ↓ switch to Nepali
/ne/commodity/tomato-big-nepali?q=foo
```

- Switching locale **updates the `NEXT_LOCALE` cookie**, so a future visit
  to `/` redirects to the newly chosen locale.
- The switcher is always visible in the header, on every page.

---

## 7. Price Change Indicator Logic

- Computed using the `price_pct_change(commodity_id, days)` SQL function
  (defined in `supabase/schema.sql`), comparing today's `avg_price` to the
  value from `N` days ago.
- **v1 shows two comparisons:** vs. yesterday (1 day) and vs. last week (7
  days) — both shown on the commodity detail page; dashboard table shows
  only the 1-day comparison (space-constrained).
- **Display:** ▲ (up) / ▼ (down) / — (no data) with the percentage value
  always shown as text — never color-only, per accessibility requirement in
  the PRD.
- **Color convention:** for *vegetables/fruits/fish as a category*, there's
  no inherent "good" or "bad" direction (rising prices are good for farmers,
  bad for buyers) — so use neutral colors (e.g., a accent color for change,
  not red=bad/green=good) and let the arrow + number communicate direction.
  This avoids implicitly framing price increases as negative.

---

## 8. Data Flow (System-Level)

Brief pointer — full detail in `backend-structure.md`.

```
Vercel Cron (daily, ~06:45 NPT)
      ↓
/api/cron → scrapes kalimatimarket.gov.np/price
      ↓
Upserts into Supabase `daily_prices`
      ↓
Next.js pages (revalidate = 1800s) read fresh data
  via `latest_prices` view + `price_pct_change()`
```

No user action triggers data updates — this is a one-way daily pipeline.

---

## 9. Error & Edge Cases

| Case | Handling |
|---|---|
| No data at all (pre-launch) | Dashboard shows "data coming soon" message; commodity/category pages return 404 until commodities exist in DB |
| Scrape fails one day | Previous day's data remains visible with a "last updated [date]" notice — never show a blank dashboard due to a transient scrape failure |
| Invalid commodity slug | Standard 404 |
| Invalid/unsupported locale segment (e.g., `/fr/...`) | 404 (only `en`/`ne` are valid locale segments) |
| Search with zero matches | "No commodities match your search" message, with a link to clear the search |
| Duplicate alert signup email | `ON CONFLICT (email) DO NOTHING` — still show success message (don't reveal whether email was already registered) |

---

## 10. Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06 | URL-based locale routing (`en`/`ne`), not client-side toggle | SEO is the primary acquisition channel; separate indexable pages per language matter more than implementation simplicity |
| 2026-06 | Shared slugs across locales (commodity & category) | Avoids per-locale slug-translation tables; only content differs, not URL structure |
| 2026-06 | Dedicated category routes (`/vegetables`, `/fruits`, `/fish`) per locale | Low incremental cost once locale routing exists; enables independently-ranking category pages |
| 2026-06 | Category slugs stay in Latin script even under `/ne/` | SEO gain from translated slugs is minor vs. operational complexity; revisit later if data supports it |
| 2026-06 | Search state in URL query param (`?q=`) | Shareable URLs, working back button, easier analytics |
| 2026-06 | `alert_interest` table includes `source_page` | Cheap to add now; gives demand signal by page/commodity for later prioritization |
| 2026-06 | Alerts CTA on both dashboard and commodity pages | More signup surface area + richer `source_page` data, at negligible UI cost |
| 2026-06 | Price change indicators use neutral (non red/green) colors | Rising prices aren't inherently "bad" — avoids misleading framing for a price-info-only product |
| 2026-06 | Stale data shown with notice rather than hidden | Never show a blank/broken-looking dashboard due to a transient scrape failure |
