
import {
  createAsset,
  getAllAssets,
  CreateAssetData,
  updateAssetMetadata,
  getDashboardStats,
  getAssetById,
  deleteAsset,
} from "../repositories/assetRepository";

import minioClient, { bucketName } from "../config/minio";

export const createAssetService = async (data: CreateAssetData) => {
  return await createAsset(data);
};


export const getAssetsService = async (
  page: number = 1,
  limit: number = 8,
  search: string = "",
  filter: "all" | "image" | "video" = "all"
) => {
  return await getAllAssets(page, limit, search, filter);
};


export const updateAssetMetadataService = async (
  assetId: number,
  metadata: object
) => {
  return await updateAssetMetadata(assetId, metadata);
};

export const getDashboardStatsService = async () => {
  return await getDashboardStats();
};



export const deleteAssetService = async (
  assetId: number
): Promise<boolean> => {
  const asset = await getAssetById(assetId);

  if (!asset) {
    return false;
  }

  // Remove the generated thumbnail, if one exists.
  const thumbnailKey = asset.metadata?.thumbnailKey;

  if (typeof thumbnailKey === "string" && thumbnailKey.length > 0) {
    await minioClient.removeObject(bucketName, thumbnailKey);
  }

  // Remove the original file.
  if (asset.storage_key) {
    await minioClient.removeObject(bucketName, asset.storage_key);
  }

  // Delete the database record only after storage cleanup succeeds.
  return await deleteAsset(assetId);
};
