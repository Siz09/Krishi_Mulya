"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Tag, ChevronDown, Check } from "lucide-react";

interface CategorySelectorProps {
  currentCategory?: string;
}

const CATEGORIES = [
  { id: "", label: "All Products", href: "/" },
  { id: "vegetable", label: "Vegetables", href: "/vegetables" },
  { id: "fruit", label: "Fruits", href: "/fruits" },
  { id: "spice", label: "Spices", href: "/spices" },
  { id: "leafy_green", label: "Leafy Greens", href: "/leafy-greens" },
  { id: "mushroom", label: "Mushrooms", href: "/mushrooms" },
  { id: "root_vegetable", label: "Root Vegetables", href: "/root-vegetables" },
  { id: "legume", label: "Legumes", href: "/legumes" },
  { id: "fish", label: "Fish", href: "/fish" },
  { id: "meat", label: "Meat", href: "/meat" },
  { id: "dairy", label: "Dairy", href: "/dairy" },
  { id: "other", label: "Other Grains", href: "/other-grains" },
];

export default function CategorySelector({ currentCategory = "" }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const activeCategory = CATEGORIES.find((c) => c.id === currentCategory) || CATEGORIES[0];

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
    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
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
          <span className="truncate">{activeCategory.label}</span>
        </span>
        <ChevronDown className={`h-4 w-4 text-soil-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-leaf-100 rounded-xl shadow-lg z-50 py-1 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const active = currentCategory === cat.id;
            return (
              <Link
                key={cat.id}
                href={getHref(cat.href)}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between w-full px-4 py-2 text-left text-xs font-semibold hover:bg-leaf-50 transition-colors cursor-pointer ${
                  active ? "text-leaf-700 bg-leaf-50/50" : "text-soil-750"
                }`}
              >
                <span>{cat.label}</span>
                {active && <Check className="h-3.5 w-3.5 text-leaf-600 shrink-0" />}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
