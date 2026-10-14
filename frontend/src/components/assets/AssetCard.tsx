import { Play, File as FileIcon, Trash2 } from "lucide-react";
import type { Asset } from "../../types/asset";

interface AssetCardProps {
  asset: Asset;
  previewUrl: string;
  onPlayVideo: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  formatFileSize: (size: number | string) => string;
  formatDate: (date: string) => string;
}

export default function AssetCard({
  asset,
  previewUrl,
  onPlayVideo,
  onDelete,
  formatFileSize,
  formatDate,
}: AssetCardProps) {
  const isImage = asset.mime_type?.toLowerCase().startsWith("image/");
  const isVideo = asset.mime_type?.toLowerCase().startsWith("video/");

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-100">
        {isImage || (isVideo && asset.metadata?.thumbnailKey) ? (
          <img
            src={previewUrl}
            alt={asset.original_filename}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : isVideo ? (
          <Play size={30} className="text-indigo-500" />
        ) : (
          <FileIcon size={30} className="text-slate-400" />
        )}

        {isVideo && (
          <button
            type="button"
            aria-label={`Play ${asset.original_filename}`}
            onClick={() => onPlayVideo(asset)}
            className="absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/30"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-md">
              <Play size={23} fill="currentColor" />
            </span>
          </button>
        )}
      </div>

      <div className="p-4">
        <h3
          title={asset.original_filename}
          className="truncate font-semibold text-slate-800"
        >
          {asset.original_filename}
        </h3>

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate">{asset.mime_type || "Unknown type"}</span>
          <span className="shrink-0">{formatFileSize(asset.file_size)}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {asset.status || "Uploaded"}
          </span>
          <span className="text-xs text-slate-400">
            {formatDate(asset.created_at)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onDelete(asset)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
        >
          <Trash2 size={16} />
          Delete asset
        </button>
      </div>
    </article>
  );
}