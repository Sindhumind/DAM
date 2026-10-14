import { ImagePlus } from "lucide-react";

interface AssetEmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function AssetEmptyState({
  title = "No assets found",
  message = "Upload your first image or video to get started.",
  actionLabel,
  onAction,
}: AssetEmptyStateProps) {
  return (
    <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-4 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
        <ImagePlus size={26} />
      </div>

      <h3 className="mt-4 font-semibold text-slate-800">{title}</h3>

      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        >
          <ImagePlus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
