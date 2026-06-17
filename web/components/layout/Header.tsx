import Link from "next/link";
import { Sprout } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Dictionary } from "@/lib/dictionary";

interface HeaderProps {
  locale?: "en" | "ne";
  dict: Dictionary;
}

export default function Header({ locale = "en", dict }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-leaf-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand logo & wordmark */}
        <Link href={`/${locale}`} className="flex items-center gap-2.5 group focus:outline-none">
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

        {/* Navigation links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href={`/${locale}/vegetables`}
            className="text-sm font-semibold text-soil-800/80 hover:text-leaf-600 transition-colors"
          >
            {dict.nav.vegetables}
          </Link>
          <Link
            href={`/${locale}/fruits`}
            className="text-sm font-semibold text-soil-800/80 hover:text-leaf-600 transition-colors"
          >
            {dict.nav.fruits}
          </Link>
          <Link
            href={`/${locale}/fish`}
            className="text-sm font-semibold text-soil-800/80 hover:text-leaf-600 transition-colors"
          >
            {dict.nav.fish}
          </Link>
        </nav>

        {/* Language switcher */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}
