import {
  createAsset,
  getAllAssets,
  type CreateAssetData,
  updateAssetMetadata,
  getDashboardStats,
  getAssetByIdForAccess,
  deleteAsset,
  updateAssetStatus,
  type AssetProcessingStatus,
  claimAssetForProcessing,
  resetFailedAssetForRetry,
  restoreFailedAssetAfterRetryError,
  type AssetAccess,
} from "../repositories/assetRepository";

import { validateAssetMetadata } from "../utils/metadataValidation";
import minioClient, { bucketName } from "../config/minio";

export const createAssetService = async (
  data: CreateAssetData,
) => {
  return createAsset(data);
};

export const getAssetsService = async (
  page: number = 1,
  limit: number = 8,
  search: string = "",
  filter: "all" | "image" | "video" = "all",
  access: AssetAccess,
) => {
  return getAllAssets(page, limit, search, filter, access);
};

export const updateAssetMetadataService = async (
  assetId: number,
  metadata: object,
  access: AssetAccess,
) => {
  validateAssetMetadata(metadata);
  return updateAssetMetadata(assetId, metadata, access);
};

export const getDashboardStatsService = async (
  access: AssetAccess,
) => {
  return getDashboardStats(access);
};

export const deleteAssetService = async (
  assetId: number,
  access: AssetAccess,
): Promise<boolean> => {
  const asset = await getAssetByIdForAccess(assetId, access);

  if (!asset) {
    return false;
  }

  const deleted = await deleteAsset(assetId, access);

  if (!deleted) {
    return false;
  }

  const thumbnailKey = asset.metadata?.thumbnailKey;

  try {
    if (
      typeof thumbnailKey === "string" &&
      thumbnailKey.length > 0
    ) {
      await minioClient.removeObject(bucketName, thumbnailKey);
    }

    if (asset.storage_key) {
      await minioClient.removeObject(
        bucketName,
        asset.storage_key,
      );
    }
  } catch (error) {
    console.error(
      "Asset deleted from database, but MinIO cleanup failed:",
      error,
    );

    throw new Error(
      "Asset record deleted, but file cleanup failed",
    );
  }

  return true;
};

type WorkerResultStatus = Exclude<
  AssetProcessingStatus,
  "PROCESSING"
>;

export const updateAssetStatusService = async (
  assetId: number,
  status: WorkerResultStatus,
  leaseToken: string,
) => {
  return updateAssetStatus(
    assetId,
    status,
    leaseToken,
  );
};

export const claimAssetForProcessingService = async (
  assetId: number,
) => {
  return claimAssetForProcessing(assetId);
};

export const retryFailedAssetService = async (
  assetId: number,
) => {
  return resetFailedAssetForRetry(assetId);
};

export const restoreFailedAssetAfterRetryErrorService = async (
  assetId: number,
) => {
  return restoreFailedAssetAfterRetryError(assetId);
};