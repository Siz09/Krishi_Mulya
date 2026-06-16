// Thin Vercel Cron trigger — all logic lives in lib/scraper.ts.
// Called daily by Vercel Cron at 00:45 UTC (~06:30 NPT).
//
// Security: requires the Authorization header to match CRON_SECRET.
// This prevents arbitrary parties from triggering scrapes.

import { type NextRequest, NextResponse } from "next/server";
import { runScrape } from "@/lib/scraper";

// Vercel Cron requires dynamic rendering (no static caching)
export const dynamic = "force-dynamic";

// Allow up to 60 seconds for the scrape to complete
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[cron] CRON_SECRET env var is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Run scrape ──────────────────────────────────────────────────────────────
  try {
    const result = await runScrape();
    const status = result.ok ? 200 : 500;
    return NextResponse.json(result, { status });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron] Unexpected error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
