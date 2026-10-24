
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Readable } from "node:stream";

const mocks = vi.hoisted(() => ({
  execFileAsync: vi.fn(),
  getObject: vi.fn(),
  fPutObject: vi.fn(),
  saveMetadata: vi.fn(),
}));

vi.mock("node:child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("node:util", () => ({
  promisify: () => mocks.execFileAsync,
}));

vi.mock("../minio", () => ({
  minioClient: {
    getObject: mocks.getObject,
    fPutObject: mocks.fPutObject,
  },
  bucketName: "test-bucket",
}));

vi.mock("./metadataService", () => ({
  saveMetadata: mocks.saveMetadata,
}));

import { processVideo } from "./videoProcessor";

describe("processVideo", () => {
  const job = {
    assetId: 42,
    storageKey: "uploads/video.mp4",
    mimeType: "video/mp4",
  };

  const leaseToken = "test-lease-token";

  const probeResult = {
    format: {
      duration: "125.5",
      format_name: "mov,mp4,m4a,3gp,3g2,mj2",
    },
    streams: [
      {
        codec_type: "video",
        width: 1920,
        height: 1080,
        codec_name: "h264",
      },
      {
        codec_type: "audio",
        codec_name: "aac",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.getObject.mockResolvedValue(
      Readable.from([Buffer.from("fake video data")]),
    );

    mocks.fPutObject.mockResolvedValue("etag");
    mocks.saveMetadata.mockResolvedValue(undefined);

    // First call: FFprobe. Second call: FFmpeg.
    mocks.execFileAsync
      .mockResolvedValueOnce({
        stdout: JSON.stringify(probeResult),
        stderr: "",
      })
      .mockResolvedValueOnce({
        stdout: "",
        stderr: "",
      });
  });

  it("processes a video and saves its metadata with the lease token", async () => {
    await processVideo(job, leaseToken);

    expect(mocks.getObject).toHaveBeenCalledWith(
      "test-bucket",
      "uploads/video.mp4",
    );

    expect(mocks.execFileAsync).toHaveBeenCalledTimes(2);

    expect(mocks.execFileAsync.mock.calls[0][1]).toContain(
      "-show_streams",
    );

    expect(mocks.execFileAsync.mock.calls[1][1]).toContain(
      "-frames:v",
    );

    expect(mocks.fPutObject).toHaveBeenCalledWith(
      "test-bucket",
      "thumbnails/thumb-42.jpg",
      expect.any(String),
      { "Content-Type": "image/jpeg" },
    );

    expect(mocks.saveMetadata).toHaveBeenCalledWith(
      42,
      {
        width: 1920,
        height: 1080,
        videoCodec: "h264",
        duration: 125.5,
        format: "mov,mp4,m4a,3gp,3g2,mj2",
        thumbnailKey: "thumbnails/thumb-42.jpg",
        processed: true,
      },
      leaseToken,
    );
  });

  it("rejects a video with no video stream", async () => {
    mocks.execFileAsync.mockReset();

    mocks.execFileAsync.mockResolvedValueOnce({
      stdout: JSON.stringify({
        format: { duration: "10" },
        streams: [
          { codec_type: "audio", codec_name: "aac" },
        ],
      }),
      stderr: "",
    });

    await expect(
      processVideo(job, leaseToken),
    ).rejects.toThrow("No video stream found for asset 42");

    expect(mocks.fPutObject).not.toHaveBeenCalled();
    expect(mocks.saveMetadata).not.toHaveBeenCalled();
  });

  it("propagates FFprobe errors", async () => {
    mocks.execFileAsync.mockReset();
    mocks.execFileAsync.mockRejectedValueOnce(
      new Error("FFprobe failed"),
    );

    await expect(
      processVideo(job, leaseToken),
    ).rejects.toThrow("FFprobe failed");

    expect(mocks.fPutObject).not.toHaveBeenCalled();
    expect(mocks.saveMetadata).not.toHaveBeenCalled();
  });

  it("rejects invalid FFprobe JSON", async () => {
    mocks.execFileAsync.mockReset();
    mocks.execFileAsync.mockResolvedValueOnce({
      stdout: "invalid JSON",
      stderr: "",
    });

    await expect(
      processVideo(job, leaseToken),
    ).rejects.toThrow();

    expect(mocks.fPutObject).not.toHaveBeenCalled();
    expect(mocks.saveMetadata).not.toHaveBeenCalled();
  });

  it("propagates FFmpeg thumbnail-generation errors", async () => {
    mocks.execFileAsync.mockReset();

    mocks.execFileAsync
      .mockResolvedValueOnce({
        stdout: JSON.stringify(probeResult),
        stderr: "",
      })
      .mockRejectedValueOnce(
        new Error("FFmpeg failed"),
      );

    await expect(
      processVideo(job, leaseToken),
    ).rejects.toThrow("FFmpeg failed");

    expect(mocks.fPutObject).not.toHaveBeenCalled();
    expect(mocks.saveMetadata).not.toHaveBeenCalled();
  });

  it("propagates metadata-saving errors", async () => {
    mocks.saveMetadata.mockRejectedValueOnce(
      new Error("Metadata API unavailable"),
    );

    await expect(
      processVideo(job, leaseToken),
    ).rejects.toThrow("Metadata API unavailable");
  });
});
