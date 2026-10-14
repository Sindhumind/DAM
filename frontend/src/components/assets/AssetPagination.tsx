import { ChevronLeft, ChevronRight } from "lucide-react";

interface AssetPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function AssetPagination({
  currentPage,
  totalPages,
  onPageChange,
}: AssetPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  return (
    <nav
      aria-label="Asset pagination"
      className="mt-6 flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-slate-500">
        Page{" "}
        <span className="font-semibold text-slate-800">{safeCurrentPage}</span>{" "}
        of <span className="font-semibold text-slate-800">{totalPages}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={safeCurrentPage === 1}
          onClick={() => onPageChange(safeCurrentPage - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
          Previous
        </button>

        <button
          type="button"
          disabled={safeCurrentPage === totalPages}
          onClick={() => onPageChange(safeCurrentPage + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
