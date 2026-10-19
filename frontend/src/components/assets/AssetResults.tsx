import type { Asset, ViewMode } from "../../types/asset";
import AssetGrid from "./AssetGrid";
import AssetList from "./AssetList";
import AssetLoading from "./AssetLoading";
import AssetError from "./AssetError";
import AssetEmptyState from "./AssetEmptyState";

type Props = {
  assets: Asset[];
  loading: boolean;
  error: string;
  total: number;
  search: string;
  filter: string;
  viewMode: ViewMode;
  getPreviewUrl: (asset: Asset) => string;
  onRetry: () => void;
  onPlayVideo: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  canManageAsset: (asset: Asset) => boolean;
};

export default function AssetResults({
  assets,
  loading,
  error,
  total,
  search,
  filter,
  viewMode,
  getPreviewUrl,
  onRetry,
  onPlayVideo,
  onDelete,
  onEdit,
  canManageAsset,
}: Props) {
  if (loading) return <AssetLoading message="Loading assets..." />;

  if (error) {
    return <AssetError message={error} onRetry={onRetry} />;
  }

  if (assets.length === 0) {
    return (
      <AssetEmptyState
        title="No assets found"
        message={
          total === 0
            ? search.trim() || filter !== "all"
              ? "No assets match your search or filter."
              : "Upload your first image or video to get started."
            : "There are no assets on this page."
        }
      />
    );
  }

  const props = {
    assets,
    getPreviewUrl,
    onPlayVideo,
    onDelete,
    onEdit,
    canManageAsset,
  };

  return viewMode === "grid" ? (
    <AssetGrid {...props} />
  ) : (
    <AssetList {...props} />
  );
}
