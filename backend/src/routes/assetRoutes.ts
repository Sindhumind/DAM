
import { Router } from "express";
import upload from "../middleware/uploadMiddleware";

import { getAssetPreview } from "../controllers/assetPreviewController";
import { streamAssetVideo } from "../controllers/assetVideoController";
import { getDashboardStats } from "../controllers/assetStatsController";
import { deleteAsset } from "../controllers/assetDeleteController";
import { updateMetadata } from "../controllers/assetMetadataController";
import { getAssets } from "../controllers/assetListController";
import { uploadAsset } from "../controllers/assetUploadController";

import {
  updateStatus,
  claimForProcessing,
} from "../controllers/assetController";

import { downloadAsset } from "../controllers/assetDownloadController";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware";

const router = Router();

// All routes require a valid login by default.
router.use(authenticateToken);

// Dashboard statistics
router.get("/stats", getDashboardStats);

// Upload assets
router.post("/upload", upload.array("files", 10), uploadAsset);

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

// Temporary admin-only protection for processing endpoints.
// We'll move these to dedicated worker authentication next.
router.patch("/:id/status", requireAdmin, updateStatus);
router.post("/:id/claim", requireAdmin, claimForProcessing);

export default router;
