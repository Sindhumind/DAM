
import { Router } from "express";
import upload from "../middleware/uploadMiddleware";

import { getAssetPreview } from "../controllers/assetPreviewController";
import { streamAssetVideo } from "../controllers/assetVideoController";
import { getDashboardStats } from "../controllers/assetStatsController";
import { deleteAsset } from "../controllers/assetDeleteController";
import { updateMetadata } from "../controllers/assetMetadataController";
import { getAssets } from "../controllers/assetListController";
import { uploadAsset } from "../controllers/assetUploadController";
import { retryFailedAsset } from "../controllers/assetController";
import { downloadAsset } from "../controllers/assetDownloadController";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware";

import { validateUploadedFiles } from "../middleware/validateUploadedFiles";

const router = Router();

// All routes require a valid login by default.
router.use(authenticateToken);

// Dashboard statistics
router.get("/stats", getDashboardStats);

// Upload assets with file signature validation
router.post(
  "/upload",
  upload.array("files", 10),
  validateUploadedFiles,
  uploadAsset,
);

// Retrieve assets
router.get("/", getAssets);

// Update asset metadata
router.patch("/:id/metadata", updateMetadata);

// Delete an asset
router.delete("/:id", deleteAsset);

// Preview and stream assets
router.get("/:id/video", streamAssetVideo);
router.get("/:id/preview", getAssetPreview);

// Download an asset
router.get("/:id/download", downloadAsset);

// Retry a failed asset (admin only)
router.post("/:id/retry", requireAdmin, retryFailedAsset);

export default router;