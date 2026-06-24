import { Sprout } from "lucide-react";
import type { Dictionary } from "@/lib/dictionary";
import type { ScraperStatusResponse } from "@/app/api/scraper-status/route";

interface FooterProps {
  locale?: "en" | "ne";
  dict: Dictionary;
}

async function getScraperStatus(): Promise<ScraperStatusResponse | null> {
  try {
    // Self-call during SSR. next: { revalidate: 1800 } caches for 30 min.
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${baseUrl}/api/scraper-status`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Footer({ locale = "en", dict }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const status = await getScraperStatus();

  const isLive = status?.overall === "live";
  const isStale = status?.overall === "stale";
  const lastDate = status?.kalimati?.lastDate;
  const lastWfp = status?.wfp?.lastMonth;

  const statusLabel = isLive
    ? (locale === "ne" ? "लाइभ" : "Live")
    : isStale
    ? (locale === "ne" ? "पुरानो" : "Stale")
    : (locale === "ne" ? "अज्ञात" : "Unknown");

  const statusColor = isLive
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : isStale
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-gray-50 text-gray-500 border-gray-200";

  const dotColor = isLive
    ? "bg-emerald-500"
    : isStale
    ? "bg-amber-500"
    : "bg-gray-400";

  const dotAnimate = isLive ? "animate-pulse" : "";

  return (
    <footer className="w-full bg-white border-t border-leaf-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-start gap-8">
        
        {/* Brand details */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-leaf-600 fill-leaf-600/20" />
            <span className="font-extrabold text-soil-800 text-lg tracking-tight">
              Krishi Mulya <span className="font-devanagari font-bold text-leaf-600 text-[13px] ml-1">कृषि मूल्य</span>
            </span>
          </div>
          <p className="text-xs text-soil-800/60 max-w-sm">
            {dict.footer.desc}
          </p>
          <p className="text-[10px] text-soil-800/40">
            &copy; {currentYear} Krishi Mulya. All rights reserved.
          </p>
        </div>

        {/* Data Attribution & Scraper Status */}
        <div className="flex flex-col gap-4 text-xs text-soil-800/70 max-w-md">
          <div>
            <span className="font-bold text-soil-800 block mb-1">{dict.footer.source_attribution}</span>
            <span className="text-soil-800/60">
              {dict.footer.source_desc}
            </span>
          </div>

          {/* Live scraper status */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[10px]">
              <span className="text-soil-800/40">{dict.footer.scraper_status}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium border text-[10px] ${statusColor}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${dotColor} ${dotAnimate}`} />
                {statusLabel}
              </span>
            </div>

            {/* Last update details */}
            <div className="text-[10px] text-soil-800/40 flex flex-col gap-0.5 pl-0.5">
              {lastDate && (
                <span>
                  {locale === "ne" ? "कालीमाटी: " : "Kalimati: "}
                  <span className="font-mono text-soil-800/60">{lastDate}</span>
                  {isStale && (
                    <span className="ml-1 text-amber-600 font-semibold">
                      {locale === "ne" ? "· पुरानो डाटा" : "· data is stale"}
                    </span>
                  )}
                </span>
              )}
              {lastWfp && (
                <span>
                  {locale === "ne" ? "WFP स्टेपल: " : "WFP staples: "}
                  <span className="font-mono text-soil-800/60">{lastWfp}</span>
                  {status?.wfp?.isStale && (
                    <span className="ml-1 text-amber-600 font-semibold">
                      {locale === "ne" ? "· पुरानो" : "· stale"}
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
