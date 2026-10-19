import { useState } from "react";
import type { Asset, ViewMode } from "../types/asset";
import useAssets from "./useAssets";
import { deleteAsset } from "../services/assetService";
import { getCurrentUser } from "../services/authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function useAssetLibrary() {
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === "admin";

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedVideo, setSelectedVideo] = useState<Asset | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deletingAssetId, setDeletingAssetId] = useState<number | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const assetData = useAssets();

  const canManageAsset = (asset: Asset) =>
    isAdmin ||
    (currentUser !== null &&
      asset.uploaded_by != null &&
      Number(asset.uploaded_by) === currentUser.id);

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

      if (assetData.assets.length === 1 && assetData.page > 1) {
        assetData.setPage(assetData.page - 1);
      } else {
        await assetData.refreshAssets();
      }
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete asset."
      );
    } finally {
      setDeletingAssetId(null);
    }
  };

  return {
    ...assetData,
    currentUser,
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
  };
}
