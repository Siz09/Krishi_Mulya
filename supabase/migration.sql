-- ─── 1. Create sources table ────────────────────────────────────────────────
create table if not exists sources (
  id             serial primary key,
  slug           text unique not null,
  name           text not null,
  website        text,
  is_independent boolean not null default true,
  source_type    text not null check (source_type in ('board', 'mirror', 'cooperative', 'api', 'other')),
  created_at     timestamptz not null default now()
);

-- Enable RLS on sources
alter table sources enable row level security;
drop policy if exists "Public can read sources" on sources;
create policy "Public can read sources" on sources for select using (true);

-- Seed initial sources
insert into sources (slug, name, website, is_independent, source_type) values
  ('official', 'Official Board', 'https://kalimatimarket.gov.np', true, 'board'),
  ('ampis', 'Government AMPIS Feed', 'https://ampis.gov.np', true, 'api')
on conflict (slug) do update set
  name = excluded.name,
  website = excluded.website,
  is_independent = excluded.is_independent,
  source_type = excluded.source_type;

-- ─── 2. Update daily_prices structure ───────────────────────────────────────
-- Add source_id column referencing sources
alter table daily_prices add column if not exists source_id int references sources(id);

-- Update existing records to link to correct sources
update daily_prices dp
set source_id = s.id
from sources s
where dp.source = s.slug;

-- If there are any nulls left (unlikely), set them to official
update daily_prices set source_id = (select id from sources where slug = 'official') where source_id is null;

-- Make source_id NOT NULL
alter table daily_prices alter column source_id set not null;

-- Drop old unique constraint
alter table daily_prices drop constraint if exists daily_prices_commodity_id_market_source_price_date_key;

-- Add new unique constraint
alter table daily_prices add constraint daily_prices_commodity_id_market_source_id_price_date_key 
  unique (commodity_id, market, source_id, price_date);

-- Drop old source text column
alter table daily_prices drop column if exists source;

-- ─── 3. Re-create views referencing source_id ───────────────────────────────

create or replace view daily_consensus_prices as
select
  commodity_id,
  market,
  price_date,
  round(avg(avg_price), 2) as avg_price,
  round(avg(min_price), 2) as min_price,
  round(avg(max_price), 2) as max_price,
  count(distinct source_id) as source_count,
  case
    when count(distinct source_id) <= 1 then 'High (Single Source)'
    when (max(avg_price) - min(avg_price)) / nullif(avg(avg_price), 0) < 0.03 then 'High (Consensus)'
    when (max(avg_price) - min(avg_price)) / nullif(avg(avg_price), 0) < 0.10 then 'Medium'
    else 'Low (Discrepancy)'
  end as confidence
from daily_prices
group by commodity_id, market, price_date;

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
    select max(dp2.price_date)
    from daily_consensus_prices dp2
    where dp2.commodity_id = c.id
      and dp2.market = pc.market
  );
