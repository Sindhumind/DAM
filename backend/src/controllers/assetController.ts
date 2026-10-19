import type { Request, Response } from "express";
import {
  updateAssetStatusService,
  claimAssetForProcessingService,
} from "../services/assetService";

const allowedStatuses = [
  "UPLOADED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
] as const;

export const updateStatus = async (
  req: Request,
  res: Response,
) => {
  try {
    const assetId = Number(req.params.id);
    const { status } = req.body ?? {};

    if (!Number.isInteger(assetId) || assetId <= 0) {
      return res.status(400).json({
        message: "A valid asset ID is required",
      });
    }

    if (
      typeof status !== "string" ||
      !allowedStatuses.includes(
        status as (typeof allowedStatuses)[number],
      )
    ) {
      return res.status(400).json({
        message: "A valid asset status is required",
      });
    }

    const asset = await updateAssetStatusService(
      assetId,
      status as (typeof allowedStatuses)[number],
    );

    if (!asset) {
      return res.status(404).json({
        message: "Asset not found",
      });
    }

    return res.json({
      message: "Asset status updated successfully",
      asset,
    });
  } catch (error) {
    console.error("Update asset status error:", error);

    return res.status(500).json({
      message: "Failed to update asset status",
    });
  }
};

export const claimForProcessing = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const assetId = Number(req.params.id);

  if (!Number.isInteger(assetId) || assetId <= 0) {
    res.status(400).json({
      message: "A valid asset ID is required",
    });
    return;
  }

  try {
    const claimed =
      await claimAssetForProcessingService(assetId);

    res.status(200).json({ claimed });
  } catch (error) {
    console.error("Failed to claim asset:", error);

    res.status(500).json({
      message: "Failed to claim asset",
    });
  }
};