import { Router } from "express";
import healthRoutes from "./health.routes";
import companyRoutes from "./company.routes";
import codeExecutionRoutes from "./code-execution.routes";
import computationRoutes from "./computation.routes";
import reportRoutes from "./report.routes";

const router = Router();

/**
 * Main router
 * Aggregates all route modules
 */

// Health check routes
router.use("/", healthRoutes);

// Company and DynamoDB routes
router.use("/SAGE/dynamoDB", companyRoutes);

// Code execution routes
router.use("/SAGE/code", codeExecutionRoutes);

// Model computation routes
router.use("/SAGE/model", computationRoutes);

// Report generation routes
router.use("/SAGE/report", reportRoutes);

export default router;
