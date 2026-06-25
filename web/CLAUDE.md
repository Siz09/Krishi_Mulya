# web workspace

<!-- BEGIN:nextjs-agent-rules -->
This is NOT the Next.js you know — Next 16 + React 19 have breaking changes.
Before writing App Router / route handler / params code, read the relevant
guide under `node_modules/next/dist/docs/`. Do not rely on training-data Next.js APIs.
<!-- END:nextjs-agent-rules -->

## Stack pins
- Next.js 16.2.9 (App Router) · React 19.2 · TypeScript 5 · Tailwind 4
- Supabase (anon for reads, service-role for scraper only)
- Recharts 3, cheerio, axios, nepali-date-converter

## Commands (pnpm preferred)
```bash
pnpm install
pnpm dev              # localhost:3000
pnpm build && pnpm start
pnpm lint

# CLI utilities (npx tsx …)
npx tsx scripts/fix-commodity-names.ts          # sync master commodity map
npx tsx scripts/backfill-wfp.ts                 # historical WFP import
npx tsx scripts/backfill-wfp.ts --dry-run       # preview mappings
npx tsx scripts/scrape.ts                       # run scraper today
npx tsx scripts/scrape.ts --date 2026-06-15     # back-scrape a date
```

## Layout
- `app/[locale]/*`          — every page is locale-prefixed (en | ne)
- `app/api/cron/route.ts`   — Vercel Cron entry, gated by `CRON_SECRET`
- `app/api/scraper-status/` — read-only run history
- `lib/scraper.ts`          — single source of truth for scraping (server-only)
- `lib/supabase.ts`         — anon client + canonical DB/view types (`Commodity`, `Source`, `DailyPrice`, `LatestPriceWithChange`)
- `lib/queries/prices.ts`   — Supabase query helpers used by server components
- `lib/commodityMap.ts`     — Nepali/English name → canonical slug
- `dictionaries/{en,ne}.json`
- `scripts/`                — CLI seeders/scrape/backfill (run with `npx tsx`)

## Dev gotchas
- **Devanagari numerals + currency**: Kalimati emits `रू ६३.७५`. Use `devanagariToNumber()` from `lib/scraper.ts` — do not roll your own.
- **Nepali unit suffixes**: `(के.जी.)`, `(दर्जन)`, `(प्रति गोटा)`, `(केजी)` must be stripped before name normalization. See `normaliseCommodityName()`.
- **Two Supabase clients**: anon (`lib/supabase.ts`) for browser + server components; service-role ONLY inside `lib/scraper.ts`. Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
- **Type discipline**: import `Commodity`, `DailyPrice`, `LatestPriceWithChange` etc. from `lib/supabase.ts`. Don't redeclare per page.
- **i18n**: the middleware only redirects `/` based on cookie + Accept-Language. It does NOT do path-prefix routing. All pages must be under `app/[locale]/`.
- **Turbopack root**: `next.config.ts` sets `turbopack.root` to the repo root — keeps pnpm-workspace parent from triggering "multiple lockfiles".
- **DB writes**: only the cron route handler + scrape scripts may write. Frontend reads via anon key through RLS-protected views.

## Env vars (must match `web/.env.example`)
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (header check on `/api/cron`)
