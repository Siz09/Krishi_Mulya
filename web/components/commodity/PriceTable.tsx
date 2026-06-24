import Link from "next/link";
import Image from "next/image";
import type { LatestPriceWithChange } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { getProductImageUrl } from "@/lib/commodityDetails";
import PriceChangeBadge from "./PriceChangeBadge";
import type { Dictionary } from "@/lib/dictionary";

interface PriceTableProps {
  prices: LatestPriceWithChange[];
  locale?: "en" | "ne";
  dict: Dictionary;
  className?: string;
  showMarket?: boolean;
}

const MARKET_LABELS: Record<string, Record<"en" | "ne", string>> = {
  kalimati: { en: "Kathmandu (Kalimati)", ne: "काठमाडौं (कालीमाटी)" },
  birtamod: { en: "Birtamod", ne: "विर्तामोड" },
  dharan: { en: "Dharan", ne: "धरान" },
  dhalkebar: { en: "Dhalkebar", ne: "ढल्केबर" },
  kamalamai: { en: "Kamalamai", ne: "कमलामाई" },
  kawasoti: { en: "Kawasoti", ne: "कावासोती" },
  pokhara: { en: "Pokhara", ne: "पोखरा" },
  butwal: { en: "Butwal", ne: "बुटवल" },
  kohalpur: { en: "Kohalpur", ne: "कोहलपुर" },
  birendranagar: { en: "Birendranagar", ne: "वीरेन्द्रनगर" },
  attariya: { en: "Attariya", ne: "अत्तरिया" },
  lalbandi: { en: "Lalbandi", ne: "लालबन्दी" },
};

const CATEGORY_KEYS: Record<string, string> = {
  vegetable: "vegetables",
  fruit: "fruits",
  spice: "spices",
  leafy_green: "leafy_greens",
  mushroom: "mushrooms",
  root_vegetable: "root_vegetables",
  legume: "legumes",
  fish: "fish",
  meat: "meat",
  dairy: "dairy",
  other: "other_grains",
  staple: "staples",
};

export default function PriceTable({
  prices,
  locale = "en",
  dict,
  className = "",
  showMarket = false,
}: PriceTableProps) {
  const hasMonthly = prices.some((p) => p.price_frequency === "monthly");
  
  return (
    <div className={`overflow-hidden rounded-xl border border-leaf-100 bg-white shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-leaf-600 text-white font-semibold text-xs uppercase tracking-wider">
            <th className="p-4">{locale === "ne" ? "उत्पादन" : "Commodity"}</th>
            {showMarket && <th className="p-4">{dict.commodity.market}</th>}
            <th className="p-4">{locale === "ne" ? "कोटि" : "Category"}</th>
            <th className="p-4 text-right">
              <span className="inline-flex items-center justify-end gap-1 group/avg relative">
                {dict.commodity.avg}
                <span className="opacity-60 cursor-help">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </span>
                <span className="absolute right-0 top-full mt-1 w-52 text-xs font-normal normal-case tracking-normal bg-soil-800 text-white rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover/avg:opacity-100 pointer-events-none transition-opacity z-50 text-left">
                  {dict.commodity.avg_tooltip}
                </span>
              </span>
            </th>
            <th className="p-4 text-right">
              <span className="inline-flex items-center justify-end gap-1 group/min relative">
                {dict.commodity.min}
                <span className="opacity-60 cursor-help">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </span>
                <span className="absolute right-0 top-full mt-1 w-52 text-xs font-normal normal-case tracking-normal bg-soil-800 text-white rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover/min:opacity-100 pointer-events-none transition-opacity z-50 text-left">
                  {dict.commodity.min_tooltip}
                </span>
              </span>
            </th>
            <th className="p-4 text-right">
              <span className="inline-flex items-center justify-end gap-1 group/max relative">
                {dict.commodity.max}
                <span className="opacity-60 cursor-help">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                </span>
                <span className="absolute right-0 top-full mt-1 w-52 text-xs font-normal normal-case tracking-normal bg-soil-800 text-white rounded-lg px-3 py-2 shadow-lg opacity-0 group-hover/max:opacity-100 pointer-events-none transition-opacity z-50 text-left">
                  {dict.commodity.max_tooltip}
                </span>
              </span>
            </th>
            <th className="p-4 text-center">
              {hasMonthly
                ? (locale === "ne" ? "परिवर्तन" : "Change")
                : dict.commodity.change_1d}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-leaf-100 text-sm">
          {prices.length === 0 ? (
            <tr>
              <td colSpan={showMarket ? 7 : 6} className="p-8 text-center text-soil-800/50">
                {dict.dashboard.no_results_title}
              </td>
            </tr>
          ) : (
            prices.map((price, idx) => {
              const bgClass = idx % 2 === 1 ? "bg-soil-50/40" : "bg-white";
              const categoryKey = CATEGORY_KEYS[price.category] || price.category;
              const categoryLabel = dict.nav[categoryKey as keyof typeof dict.nav] || price.category;
              const marketName = MARKET_LABELS[price.market]?.[locale] || price.market;
              const isMonthly = price.price_frequency === "monthly";
              
              return (
                <tr
                  key={`${price.commodity_id}-${price.market}`}
                  className={`relative ${bgClass} hover:bg-leaf-50/60 transition-colors`}
                >
                  <td className="p-4 relative">
                    <div className="flex items-center gap-3">
                      {/* Product Thumbnail */}
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-leaf-100 bg-leaf-50/50 shrink-0 shadow-sm">
                        <Image
                          src={getProductImageUrl(price.slug, price.category)}
                          alt={price.name_en}
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div>
                        {/* The after:absolute pseudo-element stretches the link to cover the entire relative row */}
                        <Link
                          href={`/${locale}/commodity/${price.slug}?market=${price.market}`}
                          className="font-semibold text-leaf-700 hover:underline block after:absolute after:inset-0 after:z-10"
                        >
                          {locale === "ne" ? price.name_ne : price.name_en}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 relative z-20 pointer-events-none">
                          <span className="text-xs text-soil-800/50 font-devanagari font-medium">
                            {locale === "ne" ? price.name_en : price.name_ne}
                          </span>
                          <span className={`inline-flex items-center px-1 py-0.2 rounded text-[8px] font-semibold leading-none border uppercase tracking-wider ${
                            isMonthly
                              ? "bg-amber-50 text-amber-700 border-amber-200/50"
                              : "bg-leaf-50 text-leaf-700 border-leaf-100"
                          }`}>
                            {isMonthly 
                              ? (dict.data_freshness?.monthly_retail || "Monthly Retail") 
                              : (dict.data_freshness?.daily_wholesale || "Daily Wholesale")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  {showMarket && (
                    <td className="p-4 text-soil-800/80 font-medium relative z-20 pointer-events-none">
                      {marketName}
                    </td>
                  )}
                  <td className="p-4 text-soil-800/80 capitalize relative z-20 pointer-events-none">
                    {categoryLabel}
                  </td>
                  <td className="p-4 text-right font-bold text-soil-800 relative z-20 pointer-events-none">
                    {formatPrice(price.avg_price, price.unit, locale, { priceOnly: true })}
                    <span className="text-[10px] text-soil-800/40 font-normal block">
                      {locale === "ne" ? `प्रति ${price.unit}` : `per ${price.unit}`}
                    </span>
                  </td>
                  <td className="p-4 text-right text-soil-800/70 font-semibold relative z-20 pointer-events-none">
                    {formatPrice(price.min_price, price.unit, locale, { priceOnly: true })}
                  </td>
                  <td className="p-4 text-right text-soil-800/70 font-semibold relative z-20 pointer-events-none">
                    {formatPrice(price.max_price, price.unit, locale, { priceOnly: true })}
                  </td>
                  <td className="p-4 text-center relative z-20 pointer-events-none">
                    <PriceChangeBadge pct={price.change_1d_pct} locale={locale} />
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
