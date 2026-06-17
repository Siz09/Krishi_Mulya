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
};

export default function PriceTable({
  prices,
  locale = "en",
  dict,
  className = "",
  showMarket = false,
}: PriceTableProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-leaf-100 bg-white shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-leaf-600 text-white font-semibold text-xs uppercase tracking-wider">
            <th className="p-4">{locale === "ne" ? "उत्पादन" : "Commodity"}</th>
            {showMarket && <th className="p-4">{dict.commodity.market}</th>}
            <th className="p-4">{locale === "ne" ? "कोटि" : "Category"}</th>
            <th className="p-4 text-right">{dict.commodity.avg}</th>
            <th className="p-4 text-right">{dict.commodity.min}</th>
            <th className="p-4 text-right">{dict.commodity.max}</th>
            <th className="p-4 text-center">{dict.commodity.change_1d}</th>
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
                        <div className="text-xs text-soil-800/50 font-devanagari font-medium mt-0.5 relative z-20 pointer-events-none">
                          {locale === "ne" ? price.name_en : price.name_ne}
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
