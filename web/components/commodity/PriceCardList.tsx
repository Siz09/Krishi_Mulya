import Link from "next/link";
import Image from "next/image";
import type { LatestPriceWithChange } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { getProductImageUrl } from "@/lib/commodityDetails";
import PriceChangeBadge from "./PriceChangeBadge";
import type { Dictionary } from "@/lib/dictionary";

interface PriceCardListProps {
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

export default function PriceCardList({
  prices,
  locale = "en",
  dict,
  className = "",
  showMarket = false,
}: PriceCardListProps) {
  if (prices.length === 0) {
    return (
      <div className={`rounded-xl border border-leaf-100 bg-white p-8 text-center text-sm text-soil-800/50 ${className}`}>
        {dict.dashboard.no_results_title}
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {prices.map((price) => {
        const categoryKey = CATEGORY_KEYS[price.category] || price.category;
        const categoryLabel = dict.nav[categoryKey as keyof typeof dict.nav] || price.category;
        const marketName = MARKET_LABELS[price.market]?.[locale] || price.market;
        
        return (
          <Link
            key={`${price.commodity_id}-${price.market}`}
            href={`/${locale}/commodity/${price.slug}?market=${price.market}`}
            className="block bg-white border border-leaf-100 rounded-xl p-4 shadow-sm hover:shadow-interactive transition-all group"
          >
            <div className="flex justify-between items-start mb-2 gap-3">
              <div className="flex items-start gap-3">
                {/* Product Thumbnail */}
                <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-leaf-100 bg-leaf-50/50 shrink-0 shadow-sm">
                  <Image
                    src={getProductImageUrl(price.slug, price.category)}
                    alt={price.name_en}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-350"
                    sizes="48px"
                  />
                </div>
                <div>
                  <h3 className="font-bold text-base text-leaf-700 group-hover:underline leading-snug">
                    {locale === "ne" ? price.name_ne : price.name_en}
                  </h3>
                  <span className="text-xs text-soil-800/50 font-devanagari font-medium block mt-0.5">
                    {locale === "ne" ? price.name_en : price.name_ne}
                  </span>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold text-soil-800/40 tracking-wider capitalize">
                    {categoryLabel} {showMarket && `• ${marketName}`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-soil-800 text-lg">
                  {formatPrice(price.avg_price, price.unit, locale, { priceOnly: true })}
                </div>
                <div className="text-[10px] text-soil-800/40 font-medium -mt-1 mb-1">
                  {locale === "ne" ? `प्रति ${price.unit}` : `per ${price.unit}`}
                </div>
                <PriceChangeBadge pct={price.change_1d_pct} locale={locale} />
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold text-soil-800/70 pt-2.5 border-t border-leaf-50/80">
              <span>{dict.commodity.min}: {formatPrice(price.min_price, price.unit, locale, { priceOnly: true })}</span>
              <span>{dict.commodity.max}: {formatPrice(price.max_price, price.unit, locale, { priceOnly: true })}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
