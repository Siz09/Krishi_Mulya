"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";

interface MarketSelectorProps {
  locale?: "en" | "ne";
}

const MARKET_LABELS: Record<string, Record<"en" | "ne", string>> = {
  all: { en: "All Locations", ne: "सबै स्थानहरू" },
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

const MARKETS = [
  { id: "all" },
  { id: "kalimati" },
  { id: "birtamod" },
  { id: "dharan" },
  { id: "dhalkebar" },
  { id: "kamalamai" },
  { id: "kawasoti" },
  { id: "pokhara" },
  { id: "butwal" },
  { id: "kohalpur" },
  { id: "birendranagar" },
  { id: "attariya" },
  { id: "lalbandi" },
];

export default function MarketSelector({ locale = "en" }: MarketSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentMarket = searchParams.get("market") || "all";
  const selectedMarketName = MARKET_LABELS[currentMarket]?.[locale] || currentMarket;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (marketId: string) => {
    setIsOpen(false);
    const params = new URLSearchParams(searchParams.toString());
    if (marketId === "all") {
      params.delete("market");
    } else {
      params.set("market", marketId);
    }
    params.delete("page");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="relative w-full md:w-60" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center justify-between w-full px-4 py-2 bg-white text-soil-800 border border-leaf-200 rounded-xl shadow-sm text-sm font-semibold hover:border-leaf-400 focus:outline-none transition-colors cursor-pointer h-10"
      >
        <span className="flex items-center gap-2 overflow-hidden">
          <MapPin className="h-4 w-4 text-leaf-600 shrink-0" />
          <span className="truncate">{selectedMarketName}</span>
        </span>
        <span className="flex items-center gap-1">
          {isPending && (
            <div className="h-3 w-3 animate-spin rounded-full border border-leaf-500 border-t-transparent shrink-0" />
          )}
          <ChevronDown className={`h-4 w-4 text-soil-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-leaf-100 rounded-xl shadow-lg z-50 py-1 scrollbar-thin">
          {MARKETS.map((m) => {
            const active = currentMarket === m.id;
            const marketLabel = MARKET_LABELS[m.id]?.[locale] || m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleSelect(m.id)}
                className={`flex items-center justify-between w-full px-4 py-2 text-left text-xs font-semibold hover:bg-leaf-50 transition-colors cursor-pointer ${
                  active ? "text-leaf-700 bg-leaf-50/50" : "text-soil-750"
                }`}
              >
                <span>{marketLabel}</span>
                {active && <Check className="h-3.5 w-3.5 text-leaf-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
