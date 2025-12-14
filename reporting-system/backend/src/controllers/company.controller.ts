import { Request, Response, NextFunction } from "express";
import { CompanyService } from "../services/company.service";

/**
 * Company Controller
 * Handles HTTP requests and responses for company-related endpoints
 */
export class CompanyController {
  private companyService: CompanyService;

  constructor(companyService?: CompanyService) {
    this.companyService = companyService || new CompanyService();
  }

  /**
   * GET /SAGE/dynamoDB/echo
   * Health check endpoint for DynamoDB connectivity
   */
  echo = (req: Request, res: Response): void => {
    res.send("SAGE DynamoDB API is running😍😍");
  };

  /**
   * GET /SAGE/dynamoDB/retrieve
   * Get metric data by company's perm id, metric name and reported year
   */
  getMetric = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const permId = req.query.perm_id as string;
      const metricName = req.query.metric_name as string;
      const year = req.query.year as string;

      const result = await this.companyService.getMetric(
        permId,
        metricName,
        year
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /SAGE/dynamoDB/company/info
   * Get company industry and name by perm id
   */
  getCompanyInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const permId = req.query.perm_id as string;

      const result = await this.companyService.getCompanyInfo(permId);

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /SAGE/dynamoDB/metric/value
   * Get metric's value with formatted response
   */
  getMetricValue = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const permId = req.query.perm_id as string;
      const metricName = req.query.metric_name as string;
      const year = req.query.year as string;

      const result = await this.companyService.getMetricValue(
        permId,
        metricName,
        year
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
