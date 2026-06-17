"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toNepaliDigits } from "@/lib/format";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  locale?: "en" | "ne";
}

export default function Pagination({
  totalPages,
  currentPage,
  totalItems,
  itemsPerPage,
  locale = "en",
}: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // If there's 1 or fewer pages, no pagination controls are needed.
  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (Number(pageNumber) <= 1) {
      params.delete("page");
    } else {
      params.set("page", pageNumber.toString());
    }
    return `${pathname}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  };

  const pageNumbers = getPageNumbers();
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const prevLabel = locale === "ne" ? "अघिल्लो" : "Prev";
  const nextLabel = locale === "ne" ? "अर्को" : "Next";

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 pb-2 border-t border-leaf-100/60 w-full">
      {/* Page Info */}
      <div className="text-xs sm:text-sm text-soil-800/60 font-medium">
        {locale === "ne" ? (
          <>
            देखाउँदै <span className="font-bold text-soil-800">{toNepaliDigits(String(startItem))}</span> देखि{" "}
            <span className="font-bold text-soil-800">{toNepaliDigits(String(endItem))}</span> सम्म (कुल{" "}
            <span className="font-bold text-soil-800">{toNepaliDigits(String(totalItems))}</span> मध्ये)
          </>
        ) : (
          <>
            Showing <span className="font-bold text-soil-800">{startItem}</span> to{" "}
            <span className="font-bold text-soil-800">{endItem}</span> of{" "}
            <span className="font-bold text-soil-800">{totalItems}</span> commodities
          </>
        )}
      </div>

      {/* Pagination Buttons */}
      <nav
        className="flex items-center gap-1.5"
        aria-label="Pagination Navigation"
      >
        {/* Previous Button */}
        {currentPage > 1 ? (
          <Link
            href={createPageURL(currentPage - 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-leaf-100 bg-white text-soil-800 hover:text-leaf-700 hover:bg-leaf-50 hover:border-leaf-300 text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{prevLabel}</span>
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-leaf-50 bg-soil-50/50 text-soil-800/30 text-xs sm:text-sm font-semibold cursor-not-allowed">
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{prevLabel}</span>
          </span>
        )}

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            const isEllipsis = page === "...";
            const isActive = page === currentPage;

            if (isEllipsis) {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center text-soil-800/40 text-xs sm:text-sm"
                >
                  {page}
                </span>
              );
            }

            const displayPage = locale === "ne" ? toNepaliDigits(String(page)) : page;

            return (
              <Link
                key={`page-${page}`}
                href={createPageURL(page)}
                className={`w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-all shadow-sm ${
                  isActive
                    ? "bg-leaf-600 text-white border border-leaf-600 hover:bg-leaf-700 hover:border-leaf-700"
                    : "border border-leaf-100 bg-white text-soil-800 hover:bg-leaf-50 hover:text-leaf-700 hover:border-leaf-300"
                }`}
              >
                {displayPage}
              </Link>
            );
          })}
        </div>

        {/* Next Button */}
        {currentPage < totalPages ? (
          <Link
            href={createPageURL(currentPage + 1)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-leaf-100 bg-white text-soil-800 hover:text-leaf-700 hover:bg-leaf-50 hover:border-leaf-300 text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <span className="hidden sm:inline">{nextLabel}</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-leaf-50 bg-soil-50/50 text-soil-800/30 text-xs sm:text-sm font-semibold cursor-not-allowed">
            <span className="hidden sm:inline">{nextLabel}</span>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </nav>
    </div>
  );
}
