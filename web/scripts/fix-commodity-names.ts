// One-time script: updates commodity names in the DB to match the corrected
// commodity map. Run this once after fixing name mismatches.
// Usage: npx tsx scripts/fix-commodity-names.ts

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import { createClient } from "@supabase/supabase-js";
import { COMMODITIES } from "../lib/commodityMap";

const supabase = createClient(
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  console.log("Fetching existing commodities from DB...");
  const { data: existing, error } = await supabase
    .from("commodities")
    .select("id, slug, name_ne");

  if (error || !existing) {
    console.error("Failed to fetch:", error);
    process.exit(1);
  }

  const bySlug = new Map(existing.map((c) => [c.slug, c]));
  const mapBySlug = new Map(COMMODITIES.map((c) => [c.slug, c]));

  let updated = 0;
  let inserted = 0;

  for (const def of COMMODITIES) {
    const dbRow = bySlug.get(def.slug);

    if (!dbRow) {
      // New commodity — insert it
      const { error: insertErr } = await supabase.from("commodities").insert({
        slug: def.slug,
        name_en: def.name_en,
        name_ne: def.name_ne,
        unit: def.unit,
        category: def.category,
        active: true,
      });
      if (insertErr) {
        console.error(`Failed to insert ${def.slug}:`, insertErr.message);
      } else {
        console.log(`  ➕ Inserted: ${def.slug}`);
        inserted++;
      }
    } else if (dbRow.name_ne !== def.name_ne) {
      // Name mismatch — update it
      const { error: updateErr } = await supabase
        .from("commodities")
        .update({ name_ne: def.name_ne, name_en: def.name_en })
        .eq("id", dbRow.id);

      if (updateErr) {
        console.error(`Failed to update ${def.slug}:`, updateErr.message);
      } else {
        console.log(`  ✏️  Updated: ${def.slug}  (${dbRow.name_ne} → ${def.name_ne})`);
        updated++;
      }
    }
  }

  console.log(`\nDone. Updated: ${updated}, Inserted: ${inserted}`);
}

main().catch(console.error);
