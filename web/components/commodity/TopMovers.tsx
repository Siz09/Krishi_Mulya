import Link from "next/link";
import Image from "next/image";
import type { LatestPriceWithChange } from "@/lib/supabase";
import { formatChange } from "@/lib/format";
import { getProductImageUrl } from "@/lib/commodityDetails";
import type { Dictionary } from "@/lib/dictionary";

interface TopMoversProps {
  gainers: LatestPriceWithChange[];
  losers: LatestPriceWithChange[];
  locale: "en" | "ne";
  dict: Dictionary;
  market?: string;
}

function MoverCard({
  price,
  locale,
  dict,
  market,
  direction,
}: {
  price: LatestPriceWithChange;
  locale: "en" | "ne";
  dict: Dictionary;
  market: string;
  direction: "up" | "down";
}) {
  const change = formatChange(price.change_1d_pct, locale);
  const name = locale === "ne" ? price.name_ne : price.name_en;
  const subName = locale === "ne" ? price.name_en : price.name_ne;

  return (
    <Link
      href={`/${locale}/commodity/${price.slug}?market=${market}`}
      className="flex items-center gap-3 p-3 rounded-xl border border-leaf-100 bg-white hover:bg-leaf-50/40 hover:border-leaf-200 transition-all group shadow-sm"
    >
      {/* Thumbnail */}
      <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-leaf-100 bg-leaf-50 shrink-0 shadow-sm">
        <Image
          src={getProductImageUrl(price.slug, price.category)}
          alt={price.name_en}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="40px"
        />
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm text-soil-800 leading-tight truncate">{name}</div>
        <div className="text-[10px] text-soil-800/40 font-devanagari truncate mt-0.5">{subName}</div>
      </div>

      {/* Change badge */}
      <div
        className={`shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-xs ${
          direction === "up"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "bg-rose-50 text-rose-700 border border-rose-100"
        }`}
      >
        <span>{direction === "up" ? "▲" : "▼"}</span>
        <span>{change.text}</span>
      </div>
    </Link>
  );
}

export default function TopMovers({
  gainers,
  losers,
  locale,
  dict,
  market = "kalimati",
}: TopMoversProps) {
  // If no change data at all yet, render nothing (data accumulates over time)
  if (gainers.length === 0 && losers.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={dict.top_movers.title}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-extrabold text-soil-800 tracking-tight">
          {dict.top_movers.title}
        </h2>
        <p className="text-xs text-soil-800/50 mt-0.5">{dict.top_movers.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Gainers */}
        {gainers.length > 0 && (
          <div className="bg-emerald-50/40 border border-emerald-100 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] font-black">▲</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                {dict.top_movers.gainers}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {gainers.map((p) => (
                <MoverCard
                  key={`${p.commodity_id}-${p.market}`}
                  price={p}
                  locale={locale}
                  dict={dict}
                  market={market}
                  direction="up"
                />
              ))}
            </div>
          </div>
        )}

        {/* Losers */}
        {losers.length > 0 && (
          <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-black">▼</span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                {dict.top_movers.losers}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {losers.map((p) => (
                <MoverCard
                  key={`${p.commodity_id}-${p.market}`}
                  price={p}
                  locale={locale}
                  dict={dict}
                  market={market}
                  direction="down"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
