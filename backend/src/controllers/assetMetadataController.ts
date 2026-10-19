import type { Response } from "express";
import { updateAssetMetadataService } from "../services/assetService";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

export const updateMetadata = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const assetId = Number(req.params.id);

    if (!Number.isSafeInteger(assetId) || assetId <= 0) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const metadata = req.body;

    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      res.status(400).json({ message: "Invalid metadata" });
      return;
    }

    const updatedAsset = await updateAssetMetadataService(
      assetId,
      metadata,
      {
        userId: req.user.id,
        role: req.user.role,
      },
    );

    if (!updatedAsset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    res.status(200).json({
      message: "Asset metadata updated successfully",
      asset: updatedAsset,
    });
  } catch (error) {
    console.error("Error updating asset metadata:", error);

    if (error instanceof Error) {
      const validationMessages = [
        "Invalid metadata",
        "Metadata must be a JSON object.",
        "At least one metadata field is required.",
        "is not allowed.",
        "Tags must be an array",
        "Invalid value for metadata field",
      ];

      if (
        validationMessages.some((message) =>
          error.message.includes(message),
        )
      ) {
        res.status(400).json({ message: error.message });
        return;
      }
    }

    res.status(500).json({
      message: "Failed to update asset metadata",
    });
  }
};