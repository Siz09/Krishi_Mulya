import NepaliDate from "nepali-date-converter";

// ─── Unit label translations ──────────────────────────────────────────────────
const UNIT_NE: Record<string, string> = {
  kg: "केजी",
  dozen: "दर्जन",
  piece: "गोटा",
};

/**
 * Formats a commodity price with currency prefix and unit suffix.
 * Numeric values always use Arabic numerals (0-9) in both locales —
 * these are "scan for magnitude" values where rapid recognition matters.
 *
 * @example
 *   formatPrice(125, "kg", "en")  → "Rs. 125/kg"
 *   formatPrice(125, "kg", "ne")  → "रु 125/केजी"
 *   formatPrice(null, "kg", "en") → "—"
 */
export function formatPrice(
  value: number | null | undefined,
  unit: string,
  locale: "en" | "ne",
  opts?: { priceOnly?: boolean }
): string {
  if (value === null || value === undefined) return "—";

  const rounded = Math.round(value * 100) / 100;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);

  const prefix = locale === "ne" ? "रु" : "Rs.";

  if (opts?.priceOnly) {
    return `${prefix} ${display}`;
  }

  const unitLabel = locale === "ne" ? (UNIT_NE[unit.toLowerCase()] ?? unit) : unit;
  return `${prefix} ${display}/${unitLabel}`;
}

/**
 * Formats a percentage change value.
 * Always Arabic numerals regardless of locale (same rule as prices above).
 *
 * @example
 *   formatChange(3.2)  → { text: "+3.2%", direction: "up" }
 *   formatChange(-1.8) → { text: "-1.8%", direction: "down" }
 *   formatChange(0)    → { text: "0%",    direction: "none" }
 *   formatChange(null) → { text: "—",     direction: "none" }
 */
export function formatChange(pct: number | null | undefined): {
  text: string;
  direction: "up" | "down" | "none";
} {
  if (pct === null || pct === undefined) return { text: "—", direction: "none" };
  if (pct > 0) return { text: `+${pct}%`, direction: "up" };
  if (pct < 0) return { text: `${pct}%`, direction: "down" };
  return { text: "0%", direction: "none" };
}

// Devanagari digit map for BS date conversion
const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function toNepaliDigits(str: string): string {
  return str.replace(/\d/g, (d) => NEPALI_DIGITS[parseInt(d, 10)]);
}

/**
 * Converts a Gregorian (AD) date to Bikram Sambat (BS) and formats it.
 * Bikram Sambat dates are the one exception to the "Arabic-numerals only"
 * rule — they are read as a whole label so Devanagari digits are appropriate
 * for the Nepali locale.
 *
 * @example
 *   formatBSDate("2026-06-16", "en") → "2083-03-02 BS"
 *   formatBSDate("2026-06-16", "ne") → "२०८३-०३-०२"
 *   formatBSDate(null, "en")         → "—"
 */
export function formatBSDate(
  dateInput: string | Date | null | undefined,
  locale: "en" | "ne"
): string {
  if (!dateInput) return "—";

  try {
    const dateObj =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(dateObj.getTime())) return "—";

    const bsDate = new NepaliDate(dateObj);
    const formatted = bsDate.format("YYYY-MM-DD"); // e.g. "2083-03-02"

    return locale === "ne" ? toNepaliDigits(formatted) : `${formatted} BS`;
  } catch {
    return "—";
  }
}
