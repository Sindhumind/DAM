
import { beforeEach, describe, expect, it, vi } from "vitest";

// Ensure the required environment variable exists before
// workerConfig.ts is imported.
vi.hoisted(() => {
  process.env.RABBITMQ_URL ??= "amqp://localhost";
});

import {
  MAIN_QUEUE,
  RETRY_QUEUE,
  DEAD_QUEUE,
  MAX_ATTEMPTS,
  RETRY_DELAY_MS,
  RECONNECT_DELAY_MS,
  MAX_RECONNECT_DELAY_MS,
  parseJob,
  publishRawConfirmed,
  publishConfirmed,
  setupQueues,
} from "./workerConfig";

import type { ConfirmChannel, ConsumeMessage } from "amqplib";

describe("workerConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("configuration", () => {
    it("defines the expected queue names", () => {
      expect(MAIN_QUEUE).toBe("asset-processing");
      expect(RETRY_QUEUE).toBe("asset-processing-retry");
      expect(DEAD_QUEUE).toBe("asset-processing-dead");
    });

    it("defines valid retry and reconnect limits", () => {
      expect(MAX_ATTEMPTS).toBe(3);
      expect(RETRY_DELAY_MS).toBe(10_000);
      expect(RECONNECT_DELAY_MS).toBe(5_000);
      expect(MAX_RECONNECT_DELAY_MS).toBe(30_000);
    });
  });

  describe("parseJob", () => {
    function makeMessage(payload: string): ConsumeMessage {
      return {
        content: Buffer.from(payload),
      } as ConsumeMessage;
    }

    it("parses a valid job", () => {
      const job = {
        assetId: 42,
        storageKey: "uploads/photo.jpg",
        mimeType: "image/jpeg",
      };

      expect(parseJob(makeMessage(JSON.stringify(job)))).toEqual(job);
    });

    it("rejects malformed JSON", () => {
      expect(() => parseJob(makeMessage("{invalid"))).toThrow();
    });

    it("rejects a non-object payload", () => {
      expect(() => parseJob(makeMessage("null"))).toThrow(
        "Invalid job payload",
      );

      expect(() => parseJob(makeMessage('"hello"'))).toThrow(
        "Invalid job payload",
      );
    });

    it("rejects an invalid asset ID", () => {
      expect(() =>
        parseJob(
          makeMessage(
            JSON.stringify({
              assetId: 0,
              storageKey: "uploads/photo.jpg",
              mimeType: "image/jpeg",
            }),
          ),
        ),
      ).toThrow("Job payload is missing required fields");
    });

    it("rejects missing or blank required fields", () => {
      const invalidJobs = [
        { assetId: 1, mimeType: "image/jpeg" },
        { assetId: 1, storageKey: " ", mimeType: "image/jpeg" },
        { assetId: 1, storageKey: "uploads/a.jpg", mimeType: " " },
      ];

      for (const job of invalidJobs) {
        expect(() =>
          parseJob(makeMessage(JSON.stringify(job))),
        ).toThrow("Job payload is missing required fields");
      }
    });
  });

  describe("publishRawConfirmed", () => {
    it("publishes persistent messages and waits for confirmation", async () => {
      const sendToQueue = vi.fn(
        (
          _queue: string,
          _content: Buffer,
          _options: object,
          callback: (error: Error | null) => void,
        ) => callback(null),
      );

      const waitForConfirms = vi.fn().mockResolvedValue(undefined);

      const channel = {
        sendToQueue,
        waitForConfirms,
      } as unknown as ConfirmChannel;

      const content = Buffer.from("test message");

      await publishRawConfirmed(channel, MAIN_QUEUE, content);

      expect(sendToQueue).toHaveBeenCalledWith(
        MAIN_QUEUE,
        content,
        { persistent: true },
        expect.any(Function),
      );

      expect(waitForConfirms).toHaveBeenCalledOnce();
    });

    it("rejects when the publish callback reports an error", async () => {
      const sendToQueue = vi.fn(
        (
          _queue: string,
          _content: Buffer,
          _options: object,
          callback: (error: Error | null) => void,
        ) => callback(new Error("Publish failed")),
      );

      const waitForConfirms = vi.fn();

      const channel = {
        sendToQueue,
        waitForConfirms,
      } as unknown as ConfirmChannel;

      await expect(
        publishRawConfirmed(
          channel,
          MAIN_QUEUE,
          Buffer.from("test"),
        ),
      ).rejects.toThrow("Publish failed");

      expect(waitForConfirms).not.toHaveBeenCalled();
    });

    it("propagates publisher confirmation failures", async () => {
      const channel = {
        sendToQueue: vi.fn(
          (
            _queue: string,
            _content: Buffer,
            _options: object,
            callback: (error: Error | null) => void,
          ) => callback(null),
        ),
        waitForConfirms: vi.fn().mockRejectedValue(
          new Error("Confirmation failed"),
        ),
      } as unknown as ConfirmChannel;

      await expect(
        publishRawConfirmed(
          channel,
          MAIN_QUEUE,
          Buffer.from("test"),
        ),
      ).rejects.toThrow("Confirmation failed");
    });
  });

  describe("publishConfirmed", () => {
    it("serializes the job and publishes it", async () => {
      const channel = {
        sendToQueue: vi.fn(
          (
            _queue: string,
            _content: Buffer,
            _options: object,
            callback: (error: Error | null) => void,
          ) => callback(null),
        ),
        waitForConfirms: vi.fn().mockResolvedValue(undefined),
      } as unknown as ConfirmChannel;

      const job = {
        assetId: 42,
        storageKey: "uploads/photo.jpg",
        mimeType: "image/jpeg",
      };

      await publishConfirmed(channel, MAIN_QUEUE, job);

      const publishedBuffer = (
        channel.sendToQueue as ReturnType<typeof vi.fn>
      ).mock.calls[0][1] as Buffer;

      expect(JSON.parse(publishedBuffer.toString())).toEqual(job);
    });
  });

  describe("setupQueues", () => {
    it("creates durable main, retry, and dead-letter queues", async () => {
      const assertQueue = vi.fn().mockResolvedValue(undefined);

      const channel = {
        assertQueue,
      } as unknown as ConfirmChannel;

      await setupQueues(channel);

      expect(assertQueue).toHaveBeenCalledTimes(3);

      expect(assertQueue).toHaveBeenNthCalledWith(
        1,
        MAIN_QUEUE,
        { durable: true },
      );

      expect(assertQueue).toHaveBeenNthCalledWith(
        2,
        RETRY_QUEUE,
        {
          durable: true,
          arguments: {
            "x-message-ttl": RETRY_DELAY_MS,
            "x-dead-letter-exchange": "",
            "x-dead-letter-routing-key": MAIN_QUEUE,
          },
        },
      );

      expect(assertQueue).toHaveBeenNthCalledWith(
        3,
        DEAD_QUEUE,
        { durable: true },
      );
    });

    it("propagates queue setup failures", async () => {
      const channel = {
        assertQueue: vi.fn().mockRejectedValue(
          new Error("RabbitMQ unavailable"),
        ),
      } as unknown as ConfirmChannel;

      await expect(setupQueues(channel)).rejects.toThrow(
        "RabbitMQ unavailable",
      );
    });
  });
});
