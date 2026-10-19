import type { Response } from "express";
import { getDashboardStatsService } from "../services/assetService";
import type { AuthenticatedRequest } from "../middleware/authMiddleware";

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const stats = await getDashboardStatsService({
      userId: req.user.id,
      role: req.user.role,
    });

    return res.json(stats);
  } catch (error) {
    console.error("Get dashboard stats error:", error);

    return res.status(500).json({
      message: "Failed to fetch dashboard statistics",
    });
  }
};