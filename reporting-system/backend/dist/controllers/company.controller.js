"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyController = void 0;
const company_service_1 = require("../services/company.service");
/**
 * Company Controller
 * Handles HTTP requests and responses for company-related endpoints
 */
class CompanyController {
    constructor(companyService) {
        /**
         * GET /SAGE/dynamoDB/echo
         * Health check endpoint for DynamoDB connectivity
         */
        this.echo = (req, res) => {
            res.send("SAGE DynamoDB API is running😍😍");
        };
        /**
         * GET /SAGE/dynamoDB/retrieve
         * Get metric data by company's perm id, metric name and reported year
         */
        this.getMetric = async (req, res, next) => {
            try {
                const permId = req.query.perm_id;
                const metricName = req.query.metric_name;
                const year = req.query.year;
                const result = await this.companyService.getMetric(permId, metricName, year);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * GET /SAGE/dynamoDB/company/info
         * Get company industry and name by perm id
         */
        this.getCompanyInfo = async (req, res, next) => {
            try {
                const permId = req.query.perm_id;
                const result = await this.companyService.getCompanyInfo(permId);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        /**
         * GET /SAGE/dynamoDB/metric/value
         * Get metric's value with formatted response
         */
        this.getMetricValue = async (req, res, next) => {
            try {
                const permId = req.query.perm_id;
                const metricName = req.query.metric_name;
                const year = req.query.year;
                const result = await this.companyService.getMetricValue(permId, metricName, year);
                res.json(result);
            }
            catch (error) {
                next(error);
            }
        };
        this.companyService = companyService || new company_service_1.CompanyService();
    }
}
exports.CompanyController = CompanyController;
