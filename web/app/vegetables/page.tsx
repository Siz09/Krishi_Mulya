import type { Metadata } from "next";
import { getLatestPrices } from "@/lib/queries/prices";
import { formatBSDate } from "@/lib/format";
import SearchBar from "@/components/shared/SearchBar";
import PriceTable from "@/components/commodity/PriceTable";
import PriceCardList from "@/components/commodity/PriceCardList";
import AlertSignupForm from "@/components/shared/AlertSignupForm";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export const revalidate = 1800; // revalidate every 30 minutes

export const metadata: Metadata = {
  title: "Today's Vegetable Prices in Nepal | Kalimati Market",
  description: "Wholesale vegetable prices today in Kalimati Fruits and Vegetable Market. Daily updates and historical trends.",
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function VegetablesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const search = searchParams.q || "";

  // Fetch latest vegetable prices
  const prices = await getLatestPrices({ category: "vegetable", search });

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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Header & Notice */}
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-leaf-700 tracking-tight">
          Vegetables Wholesale Prices
        </h1>

        {isStale && latestDateStr && (
          <div className="bg-soil-50 border border-leaf-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-soil-800 font-medium">
              Notice: Showing vegetable prices for {formatBSDate(latestDateStr, "en")} ({latestDateStr}) as today's market prices have not yet been published by Kalimati.
            </p>
          </div>
        )}
      </header>

      {/* Search and Category filters */}
      <section className="flex flex-col md:flex-row justify-between items-center gap-4">
        <SearchBar />

        <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-2 md:pb-0 scrollbar-none">
          <Link
            href={search ? `/?q=${search}` : "/"}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-soil-800/70 border border-leaf-100 hover:bg-leaf-50 whitespace-nowrap transition-colors cursor-pointer"
          >
            All
          </Link>
          <Link
            href={search ? `/vegetables?q=${search}` : "/vegetables"}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-leaf-600 text-white shadow-sm whitespace-nowrap cursor-pointer"
          >
            Vegetables
          </Link>
          <Link
            href={search ? `/fruits?q=${search}` : "/fruits"}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-soil-800/70 border border-leaf-100 hover:bg-leaf-50 whitespace-nowrap transition-colors cursor-pointer"
          >
            Fruits
          </Link>
          <Link
            href={search ? `/fish?q=${search}` : "/fish"}
            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white text-soil-800/70 border border-leaf-100 hover:bg-leaf-50 whitespace-nowrap transition-colors cursor-pointer"
          >
            Fish
          </Link>
        </div>
      </section>

      {/* Commodity lists (Responsive) */}
      <PriceCardList prices={prices} className="md:hidden" />
      <PriceTable prices={prices} className="hidden md:block" />

      {/* Alert Signup section */}
      <AlertSignupForm sourcePage="vegetables" />
    </div>
  );
}
