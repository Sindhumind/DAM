import { Grid2X2, List } from "lucide-react";
import type { ViewMode } from "../../types/asset";

interface AssetToolbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  assetCount: number;
}

export default function AssetToolbar({
  viewMode,
  onViewModeChange,
  assetCount,
}: AssetToolbarProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500" aria-live="polite">
        <span className="font-semibold text-slate-800">{assetCount}</span>{" "}
        {assetCount === 1 ? "asset" : "assets"} found
      </p>

      <div
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1"
        role="group"
        aria-label="Asset view mode"
      >
        <button
          type="button"
          aria-label="Grid view"
          aria-pressed={viewMode === "grid"}
          onClick={() => onViewModeChange("grid")}
          className={`rounded-md p-2 transition-colors ${
            viewMode === "grid"
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <Grid2X2 size={18} />
        </button>

        <button
          type="button"
          aria-label="List view"
          aria-pressed={viewMode === "list"}
          onClick={() => onViewModeChange("list")}
          className={`rounded-md p-2 transition-colors ${
            viewMode === "list"
              ? "bg-indigo-50 text-indigo-600"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <List size={18} />
        </button>
      </div>
    </div>
  );
}
