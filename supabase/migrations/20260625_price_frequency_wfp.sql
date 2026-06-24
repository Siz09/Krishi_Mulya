-- =============================================================================
-- Migration: price_frequency + staple category + WFP source
-- Run in: Supabase Dashboard → SQL Editor → New Query → Run
--
-- Safe to re-run (all statements are idempotent).
-- Run BEFORE deploying the updated scraper code.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Add price_frequency column to daily_prices
--    'daily'   = Kalimati / AMPIS (scrapes today's market data)
--    'monthly' = WFP / HDX (one reading per month, retail retail markets)
-- ---------------------------------------------------------------------------
ALTER TABLE daily_prices
  ADD COLUMN IF NOT EXISTS price_frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (price_frequency IN ('daily', 'monthly'));


-- ---------------------------------------------------------------------------
-- 2. Update the unique constraint to include price_frequency
--    Existing constraint: (commodity_id, market, source_id, price_date)
--    New constraint:      (commodity_id, market, source_id, price_date, price_frequency)
--    This allows the same commodity/market/date to have BOTH a daily wholesale
--    row AND a monthly retail row from different sources.
-- ---------------------------------------------------------------------------
ALTER TABLE daily_prices DROP CONSTRAINT IF EXISTS daily_prices_commodity_id_market_source_id_price_date_key;
ALTER TABLE daily_prices ADD CONSTRAINT daily_prices_unique
  UNIQUE (commodity_id, market, source_id, price_date, price_frequency);


-- ---------------------------------------------------------------------------
-- 3. Expand the commodities category CHECK constraint to include 'staple'
--    Postgres doesn't support ADD VALUE to a CHECK inline — we drop + re-add.
-- ---------------------------------------------------------------------------
ALTER TABLE commodities DROP CONSTRAINT IF EXISTS commodities_category_check;
ALTER TABLE commodities ADD CONSTRAINT commodities_category_check
  CHECK (category IN (
    'vegetable', 'fruit', 'fish',
    'meat', 'dairy', 'spice',
    'leafy_green', 'mushroom',
    'root_vegetable', 'legume', 'other',
    'staple'   -- WFP: rice, wheat, lentils, oil, sugar, salt
  ));


-- ---------------------------------------------------------------------------
-- 4. Add WFP as a source
-- ---------------------------------------------------------------------------
INSERT INTO sources (slug, name, website, is_independent, source_type)
VALUES (
  'wfp',
  'WFP / HDX Food Prices',
  'https://data.humdata.org/dataset/wfp-food-prices-for-nepal',
  true,
  'api'
)
ON CONFLICT (slug) DO NOTHING;


-- ---------------------------------------------------------------------------
-- 5. Add index for price_frequency queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_daily_prices_frequency
  ON daily_prices(price_frequency, price_date DESC);


-- ---------------------------------------------------------------------------
-- 6. Rebuild daily_consensus_prices to be frequency-aware
--    Groups by (commodity_id, market, price_date, price_frequency) so daily
--    and monthly rows are never averaged together.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW daily_consensus_prices AS
SELECT
  commodity_id,
  market,
  price_date,
  price_frequency,
  ROUND(AVG(avg_price), 2)   AS avg_price,
  ROUND(AVG(min_price), 2)   AS min_price,
  ROUND(AVG(max_price), 2)   AS max_price,
  COUNT(DISTINCT source_id)  AS source_count,
  CASE
    WHEN COUNT(DISTINCT source_id) <= 1
      THEN 'High (Single Source)'
    WHEN (MAX(avg_price) - MIN(avg_price)) / NULLIF(AVG(avg_price), 0) < 0.03
      THEN 'High (Consensus)'
    WHEN (MAX(avg_price) - MIN(avg_price)) / NULLIF(AVG(avg_price), 0) < 0.10
      THEN 'Medium'
    ELSE 'Low (Discrepancy)'
  END AS confidence
FROM daily_prices
GROUP BY commodity_id, market, price_date, price_frequency;


-- ---------------------------------------------------------------------------
-- 7. Rebuild price_changes (LAG window) to partition by frequency too
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW price_changes AS
SELECT
  commodity_id,
  market,
  price_date,
  price_frequency,
  avg_price,
  min_price,
  max_price,
  source_count,
  confidence,
  LAG(avg_price, 1) OVER (
    PARTITION BY commodity_id, market, price_frequency ORDER BY price_date
  ) AS avg_price_1d_ago,
  LAG(avg_price, 7) OVER (
    PARTITION BY commodity_id, market, price_frequency ORDER BY price_date
  ) AS avg_price_7d_ago
FROM daily_consensus_prices;


-- ---------------------------------------------------------------------------
-- 8. Rebuild latest_prices_with_changes to expose price_frequency
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW latest_prices_with_changes AS
SELECT
  c.id          AS commodity_id,
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
  CASE
    WHEN pc.avg_price_1d_ago IS NOT NULL AND pc.avg_price_1d_ago != 0
    THEN ROUND(
      ((pc.avg_price - pc.avg_price_1d_ago) / pc.avg_price_1d_ago) * 100, 2
    )
    ELSE NULL
  END AS change_1d_pct,
  CASE
    WHEN pc.avg_price_7d_ago IS NOT NULL AND pc.avg_price_7d_ago != 0
    THEN ROUND(
      ((pc.avg_price - pc.avg_price_7d_ago) / pc.avg_price_7d_ago) * 100, 2
    )
    ELSE NULL
  END AS change_7d_pct
FROM commodities c
JOIN price_changes pc ON pc.commodity_id = c.id
WHERE pc.price_date = (
  SELECT MAX(dp2.price_date)
  FROM daily_consensus_prices dp2
  WHERE dp2.commodity_id = c.id
    AND dp2.market       = pc.market
    AND dp2.price_frequency = pc.price_frequency
);
