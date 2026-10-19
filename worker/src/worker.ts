import "dotenv/config";

import type { WorkerRuntime } from "./workerTypes";

import {
  MAX_RECONNECT_DELAY_MS,
  RECONNECT_DELAY_MS,
  sleep,
} from "./workerConfig";

import { connectAndConsume } from "./workerConnection";

const runtime: WorkerRuntime = {
  shuttingDown: false,
};

let shutdownPromise: Promise<void> | undefined;

async function shutdown(): Promise<void> {
  if (shutdownPromise) {
    return shutdownPromise;
  }

  runtime.shuttingDown = true;

  shutdownPromise = (async () => {
    console.log("Shutting down worker...");

    if (runtime.currentChannel && runtime.consumerTag) {
      try {
        await runtime.currentChannel.cancel(runtime.consumerTag);
        console.log("Consumer stopped");
      } catch (error) {
        console.error("Could not cancel consumer:", error);
      }
    }

    if (runtime.activeJob) {
      console.log("Waiting for active job...");

      await runtime.activeJob.catch((error) => {
        console.error(
          "Active job failed during shutdown:",
          error,
        );
      });
    }

    try {
      await runtime.currentChannel?.close();
    } catch {
      // The channel may already be closed.
    }

    try {
      await runtime.currentConnection?.close();
    } catch {
      // The connection may already be closed.
    }

    console.log("Worker stopped");
  })();

  return shutdownPromise;
}

process.once("SIGINT", () => {
  void shutdown();
});

process.once("SIGTERM", () => {
  void shutdown();
});

async function startWorker(): Promise<void> {
  let reconnectDelay = RECONNECT_DELAY_MS;

  while (!runtime.shuttingDown) {
    try {
      console.log("Connecting to RabbitMQ...");

      await connectAndConsume(runtime);

      reconnectDelay = RECONNECT_DELAY_MS;
    } catch (error) {
      if (!runtime.shuttingDown) {
        console.error(
          "Worker connection/consumer failed:",
          error,
        );
      }
    } finally {
      runtime.currentChannel = undefined;
      runtime.currentConnection = undefined;
      runtime.consumerTag = undefined;
    }

    if (runtime.shuttingDown) {
      break;
    }

    console.log(
      `Reconnecting to RabbitMQ in ${reconnectDelay / 1000}s...`,
    );

    await sleep(reconnectDelay);

    reconnectDelay = Math.min(
      reconnectDelay * 2,
      MAX_RECONNECT_DELAY_MS,
    );
  }
}

void startWorker().catch((error) => {
  console.error("Worker stopped unexpectedly:", error);
  process.exitCode = 1;
});