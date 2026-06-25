# Krishi Mulya

Nepal agricultural price intelligence (Kalimati + AMPIS wholesale, WFP monthly retail).
Bilingual (en/ne), Supabase + Next.js 16 App Router, deployed on Vercel.

## Workspaces

- `web/` — Next.js 16 app. See [web/CLAUDE.md](web/CLAUDE.md).
- `supabase/` — canonical `schema.sql` + incremental migrations. Run `schema.sql` first, then migrations in order.

## Environment

All env vars live in `web/.env.local`. See `web/.env.example` for the template.
Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.

## Where to look

- Project pitch + data-flow diagram → top-level [README.md](README.md)
- Full architecture/install → top-level README
- Daily price logic → `web/lib/scraper.ts`
- Frontend query layer → `web/lib/queries/prices.ts`
- DB shape → `web/lib/supabase.ts` (canonical types) + `supabase/schema.sql`
