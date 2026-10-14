import { useState } from "react";

import type { Asset, ViewMode } from "../types/asset";
import useAssets from "../hooks/useAssets";
import { deleteAsset } from "../services/assetService";

import AssetUploader from "./assets/AssetUploader";
import AssetFilters from "./assets/AssetFilters";
import AssetToolbar from "./assets/AssetToolbar";
import AssetGrid from "./assets/AssetGrid";
import AssetList from "./assets/AssetList";
import AssetLoading from "./assets/AssetLoading";
import AssetError from "./assets/AssetError";
import AssetEmptyState from "./assets/AssetEmptyState";
import AssetPreview from "./assets/AssetPreview";
import DeleteAssetModal from "./assets/AssetDeleteModal";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function AssetLibrary() {
  const {
    assets,
    loading,
    error,
    page,
    limit,
    total,
    totalPages,
    search,
    filter,
    setPage,
    setSearch,
    setFilter,
    refreshAssets,
  } = useAssets();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedVideo, setSelectedVideo] = useState<Asset | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);

  const getPreviewUrl = (asset: Asset) =>
    `${API_BASE_URL}/api/assets/${asset.id}/preview`;

  const getVideoUrl = (asset: Asset) =>
    `${API_BASE_URL}/api/assets/${asset.id}/video`;

  const handleDelete = async (asset: Asset) => {
    if (deletingAssetId !== null) return;

    setDeleteError("");
    setDeletingAssetId(asset.id);

    try {
      await deleteAsset(asset.id);

      if (selectedVideo?.id === asset.id) {
        setSelectedVideo(null);
      }

      if (assets.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await refreshAssets();
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete asset.",
      );
    } finally {
      setDeletingAssetId(null);
    }
  };

  const firstAsset = total === 0 ? 0 : (page - 1) * limit + 1;
  const lastAsset = Math.min(page * limit, total);

  return (
    <section className="space-y-5">
      <AssetUploader onUploadComplete={refreshAssets} />

      <AssetFilters
        searchValue={search}
        onSearchChange={setSearch}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <AssetToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        assetCount={total}
      />

      {deleteError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {deleteError}
        </div>
      )}

      <p className="text-sm text-slate-500">
        Showing {assets.length} assets on this page. Page {page} of{" "}
        {Math.max(totalPages, 1)} · {total} matching assets
      </p>

      {loading ? (
        <AssetLoading message="Loading assets..." />
      ) : error ? (
        <AssetError
          message={error}
          onRetry={() => void refreshAssets()}
        />
      ) : assets.length === 0 ? (
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
      ) : viewMode === "grid" ? (
        <AssetGrid
          assets={assets}
          getPreviewUrl={getPreviewUrl}
          onPlayVideo={setSelectedVideo}
          onDelete={setAssetToDelete}
        />
      ) : (
        <AssetList
          assets={assets}
          getPreviewUrl={getPreviewUrl}
          onPlayVideo={setSelectedVideo}
          onDelete={setAssetToDelete}
        />
      )}

      {!loading && !error && total > 0 && (
        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Showing {firstAsset}–{lastAsset} of {total} matching assets
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1 || loading || deletingAssetId !== null}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm font-medium text-slate-700">
              {page} / {Math.max(totalPages, 1)}
            </span>

            <button
              type="button"
              onClick={() => setPage(page + 1)}
              disabled={
                page >= totalPages || loading || deletingAssetId !== null
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <AssetPreview
        asset={selectedVideo}
        previewUrl={selectedVideo ? getPreviewUrl(selectedVideo) : ""}
        videoUrl={selectedVideo ? getVideoUrl(selectedVideo) : undefined}
        isOpen={selectedVideo !== null}
        onClose={() => setSelectedVideo(null)}
      />

      <DeleteAssetModal
        asset={assetToDelete}
        deleting={deletingAssetId !== null}
        onCancel={() => {
          if (deletingAssetId === null) {
            setAssetToDelete(null);
          }
        }}
        onConfirm={async () => {
          if (assetToDelete) {
            await handleDelete(assetToDelete);
            setAssetToDelete(null);
          }
        }}
      />
    </section>
  );
}