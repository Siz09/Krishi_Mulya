import Link from "next/link";
import type { LatestPriceWithChange } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import PriceChangeBadge from "./PriceChangeBadge";

interface PriceTableProps {
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

export default function PriceTable({
  prices,
  locale = "en",
  className = "",
  showMarket = false,
}: PriceTableProps) {
  return (
    <div className={`overflow-hidden rounded-xl border border-leaf-100 bg-white shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-leaf-600 text-white font-semibold text-xs uppercase tracking-wider">
            <th className="p-4">Commodity</th>
            {showMarket && <th className="p-4">Location</th>}
            <th className="p-4">Category</th>
            <th className="p-4 text-right">Avg Price</th>
            <th className="p-4 text-right">Min Price</th>
            <th className="p-4 text-right">Max Price</th>
            <th className="p-4 text-center">1-Day Change</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-leaf-100 text-sm">
          {prices.length === 0 ? (
            <tr>
              <td colSpan={showMarket ? 7 : 6} className="p-8 text-center text-soil-800/50">
                No commodities found matching your search.
              </td>
            </tr>
          ) : (
            prices.map((price, idx) => {
              const bgClass = idx % 2 === 1 ? "bg-soil-50/40" : "bg-white";
              return (
                <tr
                  key={`${price.commodity_id}-${price.market}`}
                  className={`relative ${bgClass} hover:bg-leaf-50/60 transition-colors`}
                >
                  <td className="p-4">
                    {/* The after:absolute pseudo-element stretches the link to cover the entire relative row */}
                    <Link
                      href={`/commodity/${price.slug}?market=${price.market}`}
                      className="font-semibold text-leaf-700 hover:underline block after:absolute after:inset-0 after:z-10"
                    >
                      {price.name_en}
                    </Link>
                    <div className="text-xs text-soil-800/50 font-devanagari font-medium mt-0.5 relative z-20 pointer-events-none">
                      {price.name_ne}
                    </div>
                  </td>
                  {showMarket && (
                    <td className="p-4 text-soil-800/80 font-medium relative z-20 pointer-events-none">
                      {MARKET_LABELS[price.market] || price.market}
                    </td>
                  )}
                  <td className="p-4 text-soil-800/80 capitalize relative z-20 pointer-events-none">
                    {price.category}
                  </td>
                  <td className="p-4 text-right font-bold text-soil-800 relative z-20 pointer-events-none">
                    {formatPrice(price.avg_price, price.unit, locale, { priceOnly: true })}
                    <span className="text-[10px] text-soil-800/40 font-normal block">
                      per {price.unit}
                    </span>
                  </td>
                  <td className="p-4 text-right text-soil-800/70 font-semibold relative z-20 pointer-events-none">
                    {formatPrice(price.min_price, price.unit, locale, { priceOnly: true })}
                  </td>
                  <td className="p-4 text-right text-soil-800/70 font-semibold relative z-20 pointer-events-none">
                    {formatPrice(price.max_price, price.unit, locale, { priceOnly: true })}
                  </td>
                  <td className="p-4 text-center relative z-20 pointer-events-none">
                    <PriceChangeBadge pct={price.change_1d_pct} />
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
