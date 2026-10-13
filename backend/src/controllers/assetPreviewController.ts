
import { Request, Response } from "express";
import pool from "../config/db";
import minioClient, { bucketName } from "../config/minio";

export const getAssetPreview = async (
  req: Request,
  res: Response
) => {
  try {
    const assetId = Number(req.params.id);

    if (!Number.isInteger(assetId) || assetId <= 0) {
      return res.status(400).json({
        message: "Invalid asset ID",
      });
    }

    const result = await pool.query(
      `
      SELECT storage_key, mime_type, metadata
      FROM assets
      WHERE id = $1
      `,
      [assetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    const asset = result.rows[0];
    const thumbnailKey = asset.metadata?.thumbnailKey;

    const objectKey =
      typeof thumbnailKey === "string" && thumbnailKey.length > 0
        ? thumbnailKey
        : asset.storage_key;

    const contentType =
      objectKey === thumbnailKey
        ? "image/jpeg"
        : asset.mime_type;

    const stream = await minioClient.getObject(
      bucketName,
      objectKey
    );

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");
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
      return res.status(404).json({
        message: "Preview not found",
      });
    }
  }
};
