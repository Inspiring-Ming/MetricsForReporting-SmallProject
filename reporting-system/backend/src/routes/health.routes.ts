import { Router } from "express";
import { HealthController } from "../controllers/health.controller";

const router = Router();
const healthController = new HealthController();

/**
 * Health Check Routes
 */

// System health check
router.get("/health", healthController.getHealth);

export default router;
