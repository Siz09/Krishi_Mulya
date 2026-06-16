// Single source of truth for all Kalimati scraping logic.
// Imported by:
//   - web/app/api/cron/route.ts   (Vercel Cron trigger)
//   - web/scripts/scrape.ts       (manual CLI)
//
// Never import this from a Client Component or browser code.

import axios from "axios";
import * as cheerio from "cheerio";
import { createClient } from "@supabase/supabase-js";
import { COMMODITY_MAP, COMMODITIES } from "./commodityMap";

// ─── Service-role Supabase client (bypasses RLS) ─────────────────────────────
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// This file must only ever be imported in server-side / Node.js contexts.
function getServiceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars. " +
        "Check web/.env.local and Vercel project settings."
    );
  }
  return createClient(url, key);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ScrapeResult = {
  ok: boolean;
  date: string;               // ISO date "YYYY-MM-DD" stored in daily_prices
  matchedCount: number;
  unmatched: { raw: string; cleaned: string }[];
  error?: string;
};

// ─── Devanagari numeral conversion ───────────────────────────────────────────
// The Kalimati table uses Devanagari digits with a "रू" prefix.
// e.g. "रू ६३.७५" → 63.75

const DEVANAGARI_DIGITS: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

export function devanagariToNumber(raw: string): number | null {
  // Strip currency prefix, whitespace, commas
  const cleaned = raw
    .replace(/रू\s*/g, "")
    .replace(/,/g, "")
    .trim()
    .replace(/[०-९]/g, (d) => DEVANAGARI_DIGITS[d] ?? d);

  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

// ─── Commodity name normalisation ────────────────────────────────────────────
// The table contains unit suffixes embedded in the name column on some rows,
// but based on live inspection the table structure is:
//   col 0: commodity name (Nepali)  col 1: unit  col 2: min  col 3: max  col 4: avg
// This function strips any trailing parenthetical unit suffix just in case.

export function normaliseCommodityName(raw: string): string {
  return raw
    .replace(/\s*\(के\.जी\.\)\s*$/u, "")
    .replace(/\s*\(दर्जन\)\s*$/u, "")
    .replace(/\s*\(प्रति गोटा\)\s*$/u, "")
    .replace(/\s*\(केजी\)\s*$/u, "")
    .trim();
}

// ─── HTML table fetch & parse ─────────────────────────────────────────────────

type RawRow = {
  rawName: string;
  unit: string;
  minPrice: number | null;
  maxPrice: number | null;
  avgPrice: number | null;
};

async function fetchPriceTable(): Promise<RawRow[]> {
  const res = await axios.get("https://kalimatimarket.gov.np/price", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; KrishiMulyaBot/1.0; +https://krishimulya.com)",
      "Accept-Language": "ne,en;q=0.9",
    },
    timeout: 20000,
  });

  const $ = cheerio.load(res.data);
  const rows: RawRow[] = [];

  // Table structure confirmed from live site (June 2026):
  //   col 0: commodity name (Nepali)
  //   col 1: unit text (के.जी., दर्जन, प्रति गोटा …)
  //   col 2: min price  (Devanagari, "रू XXX.XX")
  //   col 3: max price  (Devanagari, "रू XXX.XX")
  //   col 4: avg price  (Devanagari, "रू XXX.XX")
  $("table tbody tr").each((_, el) => {
    const cells = $(el).find("td");
    if (cells.length < 5) return; // skip header / malformed rows

    const rawName = $(cells[0]).text().trim();
    const unit = $(cells[1]).text().trim();
    const minPrice = devanagariToNumber($(cells[2]).text());
    const maxPrice = devanagariToNumber($(cells[3]).text());
    const avgPrice = devanagariToNumber($(cells[4]).text());

    if (rawName) {
      rows.push({ rawName, unit, minPrice, maxPrice, avgPrice });
    }
  });

  return rows;
}

// ─── AMPIS Scraper ──────────────────────────────────────────────────────────

const AMPIS_MARKETS = [
  { id: "5", slug: "birtamod" },
  { id: "6", slug: "dharan" },
  { id: "7", slug: "dhalkebar" },
  { id: "8", slug: "kamalamai" },
  { id: "9", slug: "kawasoti" },
  { id: "10", slug: "pokhara" },
  { id: "11", slug: "butwal" },
  { id: "12", slug: "kohalpur" },
  { id: "13", slug: "birendranagar" },
  { id: "14", slug: "attariya" },
  { id: "15", slug: "lalbandi" },
  { id: "23", slug: "kalimati" },
];

async function fetchAmpisDateIds(): Promise<{ yearId: string; monthId: string }> {
  try {
    const res = await axios.get("https://ampis.gov.np", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 10000,
    });
    const $ = cheerio.load(res.data);

    // Extract selected or first year option
    const yearId = $("#edit-field-market-rate-year-target-id-entityreference-filter option[selected]").attr("value") || 
                   $("#edit-field-market-rate-year-target-id-entityreference-filter option").eq(1).attr("value") || 
                   "1614822"; // 2083 default
    
    // Extract date text to find current month
    let dateText = "";
    $("p, div, span").each((_, el) => {
      const txt = $(el).text().trim();
      if (txt.includes("मिति:") || txt.includes("मिति :")) {
        dateText = txt;
        return false;
      }
    });

    let monthId = "35"; // Asar default
    if (dateText) {
      const match = dateText.match(/मिति\s*:\s*([^\s]+)\s+(\d+),\s*(\d+)/) || 
                    dateText.match(/मिति\s*:\s*([^\s\d]+)/);
      if (match) {
        const rawMonthName = match[1];
        const monthOptions: { value: string; name: string }[] = [];
        $("#edit-field-market-rate-month-target-id option").each((_, el) => {
          const val = $(el).attr("value") || "";
          const text = $(el).text().trim();
          if (val !== "All") {
            monthOptions.push({ value: val, name: text });
          }
        });
        const foundMonth = monthOptions.find(o => rawMonthName.includes(o.name) || o.name.includes(rawMonthName));
        if (foundMonth) {
          monthId = foundMonth.value;
        }
      }
    }

    return { yearId, monthId };
  } catch (err) {
    console.warn("[scraper] Failed to fetch AMPIS date IDs, using defaults:", err);
    return { yearId: "1614822", monthId: "35" };
  }
}

async function fetchAmpisPriceTable(marketId: string, yearId: string, monthId: string): Promise<RawRow[]> {
  try {
    const res = await axios.get("https://ampis.gov.np/market-price-comparison", {
      params: {
        uid_entityreference_filter: marketId,
        field_market_rate_commodity_target_id_entityreference_filter: "All",
        field_market_rate_year_target_id_entityreference_filter: yearId,
        field_market_rate_month_target_id: monthId,
      },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      timeout: 15000,
    });
    const $ = cheerio.load(res.data);
    const rows: RawRow[] = [];
    
    $("table").each((_, tableEl) => {
      $(tableEl).find("tbody tr").each((_, tr) => {
        const cells = $(tr).find("td");
        if (cells.length >= 8) {
          const rawName = $(cells[3]).text().trim();
          const unit = $(cells[4]).text().trim();
          const minPrice = parseFloat($(cells[5]).text().replace(/[^\d.]/g, "")) || null;
          const maxPrice = parseFloat($(cells[6]).text().replace(/[^\d.]/g, "")) || null;
          const avgPrice = parseFloat($(cells[7]).text().replace(/[^\d.]/g, "")) || null;
          if (rawName) {
            rows.push({ rawName, unit, minPrice, maxPrice, avgPrice });
          }
        }
      });
    });
    return rows;
  } catch (err) {
    console.warn(`[scraper] AMPIS market ${marketId} fetch timed out/failed. Skipping.`);
    return [];
  }
}

// ─── Main scrape function ─────────────────────────────────────────────────────

export async function runScrape(opts?: {
  /** Override the stored price_date. Useful for testing or manual re-runs.
   *  Does NOT change which page is fetched — the source only serves today's data. */
  date?: string;
}): Promise<ScrapeResult> {
  const supabase = getServiceClient();

  // Determine the price date to store (AD / Gregorian)
  const priceDate =
    opts?.date ?? new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

  let rawRows: RawRow[];
  try {
    rawRows = await fetchPriceTable();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[scraper] Failed to fetch price table:", message);
    return { ok: false, date: priceDate, matchedCount: 0, unmatched: [], error: message };
  }

  if (rawRows.length === 0) {
    const error = "Zero rows parsed from Kalimati table — site structure may have changed";
    console.error("[scraper]", error);
    return { ok: false, date: priceDate, matchedCount: 0, unmatched: [], error };
  }

  // ── Step 1: sync all commodities from the map to the DB ─────────────────────
  console.log(`[scraper] Syncing ${COMMODITIES.length} commodities from map to DB...`);
  const { error: insertErr } = await supabase.from("commodities").upsert(
    COMMODITIES.map((c) => ({
      slug: c.slug,
      name_en: c.name_en,
      name_ne: c.name_ne,
      unit: c.unit,
      category: c.category,
      active: true,
    })),
    { onConflict: "slug" }
  );
  if (insertErr) {
    throw new Error(`Failed to sync commodities: ${insertErr.message}`);
  }
  console.log("[scraper] Commodities synced successfully.");

  // Load source mapping slug -> id from database
  const { data: sourceRows, error: sourceErr } = await supabase
    .from("sources")
    .select("id, slug");

  if (sourceErr || !sourceRows || sourceRows.length === 0) {
    throw new Error(`Failed to load sources mapping: ${sourceErr?.message}`);
  }
  const sourceMap = new Map(sourceRows.map((s) => [s.slug, s.id]));

  const { data: commodityRows, error: reloadErr } = await supabase
    .from("commodities")
    .select("id, slug, name_ne");

  if (reloadErr || !commodityRows) {
    throw new Error(`Failed to reload commodities: ${reloadErr?.message}`);
  }

  const dbMap = new Map(commodityRows.map((c) => [c.name_ne, c]));

  // ── Step 2: match raw rows → commodity IDs ────────────────────────────────
  type UpsertRow = {
    commodity_id: number;
    market: string;
    source_id: number;
    price_date: string;
    min_price: number | null;
    max_price: number | null;
    avg_price: number | null;
    unit: string;
  };

  const toUpsert: UpsertRow[] = [];
  const unmatched: { raw: string; cleaned: string }[] = [];

  const officialSourceId = sourceMap.get("official")!;
  const ampisSourceId = sourceMap.get("ampis")!;

  // 1. Process Kalimati - Official (scraped)
  for (const row of rawRows) {
    const cleaned = normaliseCommodityName(row.rawName);
    const mapEntry = COMMODITY_MAP.get(cleaned);

    if (!mapEntry) {
      unmatched.push({ raw: row.rawName, cleaned });
      continue;
    }

    const dbEntry = dbMap.get(mapEntry.name_ne);
    if (!dbEntry) {
      unmatched.push({ raw: row.rawName, cleaned });
      continue;
    }

    toUpsert.push({
      commodity_id: dbEntry.id,
      market: "kalimati",
      source_id: officialSourceId,
      price_date: priceDate,
      min_price: row.minPrice,
      max_price: row.maxPrice,
      avg_price: row.avgPrice,
      unit: mapEntry.unit,
    });
  }

  // 2. Fetch AMPIS year and month IDs dynamically
  const { yearId, monthId } = await fetchAmpisDateIds();
  console.log(`[scraper] AMPIS dynamic IDs resolved: Year ID = ${yearId}, Month ID = ${monthId}`);

  // 3. Process AMPIS markets sequentially
  for (const m of AMPIS_MARKETS) {
    console.log(`[scraper] Scraping AMPIS market: ${m.slug} (ID: ${m.id})...`);
    const marketRows = await fetchAmpisPriceTable(m.id, yearId, monthId);
    console.log(`[scraper] Parsed ${marketRows.length} rows for market: ${m.slug}`);
    
    for (const row of marketRows) {
      const cleaned = normaliseCommodityName(row.rawName);
      const mapEntry = COMMODITY_MAP.get(cleaned);

      if (!mapEntry) {
        // Log or track unmatched if helpful, or skip
        continue;
      }

      const dbEntry = dbMap.get(mapEntry.name_ne);
      if (!dbEntry) {
        continue;
      }

      toUpsert.push({
        commodity_id: dbEntry.id,
        market: m.slug,
        source_id: ampisSourceId,
        price_date: priceDate,
        min_price: row.minPrice,
        max_price: row.maxPrice,
        avg_price: row.avgPrice,
        unit: mapEntry.unit,
      });
    }
  }

  // ── Step 3: upsert into daily_prices ──────────────────────────────────────
  if (toUpsert.length > 0) {
    const { error: upsertErr } = await supabase
      .from("daily_prices")
      .upsert(toUpsert, { onConflict: "commodity_id,market,source_id,price_date" });

    if (upsertErr) {
      throw new Error(`Upsert failed: ${upsertErr.message}`);
    }
  }

  // ── Step 4: log results ───────────────────────────────────────────────────
  if (unmatched.length > 0) {
    console.warn(
      `[scraper] ${unmatched.length} unmatched commodities (add to commodityMap.ts):`,
      unmatched
    );
  }

  console.log(
    `[scraper] Done. date=${priceDate} matched=${toUpsert.length} unmatched=${unmatched.length}`
  );

  if (toUpsert.length === 0) {
    const error = "Zero commodities matched — commodity map may be out of date";
    console.error("[scraper]", error);
    return { ok: false, date: priceDate, matchedCount: 0, unmatched, error };
  }

  return {
    ok: true,
    date: priceDate,
    matchedCount: toUpsert.length,
    unmatched,
  };
}
