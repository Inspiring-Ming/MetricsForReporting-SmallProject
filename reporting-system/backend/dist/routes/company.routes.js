"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const router = (0, express_1.Router)();
const companyController = new company_controller_1.CompanyController();
/**
 * Company and Metrics Routes
 * Base path: /SAGE/dynamoDB
 */
// Health check
router.get("/echo", companyController.echo);
// Get metric data by company ID, metric name, and year
router.get("/retrieve", (0, validation_middleware_1.validateQueryParams)(["perm_id", "metric_name", "year"]), companyController.getMetric);
// Get company information (industry and name)
router.get("/company/info", (0, validation_middleware_1.validateQueryParams)(["perm_id"]), companyController.getCompanyInfo);
// Get metric value with formatted response
router.get("/metric/value", (0, validation_middleware_1.validateQueryParams)(["perm_id", "metric_name", "year"]), companyController.getMetricValue);
exports.default = router;
