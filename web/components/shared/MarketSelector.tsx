"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const MARKETS = [
  { id: "kalimati", label: "Kathmandu (Kalimati)" },
  { id: "pokhara", label: "Pokhara" },
  { id: "butwal", label: "Butwal" },
  { id: "biratnagar", label: "Biratnagar" },
];

export default function MarketSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentMarket = searchParams.get("market") || "kalimati";

  const handleSelect = (marketId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (marketId === "kalimati") {
      params.delete("market");
    } else {
      params.set("market", marketId);
    }

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="flex items-center gap-1 bg-leaf-50/50 p-1 rounded-lg border border-leaf-100/60 shadow-sm overflow-x-auto scrollbar-none w-full md:w-auto">
      {MARKETS.map((m) => {
        const active = currentMarket === m.id;
        return (
          <button
            key={m.id}
            onClick={() => handleSelect(m.id)}
            disabled={isPending}
            className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              active
                ? "bg-white text-leaf-700 shadow-sm border border-leaf-100"
                : "text-soil-800/60 hover:text-leaf-700 hover:bg-white/40"
            }`}
          >
            {m.label}
          </button>
        );
      })}
      {isPending && (
        <div className="px-2">
          <div className="h-3 w-3 animate-spin rounded-full border border-leaf-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
