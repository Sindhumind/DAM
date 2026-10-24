import type { Request, Response } from "express";
import {
  retryFailedAssetService,
  restoreFailedAssetAfterRetryErrorService,
} from "../services/assetService";
import { publishAssetProcessingJob } from "../services/queueService";

export const retryFailedAsset = async (
  req: Request,
  res: Response,
) => {
  const assetId = Number(req.params.id);

  if (!Number.isSafeInteger(assetId) || assetId <= 0) {
    return res.status(400).json({
      message: "A valid asset ID is required",
    });
  }

  let asset: Awaited<
    ReturnType<typeof retryFailedAssetService>
  > = null;

  try {
    asset = await retryFailedAssetService(assetId);

    if (!asset) {
      return res.status(409).json({
        message: "Asset not found or is not in FAILED status",
      });
    }

    await publishAssetProcessingJob({
      id: asset.id,
      storageKey: asset.storage_key,
      mimeType: asset.mime_type,
    });

    return res.status(202).json({
      message: "Asset retry queued successfully",
    });
  } catch (error) {
    console.error("Failed to retry asset:", error);

    if (asset) {
      try {
        await restoreFailedAssetAfterRetryErrorService(assetId);
      } catch (restoreError) {
        console.error(
          "Failed to restore asset status after queue error:",
          restoreError,
        );
      }
    }

    return res.status(500).json({
      message: "Failed to queue asset retry",
    });
  }
};