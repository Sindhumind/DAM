import { Search, SlidersHorizontal } from "lucide-react";
import type { AssetFilter } from "../../types/asset";

interface AssetFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  activeFilter: AssetFilter;
  onFilterChange: (filter: AssetFilter) => void;
}

const filters: { label: string; value: AssetFilter }[] = [
  { label: "All assets", value: "all" },
  { label: "Images", value: "image" },
  { label: "Videos", value: "video" },
];

export default function AssetFilters({
  searchValue,
  onSearchChange,
  activeFilter,
  onFilterChange,
}: AssetFiltersProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="w-full sm:max-w-sm">

        <div className="relative">
          <Search
            size={17}
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            id="asset-search"
            type="search"
            placeholder="Search by filename..."
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 flex items-center gap-1 text-sm text-slate-500">
          <SlidersHorizontal size={15} aria-hidden="true" />
          Filter:
        </span>

        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFilterChange(filter.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
