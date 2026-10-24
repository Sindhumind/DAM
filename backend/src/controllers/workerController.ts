import type { Request, Response, NextFunction } from "express";
import pool from "../config/db";
import {
  updateAssetStatus,
  claimAssetForProcessing,
  renewAssetProcessingLease,
} from "../repositories/assetRepository";

const validStatuses = [
  "UPLOADED",
  "COMPLETED",
  "FAILED",
] as const;

function isValidAssetId(assetId: number): boolean {
  return Number.isSafeInteger(assetId) && assetId > 0;
}

export async function saveWorkerMetadata(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assetId = Number(req.params.id);
    const metadata = req.body?.metadata;
    const leaseToken: unknown = req.body?.leaseToken;

    if (!isValidAssetId(assetId)) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    if (
      typeof leaseToken !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leaseToken)
    ) {
      res.status(400).json({ message: "Invalid lease token" });
      return;
    }

    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      res.status(400).json({ message: "Invalid metadata" });
      return;
    }

    const result = await pool.query(
      `
      UPDATE assets
      SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
        AND status = 'PROCESSING'
        AND processing_lease_token = $3::uuid
      RETURNING id
      `,
      [JSON.stringify(metadata), assetId, leaseToken],
    );

    if (result.rowCount === 0) {
      res.status(409).json({
        message: "Asset not found or processing lease is no longer valid",
      });
      return;
    }

    res.status(200).json({
      message: "Asset metadata saved successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkerAssetStatus(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assetId = Number(req.params.id);
    const status: unknown = req.body?.status;
    const leaseToken: unknown = req.body?.leaseToken;

    if (!isValidAssetId(assetId)) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    if (
      typeof status !== "string" ||
      !validStatuses.includes(status as (typeof validStatuses)[number])
    ) {
      res.status(400).json({ message: "Invalid asset status" });
      return;
    }

    if (
      typeof leaseToken !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leaseToken)
    ) {
      res.status(400).json({ message: "Invalid lease token" });
      return;
    }

    const asset = await updateAssetStatus(
      assetId,
      status as (typeof validStatuses)[number],
      leaseToken,
    );

    if (!asset) {
      res.status(409).json({
        message: "Asset not found or processing lease is no longer valid",
      });
      return;
    }

    res.status(200).json({
      message: "Asset status updated successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function claimWorkerAsset(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assetId = Number(req.params.id);

    if (!isValidAssetId(assetId)) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    const claim = await claimAssetForProcessing(assetId);

    if (!claim) {
      res.status(200).json({ claimed: false });
      return;
    }

    res.status(200).json({
      claimed: true,
      leaseToken: claim.leaseToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function renewWorkerAssetLease(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const assetId = Number(req.params.id);
    const leaseToken: unknown = req.body?.leaseToken;

    if (!isValidAssetId(assetId)) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    if (
      typeof leaseToken !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(leaseToken)
    ) {
      res.status(400).json({ message: "Invalid lease token" });
      return;
    }

    const renewed = await renewAssetProcessingLease(
      assetId,
      leaseToken,
    );

    res.status(200).json({ renewed });
  } catch (error) {
    next(error);
  }
}