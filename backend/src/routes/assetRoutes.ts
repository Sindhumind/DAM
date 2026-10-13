
import { Router } from "express";
import upload from "../middleware/uploadMiddleware";
import { getAssetPreview } from "../controllers/assetPreviewController";
import { streamAssetVideo } from "../controllers/assetVideoController";
import {
  uploadAsset,
  getAssets,
  updateMetadata,
  getDashboardStats,
} from "../controllers/assetController";

const router = Router();

// Dashboard statistics
router.get("/stats", getDashboardStats);

// Upload assets
router.post("/upload", upload.array("files", 10), uploadAsset);

// Retrieve all assets
router.get("/", getAssets);

// Update asset metadata
router.patch("/:id/metadata", updateMetadata);

router.get("/:id/video", streamAssetVideo);

router.get("/:id/preview", getAssetPreview);

export default router;
