import { Router } from "express";
import upload from "../middleware/uploadMiddleware";
import {
  uploadAsset,
  getAssets,
  updateMetadata,
} from "../controllers/assetController";


const router = Router();

router.post("/upload", upload.array("files", 10), uploadAsset);

router.get("/", getAssets);

router.patch("/:id/metadata", updateMetadata);

export default router;