import { File as FileIcon, Play, Trash2 } from "lucide-react";
import type { Asset } from "../../types/asset";
import formatFileSize from "../../utils/formatFileSize";
import formatDate from "../../utils/formatDate";

interface AssetListProps {
  assets: Asset[];
  getPreviewUrl: (asset: Asset) => string;
  onPlayVideo: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

export default function AssetList({
  assets,
  getPreviewUrl,
  onPlayVideo,
  onDelete,
}: AssetListProps) {
  if (assets.length === 0) {
    return (
      <div className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-14 text-center">
        <h3 className="font-semibold text-slate-800">No assets found</h3>
        <p className="mt-1 text-sm text-slate-500">
          Try changing your search or filter, or upload a file.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-162.5 text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Asset</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Size</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {assets.map((asset) => {
            const isImage = asset.mime_type?.toLowerCase().startsWith("image/");
            const isVideo = asset.mime_type?.toLowerCase().startsWith("video/");

            return (
              <tr key={asset.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-slate-100">
                      {isImage || (isVideo && asset.metadata?.thumbnailKey) ? (
                        <img
                          src={getPreviewUrl(asset)}
                          alt={asset.original_filename}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : isVideo ? (
                        <Play size={20} className="text-indigo-500" />
                      ) : (
                        <FileIcon size={20} className="text-slate-400" />
                      )}

                      {isVideo && (
                        <button
                          type="button"
                          aria-label={`Play ${asset.original_filename}`}
                          onClick={() => onPlayVideo(asset)}
                          className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30"
                        >
                          <Play
                            size={15}
                            fill="currentColor"
                            className="text-white"
                          />
                        </button>
                      )}
                    </div>

                    <span
                      title={asset.original_filename}
                      className="max-w-xs truncate font-medium text-slate-800"
                    >
                      {asset.original_filename}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {asset.mime_type || "Unknown"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatFileSize(asset.file_size)}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {asset.status || "Uploaded"}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  {formatDate(asset.created_at)}
                </td>

                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onDelete(asset)}
                    aria-label={`Delete ${asset.original_filename}`}
                    title="Delete asset"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
