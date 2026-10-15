
import { Request, Response } from "express";
import { saveFile } from "../services/storageService";
import minioClient, { bucketName } from "../config/minio";
import {
  createAssetService,
  getAssetsService,
  updateAssetMetadataService,
  getDashboardStatsService,
  deleteAssetService,
} from "../services/assetService";
import { publishAssetProcessingJob } from "../services/queueService";



export const uploadAsset = async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const assets = [];

  try {
    if (files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    for (const file of files) {
      const storageResult = await saveFile(file);

      let asset;

      try {
        asset = await createAssetService({
          originalFilename: file.originalname,
          storedFilename: storageResult.storedFilename,
          storageKey: storageResult.storageKey,
          mimeType: file.mimetype,
          fileSize: file.size,
        });
      } catch (databaseError) {
        try {
          await minioClient.removeObject(
            bucketName,
            storageResult.storageKey
          );
        } catch (cleanupError) {
          console.error("Failed to clean up MinIO object:", cleanupError);
        }

        throw databaseError;
      }

      await publishAssetProcessingJob({
        id: asset.id,
        storageKey: asset.storage_key,
        mimeType: asset.mime_type,
      });

      assets.push(asset);
    }

    return res.status(201).json({
      message: "Files uploaded successfully",
      count: assets.length,
      assets,
    });
  } catch (error) {
    console.error("Upload assets error:", error);

    return res.status(500).json({
      message: "Failed to upload files",
    });
  }
};


export const getAssets = async (req: Request, res: Response) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page as string, 10) || 1
    );

    const requestedLimit =
      Number.parseInt(req.query.limit as string, 10) || 8;

    const limit = Math.min(50, Math.max(1, requestedLimit));
    const search =
      typeof req.query.search === "string" ? req.query.search : "";

    const allowedFilters = ["all", "image", "video"] as const;
    const requestedFilter =
      typeof req.query.filter === "string" ? req.query.filter : "all";

    const filter = allowedFilters.includes(
      requestedFilter as (typeof allowedFilters)[number]
    )
      ? (requestedFilter as (typeof allowedFilters)[number])
      : "all";

    const result = await getAssetsService(
      page,
      limit,
      search,
      filter
    );

    return res.json(result);
  } catch (error) {
    console.error("Get assets error:", error);

    return res.status(500).json({
      message: "Failed to fetch assets",
    });
  }
};


export const updateMetadata = async (
  req: Request,
  res: Response
) => {
  try {
    const assetId = Number(req.params.id);
    const { metadata } = req.body;

    if (!Number.isInteger(assetId) || assetId <= 0 || !metadata) {
      return res.status(400).json({
        message: "Asset ID and metadata are required",
      });
    }

    const asset = await updateAssetMetadataService(
      assetId,
      metadata
    );

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    return res.json({
      message: "Metadata updated successfully",
      asset,
    });
  } catch (error) {
    console.error("Update metadata error:", error);

    return res.status(500).json({
      message: "Failed to update metadata",
    });
  }
};

export const getDashboardStats = async (
  _req: Request,
  res: Response
) => {
  try {
    const stats = await getDashboardStatsService();

    return res.json(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      message: "Failed to fetch dashboard statistics",
    });
  }
};


export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);

    if (!Number.isInteger(assetId) || assetId <= 0) {
      return res.status(400).json({
        message: "A valid asset ID is required",
      });
    }

    const deleted = await deleteAssetService(assetId);

    if (!deleted) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    return res.json({
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error("Delete asset error:", error);

    return res.status(500).json({
      message: "Failed to delete asset",
    });
  }
};
