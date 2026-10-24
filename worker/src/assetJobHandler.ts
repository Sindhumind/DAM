
import type {
  ConfirmChannel,
  ConsumeMessage,
} from "amqplib";

import {
  processAsset,
  type AssetJob,
} from "./services/assetProcessor";

import {
  updateAssetStatus,
  claimAssetForProcessing,
  renewAssetProcessingLease,
} from "./services/metadataService";

import {
  DEAD_QUEUE,
  MAX_ATTEMPTS,
  RETRY_QUEUE,
  parseJob,
  publishConfirmed,
  publishRawConfirmed,
} from "./workerConfig";

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;

async function processWithHeartbeat(
  job: AssetJob,
  leaseToken: string,
): Promise<void> {
  let heartbeatFailure: unknown;
  let heartbeatTask: Promise<void> | undefined;

  const heartbeatTimer = setInterval(() => {
    if (heartbeatTask || heartbeatFailure) return;

    heartbeatTask = renewAssetProcessingLease(
      job.assetId,
      leaseToken,
    )
      .then((renewed) => {
        if (!renewed) {
          throw new Error(
            `Lease renewal rejected for asset ${job.assetId}`,
          );
        }
      })
      .catch((error: unknown) => {
        heartbeatFailure = error;
      })
      .finally(() => {
        heartbeatTask = undefined;
      });
  }, HEARTBEAT_INTERVAL_MS);

  try {
    await processAsset(job, leaseToken);

    if (heartbeatTask) {
      await heartbeatTask;
    }

    if (heartbeatFailure) {
      throw heartbeatFailure;
    }
  } finally {
    clearInterval(heartbeatTimer);

    if (heartbeatTask) {
      await heartbeatTask;
    }
  }
}

export async function handleMessage(
  channel: ConfirmChannel,
  message: ConsumeMessage,
): Promise<void> {
  let job: AssetJob;

  try {
    job = parseJob(message);
  } catch (error) {
    console.error(
      "Invalid RabbitMQ job; moving original message to dead queue:",
      error,
    );

    try {
      await publishRawConfirmed(
        channel,
        DEAD_QUEUE,
        message.content,
      );

      channel.ack(message);
    } catch (publishError) {
      console.error(
        "Could not safely publish invalid job to dead queue:",
        publishError,
      );

      try {
        await channel.close();
      } catch {
        // The channel may already be closed.
      }

      throw publishError;
    }

    return;
  }

  let leaseToken: string | undefined;

  try {
    const claim = await claimAssetForProcessing(job.assetId);

    if (!claim.claimed) {
      console.log(
        `Skipping duplicate or ineligible job for asset ${job.assetId}`,
      );

      channel.ack(message);
      return;
    }

    if (!claim.leaseToken) {
      throw new Error(
        `Asset ${job.assetId} was claimed without a lease token`,
      );
    }

    leaseToken = claim.leaseToken;

    console.log(`Processing asset ${job.assetId}`);

    await processWithHeartbeat(job, leaseToken);

    await updateAssetStatus(
      job.assetId,
      "COMPLETED",
      leaseToken,
    );

    channel.ack(message);

    console.log(`Asset ${job.assetId} completed`);
  } catch (error) {
    console.error(`Asset ${job.assetId} failed:`, error);

    const attempts = Number.isInteger(job.attempts)
      ? Math.max(0, job.attempts ?? 0)
      : 0;

    try {
      if (!leaseToken) {
        throw error;
      }

      if (attempts + 1 < MAX_ATTEMPTS) {
        await updateAssetStatus(
          job.assetId,
          "UPLOADED",
          leaseToken,
        );

        await publishConfirmed(channel, RETRY_QUEUE, {
          ...job,
          attempts: attempts + 1,
        });

        console.log(
          `Asset ${job.assetId} scheduled for retry ${attempts + 1}`,
        );
      } else {
        await updateAssetStatus(
          job.assetId,
          "FAILED",
          leaseToken,
        );

        await publishConfirmed(channel, DEAD_QUEUE, {
          ...job,
          attempts: attempts + 1,
        });

        console.error(
          `Asset ${job.assetId} reached max attempts; moved to dead queue`,
        );
      }

      channel.ack(message);
    } catch (publishError) {
      console.error(
        "Could not safely handle failed job:",
        publishError,
      );

      try {
        await channel.close();
      } catch {
        // The channel may already be closed.
      }

      throw publishError;
    }
  }
}