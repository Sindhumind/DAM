
import { processImage } from "./imageProcessor";
import { processVideo } from "./videoProcessor";

export interface AssetJob {
  assetId: number;
  storageKey: string;
  mimeType: string;
  attempts?: number;
}

export async function processAsset(
  job: AssetJob,
  leaseToken: string,
): Promise<void> {
  if (!Number.isInteger(job.assetId) || job.assetId <= 0) {
    throw new Error("Invalid assetId");
  }

  if (
    typeof job.storageKey !== "string" ||
    !job.storageKey.trim()
  ) {
    throw new Error("Invalid storageKey");
  }

  if (
    typeof job.mimeType !== "string" ||
    !job.mimeType.trim()
  ) {
    throw new Error("Invalid mimeType");
  }

  if (!leaseToken.trim()) {
    throw new Error("Invalid lease token");
  }

  if (job.mimeType.startsWith("image/")) {
    await processImage(job, leaseToken);
    return;
  }

  if (job.mimeType.startsWith("video/")) {
    await processVideo(job, leaseToken);
    return;
  }

  throw new Error(`Unsupported MIME type: ${job.mimeType}`);
}