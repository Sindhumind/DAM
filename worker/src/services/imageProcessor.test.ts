
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { Readable } from "node:stream";

const mocks = vi.hoisted(() => {
  const sharpChain = {
    metadata: vi.fn(),
    rotate: vi.fn(),
    resize: vi.fn(),
    jpeg: vi.fn(),
    toFile: vi.fn(),
  };

  sharpChain.rotate.mockReturnValue(sharpChain);
  sharpChain.resize.mockReturnValue(sharpChain);
  sharpChain.jpeg.mockReturnValue(sharpChain);

  return {
    sharp: vi.fn(() => sharpChain),
    sharpChain,
    getObject: vi.fn(),
    fPutObject: vi.fn(),
    saveMetadata: vi.fn(),
  };
});

vi.mock("sharp", () => ({
  default: mocks.sharp,
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

import { processImage } from "./imageProcessor";

describe("processImage", () => {
  const job = {
    assetId: 42,
    storageKey: "uploads/photo.png",
    mimeType: "image/png",
  };

  const leaseToken = "test-lease-token";

  beforeEach(() => {
    vi.clearAllMocks();

    mocks.sharpChain.metadata.mockResolvedValue({
      width: 1200,
      height: 800,
      format: "png",
    });

    mocks.sharpChain.toFile.mockResolvedValue({});
    mocks.getObject.mockResolvedValue(
      Readable.from([Buffer.from("fake image data")]),
    );
    mocks.fPutObject.mockResolvedValue("etag");
    mocks.saveMetadata.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads, transforms, uploads, and saves image metadata", async () => {
    await processImage(job, leaseToken);

    expect(mocks.getObject).toHaveBeenCalledWith(
      "test-bucket",
      "uploads/photo.png",
    );

    expect(mocks.sharp).toHaveBeenCalledTimes(2);

    expect(mocks.sharpChain.resize).toHaveBeenCalledWith({
      width: 400,
      height: 400,
      fit: "inside",
      withoutEnlargement: true,
    });

    expect(mocks.sharpChain.jpeg).toHaveBeenCalledWith({
      quality: 80,
    });

    expect(mocks.fPutObject).toHaveBeenCalledWith(
      "test-bucket",
      "thumbnails/thumb-42.jpg",
      expect.any(String),
      { "Content-Type": "image/jpeg" },
    );

    expect(mocks.saveMetadata).toHaveBeenCalledWith(
      42,
      {
        width: 1200,
        height: 800,
        format: "png",
        thumbnailKey: "thumbnails/thumb-42.jpg",
        processed: true,
      },
      leaseToken,
    );
  });

  it("saves null dimensions when image metadata is missing", async () => {
    mocks.sharpChain.metadata.mockResolvedValue({
      format: "png",
    });

    await processImage(job, leaseToken);

    expect(mocks.saveMetadata).toHaveBeenCalledWith(
      42,
      {
        width: null,
        height: null,
        format: "png",
        thumbnailKey: "thumbnails/thumb-42.jpg",
        processed: true,
      },
      leaseToken,
    );
  });

  it("propagates download errors", async () => {
    mocks.getObject.mockRejectedValueOnce(
      new Error("Storage unavailable"),
    );

    await expect(
      processImage(job, leaseToken),
    ).rejects.toThrow("Storage unavailable");

    expect(mocks.fPutObject).not.toHaveBeenCalled();
    expect(mocks.saveMetadata).not.toHaveBeenCalled();
  });

  it("propagates metadata-saving errors", async () => {
    mocks.saveMetadata.mockRejectedValueOnce(
      new Error("Metadata API unavailable"),
    );

    await expect(
      processImage(job, leaseToken),
    ).rejects.toThrow("Metadata API unavailable");
  });
});
