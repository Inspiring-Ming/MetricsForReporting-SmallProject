/**
 * Computation Routes
 * Routes for metric computation and model execution
 */

import { Router } from "express";
import { ComputationController } from "../controllers/computation.controller";

const router = Router();
const computationController = new ComputationController();

/**
 * POST /SAGE/model/computation
 * Execute model computation with given metrics
 * 
 * Request body:
 * - perm_id: string - Company permanent ID
 * - calculation_type: string - Type of calculation/model to execute
 * - year: string - Year for metric data
 * - metricArray: string[] - Array of metric names to compute
 */
router.post("/computation", computationController.executeModel);

export default router;
