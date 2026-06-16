# Backend Structure — Krishi Mulya (कृषि मूल्य)

> **Status:** ✅ Final for MVP — confirmed after discussion.
>
> **Audience:** Human developer + AI coding agents (e.g. Antigravity)
> working in this repo. This file defines the **database schema, views,
> RLS policies, scraper architecture, data access layer, and server
> actions**. Technology choices live in `tech-stack.md`; screen-level
> consumption of this data lives in `app-flow.md` and
> `frontend-guidelines.md`.
>
> **⚠️ Migration note:** the existing `supabase/schema.sql` and repo
> structure (from the initial scaffold) predate several decisions here —
> notably the `price_pct_change()` function + `latest_prices` view are
> **replaced** (not supplemented) by `price_changes` +
> `latest_prices_with_changes` below, and the standalone `/scraper` folder
> is **removed**. `implementation-plan.md` should sequence these changes
> explicitly rather than treating this as a from-scratch build.

---

## Table of Contents

1. [Layer Responsibilities](#1-layer-responsibilities)
2. [Database Schema](#2-database-schema)
3. [Views & Computed Data](#3-views--computed-data)
4. [Data Integrity Rules](#4-data-integrity-rules)
5. [Row Level Security Summary](#5-row-level-security-summary)
6. [Scraper Architecture](#6-scraper-architecture)
7. [Data Access Layer (`lib/queries`)](#7-data-access-layer-libqueries)
8. [Server Actions](#8-server-actions)
9. [Search Implementation](#9-search-implementation)
10. [Folder Structure (`web/lib`)](#10-folder-structure-weblib)
11. [Decisions Log](#11-decisions-log)

---

## 1. Layer Responsibilities

| Layer | Responsibility |
|---|---|
| `web/app/api/cron/route.ts` | Thin trigger — auth check, calls `runScrape()`, returns result |
| `web/lib/scraper.ts` | All scraping/parsing/upsert logic — single source of truth |
| `web/lib/queries/` | Read queries used by pages (Server Components) |
| `web/lib/actions/` | Server Actions for mutations (alert signup) |
| Supabase Postgres | Storage, views for computed data, RLS for access control |

Route handlers and Server Components **never contain business logic
directly** — they call into `lib/`.

---

## 2. Database Schema

### `commodities`

```sql
create table if not exists commodities (
  id          serial primary key,
  slug        text unique not null,
  name_en     text not null,
  name_ne     text not null,
  unit        text not null default 'kg',
  category    text not null default 'vegetable', -- vegetable | fruit | fish
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_commodities_category on commodities(category);
```

### `daily_prices`

```sql
create table if not exists daily_prices (
  id            bigserial primary key,
  commodity_id  int not null references commodities(id) on delete cascade,
  market        text not null default 'kalimati',
  price_date    date not null,
  min_price     numeric(10,2),
  max_price     numeric(10,2),
  avg_price     numeric(10,2),
  unit          text not null default 'kg',
  scraped_at    timestamptz not null default now(),
  unique (commodity_id, market, price_date)
);

create index if not exists idx_daily_prices_date on daily_prices(price_date desc);
create index if not exists idx_daily_prices_commodity on daily_prices(commodity_id, price_date desc);
```

### `alert_interest` *(new — Phase 2 signal capture)*

```sql
create table if not exists alert_interest (
  id           bigserial primary key,
  email        text not null,
  locale       text not null check (locale in ('en', 'ne')),
  source_page  text not null, -- 'dashboard' | 'vegetables' | 'fruits' | 'fish' | 'commodity/<slug>'
  created_at   timestamptz not null default now(),
  unique (email)
);
```

> `unique(email)` — the current product promise is "notify me when alerts
> launch," not "subscribe to a locale-specific alert stream." `locale` is
> retained as an analytics signal (which language the user was on when they
> signed up) but is not part of the uniqueness constraint. If locale-specific
> alert subscriptions arrive later, a dedicated `subscriptions` table is
> introduced at that point rather than overloading this interest-capture table.

### Phase 2+ tables (schema reserved, not used by v1 app code)

`price_alerts`, `alert_log`, `organizations`, `organization_members` — kept
as defined in the original scaffold's `schema.sql` for forward-compatibility
with the roadmap in `prd.md` §10. No v1 page or query touches these; they
exist so the schema doesn't need a breaking migration when Phase 2/4 begin.

---

## 3. Views & Computed Data

### `price_changes` — row-to-row deltas via window functions

```sql
create or replace view price_changes as
select
  commodity_id,
  market,
  price_date,
  avg_price,
  min_price,
  max_price,
  lag(avg_price, 1) over (
    partition by commodity_id, market order by price_date
  ) as avg_price_1d_ago,
  lag(avg_price, 7) over (
    partition by commodity_id, market order by price_date
  ) as avg_price_7d_ago
from daily_prices;
```

### `latest_prices_with_changes` — the dashboard's primary data source

```sql
create or replace view latest_prices_with_changes as
select
  c.id as commodity_id,
  c.slug,
  c.name_en,
  c.name_ne,
  c.unit,
  c.category,
  pc.market,
  pc.price_date,
  pc.avg_price,
  pc.min_price,
  pc.max_price,
  case
    when pc.avg_price_1d_ago is not null and pc.avg_price_1d_ago != 0
    then round(((pc.avg_price - pc.avg_price_1d_ago) / pc.avg_price_1d_ago) * 100, 2)
    else null
  end as change_1d_pct,
  case
    when pc.avg_price_7d_ago is not null and pc.avg_price_7d_ago != 0
    then round(((pc.avg_price - pc.avg_price_7d_ago) / pc.avg_price_7d_ago) * 100, 2)
    else null
  end as change_7d_pct
from commodities c
join price_changes pc on pc.commodity_id = c.id
where pc.market = 'kalimati'
  and pc.price_date = (
    select max(price_date) from daily_prices dp2
    where dp2.commodity_id = c.id and dp2.market = 'kalimati'
  );
```

**One query** returns everything the dashboard/category pages need: latest
price, min/max, and both 1-day and 7-day % change — for all ~98
commodities.

**Commodity detail page** queries this view filtered to a single `slug`
(for the stats/change badges) **and** queries raw `daily_prices` separately
for the chart's historical series (see `getCommodityHistory` in
[Section 6](#6-data-access-layer-libqueries)).

**Removed:** `price_pct_change(commodity_id, days)` function and the old
`latest_prices` view — both superseded by the above.

---

## 4. Data Integrity Rules

These rules are first-class constraints — not implementation suggestions.
AI coding agents must treat them as invariants and never generate code
that violates them.

### Commodity slug immutability

```
Slugs are generated once, at commodity creation time, and never
regenerated automatically — even if name_en or name_ne changes later.
```

Slugs are public URL identifiers (`/en/commodity/tomato-big-nepali`).
Changing a slug after launch causes broken links, sitemap churn, lost
backlinks, and SEO ranking instability. If a commodity name is corrected,
update `name_en` / `name_ne` only — the `slug` column is immutable.

If a commodity is truly retired and a new one replaces it (different
product, not a name correction), insert a new row with a new slug and
set `active = false` on the old one. Never reuse or regenerate slugs.

### One price row per commodity per market per day

```sql
-- Already defined in daily_prices:
unique (commodity_id, market, price_date)
```

This constraint guarantees idempotency: the scraper can run multiple
times for the same day without creating duplicate rows. The upsert
pattern is:

```ts
await supabase
  .from("daily_prices")
  .upsert(rows, { onConflict: "commodity_id,market,price_date" });
```

Never remove or relax this constraint — it is the foundation of safe
re-runs and backfill tooling.

---

## 5. Row Level Security Summary

| Table / View | Public (anon) read | Public (anon) write |
|---|---|---|
| `commodities` | ✅ Yes | ❌ No |
| `daily_prices` | ✅ Yes | ❌ No |
| `price_changes`, `latest_prices_with_changes` | ✅ Yes (inherits from base tables) | — |
| `alert_interest` | ❌ No (no SELECT policy) | ✅ INSERT only |
| `price_alerts`, `organizations`, etc. (Phase 2+) | Scoped to `auth.uid()` | Scoped to `auth.uid()` |

```sql
alter table alert_interest enable row level security;

create policy "Anyone can submit interest" on alert_interest
  for insert with check (true);
-- Deliberately no SELECT policy: the anon key can never read the
-- alert_interest table. Only the service-role key (admin access) can.
```

Writes to `commodities`/`daily_prices` happen exclusively via the
service-role key (scraper) — anon key never writes to these tables.

---

## 6. Scraper Architecture

### `web/lib/scraper.ts` — single source of truth

```ts
export type ScrapeResult = {
  date: string;
  matchedCount: number;
  unmatched: { raw: string; cleaned: string }[];
};

export async function runScrape(opts?: { date?: string }): Promise<ScrapeResult> {
  // 1. Fetch https://kalimatimarket.gov.np/price
  // 2. Parse table via cheerio
  // 3. Convert Devanagari numerals, normalise commodity names
  // 4. Match against commodityMap
  // 5. Upsert into daily_prices for `opts.date ?? today` (AD)
  // 6. Return matched count + unmatched names for logging
}
```

- **Idempotent:** safe to re-run for the same date — upsert keyed on
  `(commodity_id, market, price_date)`.
- **`opts.date`** overrides the stored `price_date` (useful for
  testing/manual correction). It does **not** change which page is
  fetched — the source only ever exposes "today's" snapshot. True
  historical backfill via `/price-history` is a **flagged future
  enhancement**, not implemented in v1 (see `implementation-plan.md`).

### `web/app/api/cron/route.ts` — thin trigger

```ts
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runScrape();
  return NextResponse.json(result);
}
```

### `web/scripts/scrape.ts` — local/manual CLI

```ts
// Usage: npx tsx scripts/scrape.ts [--date YYYY-MM-DD]
import { runScrape } from "../lib/scraper";

const dateArg = process.argv.includes("--date")
  ? process.argv[process.argv.indexOf("--date") + 1]
  : undefined;

runScrape({ date: dateArg }).then((result) => {
  console.log(result);
  process.exit(0);
});
```

Both entry points import the same `runScrape()` — no duplicated logic.

---

## 7. Data Access Layer (`lib/queries`)

### `web/lib/queries/prices.ts`

```ts
/** Dashboard / category pages — one query for prices + changes. */
export async function getLatestPrices(opts?: {
  category?: "vegetable" | "fruit" | "fish";
  search?: string;
}): Promise<LatestPriceWithChange[]>

/** Commodity detail — stats + change badges for one commodity. */
export async function getCommodityWithChange(
  slug: string
): Promise<LatestPriceWithChange | null>

/** Commodity detail — historical series for the chart. */
export async function getCommodityHistory(
  slug: string,
  days: number = 90
): Promise<{ commodity: Commodity | null; history: DailyPrice[] }>
```

- `getLatestPrices` queries `latest_prices_with_changes`, optionally
  filtered by `category` (`.eq("category", ...)`) and `search` (see
  [Section 8](#8-search-implementation)).
- `getCommodityWithChange` queries the same view filtered to one `slug` —
  used for the 1-day/7-day change badges on the detail page.
- `getCommodityHistory` is unchanged from the original scaffold — queries
  `commodities` + `daily_prices` directly for the chart's time series.

---

## 8. Server Actions

### `web/lib/actions/alerts.ts`

```ts
"use server";

export async function submitAlertInterest(formData: FormData) {
  const email = formData.get("email") as string;
  const locale = formData.get("locale") as "en" | "ne";
  const sourcePage = formData.get("source_page") as string;

  // basic validation, then:
  await supabase
    .from("alert_interest")
    .upsert(
      { email, locale, source_page: sourcePage },
      { onConflict: "email,locale", ignoreDuplicates: true }
    );

  return { success: true };
}
```

Called directly from `AlertSignupForm` (a Client Component) via the
`action` prop — no API route involved, per Next.js's recommended pattern
for form mutations.

---

## 9. Search Implementation

```ts
if (search) {
  query = query.or(
    `name_en.ilike.%${search}%,name_ne.ilike.%${search}%`
  );
}
```

**Explicitly documented behavior** (important for AI coding agents, who
might otherwise implement only the active-locale field):

- **Case-insensitive** (`ilike`)
- **Substring match** (`%term%`, not exact match)
- **Both `name_en` and `name_ne` are searched, regardless of UI locale** —
  a Nepali-locale user typing "tomato" or an English-locale user typing
  "गोलभेडा" both return correct results.

---

## 10. Folder Structure (`web/lib`)

Combining backend (this doc) and frontend (`frontend-guidelines.md`)
concerns into the full `lib/` layout:

```
web/lib/
  supabase.ts          # Supabase client + shared TypeScript types
  scraper.ts           # runScrape() — scraping, parsing, upsert
  commodityMap.ts       # Nepali -> English commodity mapping (TS)
  dictionary.ts         # getDictionary(locale) — i18n strings
  format.ts             # formatPrice, formatChange, formatBSDate
  queries/
    prices.ts            # getLatestPrices, getCommodityWithChange, getCommodityHistory
  actions/
    alerts.ts             # submitAlertInterest (Server Action)

web/scripts/
  scrape.ts              # local/manual CLI, imports lib/scraper.ts
```

**Removed from original scaffold:** the top-level `/scraper` folder
(`scraper/index.js`, `scraper/commodityMap.js`, `scraper/supabaseClient.js`,
`scraper/package.json`) — fully absorbed into `web/lib/` + `web/scripts/`.

---

## 11. Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-06 | Removed standalone `/scraper` folder; consolidated into `web/lib/scraper.ts` + `web/scripts/scrape.ts` | Single source of truth — route handler becomes a thin trigger, no logic drift between two copies |
| 2026-06 | `runScrape({ date? })` is idempotent and accepts an optional date override | Nearly free to support; enables safe re-runs and future backfill tooling without redesign |
| 2026-06 | `date` param controls stored `price_date`, not the fetched page | The live source only exposes "today" — true historical backfill via `/price-history` is a flagged future enhancement, not implied as working now |
| 2026-06 | Replaced `price_pct_change()` function + `latest_prices` view with `price_changes` (LAG-based) + `latest_prices_with_changes` views | One query for ~98 commodities instead of ~196 per-row function calls (1d + 7d) on every dashboard render |
| 2026-06 | `alert_interest.unique(email, locale)` instead of `unique(email)` | Future-proofs against EN/NE becoming separate alert products; negligible cost now |
| 2026-06 | `alert_interest` has INSERT policy only, no SELECT | Anon key can never read the email list — privacy by default |
| 2026-06 | Server Action (`submitAlertInterest`) instead of an API route | Next.js's recommended pattern for form mutations; one less route to maintain |
| 2026-06 | `alert_interest.unique(email)` instead of `unique(email, locale)` | Current promise is "notify me when alerts launch" — not locale-specific subscriptions. `locale` kept as analytics signal only. Locale-specific subscriptions get a dedicated table if/when that feature arrives |
| 2026-06 | Slug immutability: slugs generated once, never regenerated | Slugs are public SEO URLs — changing them causes broken links, lost rankings, sitemap churn. Name corrections update `name_en`/`name_ne` only |
| 2026-06 | `unique(commodity_id, market, price_date)` on `daily_prices` | Guarantees idempotent scraper re-runs; foundation for safe backfill tooling |
