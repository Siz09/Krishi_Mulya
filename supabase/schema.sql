-- =============================================================================
-- Krishi Mulya — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- For incremental migrations, see: supabase/migrations/
--
-- Sections:
--   1. Tables & Indexes
--   2. Row Level Security (RLS)
--   3. Views (daily_consensus_prices, price_changes, latest_prices_with_changes)
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
  category   text not null default 'vegetable'
               -- Kalimati + AMPIS categories:
               check (category in (
                 'vegetable', 'fruit', 'fish',
                 'meat', 'dairy', 'spice',
                 'leafy_green', 'mushroom',
                 'root_vegetable', 'legume', 'other',
                 'staple'   -- WFP: rice, wheat, lentils, cooking oil, sugar, salt
               )),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_commodities_category
  on commodities(category);

create index if not exists idx_commodities_slug
  on commodities(slug);


-- ---------------------------------------------------------------------------
-- sources
-- Independent data sources or mirrors representing price information.
-- ---------------------------------------------------------------------------
create table if not exists sources (
  id             serial primary key,
  slug           text unique not null,
  name           text not null,
  website        text,
  is_independent boolean not null default true,
  source_type    text not null check (source_type in ('board', 'mirror', 'cooperative', 'api', 'other')),
  created_at     timestamptz not null default now()
);


-- ---------------------------------------------------------------------------
-- daily_prices
-- One row per commodity × market × source × day.
-- ---------------------------------------------------------------------------
create table if not exists daily_prices (
  id              bigserial primary key,
  commodity_id    int not null references commodities(id) on delete cascade,
  market          text not null default 'kalimati',
  source_id       int not null references sources(id) on delete cascade,
  price_date      date not null,
  price_frequency text not null default 'daily'
                    check (price_frequency in ('daily', 'monthly')),
  min_price       numeric(10, 2),
  max_price       numeric(10, 2),
  avg_price       numeric(10, 2),
  unit            text not null default 'kg',
  scraped_at      timestamptz not null default now(),

  -- One price row per commodity per market per source per day per frequency.
  -- This allows the same commodity/market/date to have both a daily wholesale
  -- row (Kalimati/AMPIS) AND a monthly retail row (WFP) without conflict.
  unique (commodity_id, market, source_id, price_date, price_frequency)
);

create index if not exists idx_daily_prices_date
  on daily_prices(price_date desc);

create index if not exists idx_daily_prices_commodity
  on daily_prices(commodity_id, price_date desc);

create index if not exists idx_daily_prices_frequency
  on daily_prices(price_frequency, price_date desc);


-- ---------------------------------------------------------------------------
-- alert_interest
-- Phase 1 interest-capture only — no actual alert sending in v1.
-- ---------------------------------------------------------------------------
create table if not exists alert_interest (
  id          bigserial primary key,
  email       text not null,
  locale      text not null check (locale in ('en', 'ne')),
  source_page text not null,
  created_at  timestamptz not null default now(),

  unique (email)
);


-- =============================================================================
-- 2. ROW LEVEL SECURITY
-- =============================================================================

alter table commodities    enable row level security;
alter table sources        enable row level security;
alter table daily_prices   enable row level security;
alter table alert_interest enable row level security;

-- commodities: public read, no public write.
create policy "Public can read commodities"
  on commodities for select
  using (true);

-- sources: public read, no public write.
create policy "Public can read sources"
  on sources for select
  using (true);

-- daily_prices: public read, no public write.
create policy "Public can read daily_prices"
  on daily_prices for select
  using (true);

-- alert_interest: INSERT only via anon key — no SELECT.
create policy "Anyone can submit interest"
  on alert_interest for insert
  with check (true);


-- =============================================================================
-- 3. VIEWS
-- =============================================================================

-- ---------------------------------------------------------------------------
-- daily_consensus_prices
-- Aggregates multiple source observations per commodity per market per day.
-- Groups by price_frequency so daily and monthly data are NEVER mixed.
-- ---------------------------------------------------------------------------
create or replace view daily_consensus_prices as
select
  commodity_id,
  market,
  price_date,
  price_frequency,
  round(avg(avg_price), 2)  as avg_price,
  round(avg(min_price), 2)  as min_price,
  round(avg(max_price), 2)  as max_price,
  count(distinct source_id) as source_count,
  case
    when count(distinct source_id) <= 1 then 'High (Single Source)'
    when (max(avg_price) - min(avg_price)) / nullif(avg(avg_price), 0) < 0.03 then 'High (Consensus)'
    when (max(avg_price) - min(avg_price)) / nullif(avg(avg_price), 0) < 0.10 then 'Medium'
    else 'Low (Discrepancy)'
  end as confidence
from daily_prices
group by commodity_id, market, price_date, price_frequency;


-- ---------------------------------------------------------------------------
-- price_changes
-- Adds LAG-based window columns for 1-day and 7-day previous avg prices.
-- Partitions by price_frequency so daily/monthly changes never cross-pollinate.
-- ---------------------------------------------------------------------------
create or replace view price_changes as
select
  commodity_id,
  market,
  price_date,
  price_frequency,
  avg_price,
  min_price,
  max_price,
  source_count,
  confidence,
  lag(avg_price, 1) over (
    partition by commodity_id, market, price_frequency order by price_date
  ) as avg_price_1d_ago,
  lag(avg_price, 7) over (
    partition by commodity_id, market, price_frequency order by price_date
  ) as avg_price_7d_ago
from daily_consensus_prices;


-- ---------------------------------------------------------------------------
-- latest_prices_with_changes
-- Primary data source for the dashboard and category pages.
-- Exposes price_frequency so the UI can show 'Daily Wholesale' vs
-- 'Monthly Retail' badges without additional queries.
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
  pc.price_frequency,
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
    select max(dp2.price_date)
    from daily_consensus_prices dp2
    where dp2.commodity_id    = c.id
      and dp2.market          = pc.market
      and dp2.price_frequency = pc.price_frequency
  );


-- =============================================================================
-- 4. PHASE 2+ RESERVED TABLES
-- =============================================================================

create table if not exists price_alerts (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  commodity_id int not null references commodities(id) on delete cascade,
  threshold    numeric(10, 2) not null,
  direction    text not null check (direction in ('above', 'below')),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

create table if not exists alert_log (
  id             bigserial primary key,
  price_alert_id bigint not null references price_alerts(id) on delete cascade,
  sent_at        timestamptz not null default now(),
  channel        text not null check (channel in ('sms', 'email')),
  status         text not null check (status in ('sent', 'failed'))
);

create table if not exists organizations (
  id         bigserial primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  id              bigserial primary key,
  organization_id bigint not null references organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null default 'member' check (role in ('owner', 'member')),
  joined_at       timestamptz not null default now(),
  unique (organization_id, user_id)
);

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
