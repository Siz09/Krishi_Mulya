import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatChange } from "@/lib/format";

interface PriceChangeBadgeProps {
  pct: number | null | undefined;
}

export default function PriceChangeBadge({ pct }: PriceChangeBadgeProps) {
  const { text, direction } = formatChange(pct);

  if (direction === "up") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 border border-amber-200"
        aria-label={`Price increased by ${text}`}
      >
        <TrendingUp className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
        <span>{text}</span>
      </span>
    );
  }

  if (direction === "down") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 border border-blue-200"
        aria-label={`Price decreased by ${text}`}
      >
        <TrendingDown className="h-3.5 w-3.5 text-blue-600" aria-hidden="true" />
        <span>{text}</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-500 border border-gray-200"
      aria-label="Price is stable"
    >
      <Minus className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
      <span>{text}</span>
    </span>
  );
}
