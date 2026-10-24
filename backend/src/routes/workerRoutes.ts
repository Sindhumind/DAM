
import { Router } from "express";
import { authenticateWorker } from "../middleware/workerAuthMiddleware";
import {
  saveWorkerMetadata,
  updateWorkerAssetStatus,
  claimWorkerAsset,
  renewWorkerAssetLease,
} from "../controllers/workerController";

const router = Router();

// Require the internal worker token for every route.
router.use(authenticateWorker);

router.patch("/:id/metadata", saveWorkerMetadata);
router.patch("/:id/status", updateWorkerAssetStatus);
router.post("/:id/claim", claimWorkerAsset);
router.patch("/:id/heartbeat", renewWorkerAssetLease);

export default router;