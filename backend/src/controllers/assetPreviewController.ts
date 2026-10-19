
import type { Response } from "express";
import { getAssetById } from "../repositories/assetRepository";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import minioClient, { bucketName } from "../config/minio";

export const getAssetPreview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const assetId = Number(req.params.id);

    if (!Number.isSafeInteger(assetId) || assetId <= 0) {
      return res.status(400).json({
        message: "Invalid asset ID",
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    // All authenticated users can preview any asset.
    const asset = await getAssetById(assetId);

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const thumbnailKey = asset.metadata?.thumbnailKey;

    const objectKey =
      typeof thumbnailKey === "string" && thumbnailKey.length > 0
        ? thumbnailKey
        : asset.storage_key;

    if (!objectKey) {
      return res.status(404).json({
        message: "Preview not found",
      });
    }

    const contentType =
      typeof thumbnailKey === "string" && thumbnailKey.length > 0
        ? "image/jpeg"
        : asset.mime_type || "application/octet-stream";

    const stream = await minioClient.getObject(
      bucketName,
      objectKey
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    stream.on("error", (error) => {
      console.error("Asset preview stream error:", error);

      if (!res.headersSent) {
        res.status(500).json({
          message: "Failed to stream asset preview",
        });
      } else {
        res.destroy(error);
      }
    });

    stream.pipe(res);
  } catch (error) {
    console.error("Get asset preview error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        message: "Failed to retrieve asset preview",
      });
    }
  }
};
