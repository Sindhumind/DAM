import { Play, File as FileIcon, Trash2, Eye, Pencil } from "lucide-react";

import type { Asset } from "../../types/asset";
import AuthenticatedImage from "./AuthenticatedImage";

interface AssetCardProps {
  asset: Asset;
  previewUrl: string;
  onPlayVideo: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  formatFileSize: (size: number | string) => string;
  formatDate: (date: string) => string;
  canManage: boolean;
}

export default function AssetCard({
  asset,
  previewUrl,
  onPlayVideo,
  onDelete,
  onEdit,
  formatFileSize,
  formatDate,
  canManage,
}: AssetCardProps) {
  const isImage = asset.mime_type?.toLowerCase().startsWith("image/");
  const isVideo = asset.mime_type?.toLowerCase().startsWith("video/");

  // Display the custom title, falling back to the original filename.
  const assetTitle =
    typeof asset.metadata?.title === "string" &&
    asset.metadata.title.trim().length > 0
      ? asset.metadata.title
      : asset.original_filename;

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative flex h-44 items-center justify-center overflow-hidden bg-slate-100">
        {isImage || (isVideo && asset.metadata?.thumbnailKey) ? (
          <button
            type="button"
            onClick={() => onPlayVideo(asset)}
            aria-label={`Preview ${assetTitle}`}
            className="absolute inset-0 h-full w-full cursor-pointer"
          >
            <AuthenticatedImage
              src={previewUrl}
              alt={assetTitle}
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition hover:bg-black/25 hover:opacity-100">
              <Eye size={28} />
            </span>
          </button>
        ) : isVideo ? (
          <>
            <Play size={30} className="text-indigo-500" />
            <button
              type="button"
              aria-label={`Play ${assetTitle}`}
              onClick={() => onPlayVideo(asset)}
              className="absolute inset-0 flex items-center justify-center bg-black/10 transition hover:bg-black/30"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-indigo-600 shadow-md">
                <Play size={23} fill="currentColor" />
              </span>
            </button>
          </>
        ) : (
          <FileIcon size={30} className="text-slate-400" />
        )}
      </div>

      <div className="p-4">
        <h3
          title={assetTitle}
          className="truncate font-semibold text-slate-800"
        >
          {assetTitle}
        </h3>

        {typeof asset.metadata?.description === "string" &&
          asset.metadata.description.trim() && (
            <p className="mt-1 truncate text-sm text-slate-500">
              {asset.metadata.description}
            </p>
          )}

        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate">{asset.mime_type || "Unknown type"}</span>
          <span className="shrink-0">{formatFileSize(asset.file_size)}</span>
        </div>

        {typeof asset.metadata?.category === "string" &&
          asset.metadata.category.trim() && (
            <div className="mt-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">
                {asset.metadata.category}
              </span>
            </div>
          )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {asset.status || "Uploaded"}
          </span>
          <span className="text-xs text-slate-400">
            {formatDate(asset.created_at)}
          </span>
        </div>

        {canManage && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(asset)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50"
            >
              <Pencil size={16} />
              Edit metadata
            </button>

            <button
              type="button"
              onClick={() => onDelete(asset)}
              aria-label={`Delete ${assetTitle}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
