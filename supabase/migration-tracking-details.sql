-- =============================================================================
-- Migration: Add Product Images and Revert Cultivation/Tracking Details
-- =============================================================================

-- 0. Drop dependent view first to avoid dependency errors when dropping columns
drop view if exists latest_prices_with_changes;

-- 1. Ensure image_url column is added to commodities
alter table commodities add column if not exists image_url text;

-- 2. Clean up/remove other tracking columns if they were previously created
alter table commodities drop column if exists planting_date;
alter table commodities drop column if exists harvest_date;
alter table commodities drop column if exists cultivation_duration;
alter table commodities drop column if exists pesticides_sprays;
alter table commodities drop column if exists growing_region;
alter table commodities drop column if exists cultivation_location;

-- 3. Re-create the latest_prices_with_changes view to only select image_url
create or replace view latest_prices_with_changes as
select
  c.id            as commodity_id,
  c.slug,
  c.name_en,
  c.name_ne,
  c.unit,
  c.category,
  c.image_url,
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
