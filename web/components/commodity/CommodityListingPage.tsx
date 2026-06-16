import { Suspense } from "react";
import { getLatestPrices } from "@/lib/queries/prices";
import { formatBSDate } from "@/lib/format";
import SearchBar from "@/components/shared/SearchBar";
import PriceTable from "@/components/commodity/PriceTable";
import PriceCardList from "@/components/commodity/PriceCardList";
import AlertSignupForm from "@/components/shared/AlertSignupForm";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

interface CommodityListingPageProps {
  category?: "vegetable" | "fruit" | "fish";
  title: string;
  sourcePage: string;
  searchParams: Promise<{ q?: string }>;
}

export default async function CommodityListingPage({
  category,
  title,
  sourcePage,
  searchParams,
}: CommodityListingPageProps) {
  const resolvedParams = await searchParams;
  const search = resolvedParams.q || "";

  // Fetch filtered latest prices
  const prices = await getLatestPrices({ category, search });

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

  // Build safe URL search query
  const getCategoryHref = (path: string) => {
    if (!search) return path;
    return `${path}?q=${encodeURIComponent(search)}`;
  };

  const categories = [
    { label: "All", href: "/", active: !category },
    { label: "Vegetables", href: "/vegetables", active: category === "vegetable" },
    { label: "Fruits", href: "/fruits", active: category === "fruit" },
    { label: "Fish", href: "/fish", active: category === "fish" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      
      {/* Header & Notice */}
      <header className="flex flex-col gap-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-leaf-700 tracking-tight">
          {title}
        </h1>

        {prices.length === 0 && !search && (
          <div className="bg-soil-50 border border-leaf-100 rounded-xl p-6 text-center text-soil-800/60 shadow-sm">
            Price data will appear here once the first daily update runs.
          </div>
        )}

        {isStale && latestDateStr && (
          <div className="bg-soil-50 border border-leaf-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-sm text-soil-800 font-medium">
              Notice: Showing prices for {formatBSDate(latestDateStr, "en")} ({latestDateStr}) as today's market prices have not yet been published by Kalimati.
            </p>
          </div>
        )}
      </header>

      {/* Search and Category filters */}
      <section className="flex flex-col md:flex-row justify-between items-center gap-4">
        <Suspense fallback={<div className="h-10 w-full md:w-96 bg-leaf-50/20 rounded-lg animate-pulse" />}>
          <SearchBar />
        </Suspense>

        <div className="flex overflow-x-auto w-full md:w-auto gap-2 pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <Link
              key={cat.href}
              href={getCategoryHref(cat.href)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                cat.active
                  ? "bg-leaf-600 text-white shadow-sm"
                  : "bg-white text-soil-800/70 border border-leaf-100 hover:bg-leaf-50"
              }`}
            >
              {cat.label}
            </Link>
          ))}
        </div>
      </section>

      {/* Commodity lists (Responsive) */}
      <PriceCardList prices={prices} className="md:hidden" />
      <PriceTable prices={prices} className="hidden md:block" />

      {/* Alert Signup section */}
      <AlertSignupForm sourcePage={sourcePage} />
    </div>
  );
}
