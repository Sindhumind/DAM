import type { Response } from "express";
import { getAssetsService } from "../services/assetService";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getAssets = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page as string, 10) || 1,
    );

    const requestedLimit =
      Number.parseInt(req.query.limit as string, 10) || 8;

    const limit = Math.min(50, Math.max(1, requestedLimit));

    const search =
      typeof req.query.search === "string" ? req.query.search : "";

    const allowedFilters = ["all", "image", "video"] as const;

    const requestedFilter =
      typeof req.query.filter === "string" ? req.query.filter : "all";

    const filter = allowedFilters.includes(
      requestedFilter as (typeof allowedFilters)[number],
    )
      ? (requestedFilter as (typeof allowedFilters)[number])
      : "all";

    const result = await getAssetsService(
      page,
      limit,
      search,
      filter,
      {
        userId: req.user.id,
        role: req.user.role,
      },
    );

    return res.json(result);
  } catch (error) {
    console.error("Get assets error:", error);

    return res.status(500).json({
      message: "Failed to fetch assets",
    });
  }
};