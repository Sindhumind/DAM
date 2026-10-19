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

export default function AssetLibrary() {
  const {
    assets,
    loading,
    error,
    page,
    total,
    totalPages,
    search,
    filter,
    setPage,
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

      <p className="text-sm text-slate-500">
        Showing {assets.length} assets on this page. Page {page} of{" "}
        {Math.max(totalPages, 1)} · {total} matching assets
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
      />

      {isUploadOpen && (
        <AssetUploader
          onClose={() => setIsUploadOpen(false)}
          onUploadComplete={refreshAssets}
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
            await handleDelete(assetToDelete);
            setAssetToDelete(null);
          }
        }}
      />

      {assetToEdit && (
        <AssetMetadataEditor
          key={assetToEdit.id}
          asset={assetToEdit}
          onClose={() => setAssetToEdit(null)}
          onSaved={() => void refreshAssets()}
        />
      )}
    </section>
  );
}
