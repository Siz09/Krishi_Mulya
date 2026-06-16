import { supabase } from "../supabase";
import type { Commodity, DailyPrice, LatestPriceWithChange } from "../supabase";

/**
 * Dashboard / category pages — one query for prices + changes.
 *
 * Search is case-insensitive substring match against BOTH name_en and name_ne,
 * regardless of the active UI locale. An English-locale user typing "गोलभेडा"
 * and a Nepali-locale user typing "tomato" both get correct results.
 */
export async function getLatestPrices(opts?: {
  category?:
    | "vegetable"
    | "fruit"
    | "fish"
    | "meat"
    | "dairy"
    | "spice"
    | "leafy_green"
    | "mushroom"
    | "root_vegetable"
    | "legume"
    | "other";
  search?: string;
  market?: string;
}): Promise<LatestPriceWithChange[]> {
  const market = opts?.market || "kalimati";
  let query = supabase
    .from("latest_prices_with_changes")
    .select("*")
    .order("name_en", { ascending: true });

  if (market !== "all") {
    query = query.eq("market", market);
  }

  if (opts?.category) {
    query = query.eq("category", opts.category);
  }

  if (opts?.search?.trim()) {
    const term = opts.search.trim();
    query = query.or(`name_en.ilike.%${term}%,name_ne.ilike.%${term}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[getLatestPrices]", error.message);
    return [];
  }

  return (data as LatestPriceWithChange[]) ?? [];
}

/**
 * Commodity detail — stats + change badges for one commodity.
 * Returns null for an invalid slug — callers use notFound() to render 404.
 */
export async function getCommodityWithChange(
  slug: string,
  market: string = "kalimati"
): Promise<LatestPriceWithChange | null> {
  let { data, error } = await supabase
    .from("latest_prices_with_changes")
    .select("*")
    .eq("slug", slug)
    .eq("market", market)
    .maybeSingle();

  if (error) {
    console.error(`[getCommodityWithChange] slug=${slug} market=${market}`, error.message);
    return null;
  }

  if (!data) {
    // Fallback: try to find the commodity in ANY market where it has data
    const { data: fallback, error: fallbackErr } = await supabase
      .from("latest_prices_with_changes")
      .select("*")
      .eq("slug", slug)
      .limit(1)
      .maybeSingle();

    if (fallbackErr) {
      console.error(`[getCommodityWithChange fallback] slug=${slug}`, fallbackErr.message);
      return null;
    }

    if (fallback) {
      data = fallback;
    }
  }

  return (data as LatestPriceWithChange) ?? null;
}

/**
 * Commodity detail — historical price series for the Recharts line chart.
 *
 * Returns history in ascending chronological order so the chart renders
 * left-to-right as time progresses. The commodity row is returned alongside
 * so the detail page has metadata without a second query.
 */
export async function getCommodityHistory(
  slug: string,
  days: number = 90,
  market: string = "kalimati"
): Promise<{ commodity: Commodity | null; history: DailyPrice[] }> {
  // 1. Commodity metadata
  const { data: commodity, error: commErr } = await supabase
    .from("commodities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (commErr || !commodity) {
    if (commErr) console.error(`[getCommodityHistory] metadata slug=${slug}`, commErr.message);
    return { commodity: null, history: [] };
  }

  // 2. Price series (last N days, oldest first for chart)
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);
  const thresholdStr = threshold.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data: history, error: histErr } = await supabase
    .from("daily_prices")
    .select("*")
    .eq("commodity_id", commodity.id)
    .eq("market", market)
    .gte("price_date", thresholdStr)
    .order("price_date", { ascending: true });

  if (histErr) {
    console.error(`[getCommodityHistory] history id=${commodity.id} market=${market}`, histErr.message);
    return { commodity: commodity as Commodity, history: [] };
  }

  return {
    commodity: commodity as Commodity,
    history: (history as DailyPrice[]) ?? [],
  };
}

/**
 * Fetch all source observations for a specific commodity, market, and date.
 * Used to display multi-source verification details.
 */
export async function getObservationsForDate(
  commodityId: number,
  market: string,
  priceDate: string
): Promise<DailyPrice[]> {
  const { data, error } = await supabase
    .from("daily_prices")
    .select("*, sources(*)")
    .eq("commodity_id", commodityId)
    .eq("market", market)
    .eq("price_date", priceDate);

  if (error) {
    console.error(`[getObservationsForDate] commId=${commodityId} market=${market} date=${priceDate}`, error.message);
    return [];
  }

  return (data as any[]) ?? [];
}
