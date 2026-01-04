"use strict";
/**
 * Report Routes
 * Routes for ESG report generation and management
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const router = (0, express_1.Router)();
const reportController = new report_controller_1.ReportController();
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
exports.default = router;
