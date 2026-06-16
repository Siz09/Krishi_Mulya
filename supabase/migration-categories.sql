-- ─── 4. Expand commodities.category constraint ───────────────────────────────
-- Drop old 3-value constraint and replace with all 11 AMPIS categories.
-- Run AFTER the previous migration blocks have been applied.
alter table commodities
  drop constraint if exists commodities_category_check;

alter table commodities
  add constraint commodities_category_check
  check (category in (
    'vegetable', 'fruit', 'fish',
    'meat', 'dairy', 'spice',
    'leafy_green', 'mushroom',
    'root_vegetable', 'legume', 'other'
  ));
