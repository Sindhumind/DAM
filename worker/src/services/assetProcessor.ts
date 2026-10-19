
import { processImage } from "./imageProcessor";
import { processVideo } from "./videoProcessor";

export interface AssetJob {
  assetId: number;
  storageKey: string;
  mimeType: string;
  attempts?: number;
}

export async function processAsset(job: AssetJob): Promise<void> {
  if (!Number.isInteger(job.assetId) || job.assetId <= 0) {
    throw new Error("Invalid assetId");
  }

  if (
    typeof job.storageKey !== "string" ||
    !job.storageKey.trim()
  ) {
    throw new Error("Invalid storageKey");
  }

  if (typeof job.mimeType !== "string" || !job.mimeType.trim()) {
    throw new Error("Invalid mimeType");
  }

  if (job.mimeType.startsWith("image/")) {
    await processImage(job);
    return;
  }

  if (job.mimeType.startsWith("video/")) {
    await processVideo(job);
    return;
  }

  throw new Error(`Unsupported MIME type: ${job.mimeType}`);
}
