/**
 * Report Controller
 * Handles HTTP requests for ESG report generation
 */

import { Request, Response, NextFunction } from "express";
import { ReportService } from "../services/report.service";

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  /**
   * POST /SAGE/report/generate
   * Generate ESG Report (PDF or HTML)
   */
  generateReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileType, data } = req.body;

      const result = await this.reportService.generateReport(fileType, data);

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * DELETE /SAGE/report/:fileName
   * Delete a generated report file
   */
  deleteReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { fileName } = req.params;

      this.reportService.deleteReport(fileName);

      res.json({});
    } catch (error) {
      next(error);
    }
  };
}
