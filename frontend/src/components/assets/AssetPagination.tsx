import { ChevronLeft, ChevronRight } from "lucide-react";

interface AssetPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

function getVisiblePages(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, idx) => idx + 1);
  }

  if (current <= 3) {
    return [1, 2, 3, 4, "ellipsis", total];
  }

  if (current >= total - 2) {
    return [1, "ellipsis", total - 3, total - 2, total - 1, total];
  }

  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

export default function AssetPagination({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50],

}: AssetPaginationProps) {
  const showPageSizeSelector =
    typeof pageSize === "number" && typeof onPageSizeChange === "function";

  if (totalPages <= 1 && !showPageSizeSelector) {
    return null;
  }

  const safeCurrentPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
  const pages = getVisiblePages(safeCurrentPage, totalPages);

  return (
    <nav
      aria-label="Asset pagination"
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-sm text-slate-500">
          Page{" "}
          <span className="font-semibold text-slate-800">{safeCurrentPage}</span>{" "}
          of{" "}
          <span className="font-semibold text-slate-800">
            {Math.max(1, totalPages)}
          </span>
        </p>

        {showPageSizeSelector && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <span>Items per page:</span>
            <select
              aria-label="Items per page"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={safeCurrentPage === 1}
            onClick={() => onPageChange(safeCurrentPage - 1)}
            aria-label="Previous page"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          {pages.map((item, index) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${index}`}
                aria-hidden="true"
                className="px-2 py-2 text-sm text-slate-400"
              >
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                aria-current={item === safeCurrentPage ? "page" : undefined}
                aria-label={`Page ${item}`}
                onClick={() => onPageChange(item)}
                className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition-colors ${item === safeCurrentPage
                    ? "bg-indigo-600 text-white"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={safeCurrentPage === totalPages}
            onClick={() => onPageChange(safeCurrentPage + 1)}
            aria-label="Next page"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </nav>
  );
}