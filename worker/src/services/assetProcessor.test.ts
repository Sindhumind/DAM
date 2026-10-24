
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { processAsset } from "./assetProcessor";
import { processImage } from "./imageProcessor";
import { processVideo } from "./videoProcessor";

import type { AssetJob } from "./assetProcessor";

vi.mock("./imageProcessor", () => ({
  processImage: vi.fn(),
}));

vi.mock("./videoProcessor", () => ({
  processVideo: vi.fn(),
}));

describe("processAsset", () => {
  const validJob: AssetJob = {
    assetId: 1,
    storageKey: "uploads/test-image.jpg",
    mimeType: "image/jpeg",
  };

  const leaseToken = "test-lease-token";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("processes a valid image job with the lease token", async () => {
    await processAsset(validJob, leaseToken);

    expect(processImage).toHaveBeenCalledWith(
      validJob,
      leaseToken,
    );
    expect(processVideo).not.toHaveBeenCalled();
  });

  it("processes a valid video job with the lease token", async () => {
    const videoJob: AssetJob = {
      assetId: 2,
      storageKey: "uploads/test-video.mp4",
      mimeType: "video/mp4",
    };

    await processAsset(videoJob, leaseToken);

    expect(processVideo).toHaveBeenCalledWith(
      videoJob,
      leaseToken,
    );
    expect(processImage).not.toHaveBeenCalled();
  });

  it("rejects an invalid asset ID", async () => {
    await expect(
      processAsset({ ...validJob, assetId: 0 }, leaseToken),
    ).rejects.toThrow("Invalid assetId");

    expect(processImage).not.toHaveBeenCalled();
    expect(processVideo).not.toHaveBeenCalled();
  });

  it("rejects a non-integer asset ID", async () => {
    await expect(
      processAsset({ ...validJob, assetId: 1.5 }, leaseToken),
    ).rejects.toThrow("Invalid assetId");
  });

  it("rejects an empty storage key", async () => {
    await expect(
      processAsset(
        { ...validJob, storageKey: "   " },
        leaseToken,
      ),
    ).rejects.toThrow("Invalid storageKey");
  });

  it("rejects an empty MIME type", async () => {
    await expect(
      processAsset({ ...validJob, mimeType: "" }, leaseToken),
    ).rejects.toThrow("Invalid mimeType");
  });

  it("rejects an empty lease token", async () => {
    await expect(
      processAsset(validJob, "   "),
    ).rejects.toThrow("Invalid lease token");

    expect(processImage).not.toHaveBeenCalled();
    expect(processVideo).not.toHaveBeenCalled();
  });

  it("rejects an unsupported MIME type", async () => {
    await expect(
      processAsset(
        { ...validJob, mimeType: "application/pdf" },
        leaseToken,
      ),
    ).rejects.toThrow(
      "Unsupported MIME type: application/pdf",
    );
  });

  it("propagates image processing errors", async () => {
    vi.mocked(processImage).mockRejectedValueOnce(
      new Error("Image processing failed"),
    );

    await expect(
      processAsset(validJob, leaseToken),
    ).rejects.toThrow("Image processing failed");
  });
});
