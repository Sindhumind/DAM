import { Request, Response } from "express";
import { saveFile } from "../services/storageService";
import minioClient, { bucketName } from "../config/minio";
import {
  createAssetService,
  getAssetsService,
  updateAssetMetadataService,
} from "../services/assetService";
import { publishAssetProcessingJob } from "../services/queueService";


export const uploadAsset = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        message: "No files uploaded",
      });
    }

    const assets = [];

    for (const file of files) {
      // Upload the original file to MinIO.
      const storageResult = await saveFile(file);

      let asset;

      try {
        // Create the PostgreSQL record.
        asset = await createAssetService({
          originalFilename: file.originalname,
          storedFilename: storageResult.storedFilename,
          storageKey: storageResult.storageKey,
          mimeType: file.mimetype,
          fileSize: file.size,
        });
      } catch (databaseError) {
        // Roll back the MinIO upload if the database insert fails.
        try {
          await minioClient.removeObject(
            bucketName,
            storageResult.storageKey
          );

          console.log(
            "Removed MinIO object after database failure:",
            storageResult.storageKey
          );
        } catch (cleanupError) {
          console.error(
            "Failed to clean up MinIO object:",
            cleanupError
          );
        }

        throw databaseError;
      }

      // Publish the processing job after the record exists.
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
    const assets = await getAssetsService();

    res.json(assets);
  } catch (error) {
    console.error("Get assets error:", error);

    res.status(500).json({
      message: "Failed to fetch assets",
    });
  }
};
export const updateMetadata = async (req: Request, res: Response) => {
  try {
    const assetId = Number(req.params.id);
    const { metadata } = req.body;

    if (!assetId || !metadata) {
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

    res.json({
      message: "Metadata updated successfully",
      asset,
    });
  } catch (error) {
    console.error("Update metadata error:", error);

    res.status(500).json({
      message: "Failed to update metadata",
    });
  }
};