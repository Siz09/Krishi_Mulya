// Local / manual CLI scraper entry point.
// Usage:
//   npx tsx scripts/scrape.ts                     # scrape today
//   npx tsx scripts/scrape.ts --date 2026-06-15   # store under a specific date
//
// Both this script and web/app/api/cron/route.ts import the same runScrape()
// from lib/scraper.ts — there is no duplicated logic.

import { config } from "dotenv";
import { resolve } from "path";
// Load web/.env.local — Next.js uses .env.local, not the default .env
config({ path: resolve(__dirname, "../.env.local") });

import { runScrape } from "../lib/scraper";

const dateArg = process.argv.includes("--date")
  ? process.argv[process.argv.indexOf("--date") + 1]
  : undefined;

if (dateArg && !/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
  console.error("Invalid date format. Use YYYY-MM-DD.");
  process.exit(1);
}

runScrape({ date: dateArg })
  .then((result) => {
    console.log("\n── Scrape Result ──────────────────────");
    console.log(JSON.stringify(result, null, 2));
    console.log("───────────────────────────────────────\n");
    process.exit(result.ok ? 0 : 1);
  })
  .catch((err) => {
    console.error("[scrape CLI] Unexpected error:", err);
    process.exit(1);
  });
