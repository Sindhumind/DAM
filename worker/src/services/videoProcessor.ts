
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { promises as fs } from "node:fs";
import { pipeline } from "node:stream/promises";
import { minioClient, bucketName } from "../minio";
import { saveMetadata } from "./metadataService";
import { createTempFilePath, removeTempFile } from "../utils/tempFileUtils";
import type { AssetJob } from "./assetProcessor";

const execFileAsync = promisify(execFile);
const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
const ffprobePath = process.env.FFPROBE_PATH || "ffprobe";

interface ProbeResult {
  format?: {
    duration?: string;
    format_name?: string;
  };
  streams?: Array<{
    codec_type?: string;
    width?: number;
    height?: number;
    codec_name?: string;
  }>;
}

export async function processVideo(job: AssetJob): Promise<void> {
  const originalPath = createTempFilePath(
    path.extname(job.storageKey) || ".video"
  );
  const thumbnailPath = createTempFilePath(".jpg");

  try {
    const stream = await minioClient.getObject(
      bucketName,
      job.storageKey
    );

    await pipeline(
      stream,
      (await import("node:fs")).createWriteStream(originalPath)
    );

    const { stdout } = await execFileAsync(
      ffprobePath,
      [
        "-v", "error",
        "-show_format",
        "-show_streams",
        "-of", "json",
        originalPath,
      ],
      { timeout: 60000, maxBuffer: 10 * 1024 * 1024 }
    );

    const probe = JSON.parse(stdout) as ProbeResult;
    const videoStream = probe.streams?.find(
      (item) => item.codec_type === "video"
    );

    if (!videoStream) {
      throw new Error(`No video stream found for asset ${job.assetId}`);
    }

    await execFileAsync(
      ffmpegPath,
      [
        "-y",
        "-ss", "00:00:01",
        "-i", originalPath,
        "-frames:v", "1",
        "-vf", "scale=400:400:force_original_aspect_ratio=decrease",
        thumbnailPath,
      ],
      { timeout: 120000 }
    );

    const thumbnailKey = `thumbnails/thumb-${job.assetId}.jpg`;

    await minioClient.fPutObject(
      bucketName,
      thumbnailKey,
      thumbnailPath,
      { "Content-Type": "image/jpeg" }
    );

    await saveMetadata(job.assetId, {
      width: videoStream.width ?? null,
      height: videoStream.height ?? null,
      videoCodec: videoStream.codec_name ?? null,
      duration: Number(probe.format?.duration ?? 0),
      format: probe.format?.format_name ?? null,
      thumbnailKey,
      processed: true,
    });

    console.log(`Video asset ${job.assetId} processed`);
  } finally {
    await Promise.all([
      removeTempFile(originalPath),
      removeTempFile(thumbnailPath),
    ]);
  }
}
