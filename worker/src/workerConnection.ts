import amqp from "amqplib";

import { ensureBucket } from "./minio";
import { handleMessage } from "./assetJobHandler";
import {
  MAIN_QUEUE,
  rabbitUrl,
  setupQueues,
} from "./workerConfig";
import type { WorkerRuntime } from "./workerTypes";

export async function connectAndConsume(
  runtime: WorkerRuntime,
): Promise<void> {
  const connection = await amqp.connect(rabbitUrl!);
  runtime.currentConnection = connection;

  connection.on("error", (error) => {
    console.error("RabbitMQ connection error:", error.message);
  });

  const channel = await connection.createConfirmChannel();
  runtime.currentChannel = channel;

  await setupQueues(channel);
  await ensureBucket();
  await channel.prefetch(1);

  const disconnected = new Promise<void>((resolve) => {
    connection.once("close", resolve);
    channel.once("close", resolve);
  });

  channel.on("error", (error) => {
    console.error("RabbitMQ channel error:", error.message);
  });

  const result = await channel.consume(
    MAIN_QUEUE,
    (message) => {
      if (!message || runtime.shuttingDown) return;

      const task = handleMessage(channel, message);
      runtime.activeJob = task;

      void task
        .catch((error) => {
          console.error(
            "Job handling failed; reconnecting:",
            error,
          );
        })
        .finally(() => {
          if (runtime.activeJob === task) {
            runtime.activeJob = undefined;
          }
        });
    },
    { noAck: false },
  );

  runtime.consumerTag = result.consumerTag;

  console.log(`Worker connected. Queue: ${MAIN_QUEUE}`);
  console.log(
    `MinIO bucket: ${process.env.MINIO_BUCKET || "dam-assets"}`,
  );

  await disconnected;
}