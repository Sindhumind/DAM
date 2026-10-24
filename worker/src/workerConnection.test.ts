
import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connect: vi.fn(),
  ensureBucket: vi.fn(),
  setupQueues: vi.fn(),
  handleMessage: vi.fn(),
}));

vi.mock("amqplib", () => ({
  default: {
    connect: mocks.connect,
  },
}));

vi.mock("./minio", () => ({
  ensureBucket: mocks.ensureBucket,
}));

vi.mock("./workerConfig", () => ({
  MAIN_QUEUE: "asset-processing",
  rabbitUrl: "amqp://localhost",
  setupQueues: mocks.setupQueues,
}));

vi.mock("./assetJobHandler", () => ({
  handleMessage: mocks.handleMessage,
}));

import { connectAndConsume } from "./workerConnection";
import type { WorkerRuntime } from "./workerTypes";
import type { ConfirmChannel, ConsumeMessage } from "amqplib";

describe("connectAndConsume", () => {
  let connection: EventEmitter & {
    createConfirmChannel: ReturnType<typeof vi.fn>;
  };

  let channel: EventEmitter & Record<string, any>;

  let runtime: WorkerRuntime;
  let consumeCallback:
    | ((message: ConsumeMessage | null) => void)
    | undefined;

  beforeEach(() => {
    vi.clearAllMocks();

    connection = Object.assign(new EventEmitter(), {
      createConfirmChannel: vi.fn(),
    });

    channel = Object.assign(new EventEmitter(), {
      assertQueue: vi.fn().mockResolvedValue(undefined),
      prefetch: vi.fn().mockResolvedValue(undefined),
      consume: vi.fn().mockImplementation(
        async (
          _queue: string,
          callback: (message: ConsumeMessage | null) => void,
        ) => {
          consumeCallback = callback;
          return { consumerTag: "test-consumer" };
        },
      ),
    });

    connection.createConfirmChannel.mockResolvedValue(channel);

    mocks.connect.mockResolvedValue(connection);
    mocks.setupQueues.mockResolvedValue(undefined);
    mocks.ensureBucket.mockResolvedValue(undefined);
    mocks.handleMessage.mockResolvedValue(undefined);

    runtime = {
      shuttingDown: false,
    };

    consumeCallback = undefined;

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("connects, configures the channel, and registers a consumer", async () => {
    mocks.connect.mockImplementation(async () => {
      // Resolve the connection after the close listeners are registered.
      setTimeout(() => connection.emit("close"), 0);
      return connection;
    });

    await connectAndConsume(runtime);

    expect(mocks.connect).toHaveBeenCalledWith("amqp://localhost");
    expect(runtime.currentConnection).toBe(connection);
    expect(runtime.currentChannel).toBe(channel);

    expect(mocks.setupQueues).toHaveBeenCalledWith(channel);
    expect(mocks.ensureBucket).toHaveBeenCalledOnce();
    expect(channel.prefetch).toHaveBeenCalledWith(1);

    expect(channel.consume).toHaveBeenCalledWith(
      "asset-processing",
      expect.any(Function),
      { noAck: false },
    );

    expect(runtime.consumerTag).toBe("test-consumer");
  });

  it("propagates RabbitMQ connection failures", async () => {
    mocks.connect.mockRejectedValueOnce(
      new Error("RabbitMQ unavailable"),
    );

    await expect(connectAndConsume(runtime)).rejects.toThrow(
      "RabbitMQ unavailable",
    );
  });

  it("propagates channel creation failures", async () => {
    connection.createConfirmChannel.mockRejectedValueOnce(
      new Error("Could not create channel"),
    );

    await expect(connectAndConsume(runtime)).rejects.toThrow(
      "Could not create channel",
    );
  });

  it("propagates queue setup failures", async () => {
    mocks.setupQueues.mockRejectedValueOnce(
      new Error("Queue setup failed"),
    );

    await expect(connectAndConsume(runtime)).rejects.toThrow(
      "Queue setup failed",
    );
  });

  it("propagates bucket initialization failures", async () => {
    mocks.ensureBucket.mockRejectedValueOnce(
      new Error("Bucket unavailable"),
    );

    await expect(connectAndConsume(runtime)).rejects.toThrow(
      "Bucket unavailable",
    );

    expect(channel.consume).not.toHaveBeenCalled();
  });

  it("ignores null messages", async () => {
    const runPromise = connectAndConsume(runtime);

    // Wait for consumer registration.
    await vi.waitFor(() => {
      expect(consumeCallback).toBeDefined();
    });

    consumeCallback!(null);

    expect(mocks.handleMessage).not.toHaveBeenCalled();

    connection.emit("close");
    await runPromise;
  });

  it("ignores messages when the worker is shutting down", async () => {
    const runPromise = connectAndConsume(runtime);

    await vi.waitFor(() => {
      expect(consumeCallback).toBeDefined();
    });

    runtime.shuttingDown = true;

    consumeCallback!({
      content: Buffer.from("{}"),
    } as ConsumeMessage);

    expect(mocks.handleMessage).not.toHaveBeenCalled();

    connection.emit("close");
    await runPromise;
  });

  it("tracks the active job and clears it after processing", async () => {
    let finishJob!: () => void;

    mocks.handleMessage.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishJob = resolve;
        }),
    );

    const runPromise = connectAndConsume(runtime);

    await vi.waitFor(() => {
      expect(consumeCallback).toBeDefined();
    });

    consumeCallback!({
      content: Buffer.from("{}"),
    } as ConsumeMessage);

    expect(mocks.handleMessage).toHaveBeenCalledWith(
      channel,
      expect.anything(),
    );

    expect(runtime.activeJob).toBeDefined();

    finishJob();

    await vi.waitFor(() => {
      expect(runtime.activeJob).toBeUndefined();
    });

    connection.emit("close");
    await runPromise;
  });

  it("resolves when the channel closes", async () => {
    const runPromise = connectAndConsume(runtime);

    await vi.waitFor(() => {
      expect(channel.consume).toHaveBeenCalledOnce();
    });

    channel.emit("close");

    await expect(runPromise).resolves.toBeUndefined();
  });
});