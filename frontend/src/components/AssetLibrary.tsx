import { useState } from "react";
import { Upload } from "lucide-react";
import Button from "./common/Button";
import AssetUploader from "./assets/AssetUploader";
import AssetFilters from "./assets/AssetFilters";
import AssetToolbar from "./assets/AssetToolbar";
import AssetResults from "./assets/AssetResults";
import AssetPagination from "./assets/AssetPagination";
import AssetPreview from "./assets/AssetPreview";
import DeleteAssetModal from "./assets/AssetDeleteModal";
import AssetMetadataEditor from "./assets/AssetMetadataEditor";
import useAssetLibrary from "../hooks/useAssetLibrary";
import type { Asset } from "../types/asset";

function getStatusTransitions(prevAssets: Asset[], nextAssets: Asset[]): string[] {
  const prevMap = new Map(prevAssets.map((a) => [a.id, a.status]));
  const transitions: string[] = [];

  for (const asset of nextAssets) {
    const prevStatus = prevMap.get(asset.id);
    if (prevStatus && prevStatus !== asset.status) {
      if (asset.status === "READY") {
        transitions.push(`${asset.original_filename} finished processing and is ready.`);
      } else if (asset.status === "FAILED") {
        transitions.push(`${asset.original_filename} failed processing.`);
      } else {
        transitions.push(`${asset.original_filename} status changed to ${asset.status}.`);
      }
    }
  }

  return transitions;
}

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
    setLimit,
    setSearch,
    setFilter,
    refreshAssets,
    viewMode,
    setViewMode,
    selectedVideo,
    setSelectedVideo,
    deleteError,
    deletingAssetId,
    assetToDelete,
    setAssetToDelete,
    assetToEdit,
    setAssetToEdit,
    isUploadOpen,
    setIsUploadOpen,
    canManageAsset,
    getPreviewUrl,
    getVideoUrl,
    handleDelete,
  } = useAssetLibrary();

  const [statusMessage, setStatusMessage] = useState("");
  const [prevAssets, setPrevAssets] = useState<Asset[]>(assets);

  if (assets !== prevAssets) {
    const transitions = getStatusTransitions(prevAssets, assets);
    setPrevAssets(assets);
    if (transitions.length > 0) {
      setStatusMessage(transitions.join(" "));
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex justify-end">
        <Button
          type="button"
          leftIcon={<Upload size={16} />}
          onClick={() => setIsUploadOpen(true)}
        >
          Upload
        </Button>
      </div>

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

      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800"
        >
          <span>{statusMessage}</span>
          <button
            type="button"
            onClick={() => setStatusMessage("")}
            className="ml-4 text-xs font-medium text-indigo-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <p aria-live="polite" className="text-sm text-slate-500">
        {loading
          ? "Loading assets..."
          : `Showing ${assets.length} assets on this page. Page ${page} of ${Math.max(
            totalPages,
            1,
          )} · ${total} matching assets`}
      </p>

      <AssetResults
        assets={assets}
        loading={loading}
        error={error}
        total={total}
        search={search}
        filter={filter}
        viewMode={viewMode}
        getPreviewUrl={getPreviewUrl}
        onRetry={() => void refreshAssets()}
        onPlayVideo={setSelectedVideo}
        onDelete={setAssetToDelete}
        onEdit={setAssetToEdit}
        canManageAsset={canManageAsset}
      />

      <AssetPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        pageSize={limit}
        onPageSizeChange={setLimit}
      />

      {isUploadOpen && (
        <AssetUploader
          onClose={() => setIsUploadOpen(false)}
          onUploadComplete={async () => {
            await refreshAssets();
            setStatusMessage("Assets uploaded and queued for processing.");
          }}
        />
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
            const deletedName = assetToDelete.original_filename;
            await handleDelete(assetToDelete);
            setAssetToDelete(null);
            setStatusMessage(`Deleted ${deletedName}.`);
          }
        }}
      />

      {assetToEdit && (
        <AssetMetadataEditor
          key={assetToEdit.id}
          asset={assetToEdit}
          onClose={() => setAssetToEdit(null)}
          onSaved={async () => {
            await refreshAssets();
            setStatusMessage(`Updated metadata for ${assetToEdit.original_filename}.`);
          }}
        />
      )}
    </section>
  );
}