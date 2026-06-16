import Link from "next/link";
import type { LatestPriceWithChange } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import PriceChangeBadge from "./PriceChangeBadge";

interface PriceCardListProps {
  prices: LatestPriceWithChange[];
  locale?: "en" | "ne";
  className?: string;
}

export default function PriceCardList({
  prices,
  locale = "en",
  className = "",
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
            key={price.commodity_id}
            href={`/commodity/${price.slug}`}
            className="block bg-white border border-leaf-100 rounded-xl p-4 shadow-sm hover:shadow-interactive transition-all group"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-base text-leaf-700 group-hover:underline">
                  {price.name_en}
                </h3>
                <span className="text-xs text-soil-800/50 font-devanagari font-medium block mt-0.5">
                  {price.name_ne}
                </span>
                <span className="inline-block mt-1 text-[10px] uppercase font-bold text-soil-800/40 tracking-wider">
                  {price.category}
                </span>
              </div>
              <div className="text-right">
                <div className="font-bold text-soil-800 text-lg">
                  {formatPrice(price.avg_price, price.unit, locale).split("/")[0]}
                </div>
                <div className="text-[10px] text-soil-800/40 font-medium -mt-1 mb-1">
                  per {price.unit}
                </div>
                <PriceChangeBadge pct={price.change_1d_pct} />
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold text-soil-800/70 pt-2.5 border-t border-leaf-50/80">
              <span>Min: {formatPrice(price.min_price, price.unit, locale).split("/")[0]}</span>
              <span>Max: {formatPrice(price.max_price, price.unit, locale).split("/")[0]}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
