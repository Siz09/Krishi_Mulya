import Link from "next/link";
import { Sprout, Languages } from "lucide-react";
import ActiveLink from "./ActiveLink";

export default function Header() {
  const navItems = [
    { label: "All Prices", href: "/" },
    { label: "Vegetables", href: "/vegetables" },
    { label: "Fruits", href: "/fruits" },
    { label: "Fish", href: "/fish" },
  ];

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

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => {
            return (
              <ActiveLink
                key={item.href}
                href={item.href}
                className="text-sm font-semibold py-1.5 transition-colors border-b-2 hover:text-leaf-600 border-transparent text-soil-800/70"
                activeClassName="!border-leaf-600 !text-leaf-600"
              >
                {item.label}
              </ActiveLink>
            );
          })}
        </nav>

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

      {/* Mobile Nav subheader bar */}
      <div className="md:hidden flex overflow-x-auto border-t border-leaf-50 bg-soil-50/50 px-4 py-2 gap-2 scrollbar-none">
        {navItems.map((item) => {
          return (
            <ActiveLink
              key={item.href}
              href={item.href}
              className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors bg-white text-soil-800/70 border border-leaf-100 hover:bg-leaf-50"
              activeClassName="!bg-leaf-600 !text-white !border-leaf-600 shadow-sm"
            >
              {item.label}
            </ActiveLink>
          );
        })}
      </div>
    </header>
  );
}
