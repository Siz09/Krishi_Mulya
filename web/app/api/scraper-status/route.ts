// Public read-only endpoint — no auth required (reads only public price data).
// Returns the freshness of each data source to power the footer health indicator.
//
// Called by: Footer.tsx (server component, fetches during render)
// Caching:   revalidates every 30 minutes

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 1800; // 30 minutes

export type ScraperStatusResponse = {
  kalimati: { lastDate: string | null; isStale: boolean; hoursAgo: number | null };
  wfp: { lastMonth: string | null; isStale: boolean };
  overall: "live" | "stale" | "unknown";
};

export async function GET() {
  try {
    // Check latest Kalimati daily price date
    const { data: kalimatiData } = await supabase
      .from("daily_prices")
      .select("price_date, scraped_at")
      .eq("market", "kalimati")
      .eq("price_frequency", "daily")
      .order("price_date", { ascending: false })
      .limit(1)
      .single();

    // Check latest WFP monthly price
    const { data: wfpData } = await supabase
      .from("daily_prices")
      .select("price_date")
      .eq("price_frequency", "monthly")
      .order("price_date", { ascending: false })
      .limit(1)
      .single();

    const now = new Date();

    // Kalimati freshness
    let kalimatiStatus: ScraperStatusResponse["kalimati"] = {
      lastDate: null,
      isStale: true,
      hoursAgo: null,
    };

    if (kalimatiData?.price_date) {
      const lastDate = new Date(kalimatiData.price_date + "T00:00:00Z");
      const hoursAgo = Math.round((now.getTime() - lastDate.getTime()) / 36e5);
      kalimatiStatus = {
        lastDate: kalimatiData.price_date,
        isStale: hoursAgo > 25, // stale if more than 25 hours old
        hoursAgo,
      };
    }

    // WFP freshness (monthly — stale if last month is >45 days ago)
    let wfpStatus: ScraperStatusResponse["wfp"] = { lastMonth: null, isStale: true };
    if (wfpData?.price_date) {
      const wfpDate = new Date(wfpData.price_date + "T00:00:00Z");
      const daysAgo = Math.round((now.getTime() - wfpDate.getTime()) / 864e5);
      wfpStatus = {
        lastMonth: wfpData.price_date.slice(0, 7), // "YYYY-MM"
        isStale: daysAgo > 45,
      };
    }

    const overall: ScraperStatusResponse["overall"] =
      kalimatiStatus.lastDate === null ? "unknown"
      : kalimatiStatus.isStale ? "stale"
      : "live";

    const response: ScraperStatusResponse = {
      kalimati: kalimatiStatus,
      wfp: wfpStatus,
      overall,
    };

    return NextResponse.json(response, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { kalimati: { lastDate: null, isStale: true, hoursAgo: null }, wfp: { lastMonth: null, isStale: true }, overall: "unknown", error: message },
      { status: 500 }
    );
  }
}
