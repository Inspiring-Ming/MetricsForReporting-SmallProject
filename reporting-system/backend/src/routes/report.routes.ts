/**
 * Report Routes
 * Routes for ESG report generation and management
 */

import { Router } from "express";
import { ReportController } from "../controllers/report.controller";

const router = Router();
const reportController = new ReportController();

/**
 * POST /SAGE/report/generate
 * Generate ESG Report (PDF or HTML)
 * 
 * Request body:
 * - fileType: string - Type of file to generate ("pdf" or "html")
 * - data: ReportData - Report data including company info, metrics, etc.
 */
router.post("/generate", reportController.generateReport);

/**
 * DELETE /SAGE/report/:fileName
 * Delete a generated report file
 * 
 * Path parameters:
 * - fileName: string - Name of the file to delete
 */
router.delete("/:fileName", reportController.deleteReport);

export default router;
