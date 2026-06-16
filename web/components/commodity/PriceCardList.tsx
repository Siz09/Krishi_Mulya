import Link from "next/link";
import Image from "next/image";
import type { LatestPriceWithChange } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { getProductImageUrl } from "@/lib/commodityDetails";
import PriceChangeBadge from "./PriceChangeBadge";

interface PriceCardListProps {
  prices: LatestPriceWithChange[];
  locale?: "en" | "ne";
  className?: string;
  showMarket?: boolean;
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

export default function PriceCardList({
  prices,
  locale = "en",
  className = "",
  showMarket = false,
}: PriceCardListProps) {
  if (prices.length === 0) {
    return (
      <div className={`rounded-xl border border-leaf-100 bg-white p-8 text-center text-sm text-soil-800/50 ${className}`}>
        No commodities found matching your search.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {prices.map((price) => {
        return (
          <Link
            key={`${price.commodity_id}-${price.market}`}
            href={`/commodity/${price.slug}?market=${price.market}`}
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
                    {price.name_en}
                  </h3>
                  <span className="text-xs text-soil-800/50 font-devanagari font-medium block mt-0.5">
                    {price.name_ne}
                  </span>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold text-soil-800/40 tracking-wider">
                    {price.category} {showMarket && `• ${MARKET_LABELS[price.market] || price.market}`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-soil-800 text-lg">
                  {formatPrice(price.avg_price, price.unit, locale, { priceOnly: true })}
                </div>
                <div className="text-[10px] text-soil-800/40 font-medium -mt-1 mb-1">
                  per {price.unit}
                </div>
                <PriceChangeBadge pct={price.change_1d_pct} />
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold text-soil-800/70 pt-2.5 border-t border-leaf-50/80">
              <span>Min: {formatPrice(price.min_price, price.unit, locale, { priceOnly: true })}</span>
              <span>Max: {formatPrice(price.max_price, price.unit, locale, { priceOnly: true })}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
