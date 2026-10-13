
import {
  createAsset,
  getAllAssets,
  CreateAssetData,
  updateAssetMetadata,
  getDashboardStats,
} from "../repositories/assetRepository";

export const createAssetService = async (data: CreateAssetData) => {
  return await createAsset(data);
};

export const getAssetsService = async () => {
  return await getAllAssets();
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
