import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCommodityWithChange, getCommodityHistory, getObservationsForDate, getPricesAcrossMarkets } from "@/lib/queries/prices";
import { formatPrice, formatBSDate } from "@/lib/format";
import { getProductImageUrl } from "@/lib/commodityDetails";
import PriceChangeBadge from "@/components/commodity/PriceChangeBadge";
import PriceChart from "@/components/commodity/PriceChart";
import AlertSignupForm from "@/components/shared/AlertSignupForm";
import { ChevronRight, Home, HelpCircle, MapPin } from "lucide-react";

export const revalidate = 1800; // revalidate every 30 minutes

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ market?: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const market = resolvedSearchParams.market || "kalimati";
  const commodity = await getCommodityWithChange(params.slug, market);
  if (!commodity) return {};
  
  const activeMarket = commodity.market;
  const marketName = activeMarket === "kalimati" ? "Kalimati" : activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1);
  return {
    title: `${commodity.name_en} (${commodity.name_ne}) Wholesale Price Today in ${marketName} Market`,
    description: `Today's wholesale price for ${commodity.name_en} (${commodity.name_ne}) in ${marketName} Market. Latest average rate, min, max, and historical chart.`,
  };
}

const MARKET_LABELS: Record<string, string> = {
  kalimati: "Kathmandu (Kalimati)",
  birtamod: "Birtamod",
  dharan: "Dharan",
  dhalkebar: "Dhalkebar",
  kamalamai: "Kamalamai",
  kawasoti: "Kawasoti",
  pokhara: "Pokhara",
  butwal: "Butwal",
  kohalpur: "Kohalpur",
  birendranagar: "Birendranagar",
  attariya: "Attariya",
  lalbandi: "Lalbandi",
};

export default async function CommodityDetailPage(props: PageProps) {
  const params = await props.params;
  const resolvedSearchParams = await props.searchParams;
  const slug = params.slug;
  const market = resolvedSearchParams.market || "kalimati";

  const commodity = await getCommodityWithChange(slug, market);
  if (!commodity) {
    notFound();
  }

  const activeMarket = commodity.market;
  const marketName = activeMarket === "kalimati" ? "Kalimati" : activeMarket.charAt(0).toUpperCase() + activeMarket.slice(1);

  const { history } = await getCommodityHistory(slug, 30, activeMarket); // fetch last 30 days
  const observations = commodity.price_date
    ? await getObservationsForDate(commodity.commodity_id, activeMarket, commodity.price_date)
    : [];
  const allLocationsPrices = await getPricesAcrossMarkets(slug);

  // Get active category link/label
  const categoryLabels: Record<string, string> = {
    vegetable: "Vegetables",
    fruit: "Fruits",
    fish: "Fish",
    meat: "Meat",
    dairy: "Dairy",
    spice: "Spices",
    leafy_green: "Leafy Greens",
    mushroom: "Mushrooms",
    root_vegetable: "Root Vegetables",
    legume: "Legumes",
    other: "Other Grains",
  };
  const categoryLabel = categoryLabels[commodity.category] || "Other";
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
          
          {/* Featured Commodity Visual Card */}
          <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm hover:shadow-interactive transition-all group flex flex-col">
            <div className="relative w-full h-48 bg-leaf-50 overflow-hidden">
              <Image
                src={getProductImageUrl(commodity.slug, commodity.category)}
                alt={commodity.name_en}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-w-768px) 100vw, 320px"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-soil-800/90 via-soil-800/20 to-transparent" />
              
              <div className="absolute bottom-4 left-4 right-4 animate-fade-in">
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider bg-leaf-600/90 text-white rounded">
                  {commodity.category}
                </span>
                <h3 className="text-white text-lg font-black leading-tight mt-1.5">
                  {commodity.name_en}
                </h3>
                <span className="text-leaf-100/90 text-sm font-semibold font-devanagari block mt-0.5">
                  {commodity.name_ne}
                </span>
              </div>
            </div>
          </div>

          {/* Validation & Consensus Status Card */}
          <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 flex flex-col gap-4">
              <h3 className="font-bold text-sm text-soil-800 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-leaf-600" />
                Consensus Verification
              </h3>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-soil-800/50">Confidence:</span>
                  <span className={`font-bold px-2 py-0.5 rounded text-[10px] uppercase border ${
                    commodity.confidence?.toLowerCase().includes("high")
                      ? "bg-leaf-50 text-leaf-700 border-leaf-100"
                      : commodity.confidence?.toLowerCase().includes("medium")
                      ? "bg-amber-50 text-amber-700 border-amber-100"
                      : "bg-rose-50 text-rose-700 border-rose-100"
                  }`}>
                    {commodity.confidence || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-soil-800/50">Sources Verified:</span>
                  <span className="font-bold text-soil-800">{commodity.source_count || 1}</span>
                </div>
              </div>

              {observations.length > 0 && (
                <div className="border-t border-leaf-100/60 pt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-soil-800/40 block mb-2">
                    Source Reports for Today
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {observations.map((obs) => (
                      <div key={obs.id} className="flex justify-between items-center text-xs p-2 bg-soil-50/50 rounded-lg border border-leaf-100/40">
                        <span className="capitalize font-semibold text-soil-800/80 flex items-center gap-1">
                          {obs.sources?.name || "Unknown Source"}
                          {!obs.sources?.is_independent && (
                            <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-normal normal-case">
                              Mirror
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-leaf-750">
                          {formatPrice(obs.avg_price, commodity.unit, "en", { priceOnly: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compare across Locations Card */}
          {allLocationsPrices.length > 1 && (
            <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm">
              <div className="p-5 flex flex-col gap-4">
                <h3 className="font-bold text-sm text-soil-800 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-leaf-600" />
                  Compare Across Locations
                </h3>
                <div className="flex flex-col gap-2">
                  {allLocationsPrices.map((p) => {
                    const isActive = p.market === activeMarket;
                    const label = MARKET_LABELS[p.market] || p.market;
                    return (
                      <div
                        key={p.market}
                        className={`flex justify-between items-center text-xs p-2.5 rounded-lg border transition-all ${
                          isActive
                            ? "bg-leaf-50/50 border-leaf-200 text-leaf-800 font-semibold"
                            : "bg-soil-50/30 border-leaf-100/40 hover:bg-leaf-50/30 hover:border-leaf-200"
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          {isActive ? (
                            <span className="capitalize">{label} (Current)</span>
                          ) : (
                            <Link
                              href={`/commodity/${slug}?market=${p.market}`}
                              className="capitalize hover:underline text-soil-800 hover:text-leaf-700"
                            >
                              {label}
                            </Link>
                          )}
                        </span>
                        <span className="font-bold text-soil-900">
                          {formatPrice(p.avg_price, p.unit, "en", { priceOnly: true })}
                          <span className="text-[10px] font-normal text-soil-800/50 ml-0.5">
                            /{p.unit}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Info details card */}
          <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5">
              <h3 className="font-bold text-sm text-soil-800 flex items-center gap-1.5 mb-2">
                <HelpCircle className="h-4 w-4 text-leaf-600" />
                Commodity Information
              </h3>
              <p className="text-xs text-soil-800/70 leading-relaxed">
                Wholesale prices represent the average daily transacted rates at the {marketName} wholesale market. Prices fluctuate based on seasonal demand, harvest conditions, transportation, and regional imports.
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
