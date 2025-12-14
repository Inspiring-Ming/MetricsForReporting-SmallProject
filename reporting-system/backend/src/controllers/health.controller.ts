import { Request, Response } from "express";

/**
 * Health Controller
 * Handles system health check endpoints
 */
export class HealthController {
  /**
   * GET /health
   * System health check
   */
  getHealth = (req: Request, res: Response): void => {
    res.status(200).json({ status: "ok" });
  };
}
