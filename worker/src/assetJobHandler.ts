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
} from "./services/metadataService";

import {
  DEAD_QUEUE,
  MAX_ATTEMPTS,
  RETRY_QUEUE,
  parseJob,
  publishConfirmed,
  publishRawConfirmed,
} from "./workerConfig";

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

  try {
    const claimed = await claimAssetForProcessing(job.assetId);

    if (!claimed) {
      console.log(
        `Skipping duplicate or ineligible job for asset ${job.assetId}`,
      );

      channel.ack(message);
      return;
    }

    console.log(`Processing asset ${job.assetId}`);

    await processAsset(job);
    await updateAssetStatus(job.assetId, "COMPLETED");

    channel.ack(message);

    console.log(`Asset ${job.assetId} completed`);
  } catch (error) {
    console.error(`Asset ${job.assetId} failed:`, error);

    const attempts = Number.isInteger(job.attempts)
      ? Math.max(0, job.attempts ?? 0)
      : 0;

    try {
      if (attempts + 1 < MAX_ATTEMPTS) {
        // Release the claim so a retry can claim the asset again.
        await updateAssetStatus(job.assetId, "UPLOADED");

        await publishConfirmed(channel, RETRY_QUEUE, {
          ...job,
          attempts: attempts + 1,
        });

        console.log(
          `Asset ${job.assetId} scheduled for retry ${attempts + 1}`,
        );
      } else {
        await updateAssetStatus(job.assetId, "FAILED");

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

      // Closing the channel lets RabbitMQ redeliver the original message.
      try {
        await channel.close();
      } catch {
        // The channel may already be closed.
      }

      throw publishError;
    }
  }
}