import NepaliDate from "nepali-date-converter";

// ─── Unit label translations ──────────────────────────────────────────────────
const UNIT_NE: Record<string, string> = {
  kg: "केजी",
  dozen: "दर्जन",
  piece: "गोटा",
};

const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

export function toNepaliDigits(str: string): string {
  return str.replace(/\d/g, (d) => NEPALI_DIGITS[parseInt(d, 10)]);
}

/**
 * Formats a commodity price with currency prefix and unit suffix.
 * Converts numeric digits to Devanagari digits when locale is "ne".
 *
 * @example
 *   formatPrice(125, "kg", "en")  → "Rs. 125/kg"
 *   formatPrice(125, "kg", "ne")  → "रु १२५/केजी"
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
  const formattedDisplay = locale === "ne" ? toNepaliDigits(display) : display;

  const prefix = locale === "ne" ? "रु" : "Rs.";

  if (opts?.priceOnly) {
    return `${prefix} ${formattedDisplay}`;
  }

  const unitLabel = locale === "ne" ? (UNIT_NE[unit.toLowerCase()] ?? unit) : unit;
  return `${prefix} ${formattedDisplay}/${unitLabel}`;
}

/**
 * Formats a percentage change value.
 * Converts numeric digits to Devanagari digits when locale is "ne".
 *
 * @example
 *   formatChange(3.2, "en")  → { text: "+3.2%", direction: "up" }
 *   formatChange(-1.8, "ne") → { text: "-१.८%", direction: "down" }
 *   formatChange(0, "en")    → { text: "0%",    direction: "none" }
 *   formatChange(null, "en") → { text: "—",     direction: "none" }
 */
export function formatChange(
  pct: number | null | undefined,
  locale?: "en" | "ne"
): {
  text: string;
  direction: "up" | "down" | "none";
} {
  if (pct === null || pct === undefined) return { text: "—", direction: "none" };
  const absPct = Math.abs(pct);
  const rounded = Math.round(absPct * 100) / 100;
  const display = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  const formattedPct = locale === "ne" ? toNepaliDigits(display) : display;

  if (pct > 0) return { text: `+${formattedPct}%`, direction: "up" };
  if (pct < 0) return { text: `-${formattedPct}%`, direction: "down" };
  return { text: `${formattedPct}%`, direction: "none" };
}

/**
 * Converts a Gregorian (AD) date to Bikram Sambat (BS) and formats it.
 * Bikram Sambat dates use Devanagari digits for the Nepali locale.
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

/**
 * Formats a Gregorian (AD) date to localized Bikram Sambat (BS) Month & Year.
 * Used for monthly retail datasets (e.g. WFP).
 *
 * @example
 *   formatMonthlyDate("2026-06-01", "en") → "Ashadh 2083 BS"
 *   formatMonthlyDate("2026-06-01", "ne") → "असार २०८३"
 */
export function formatMonthlyDate(
  dateInput: string | Date | null | undefined,
  locale: "en" | "ne"
): string {
  if (!dateInput) return "—";

  try {
    const dateObj =
      typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(dateObj.getTime())) return "—";

    const bsDate = new NepaliDate(dateObj);
    const bsMonth = bsDate.getMonth(); // 0-11
    const bsYear = bsDate.getYear();

    const bsMonthsEn = [
      "Baishakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin",
      "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"
    ];
    const bsMonthsNe = [
      "वैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज",
      "कात्तिक", "मंसिर", "पुस", "माघ", "फागुन", "चैत"
    ];

    const monthLabel = locale === "ne" ? bsMonthsNe[bsMonth] : bsMonthsEn[bsMonth];
    const yearLabel = locale === "ne" ? toNepaliDigits(String(bsYear)) : String(bsYear);

    return locale === "ne" ? `${monthLabel} ${yearLabel}` : `${monthLabel} ${yearLabel} BS`;
  } catch {
    return "—";
  }
}
