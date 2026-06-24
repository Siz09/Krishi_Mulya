import Link from "next/link";
import Image from "next/image";
import type { LatestPriceWithChange } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { getProductImageUrl } from "@/lib/commodityDetails";
import PriceChangeBadge from "@/components/commodity/PriceChangeBadge";
import type { Dictionary } from "@/lib/dictionary";

interface RelatedCommoditiesProps {
  commodities: LatestPriceWithChange[];
  locale: "en" | "ne";
  dict: Dictionary;
  market: string;
}

export default function RelatedCommodities({
  commodities,
  locale,
  dict,
  market,
}: RelatedCommoditiesProps) {
  if (commodities.length === 0) return null;

  return (
    <div className="bg-white border border-leaf-100 rounded-xl overflow-hidden shadow-sm">
      <div className="p-5 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-sm text-soil-800">
            {dict.related.title}
          </h3>
          <p className="text-[10px] text-soil-800/50 mt-0.5">
            {dict.related.subtitle}
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          {commodities.map((item) => {
            const name = locale === "ne" ? item.name_ne : item.name_en;
            const subName = locale === "ne" ? item.name_en : item.name_ne;

            return (
              <Link
                key={`${item.commodity_id}-${item.market}`}
                href={`/${locale}/commodity/${item.slug}?market=${market}`}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-leaf-50/60 border border-transparent hover:border-leaf-100 transition-all group"
              >
                {/* Thumbnail */}
                <div className="relative h-9 w-9 rounded-md overflow-hidden border border-leaf-100 bg-leaf-50 shrink-0">
                  <Image
                    src={getProductImageUrl(item.slug, item.category)}
                    alt={item.name_en}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="36px"
                  />
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-leaf-700 leading-tight truncate group-hover:underline">
                    {name}
                  </div>
                  <div className="text-[9px] text-soil-800/40 font-devanagari truncate mt-0.5">
                    {subName}
                  </div>
                </div>

                {/* Price + Change */}
                <div className="shrink-0 text-right">
                  <div className="font-bold text-xs text-soil-800">
                    {formatPrice(item.avg_price, item.unit, locale, { priceOnly: true })}
                  </div>
                  <div className="mt-0.5">
                    <PriceChangeBadge pct={item.change_1d_pct} locale={locale} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
