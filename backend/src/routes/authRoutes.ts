import { Router } from "express";
import {
  login,
  logout,
  getCurrentSession,
} from "../controllers/authController";
import { createUserAccount } from "../controllers/userController";
import { loginRateLimit } from "../middleware/loginRateLimit";
import {
  authenticateToken,
  requireAdmin,
} from "../middleware/authMiddleware";

const router = Router();

router.post("/login", loginRateLimit, login);
router.post("/logout", logout);

// Verify the HttpOnly cookie and return the authenticated user.
router.get("/me", authenticateToken, getCurrentSession);

router.post(
  "/users",
  authenticateToken,
  requireAdmin,
  createUserAccount,
);

export default router;