import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { validateQueryParams } from "../middlewares/validation.middleware";

const router = Router();
const companyController = new CompanyController();

/**
 * Company and Metrics Routes
 * Base path: /SAGE/dynamoDB
 */

// Health check
router.get("/echo", companyController.echo);

// Get metric data by company ID, metric name, and year
router.get(
  "/retrieve",
  validateQueryParams(["perm_id", "metric_name", "year"]),
  companyController.getMetric
);

// Get company information (industry and name)
router.get(
  "/company/info",
  validateQueryParams(["perm_id"]),
  companyController.getCompanyInfo
);

// Get metric value with formatted response
router.get(
  "/metric/value",
  validateQueryParams(["perm_id", "metric_name", "year"]),
  companyController.getMetricValue
);

export default router;
