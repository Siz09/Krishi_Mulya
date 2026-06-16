import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCommodityWithChange, getCommodityHistory } from "@/lib/queries/prices";
import { formatPrice, formatBSDate } from "@/lib/format";
import PriceChangeBadge from "@/components/commodity/PriceChangeBadge";
import PriceChart from "@/components/commodity/PriceChart";
import AlertSignupForm from "@/components/shared/AlertSignupForm";
import { ChevronRight, Home, HelpCircle } from "lucide-react";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const commodity = await getCommodityWithChange(params.slug);
  if (!commodity) return {};
  
  return {
    title: `${commodity.name_en} (${commodity.name_ne}) Wholesale Price Today in Nepal`,
    description: `Today's wholesale price for ${commodity.name_en} (${commodity.name_ne}) in Kalimati Market. Latest average rate, min, max, and historical chart.`,
  };
}

export default async function CommodityDetailPage(props: PageProps) {
  const params = await props.params;
  const slug = params.slug;

  const commodity = await getCommodityWithChange(slug);
  if (!commodity) {
    notFound();
  }

  const { history } = await getCommodityHistory(slug, 30); // fetch last 30 days

  // Get active category link/label
  const categoryLabel = commodity.category === "vegetable"
    ? "Vegetables"
    : commodity.category === "fruit"
    ? "Fruits"
    : "Fish";
  const categoryLink = `/${commodity.category}s`;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-soil-800/60" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-leaf-600 flex items-center gap-1 transition-colors">
          <Home className="h-3.5 w-3.5" />
          <span>Home</span>
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-soil-800/30" />
        <Link href={categoryLink} className="hover:text-leaf-600 transition-colors capitalize">
          {categoryLabel}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-soil-800/30" />
        <span className="text-soil-800 font-bold truncate max-w-[200px]" aria-current="page">
          {commodity.name_en}
        </span>
      </nav>

      {/* Title Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-leaf-100">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-leaf-700 tracking-tight">
            {commodity.name_en}
          </h1>
          <h2 className="text-xl sm:text-2xl font-bold font-devanagari text-soil-800/60 mt-1">
            {commodity.name_ne}
          </h2>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center rounded-md bg-leaf-50 px-2.5 py-1 text-xs font-semibold text-leaf-700 border border-leaf-100 capitalize">
            {commodity.category}
          </span>
          {commodity.price_date && (
            <span className="inline-flex items-center rounded-md bg-soil-50 px-2.5 py-1 text-xs font-semibold text-soil-800/70 border border-leaf-100/50">
              As of: {formatBSDate(commodity.price_date, "en")}
            </span>
          )}
        </div>
      </header>

      {/* Grid Layout (Stats & Chart Left, Info Sidebar Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Chart */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            
            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">Avg Price</span>
              <div className="text-xl sm:text-2xl font-black text-leaf-700 mt-1">
                {formatPrice(commodity.avg_price, commodity.unit, "en", { priceOnly: true })}
              </div>
              <span className="text-[10px] text-soil-800/40 mt-1">per {commodity.unit}</span>
            </div>

            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">Min Price</span>
              <div className="text-lg sm:text-xl font-extrabold text-blue-600 mt-1">
                {formatPrice(commodity.min_price, commodity.unit, "en", { priceOnly: true })}
              </div>
              <span className="text-[10px] text-soil-800/40 mt-1">per {commodity.unit}</span>
            </div>

            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">Max Price</span>
              <div className="text-lg sm:text-xl font-extrabold text-amber-600 mt-1">
                {formatPrice(commodity.max_price, commodity.unit, "en", { priceOnly: true })}
              </div>
              <span className="text-[10px] text-soil-800/40 mt-1">per {commodity.unit}</span>
            </div>

            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">1-Day Change</span>
              <div className="mt-1">
                <PriceChangeBadge pct={commodity.change_1d_pct} />
              </div>
              <span className="text-[10px] text-soil-800/40 mt-2">vs yesterday</span>
            </div>

            <div className="bg-white border border-leaf-100 rounded-xl p-4 flex flex-col justify-between shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/50">7-Day Change</span>
              <div className="mt-1">
                <PriceChangeBadge pct={commodity.change_7d_pct} />
              </div>
              <span className="text-[10px] text-soil-800/40 mt-2">vs last week</span>
            </div>

          </div>

          {/* Chart Card */}
          <div className="bg-white border border-leaf-100 rounded-xl p-6 shadow-sm">
            <header className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold text-soil-800">
                Price Trend History (Last 30 Days)
              </h3>
              <span className="text-[10px] font-bold bg-leaf-50 text-leaf-700 px-2 py-0.5 rounded border border-leaf-100">
                30 Days
              </span>
            </header>
            <PriceChart history={history} />
          </div>

        </div>

        {/* Right Column: Sidebar */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Info details card */}
          <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5">
              <h3 className="font-bold text-sm text-soil-800 flex items-center gap-1.5 mb-2">
                <HelpCircle className="h-4 w-4 text-leaf-600" />
                Commodity Information
              </h3>
              <p className="text-xs text-soil-800/70 leading-relaxed">
                Wholesale prices represent the average daily transacted rates at the Kalimati Fruits & Vegetable wholesale market in Kathmandu, Nepal. Prices fluctuate based on seasonal demand, harvest conditions, transportation, and regional imports.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-block bg-soil-50 text-soil-800/70 border border-leaf-100/50 px-2 py-1 rounded text-[10px] font-semibold">
                  Demand-driven
                </span>
                <span className="inline-block bg-soil-50 text-soil-800/70 border border-leaf-100/50 px-2 py-1 rounded text-[10px] font-semibold">
                  Daily Scrapes
                </span>
              </div>
            </div>
          </div>

          {/* Alert Form Widget */}
          <AlertSignupForm compact={true} sourcePage={`commodity/${slug}`} />

        </aside>

      </div>
    </div>
  );
}
