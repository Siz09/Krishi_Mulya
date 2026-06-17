"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Tag, ChevronDown, Check } from "lucide-react";
import type { Dictionary } from "@/lib/dictionary";

interface CategorySelectorProps {
  currentCategory?: string;
  locale?: "en" | "ne";
  dict: Dictionary;
}

const CATEGORIES = [
  { id: "", label: "All Products", href: "/", dictKey: "all" },
  { id: "vegetable", label: "Vegetables", href: "/vegetables", dictKey: "vegetables" },
  { id: "fruit", label: "Fruits", href: "/fruits", dictKey: "fruits" },
  { id: "spice", label: "Spices", href: "/spices", dictKey: "spices" },
  { id: "leafy_green", label: "Leafy Greens", href: "/leafy-greens", dictKey: "leafy_greens" },
  { id: "mushroom", label: "Mushrooms", href: "/mushrooms", dictKey: "mushrooms" },
  { id: "root_vegetable", label: "Root Vegetables", href: "/root-vegetables", dictKey: "root_vegetables" },
  { id: "legume", label: "Legumes", href: "/legumes", dictKey: "legumes" },
  { id: "fish", label: "Fish", href: "/fish", dictKey: "fish" },
  { id: "meat", label: "Meat", href: "/meat", dictKey: "meat" },
  { id: "dairy", label: "Dairy", href: "/dairy", dictKey: "dairy" },
  { id: "other", label: "Other Grains", href: "/other-grains", dictKey: "other_grains" },
];

export default function CategorySelector({
  currentCategory = "",
  locale = "en",
  dict,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const activeCategory = CATEGORIES.find((c) => c.id === currentCategory) || CATEGORIES[0];
  const activeCategoryLabel = activeCategory.id === "" 
    ? dict.nav.all_products 
    : dict.nav[activeCategory.dictKey as keyof typeof dict.nav] || activeCategory.label;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getHref = (path: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    const queryString = params.toString();
    const localizedPath = path === "/" ? `/${locale}` : `/${locale}${path}`;
    return queryString ? `${localizedPath}?${queryString}` : localizedPath;
  };

  return (
    <div className="relative w-full md:w-56" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white text-soil-800 border border-leaf-200 rounded-xl shadow-sm text-sm font-semibold hover:border-leaf-400 focus:outline-none transition-colors cursor-pointer h-10"
      >
        <span className="flex items-center gap-2 overflow-hidden">
          <Tag className="h-4 w-4 text-leaf-600 shrink-0" />
          <span className="truncate">{activeCategoryLabel}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-soil-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-leaf-100 rounded-xl shadow-lg z-50 py-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const active = currentCategory === cat.id;
            const catLabel = cat.id === "" 
              ? dict.nav.all_products 
              : dict.nav[cat.dictKey as keyof typeof dict.nav] || cat.label;
            
            return (
              <Link
                key={cat.id}
                href={getHref(cat.href)}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between w-full px-4 py-2 text-left text-xs font-semibold hover:bg-leaf-50 transition-colors cursor-pointer ${
                  active ? "text-leaf-700 bg-leaf-50/50" : "text-soil-750"
                }`}
              >
                <span>{catLabel}</span>
                {active && <Check className="h-3.5 w-3.5 text-leaf-600 shrink-0" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
