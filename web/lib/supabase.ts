import { createClient } from "@supabase/supabase-js";

// ─── Supabase client (anon key — RLS-protected, safe for browser) ────────────
// Server Components and Client Components both use this client.
// Writes to commodities/daily_prices never go through this client —
// only the service-role client in lib/scraper.ts can write those.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Database row types ───────────────────────────────────────────────────────
// Mirror the DB schema 1:1. Pages and query functions use these — do not
// redefine shapes per-component.

export type Category = "vegetable" | "fruit" | "fish" | "meat" | "dairy" | "spice" | "leafy_green" | "mushroom" | "root_vegetable" | "legume" | "other" | "staple";
export type PriceFrequency = "daily" | "monthly";
export type Locale = "en" | "ne";

export type Commodity = {
  id: number;
  slug: string;
  name_en: string;
  name_ne: string;
  unit: string;
  category: Category;
  active: boolean;
  created_at: string;
  image_url?: string | null;
};

export type Source = {
  id: number;
  slug: string;
  name: string;
  website: string | null;
  is_independent: boolean;
  source_type: 'board' | 'mirror' | 'cooperative' | 'api' | 'other';
  created_at: string;
};

export type DailyPrice = {
  id: number;
  commodity_id: number;
  market: string;
  source_id: number;
  sources?: Source;
  price_date: string; // ISO date string "YYYY-MM-DD"
  min_price: number | null;
  max_price: number | null;
  avg_price: number | null;
  unit: string;
  scraped_at: string;
  price_frequency?: PriceFrequency;
};

// ─── View types ───────────────────────────────────────────────────────────────
// Matches the shape returned by the `latest_prices_with_changes` Supabase view.

export type LatestPriceWithChange = {
  commodity_id: number;
  slug: string;
  name_en: string;
  name_ne: string;
  unit: string;
  category: Category;
  market: string;
  price_date: string;
  price_frequency: PriceFrequency;  // 'daily' (Kalimati/AMPIS) or 'monthly' (WFP)
  avg_price: number | null;
  min_price: number | null;
  max_price: number | null;
  source_count: number;
  confidence: string;
  change_1d_pct: number | null;
  change_7d_pct: number | null;
  image_url?: string | null;
};

// ─── Alert interest type ──────────────────────────────────────────────────────

export type AlertInterest = {
  id: number;
  email: string;
  locale: Locale;
  source_page: string;
  created_at: string;
};
