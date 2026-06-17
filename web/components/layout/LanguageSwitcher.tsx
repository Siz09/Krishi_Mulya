"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Languages } from "lucide-react";

interface LanguageSwitcherProps {
  locale: "en" | "ne";
}

export default function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleToggle = () => {
    const segments = pathname.split("/");
    // pathname starts with '/' so segments[0] is "" and segments[1] is the locale
    const currentLocale = segments[1] === "ne" ? "ne" : "en";
    const targetLocale = currentLocale === "en" ? "ne" : "en";
    
    segments[1] = targetLocale;
    let targetPath = segments.join("/");
    
    const queryStr = searchParams.toString();
    if (queryStr) {
      targetPath += `?${queryStr}`;
    }

    // Set cookie for middleware to remember user preference
    document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    router.push(targetPath);
  };

  const label = locale === "en" ? "Switch to Nepali" : "अंग्रेजीमा बदल्नुहोस्";

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={label}
      title={label}
      className="flex items-center gap-2 text-soil-800/70 hover:text-leaf-600 hover:bg-leaf-50 px-3 py-1.5 rounded-lg transition-all text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-leaf-500/20 cursor-pointer border border-leaf-100/30 shadow-sm"
    >
      <Languages className="h-4 w-4 text-leaf-600" />
      <span>{locale === "en" ? "नेपाली" : "English"}</span>
    </button>
  );
}
