import Link from "next/link";
import { Sprout, Languages } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-leaf-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand logo & wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-50 text-leaf-600 transition-colors group-hover:bg-leaf-100">
            <Sprout className="h-6 w-6 text-leaf-600 fill-leaf-600/20" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-soil-800 leading-tight text-lg tracking-tight">
              Krishi Mulya
            </span>
            <span className="font-devanagari font-bold text-leaf-600 text-[10px] tracking-wide leading-none -mt-0.5">
              कृषि मूल्य
            </span>
          </div>
        </Link>

        {/* Language switcher & settings button */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="flex items-center gap-2 text-soil-800/70 hover:text-leaf-600 hover:bg-leaf-50 px-3 py-1.5 rounded-lg transition-colors text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-leaf-500/20 cursor-not-allowed"
            title="Language translation coming soon"
          >
            <Languages className="h-4 w-4" />
            <span>English / नेपाली</span>
          </button>
        </div>
      </div>
    </header>
  );
}
