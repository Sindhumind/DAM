import AssetCard from "./AssetCard";
import type { Asset } from "../../types/asset";
import formatFileSize from "../../utils/formatFileSize";
import formatDate from "../../utils/formatDate";

interface AssetGridProps {
  assets: Asset[];
  getPreviewUrl: (asset: Asset) => string;
  onPlayVideo: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  canManageAsset: (asset: Asset) => boolean;
}

export default function AssetGrid({
  assets,
  getPreviewUrl,
  onPlayVideo,
  onDelete,
  onEdit,
  canManageAsset,
}: AssetGridProps) {
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
    <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          previewUrl={getPreviewUrl(asset)}
          onPlayVideo={onPlayVideo}
          onDelete={onDelete}
          onEdit={onEdit}
          canManage={canManageAsset(asset)}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
        />
      ))}
    </div>
  );
}
