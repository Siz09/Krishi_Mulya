/**
 * One-off WFP historical data backfill script.
 *
 * Downloads the full WFP Nepal food prices CSV (~5 MB, 45k rows, 2001-2026)
 * and loads ALL historical monthly data into daily_prices.
 *
 * Usage:
 *   npx tsx scripts/backfill-wfp.ts
 *   npx tsx scripts/backfill-wfp.ts --from 2020-01  # only from this year-month
 *   npx tsx scripts/backfill-wfp.ts --dry-run        # count rows without inserting
 *
 * Run ONCE after the migration SQL has been applied.
 * Safe to re-run (upsert is idempotent keyed on commodity_id+market+source_id+price_date+price_frequency).
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

import axios from "axios";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase service-role client ─────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseKey);

// ─── WFP config (same as in scraper.ts) ──────────────────────────────────────
const WFP_CSV_URL =
  "https://data.humdata.org/dataset/0e8b1b84-8e55-4aec-bc45-0c7d2c92d32e/resource/10bae3d7-82bf-4caf-a216-5fb4a8ff6e43/download/wfp_food_prices_npl.csv";

const WFP_COMMODITY_MAP: Record<string, string> = {
  "Rice (coarse)":           "rice-coarse",
  "Rice (medium quality)":   "rice-coarse",
  "Wheat flour":             "wheat-flour",
  "Lentils (red)":           "lentils-red",
  "Lentils (yellow)":        "lentils-red",
  "Cooking oil (vegetable)": "cooking-oil",
  "Oil (vegetable)":         "cooking-oil",
  "Sugar":                   "sugar",
  "Salt (iodized)":          "salt",
  "Salt":                    "salt",
};

const WFP_MARKET_MAP: Record<string, string> = {
  "Kathmandu":  "kathmandu-retail",
  "Pokhara":    "pokhara-retail",
  "Dhankuta":   "dhankuta-retail",
  "Banke":      "banke-retail",
  "Surkhet":    "surkhet-retail",
  "Kailali":    "kailali-retail",
  "Jumla":      "jumla-retail",
  "Dhanusha":   "dhanusha-retail",
  "Rupandehi":  "rupandehi-retail",
  "Ilam":       "ilam-retail",
  "Jhapa":      "jhapa-retail",
  "Tansen":     "tansen-retail",
  "Rolpa":      "rolpa-retail",
  "Achham":     "achham-retail",
};

const BATCH_SIZE = 500; // rows per upsert batch

// ─── Argument parsing ─────────────────────────────────────────────────────────
const isDryRun = process.argv.includes("--dry-run");
const fromIdx = process.argv.indexOf("--from");
const fromMonth = fromIdx !== -1 ? process.argv[fromIdx + 1] : null; // "YYYY-MM"

async function main() {
  console.log("=== WFP Historical Backfill ===");
  if (isDryRun) console.log("[dry-run mode — no data will be written]");
  if (fromMonth) console.log(`[filtering: only rows from ${fromMonth} onward]`);

  // 1. Download CSV
  console.log("\n[1] Downloading WFP Nepal CSV...");
  const res = await axios.get(WFP_CSV_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; KrishiMulyaBot/1.0; +https://krishimulya.com)" },
    timeout: 60000,
    responseType: "text",
  });
  const lines = (res.data as string).split("\n");
  console.log(`    Downloaded ${lines.length.toLocaleString()} lines`);

  // 2. Load DB mappings
  console.log("\n[2] Loading DB mappings...");
  const { data: sources } = await supabase.from("sources").select("id, slug");
  const { data: commodities } = await supabase.from("commodities").select("id, slug");

  if (!sources || !commodities) {
    console.error("Failed to load sources or commodities from DB");
    process.exit(1);
  }

  const sourceMap = new Map(sources.map((s: any) => [s.slug, s.id]));
  const slugToId = new Map(commodities.map((c: any) => [c.slug, c.id]));

  const wfpSourceId = sourceMap.get("wfp");
  if (!wfpSourceId) {
    console.error("WFP source not found in DB. Run the migration SQL first:\n  supabase/migrations/20260625_price_frequency_wfp.sql");
    process.exit(1);
  }
  console.log(`    WFP source ID: ${wfpSourceId}`);
  console.log(`    Known commodities: ${slugToId.size}`);

  // 3. Parse CSV
  console.log("\n[3] Parsing CSV rows...");
  type Row = {
    commodity_id: number;
    market: string;
    source_id: number;
    price_date: string;
    price_frequency: "monthly";
    min_price: null;
    max_price: null;
    avg_price: number;
    unit: string;
  };

  const rows: Row[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = line.split(",");
    if (cols.length < 15) continue;

    const [dateStr, , , marketName, , , , , commodityName, , unitStr, , priceType, currency, priceStr] = cols;

    if (priceType !== "Retail" || currency !== "NPR") { skipped++; continue; }
    if (fromMonth && dateStr.slice(0, 7) < fromMonth) { skipped++; continue; }

    const commoditySlug = WFP_COMMODITY_MAP[commodityName.trim()];
    if (!commoditySlug) { skipped++; continue; }

    const marketSlug = WFP_MARKET_MAP[marketName.trim()];
    if (!marketSlug) { skipped++; continue; }

    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) { skipped++; continue; }

    const commodityId = slugToId.get(commoditySlug);
    if (!commodityId) { skipped++; continue; }

    rows.push({
      commodity_id: commodityId,
      market: marketSlug,
      source_id: wfpSourceId,
      price_date: dateStr.trim(),
      price_frequency: "monthly",
      min_price: null,
      max_price: null,
      avg_price: price,
      unit: unitStr.trim().toLowerCase() === "kg" ? "kg" : "liter",
    });
  }

  console.log(`    Matched: ${rows.length.toLocaleString()} rows`);
  console.log(`    Skipped: ${skipped.toLocaleString()} rows (non-retail, non-NPR, or unmapped)`);

  if (isDryRun) {
    console.log("\n[dry-run] Would insert/upsert these rows. Exiting without writing.");
    process.exit(0);
  }

  // 4. Upsert in batches
  console.log(`\n[4] Upserting ${rows.length.toLocaleString()} rows in batches of ${BATCH_SIZE}...`);
  let total = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("daily_prices")
      .upsert(batch, { onConflict: "commodity_id,market,source_id,price_date,price_frequency" });

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      process.exit(1);
    }
    total += batch.length;
    process.stdout.write(`\r    ${total.toLocaleString()} / ${rows.length.toLocaleString()} inserted`);
  }

  console.log("\n\n=== Backfill complete ===");
  console.log(`Total rows inserted/updated: ${total.toLocaleString()}`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
