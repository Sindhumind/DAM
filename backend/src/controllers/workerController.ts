
import type { Request, Response, NextFunction } from "express";
import pool from "../config/db";
import {
  updateAssetStatus,
  claimAssetForProcessing,
  type AssetProcessingStatus,
} from "../repositories/assetRepository";

const validStatuses: AssetProcessingStatus[] = [
  "UPLOADED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
];

export async function saveWorkerMetadata(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assetId = Number(req.params.id);
    const metadata = req.body?.metadata;

    if (!Number.isSafeInteger(assetId) || assetId <= 0) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      res.status(400).json({ message: "Invalid metadata" });
      return;
    }

    const result = await pool.query(
      `
      UPDATE assets
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id
      `,
      [JSON.stringify(metadata), assetId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    res.status(200).json({
      message: "Asset metadata saved successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkerAssetStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assetId = Number(req.params.id);
    const status = req.body?.status;

    if (!Number.isSafeInteger(assetId) || assetId <= 0) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    if (!validStatuses.includes(status)) {
      res.status(400).json({ message: "Invalid asset status" });
      return;
    }

    const asset = await updateAssetStatus(assetId, status);

    if (!asset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    res.status(200).json({
      message: "Asset status updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function claimWorkerAsset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assetId = Number(req.params.id);

    if (!Number.isSafeInteger(assetId) || assetId <= 0) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    const claimed = await claimAssetForProcessing(assetId);

    res.status(200).json({ claimed });
  } catch (error) {
    next(error);
  }
}
