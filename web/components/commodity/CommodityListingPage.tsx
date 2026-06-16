import { Suspense } from "react";
import { getLatestPrices } from "@/lib/queries/prices";
import { formatBSDate } from "@/lib/format";
import SearchBar from "@/components/shared/SearchBar";
import MarketSelector from "@/components/shared/MarketSelector";
import PriceTable from "@/components/commodity/PriceTable";
import PriceCardList from "@/components/commodity/PriceCardList";
import AlertSignupForm from "@/components/shared/AlertSignupForm";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

import CategorySelector from "@/components/shared/CategorySelector";
import Pagination from "@/components/shared/Pagination";

interface CommodityListingPageProps {
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
  title: string;
  sourcePage: string;
  searchParams: Promise<{ q?: string; market?: string; page?: string }>;
}

export default async function CommodityListingPage({
  category,
  title,
  sourcePage,
  searchParams,
}: CommodityListingPageProps) {
  const resolvedParams = await searchParams;
  const search = resolvedParams.q || "";
  const market = resolvedParams.market || "kalimati";
  const page = Number(resolvedParams.page) || 1;
  const marketName = market === "all"
    ? "All Locations"
    : market === "kalimati"
      ? "Kalimati"
      : market.charAt(0).toUpperCase() + market.slice(1);

  // Fetch filtered latest prices
  const prices = await getLatestPrices({ category, search, market });

  // Determine if data is stale compared to today (UTC date)
  let latestDateStr = "";
  if (prices.length > 0) {
    latestDateStr = prices.reduce(
      (max, p) => (p.price_date > max ? p.price_date : max),
      prices[0].price_date
    );
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const isStale = latestDateStr && latestDateStr < todayStr;

  // Pagination Calculations
  const itemsPerPage = 20;
  const totalItems = prices.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, Math.max(1, totalPages)));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedPrices = prices.slice(startIndex, endIndex);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Header & Notice */}
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-leaf-700 tracking-tight">
          {title}
        </h1>

        {prices.length === 0 && !search && (
          <div className="bg-soil-50 border border-leaf-100 rounded-xl p-6 text-center text-soil-800/60 shadow-sm">
            Price data will appear here once the first daily update runs for {market === "all" ? "any location" : `the ${marketName} market`}.
          </div>
        )}

        {isStale && latestDateStr && (
          <div className="bg-soil-50 border border-leaf-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-soil-800 font-medium">
              Notice: Showing prices for {formatBSDate(latestDateStr, "en")} ({latestDateStr}) as today's market prices have not yet been published by {market === "all" ? "all locations" : marketName}.
            </p>
          </div>
        )}
      </header>

      {/* Search, Market Selector and Category filters */}
      <section className="relative z-30 flex flex-col md:flex-row justify-between items-center gap-4 bg-white/50 p-4 rounded-2xl border border-leaf-100/40 backdrop-blur-sm shadow-sm w-full">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <Suspense fallback={<div className="h-10 w-full md:w-96 bg-leaf-50/20 rounded-lg animate-pulse" />}>
            <SearchBar />
          </Suspense>
          <Suspense fallback={<div className="h-10 w-full md:w-60 bg-leaf-50/20 rounded-lg animate-pulse" />}>
            <MarketSelector />
          </Suspense>
        </div>

        <div className="w-full md:w-auto flex justify-start md:justify-end">
          <Suspense fallback={<div className="h-10 w-full md:w-56 bg-leaf-50/20 rounded-lg animate-pulse" />}>
            <CategorySelector currentCategory={category} />
          </Suspense>
        </div>
      </section>

      {/* Commodity lists (Responsive) */}
      <PriceCardList prices={paginatedPrices} showMarket={market === "all"} className="md:hidden" />
      <PriceTable prices={paginatedPrices} showMarket={market === "all"} className="hidden md:block" />

      {/* Pagination Controls */}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
      />

      {/* Alert Signup section */}
      <AlertSignupForm sourcePage={sourcePage} />
    </div>
  );
}
