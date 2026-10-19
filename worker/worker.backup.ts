
import amqp from "amqplib";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
import dotenv from "dotenv";

import minioClient, { bucketName } from "./minio";

dotenv.config();

const FFMPEG_PATH = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE_PATH = process.env.FFPROBE_PATH || "ffprobe";

const execFileAsync = promisify(execFile);

const RABBITMQ_URL = process.env.RABBITMQ_URL;

if (!RABBITMQ_URL) {
  throw new Error("Missing required environment variable: RABBITMQ_URL");
}

const BACKEND_URL =
  process.env.BACKEND_URL || "http://localhost:3000";

const QUEUE_NAME = "asset-processing";
const RETRY_QUEUE_NAME = "asset-processing-retry";
const DEAD_LETTER_QUEUE_NAME = "asset-processing-dead";
const MAX_PROCESSING_ATTEMPTS = 3;

type ProcessingJob = {
  assetId?: number;
  id?: number;
  storageKey: string;
  mimeType: string;
  attempts?: number;
};

const saveMetadata = async (
  assetId: number,
  metadata: Record<string, unknown>
): Promise<void> => {
  const response = await fetch(
    `${BACKEND_URL}/api/assets/${assetId}/metadata`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ metadata }),
      signal: AbortSignal.timeout(30000),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Failed to save metadata: ${response.status} ${errorText}`
    );
  }

  console.log(`Metadata saved for asset ${assetId}`);
};

const uploadThumbnail = async (
  assetId: number,
  thumbnailPath: string
): Promise<string> => {
  const thumbnailKey = `thumbnails/thumb-${assetId}.jpg`;

  await minioClient.fPutObject(
    bucketName,
    thumbnailKey,
    thumbnailPath,
    {
      "Content-Type": "image/jpeg",
    }
  );

  console.log("Thumbnail uploaded to MinIO:", thumbnailKey);

  return thumbnailKey;
};

const processImage = async (
  assetId: number,
  originalPath: string,
  thumbnailPath: string
): Promise<void> => {
  const metadata = await sharp(originalPath).metadata();

  const assetMetadata = {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    channels: metadata.channels,
    space: metadata.space,
  };

  await sharp(originalPath)
    .resize(300, 300, { fit: "cover" })
    .jpeg({ quality: 80 })
    .toFile(thumbnailPath);

  const thumbnailKey = await uploadThumbnail(
    assetId,
    thumbnailPath
  );

  await saveMetadata(assetId, {
    ...assetMetadata,
    thumbnailKey,
    thumbnailBucket: bucketName,
  });
};

const parseFrameRate = (
  value: string | undefined
): number | null => {
  if (!value) return null;

  const parts = value.split("/");
  const numerator = Number(parts[0]);
  const denominator = parts.length > 1
    ? Number(parts[1])
    : 1;

  if (
    !Number.isFinite(numerator) ||
    !Number.isFinite(denominator) ||
    denominator === 0
  ) {
    return null;
  }

  return Number((numerator / denominator).toFixed(3));
};

const processVideo = async (
  assetId: number,
  originalPath: string,
  thumbnailPath: string
): Promise<void> => {
  const { stdout } = await execFileAsync(
    FFPROBE_PATH,
    [
      "-v", "error",
      "-show_entries",
      "format=duration,format_name,size:stream=index,codec_type,codec_name,width,height,r_frame_rate",
      "-of", "json",
      originalPath,
    ],
    {
      timeout: 60000,
      maxBuffer: 5 * 1024 * 1024,
      windowsHide: true,
    }
  );

  const probe = JSON.parse(stdout);

  const videoStream = probe.streams?.find(
    (stream: { codec_type: string }) =>
      stream.codec_type === "video"
  );

  if (!videoStream) {
    throw new Error("No video stream found in uploaded file");
  }

  const duration = Number(probe.format?.duration);

  const assetMetadata = {
    format: probe.format?.format_name ?? null,
    duration:
      Number.isFinite(duration) && duration >= 0
        ? duration
        : null,
    width: videoStream.width ?? null,
    height: videoStream.height ?? null,
    codec: videoStream.codec_name ?? null,
    frameRate: parseFrameRate(videoStream.r_frame_rate),
  };

  console.log("Video metadata extracted:", assetMetadata);

  await execFileAsync(
    FFMPEG_PATH,
    [
      "-hide_banner",
      "-loglevel", "error",
      "-nostdin",
      "-y",
      "-i", originalPath,
      "-map", "0:v:0",
      "-frames:v", "1",
      "-vf", "scale=300:300:force_original_aspect_ratio=decrease",
      "-q:v", "3",
      thumbnailPath,
    ],
    {
      timeout: 120000,
      maxBuffer: 5 * 1024 * 1024,
      windowsHide: true,
    }
  );

  const thumbnailKey = await uploadThumbnail(
    assetId,
    thumbnailPath
  );

  await saveMetadata(assetId, {
    ...assetMetadata,
    thumbnailKey,
    thumbnailBucket: bucketName,
  });
};

const startWorker = async (): Promise<void> => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createConfirmChannel();

    let isShuttingDown = false;
    let activeJob: Promise<void> | null = null;
    let shutdownPromise: Promise<void> | null = null;

    await channel.assertQueue(QUEUE_NAME, {
      durable: true,
    });

    channel.prefetch(1);

    console.log("Worker connected to RabbitMQ");
    console.log(`Waiting for jobs on: ${QUEUE_NAME}`);
    console.log(`MinIO bucket: ${bucketName}`);

    const processMessage = async (
      message: amqp.ConsumeMessage
    ): Promise<void> => {
      let tempDirectory: string | undefined;
      let shouldAcknowledge = false;

      try {
        const job: ProcessingJob = JSON.parse(
          message.content.toString()
        );

        const assetId = job.assetId ?? job.id;

        if (
          !Number.isSafeInteger(assetId) ||
          !assetId ||
          assetId <= 0 ||
          typeof job.storageKey !== "string" ||
          !job.storageKey ||
          typeof job.mimeType !== "string"
        ) {
          throw new Error("Invalid asset-processing job");
        }

        console.log("Processing asset:", job);

        if (
          !job.mimeType.startsWith("image/") &&
          !job.mimeType.startsWith("video/")
        ) {
          console.log(`Unsupported asset type: ${job.mimeType}`);
          shouldAcknowledge = true;
        } else {
          tempDirectory = await fs.mkdtemp(
            path.join(os.tmpdir(), "dam-")
          );

          const originalPath = path.join(
            tempDirectory,
            "original"
          );

          const thumbnailPath = path.join(
            tempDirectory,
            "thumbnail.jpg"
          );

          await minioClient.fGetObject(
            bucketName,
            job.storageKey,
            originalPath
          );

          console.log("Original downloaded from MinIO");

          if (job.mimeType.startsWith("image/")) {
            await processImage(
              assetId,
              originalPath,
              thumbnailPath
            );
          } else {
            await processVideo(
              assetId,
              originalPath,
              thumbnailPath
            );
          }

          shouldAcknowledge = true;
          console.log(`Asset ${assetId} processing completed`);
        }
      } catch (error) {
        console.error("Worker processing error:", error);

        try {
          const job = JSON.parse(
            message.content.toString()
          ) as ProcessingJob;

          const attempts = (job.attempts ?? 0) + 1;
          const nextJob = { ...job, attempts };

          if (attempts < MAX_PROCESSING_ATTEMPTS) {
            channel.sendToQueue(
              RETRY_QUEUE_NAME,
              Buffer.from(JSON.stringify(nextJob)),
              { persistent: true }
            );

            await channel.waitForConfirms();

            console.log(
              `Retry ${attempts + 1} of ${MAX_PROCESSING_ATTEMPTS} scheduled.`
            );
          } else {
            channel.sendToQueue(
              DEAD_LETTER_QUEUE_NAME,
              Buffer.from(
                JSON.stringify({
                  ...nextJob,
                  failedAt: new Date().toISOString(),
                  error:
                    error instanceof Error
                      ? error.message
                      : String(error),
                })
              ),
              { persistent: true }
            );

            await channel.waitForConfirms();

            console.error(
              `Job moved to dead-letter queue after ${attempts} attempts.`
            );
          }

          shouldAcknowledge = true;
       
} catch (retryError) {
  console.error(
    "Failed to schedule retry or dead-letter job:",
    retryError
  );

  // Keep the original message unacknowledged.
  // The channel will be closed during recovery or shutdown,
  // allowing RabbitMQ to redeliver the message.
  throw retryError;
}

      } finally {
        if (tempDirectory) {
          await fs.rm(tempDirectory, {
            recursive: true,
            force: true,
          }).catch((error) => {
            console.error(
              "Temporary-file cleanup failed:",
              error
            );
          });
        }
      }

      // Acknowledge only after processing and cleanup finish.
      if (shouldAcknowledge) {
        channel.ack(message);
      }
    };

    const consumer = await channel.consume(
      QUEUE_NAME,
      async (message) => {
        if (!message) return;

        if (isShuttingDown) {
          channel.nack(message, false, true);
          return;
        }

        const jobPromise = processMessage(message);
        activeJob = jobPromise;

        try {
          await jobPromise;
        } catch (error) {
          console.error("Unexpected worker callback error:", error);
        } finally {
          if (activeJob === jobPromise) {
            activeJob = null;
          }
        }
      },
      { noAck: false }
    );

    const shutdown = (
      signal: NodeJS.Signals
    ): Promise<void> => {
      if (shutdownPromise) return shutdownPromise;

      isShuttingDown = true;

      shutdownPromise = (async () => {
        console.log(`\n${signal} received. Shutting down worker...`);

        // Stop receiving new jobs first.
        await channel.cancel(consumer.consumerTag);
        console.log("Consumer stopped");

        // Finish the currently active job and its cleanup.
        if (activeJob) {
          await activeJob;
        }

        console.log("Active job finished");

        await channel.close();
        await connection.close();

        console.log("RabbitMQ connection closed. Worker stopped.");
      })();

      return shutdownPromise;
    };

    process.once("SIGINT", () => {
      void shutdown("SIGINT").catch((error) => {
        console.error("Worker shutdown failed:", error);
        process.exitCode = 1;
      });
    });

    process.once("SIGTERM", () => {
      void shutdown("SIGTERM").catch((error) => {
        console.error("Worker shutdown failed:", error);
        process.exitCode = 1;
      });
    });
  } catch (error) {
    console.error("Worker failed to start:", error);
    process.exitCode = 1;
  }
};

void startWorker();
