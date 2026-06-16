-- =============================================================================
-- Krishi Mulya — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Sections:
--   1. Tables & Indexes
--   2. Row Level Security (RLS)
--   3. Views (price_changes, latest_prices_with_changes)
--   4. Phase 2+ reserved tables (present but unused by v1 app code)
-- =============================================================================


-- =============================================================================
-- 1. TABLES & INDEXES
-- =============================================================================

-- ---------------------------------------------------------------------------
-- commodities
-- Master list of all ~98 tracked Kalimati commodities.
-- Slugs are IMMUTABLE once created — they are public SEO URLs.
-- Never regenerate slugs automatically, even if name_en/name_ne changes.
-- ---------------------------------------------------------------------------
create table if not exists commodities (
  id         serial primary key,
  slug       text unique not null,
  name_en    text not null,
  name_ne    text not null,
  unit       text not null default 'kg',      -- 'kg' | 'dozen' | 'piece'
  category   text not null default 'vegetable' -- 'vegetable' | 'fruit' | 'fish'
               check (category in ('vegetable', 'fruit', 'fish')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_commodities_category
  on commodities(category);

create index if not exists idx_commodities_slug
  on commodities(slug);


-- ---------------------------------------------------------------------------
-- daily_prices
-- One row per commodity × market × day.
-- The unique constraint makes the scraper idempotent — safe to re-run.
-- ---------------------------------------------------------------------------
create table if not exists daily_prices (
  id           bigserial primary key,
  commodity_id int not null references commodities(id) on delete cascade,
  market       text not null default 'kalimati',
  source       text not null default 'official',
  price_date   date not null,
  min_price    numeric(10, 2),
  max_price    numeric(10, 2),
  avg_price    numeric(10, 2),
  unit         text not null default 'kg',
  scraped_at   timestamptz not null default now(),

  -- Idempotency constraint: one price row per commodity per market per source per day.
  unique (commodity_id, market, source, price_date)
);

create index if not exists idx_daily_prices_date
  on daily_prices(price_date desc);

create index if not exists idx_daily_prices_commodity
  on daily_prices(commodity_id, price_date desc);


-- ---------------------------------------------------------------------------
-- alert_interest
-- Phase 1 interest-capture only — no actual alert sending in v1.
-- unique(email): one row per email address regardless of locale.
-- The 'locale' column is kept as an analytics signal only.
-- ---------------------------------------------------------------------------
create table if not exists alert_interest (
  id          bigserial primary key,
  email       text not null,
  locale      text not null check (locale in ('en', 'ne')),
  source_page text not null,
  -- 'dashboard' | 'vegetables' | 'fruits' | 'fish' | 'commodity/<slug>'
  created_at  timestamptz not null default now(),

  unique (email)
);


-- =============================================================================
-- 2. ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS on all tables.
alter table commodities    enable row level security;
alter table daily_prices   enable row level security;
alter table alert_interest enable row level security;

-- commodities: public read, no public write.
-- Writes happen exclusively via the service-role key in the scraper.
create policy "Public can read commodities"
  on commodities for select
  using (true);

-- daily_prices: public read, no public write.
create policy "Public can read daily_prices"
  on daily_prices for select
  using (true);

-- alert_interest: INSERT only via anon key — no SELECT (privacy by default).
-- The email list is never readable via the anon key.
create policy "Anyone can submit interest"
  on alert_interest for insert
  with check (true);
-- Deliberately NO SELECT policy on alert_interest.
-- Only the service-role key (admin access) can read it.


-- =============================================================================
-- 3. VIEWS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- daily_consensus_prices
-- Aggregates multiple source observations per commodity per market per day.
-- Calculates consensus averages and confidence labels.
-- ---------------------------------------------------------------------------
create or replace view daily_consensus_prices as
select
  commodity_id,
  market,
  price_date,
  round(avg(avg_price), 2) as avg_price,
  round(avg(min_price), 2) as min_price,
  round(avg(max_price), 2) as max_price,
  count(distinct source) as source_count,
  case
    when count(distinct source) <= 1 then 'High (Single Source)'
    when (max(avg_price) - min(avg_price)) / nullif(avg(avg_price), 0) < 0.03 then 'High (Consensus)'
    when (max(avg_price) - min(avg_price)) / nullif(avg(avg_price), 0) < 0.10 then 'Medium'
    else 'Low (Discrepancy)'
  end as confidence
from daily_prices
group by commodity_id, market, price_date;


-- ---------------------------------------------------------------------------
-- price_changes
-- Adds LAG-based window columns for 1-day and 7-day previous avg prices.
-- Used as the base for latest_prices_with_changes.
-- ---------------------------------------------------------------------------
create or replace view price_changes as
select
  commodity_id,
  market,
  price_date,
  avg_price,
  min_price,
  max_price,
  source_count,
  confidence,
  lag(avg_price, 1) over (
    partition by commodity_id, market order by price_date
  ) as avg_price_1d_ago,
  lag(avg_price, 7) over (
    partition by commodity_id, market order by price_date
  ) as avg_price_7d_ago
from daily_consensus_prices;


-- ---------------------------------------------------------------------------
-- latest_prices_with_changes
-- Primary data source for the dashboard and category pages.
-- Returns ONE row per commodity: the most recent price + % change vs 1d/7d ago.
-- One query for ~98 commodities instead of per-row function calls.
-- ---------------------------------------------------------------------------
create or replace view latest_prices_with_changes as
select
  c.id            as commodity_id,
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
  pc.source_count,
  pc.confidence,
  case
    when pc.avg_price_1d_ago is not null and pc.avg_price_1d_ago != 0
    then round(
      ((pc.avg_price - pc.avg_price_1d_ago) / pc.avg_price_1d_ago) * 100,
      2
    )
    else null
  end as change_1d_pct,
  case
    when pc.avg_price_7d_ago is not null and pc.avg_price_7d_ago != 0
    then round(
      ((pc.avg_price - pc.avg_price_7d_ago) / pc.avg_price_7d_ago) * 100,
      2
    )
    else null
  end as change_7d_pct
from commodities c
join price_changes pc on pc.commodity_id = c.id
where pc.price_date = (
    -- Subquery: find this commodity's most recent price date for this market
    select max(dp2.price_date)
    from daily_consensus_prices dp2
    where dp2.commodity_id = c.id
      and dp2.market = pc.market
  );


-- =============================================================================
-- 4. PHASE 2+ RESERVED TABLES
-- Schema reserved for forward-compatibility — not used by any v1 app code.
-- Present so Phase 2/4 begin without breaking migrations.
-- =============================================================================

-- price_alerts: per-user alert subscriptions (Phase 2)
create table if not exists price_alerts (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  commodity_id int not null references commodities(id) on delete cascade,
  threshold    numeric(10, 2) not null,
  direction    text not null check (direction in ('above', 'below')),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- alert_log: record of sent alert notifications (Phase 2)
create table if not exists alert_log (
  id             bigserial primary key,
  price_alert_id bigint not null references price_alerts(id) on delete cascade,
  sent_at        timestamptz not null default now(),
  channel        text not null check (channel in ('sms', 'email')),
  status         text not null check (status in ('sent', 'failed'))
);

-- organizations: cooperative / B2B accounts (Phase 4)
create table if not exists organizations (
  id         bigserial primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

-- organization_members: links users to organizations (Phase 4)
create table if not exists organization_members (
  id              bigserial primary key,
  organization_id bigint not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member' check (role in ('owner', 'member')),
  joined_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- RLS on Phase 2+ tables — scoped to auth.uid() (no public access)
alter table price_alerts          enable row level security;
alter table alert_log             enable row level security;
alter table organizations         enable row level security;
alter table organization_members  enable row level security;

create policy "Users manage own alerts"
  on price_alerts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users view own alert log"
  on alert_log for select
  using (
    exists (
      select 1 from price_alerts pa
      where pa.id = alert_log.price_alert_id
        and pa.user_id = auth.uid()
    )
  );

create policy "Users view own org memberships"
  on organization_members for select
  using (auth.uid() = user_id);

create policy "Org owners manage members"
  on organization_members for all
  using (
    exists (
      select 1 from organization_members om
      where om.organization_id = organization_members.organization_id
        and om.user_id = auth.uid()
        and om.role = 'owner'
    )
  );
