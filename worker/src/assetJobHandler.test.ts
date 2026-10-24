
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { ConfirmChannel, ConsumeMessage } from "amqplib";

const mocks = vi.hoisted(() => ({
  processAsset: vi.fn(),
  updateAssetStatus: vi.fn(),
  claimAssetForProcessing: vi.fn(),
  renewAssetProcessingLease: vi.fn(),
  publishConfirmed: vi.fn(),
  publishRawConfirmed: vi.fn(),
  parseJob: vi.fn(),
}));

vi.mock("./services/assetProcessor", () => ({
  processAsset: mocks.processAsset,
}));

vi.mock("./services/metadataService", () => ({
  updateAssetStatus: mocks.updateAssetStatus,
  claimAssetForProcessing: mocks.claimAssetForProcessing,
  renewAssetProcessingLease: mocks.renewAssetProcessingLease,
}));

vi.mock("./workerConfig", () => ({
  DEAD_QUEUE: "asset-processing-dead",
  RETRY_QUEUE: "asset-processing-retry",
  MAX_ATTEMPTS: 3,
  parseJob: mocks.parseJob,
  publishConfirmed: mocks.publishConfirmed,
  publishRawConfirmed: mocks.publishRawConfirmed,
}));

import { handleMessage } from "./assetJobHandler";

describe("handleMessage", () => {
  const job = {
    assetId: 42,
    storageKey: "uploads/test.jpg",
    mimeType: "image/jpeg",
  };

  const leaseToken = "11111111-1111-4111-8111-111111111111";
  const heartbeatInterval = 5 * 60 * 1000;

  let channel: ConfirmChannel;
  let message: ConsumeMessage;

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();

    channel = {
      ack: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    } as unknown as ConfirmChannel;

    message = {
      content: Buffer.from(JSON.stringify(job)),
    } as ConsumeMessage;

    mocks.parseJob.mockReturnValue(job);
    mocks.claimAssetForProcessing.mockResolvedValue({
      claimed: true,
      leaseToken,
    });
    mocks.processAsset.mockResolvedValue(undefined);
    mocks.updateAssetStatus.mockResolvedValue(undefined);
    mocks.renewAssetProcessingLease.mockResolvedValue(true);
    mocks.publishConfirmed.mockResolvedValue(undefined);
    mocks.publishRawConfirmed.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("processes an asset and acknowledges the message", async () => {
    await handleMessage(channel, message);

    expect(mocks.claimAssetForProcessing).toHaveBeenCalledWith(42);
    expect(mocks.processAsset).toHaveBeenCalledWith(job, leaseToken);
    expect(mocks.updateAssetStatus).toHaveBeenCalledWith(
      42,
      "COMPLETED",
      leaseToken,
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it("skips an unclaimed asset and acknowledges the message", async () => {
    mocks.claimAssetForProcessing.mockResolvedValueOnce({
      claimed: false,
    });

    await handleMessage(channel, message);

    expect(mocks.processAsset).not.toHaveBeenCalled();
    expect(mocks.updateAssetStatus).not.toHaveBeenCalled();
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it("dead-letters an invalid message before acknowledging it", async () => {
    mocks.parseJob.mockImplementationOnce(() => {
      throw new Error("Invalid job");
    });

    await handleMessage(channel, message);

    expect(mocks.publishRawConfirmed).toHaveBeenCalledWith(
      channel,
      "asset-processing-dead",
      message.content,
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it("closes the channel if publishing an invalid message fails", async () => {
    mocks.parseJob.mockImplementationOnce(() => {
      throw new Error("Invalid job");
    });
    mocks.publishRawConfirmed.mockRejectedValueOnce(
      new Error("Dead-letter publish failed"),
    );

    await expect(handleMessage(channel, message)).rejects.toThrow(
      "Dead-letter publish failed",
    );

    expect(channel.close).toHaveBeenCalledOnce();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it("retries a failed job and increments its attempt count", async () => {
    mocks.processAsset.mockRejectedValueOnce(
      new Error("Processing failed"),
    );

    await handleMessage(channel, message);

    expect(mocks.updateAssetStatus).toHaveBeenCalledWith(
      42,
      "UPLOADED",
      leaseToken,
    );
    expect(mocks.publishConfirmed).toHaveBeenCalledWith(
      channel,
      "asset-processing-retry",
      { ...job, attempts: 1 },
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it("moves a job to the dead queue after the maximum attempts", async () => {
    mocks.parseJob.mockReturnValueOnce({
      ...job,
      attempts: 2,
    });
    mocks.processAsset.mockRejectedValueOnce(
      new Error("Processing failed"),
    );

    await handleMessage(channel, message);

    expect(mocks.updateAssetStatus).toHaveBeenCalledWith(
      42,
      "FAILED",
      leaseToken,
    );
    expect(mocks.publishConfirmed).toHaveBeenCalledWith(
      channel,
      "asset-processing-dead",
      { ...job, attempts: 3 },
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it("closes the channel when retry publishing fails", async () => {
    mocks.processAsset.mockRejectedValueOnce(
      new Error("Processing failed"),
    );
    mocks.publishConfirmed.mockRejectedValueOnce(
      new Error("Retry publish failed"),
    );

    await expect(handleMessage(channel, message)).rejects.toThrow(
      "Retry publish failed",
    );

    expect(channel.close).toHaveBeenCalledOnce();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it("retries when updating the completed status fails", async () => {
    mocks.updateAssetStatus
      .mockRejectedValueOnce(new Error("Completion update failed"))
      .mockResolvedValueOnce(undefined);

    await handleMessage(channel, message);

    expect(mocks.updateAssetStatus).toHaveBeenNthCalledWith(
      1,
      42,
      "COMPLETED",
      leaseToken,
    );
    expect(mocks.updateAssetStatus).toHaveBeenNthCalledWith(
      2,
      42,
      "UPLOADED",
      leaseToken,
    );
    expect(mocks.publishConfirmed).toHaveBeenCalledWith(
      channel,
      "asset-processing-retry",
      { ...job, attempts: 1 },
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it("closes the channel when resetting status fails", async () => {
    mocks.processAsset.mockRejectedValueOnce(
      new Error("Processing failed"),
    );
    mocks.updateAssetStatus.mockRejectedValueOnce(
      new Error("Database unavailable"),
    );

    await expect(handleMessage(channel, message)).rejects.toThrow(
      "Database unavailable",
    );

    expect(channel.close).toHaveBeenCalledOnce();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it("closes the channel when dead-letter publishing fails", async () => {
    mocks.parseJob.mockReturnValueOnce({
      ...job,
      attempts: 2,
    });
    mocks.processAsset.mockRejectedValueOnce(
      new Error("Processing failed"),
    );
    mocks.publishConfirmed.mockRejectedValueOnce(
      new Error("Dead-letter publish failed"),
    );

    await expect(handleMessage(channel, message)).rejects.toThrow(
      "Dead-letter publish failed",
    );

    expect(mocks.updateAssetStatus).toHaveBeenCalledWith(
      42,
      "FAILED",
      leaseToken,
    );
    expect(channel.close).toHaveBeenCalledOnce();
    expect(channel.ack).not.toHaveBeenCalled();
  });

  it("renews the lease while asset processing is still running", async () => {
    vi.useFakeTimers();

    let finishProcessing!: () => void;
    mocks.processAsset.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishProcessing = resolve;
        }),
    );

    const handling = handleMessage(channel, message);

    await vi.advanceTimersByTimeAsync(heartbeatInterval);

    expect(mocks.renewAssetProcessingLease).toHaveBeenCalledWith(
      42,
      leaseToken,
    );

    finishProcessing();
    await handling;

    expect(mocks.updateAssetStatus).toHaveBeenCalledWith(
      42,
      "COMPLETED",
      leaseToken,
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it("does not mark an asset completed when lease renewal returns false", async () => {
    vi.useFakeTimers();

    let finishProcessing!: () => void;
    mocks.processAsset.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishProcessing = resolve;
        }),
    );
    mocks.renewAssetProcessingLease.mockResolvedValueOnce(false);

    const handling = handleMessage(channel, message);

    await vi.advanceTimersByTimeAsync(heartbeatInterval);

    // The current implementation observes the heartbeat failure
    // after processAsset finishes, rather than cancelling it immediately.
    finishProcessing();
    await handling;

    expect(mocks.updateAssetStatus).toHaveBeenCalledWith(
      42,
      "UPLOADED",
      leaseToken,
    );
    expect(mocks.updateAssetStatus).not.toHaveBeenCalledWith(
      42,
      "COMPLETED",
      leaseToken,
    );
    expect(mocks.publishConfirmed).toHaveBeenCalledWith(
      channel,
      "asset-processing-retry",
      { ...job, attempts: 1 },
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });

  it("retries when lease renewal throws an error", async () => {
    vi.useFakeTimers();

    let finishProcessing!: () => void;
    mocks.processAsset.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishProcessing = resolve;
        }),
    );
    mocks.renewAssetProcessingLease.mockRejectedValueOnce(
      new Error("Heartbeat database error"),
    );

    const handling = handleMessage(channel, message);

    await vi.advanceTimersByTimeAsync(heartbeatInterval);

    finishProcessing();
    await handling;

    expect(mocks.updateAssetStatus).toHaveBeenCalledWith(
      42,
      "UPLOADED",
      leaseToken,
    );
    expect(mocks.updateAssetStatus).not.toHaveBeenCalledWith(
      42,
      "COMPLETED",
      leaseToken,
    );
    expect(mocks.publishConfirmed).toHaveBeenCalledWith(
      channel,
      "asset-processing-retry",
      { ...job, attempts: 1 },
    );
    expect(channel.ack).toHaveBeenCalledWith(message);
  });
});