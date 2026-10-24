
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  query: vi.fn(),
  invalidateAssetListCache: vi.fn(),
}));

vi.mock("../config/db", () => ({
  default: {
    query: mocks.query,
  },
}));

vi.mock("./assetRepositoryUtils", () => ({
  invalidateAssetListCache: mocks.invalidateAssetListCache,
}));

import {
  updateAssetStatus,
  renewAssetProcessingLease,
} from "./assetProcessingRepository";

describe("assetProcessingRepository lease protection", () => {
  const assetId = 6;
  const leaseToken = "11111111-1111-4111-8111-111111111111";

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockResolvedValue({ rows: [] });
    mocks.invalidateAssetListCache.mockResolvedValue(undefined);
  });

  describe("updateAssetStatus", () => {
    it("uses the asset ID and lease token to guard status updates", async () => {
      await updateAssetStatus(assetId, "COMPLETED", leaseToken);

      expect(mocks.query).toHaveBeenCalledWith(
        expect.stringContaining("processing_lease_token = $3::uuid"),
        ["COMPLETED", assetId, leaseToken],
      );
    });

    it("returns null and does not invalidate cache when the lease is stale", async () => {
      mocks.query.mockResolvedValueOnce({ rows: [] });

      const result = await updateAssetStatus(
        assetId,
        "COMPLETED",
        leaseToken,
      );

      expect(result).toBeNull();
      expect(mocks.invalidateAssetListCache).not.toHaveBeenCalled();
    });

    it("returns the updated asset and invalidates cache on success", async () => {
      const updatedAsset = {
        id: assetId,
        status: "COMPLETED",
        processing_lease_token: null,
      };

      mocks.query.mockResolvedValueOnce({ rows: [updatedAsset] });

      const result = await updateAssetStatus(
        assetId,
        "COMPLETED",
        leaseToken,
      );

      expect(result).toEqual(updatedAsset);
      expect(mocks.invalidateAssetListCache).toHaveBeenCalledOnce();
    });
  });

  describe("renewAssetProcessingLease", () => {
    it("renews only when the asset is processing with the matching token", async () => {
      await renewAssetProcessingLease(assetId, leaseToken);

      expect(mocks.query).toHaveBeenCalledWith(
        expect.stringContaining("processing_lease_token = $2::uuid"),
        [assetId, leaseToken],
      );
      expect(mocks.query.mock.calls[0][0]).toContain(
        "status = 'PROCESSING'",
      );
    });

    it("returns false when the lease token no longer matches", async () => {
      mocks.query.mockResolvedValueOnce({ rows: [] });

      const renewed = await renewAssetProcessingLease(
        assetId,
        leaseToken,
      );

      expect(renewed).toBe(false);
    });

    it("returns true when the lease is renewed", async () => {
      mocks.query.mockResolvedValueOnce({ rows: [{ id: assetId }] });

      const renewed = await renewAssetProcessingLease(
        assetId,
        leaseToken,
      );

      expect(renewed).toBe(true);
    });
  });
});