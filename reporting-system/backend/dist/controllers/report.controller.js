"use strict";
/**
 * Report Controller
 * Handles HTTP requests for ESG report generation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_service_1 = require("../services/report.service");
class ReportController {
    constructor() {
        /**
         * POST /SAGE/report/generate
         * Generate ESG Report (PDF or HTML)
         */
        this.generateReport = async (req, res, next) => {
            try {
                const { fileType, data } = req.body;
                const result = await this.reportService.generateReport(fileType, data);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * DELETE /SAGE/report/:fileName
         * Delete a generated report file
         */
        this.deleteReport = async (req, res, next) => {
            try {
                const { fileName } = req.params;
                this.reportService.deleteReport(fileName);
                res.json({});
            }
            catch (error) {
                next(error);
            }
        };
        this.reportService = new report_service_1.ReportService();
    }
}
exports.ReportController = ReportController;
