"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const initialQuery = searchParams.get("q") || "";
  const [inputValue, setInputValue] = useState(initialQuery);

  useEffect(() => {
    setInputValue(searchParams.get("q") || "");
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentQ = params.get("q") || "";
      if (currentQ === inputValue) return;

      if (inputValue) {
        params.set("q", inputValue);
      } else {
        params.delete("q");
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue, pathname, router, searchParams]);

  const handleClear = () => {
    setInputValue("");
  };

  return (
    <div className="relative w-full md:w-96 group">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-leaf-500 h-5 w-5 pointer-events-none flex items-center justify-center">
        <Search className="h-4 w-4 text-leaf-600" />
      </span>
      <input
        type="text"
        name="search"
        id="search"
        className="w-full pl-10 pr-10 py-2 bg-white border border-leaf-100 rounded-lg text-sm text-soil-800 placeholder-soil-800/40 focus:outline-none focus:border-leaf-600 focus:ring-1 focus:ring-leaf-600 transition-all shadow-sm hover:shadow-interactive"
        placeholder="Search commodity (e.g. Tomato, गोलभेडा)..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-soil-800/40 hover:text-soil-800/70"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {isPending && (
        <div className="absolute right-10 inset-y-0 flex items-center pr-1">
          <div className="h-3 w-3 animate-spin rounded-full border border-leaf-500 border-t-transparent" />
        </div>
      )}
    </div>
  );
}
