
import type { Response, NextFunction } from "express";
import { getAssetById } from "../repositories/assetRepository";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";
import minioClient, { bucketName } from "../config/minio";

export async function downloadAsset(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    // Any authenticated user can download any asset.
    const asset = await getAssetById(id);

    if (!asset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    if (!asset.storage_key) {
      res.status(404).json({ message: "Original file not found" });
      return;
    }

    const stat = await minioClient.statObject(
      bucketName,
      asset.storage_key
    );

    const filename = String(
      asset.original_filename || `asset-${id}`
    ).replace(/[\r\n"]/g, "_");

    res.setHeader(
      "Content-Type",
      asset.mime_type || "application/octet-stream"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );
    res.setHeader("Content-Length", stat.size);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");

    const stream = await minioClient.getObject(
      bucketName,
      asset.storage_key
    );

    stream.on("error", (error) => {
      if (!res.headersSent) {
        next(error);
      } else {
        res.destroy(error);
      }
    });

    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}
