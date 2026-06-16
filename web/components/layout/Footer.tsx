import { Sprout } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

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
            Empowering Nepalese farmers, traders, and consumers with daily transparent pricing data from wholesale markets across Nepal.
          </p>
          <p className="text-[10px] text-soil-800/40">
            &copy; {currentYear} Krishi Mulya. All rights reserved.
          </p>
        </div>

        {/* Data Attribution & Scraper Status */}
        <div className="flex flex-col gap-4 text-xs text-soil-800/70 max-w-md">
          <div>
            <span className="font-bold text-soil-800 block mb-1">Data Source Attribution</span>
            <span className="text-soil-800/60">
              Pricing details sourced directly from the official daily publications of the{" "}
              <a
                href="https://kalimatimarket.gov.np"
                target="_blank"
                rel="noopener noreferrer"
                className="text-leaf-600 hover:text-leaf-500 font-semibold underline"
              >
                Kalimati Fruits & Vegetable Market Development Board
              </a>
              , Government of Nepal.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-soil-800/40">Scraper Update Status:</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Online (Daily 00:45 UTC)
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
