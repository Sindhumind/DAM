import type {
  ConfirmChannel,
  ConsumeMessage,
} from "amqplib";

import type { AssetJob } from "./services/assetProcessor";

export const MAIN_QUEUE = "asset-processing";
export const RETRY_QUEUE = "asset-processing-retry";
export const DEAD_QUEUE = "asset-processing-dead";

export const MAX_ATTEMPTS = 3;
export const RETRY_DELAY_MS = 10_000;
export const RECONNECT_DELAY_MS = 5_000;
export const MAX_RECONNECT_DELAY_MS = 30_000;

export const rabbitUrl = process.env.RABBITMQ_URL;

if (!rabbitUrl) {
  throw new Error("RABBITMQ_URL is not configured");
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function parseJob(message: ConsumeMessage): AssetJob {
  const parsed: unknown = JSON.parse(message.content.toString());

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid job payload");
  }

  const job = parsed as AssetJob;

  if (
    !Number.isInteger(job.assetId) ||
    job.assetId <= 0 ||
    typeof job.storageKey !== "string" ||
    !job.storageKey.trim() ||
    typeof job.mimeType !== "string" ||
    !job.mimeType.trim()
  ) {
    throw new Error("Job payload is missing required fields");
  }

  return job;
}

export async function publishRawConfirmed(
  channel: ConfirmChannel,
  queue: string,
  content: Buffer,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    channel.sendToQueue(
      queue,
      content,
      { persistent: true },
      (error) => {
        if (error) reject(error);
        else resolve();
      },
    );
  });

  await channel.waitForConfirms();
}

export async function publishConfirmed(
  channel: ConfirmChannel,
  queue: string,
  job: AssetJob,
): Promise<void> {
  await publishRawConfirmed(
    channel,
    queue,
    Buffer.from(JSON.stringify(job)),
  );
}

export async function setupQueues(
  channel: ConfirmChannel,
): Promise<void> {
  await channel.assertQueue(MAIN_QUEUE, {
    durable: true,
  });

  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      "x-message-ttl": RETRY_DELAY_MS,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": MAIN_QUEUE,
    },
  });

  await channel.assertQueue(DEAD_QUEUE, {
    durable: true,
  });
}