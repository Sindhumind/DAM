import type { Response } from "express";
import { deleteAssetService } from "../services/assetService";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

export const deleteAsset = async (
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

    const deleted = await deleteAssetService(assetId, {
      userId: req.user.id,
      role: req.user.role,
    });

    if (!deleted) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    res.status(200).json({
      message: "Asset deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting asset:", error);

    res.status(500).json({
      message: "Failed to delete asset",
    });
  }
};