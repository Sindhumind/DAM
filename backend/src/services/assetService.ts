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
  type AssetAccess,
} from "../repositories/assetRepository";

import minioClient, { bucketName } from "../config/minio";

export const createAssetService = async (
  data: CreateAssetData
) => {
  return createAsset(data);
};

export const getAssetsService = async (
  page: number = 1,
  limit: number = 8,
  search: string = "",
  filter: "all" | "image" | "video" = "all",
  access: AssetAccess
) => {
  return getAllAssets(page, limit, search, filter, access);
};

 
const ALLOWED_METADATA_FIELDS = new Set([
  "title",
  "description",
  "tags",
  "category",
]);

export const updateAssetMetadataService = async (
  assetId: number,
  metadata: object,
  access: AssetAccess
) => {
  const input = metadata as Record<string, unknown>;
  const entries = Object.entries(input);

  if (entries.length === 0) {
    throw new Error("At least one metadata field is required.");
  }

  for (const [key, value] of entries) {
    if (!ALLOWED_METADATA_FIELDS.has(key)) {
      throw new Error(`Metadata field '${key}' is not allowed.`);
    }

    if (key === "tags") {
      if (
        !Array.isArray(value) ||
        value.length > 20 ||
        !value.every(
          (tag) =>
            typeof tag === "string" &&
            tag.trim().length > 0 &&
            tag.trim().length <= 50
        )
      ) {
        throw new Error(
          "Tags must be an array of up to 20 non-empty strings, each no longer than 50 characters."
        );
      }
    } else if (
      typeof value !== "string" ||
      value.length > (key === "description" ? 2000 : 150)
    ) {
      throw new Error(`Invalid value for metadata field '${key}'.`);
    }
  }

  return updateAssetMetadata(assetId, metadata, access);
};

export const getDashboardStatsService = async (
  access: AssetAccess
) => {
  return getDashboardStats(access);
};

export const deleteAssetService = async (
  assetId: number,
  access: AssetAccess
): Promise<boolean> => {
  // Retrieve the asset only if the user has permission to access it.
  const asset = await getAssetByIdForAccess(assetId, access);

  if (!asset) {
    return false;
  }

  // Delete the database record with an ownership check.
  const deleted = await deleteAsset(assetId, access);

  if (!deleted) {
    return false;
  }

  // Remove associated files from MinIO.
  const thumbnailKey = asset.metadata?.thumbnailKey;

  try {
    if (
      typeof thumbnailKey === "string" &&
      thumbnailKey.length > 0
    ) {
      await minioClient.removeObject(
        bucketName,
        thumbnailKey
      );
    }

    if (asset.storage_key) {
      await minioClient.removeObject(
        bucketName,
        asset.storage_key
      );
    }
  } catch (error) {
    console.error(
      "Asset deleted from database, but MinIO cleanup failed:",
      error
    );

    throw new Error(
      "Asset record deleted, but file cleanup failed"
    );
  }

  return true;
};

export const updateAssetStatusService = async (
  assetId: number,
  status: AssetProcessingStatus
) => {
  return updateAssetStatus(assetId, status);
};

export const claimAssetForProcessingService = async (
  assetId: number
): Promise<boolean> => {
  return claimAssetForProcessing(assetId);
};