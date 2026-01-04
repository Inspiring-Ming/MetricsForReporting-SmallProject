"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const dynamodb_repository_1 = require("../repositories/dynamodb.repository");
/**
 * Company Service
 * Handles business logic for company-related operations
 */
class CompanyService {
    constructor(dynamoRepo) {
        this.dynamoRepo = dynamoRepo || new dynamodb_repository_1.DynamoDBRepository();
    }
    /**
     * Get company information including industry and name
     */
    async getCompanyInfo(permId) {
        return await this.dynamoRepo.getCompanyInfo(permId);
    }
    /**
     * Get a specific metric value for a company
     */
    async getMetric(permId, metricName, year) {
        return await this.dynamoRepo.getMetric(permId, metricName, year);
    }
    /**
     * Get metric value with formatted response
     */
    async getMetricValue(permId, metricName, year) {
        const metric = await this.dynamoRepo.getMetric(permId, metricName, year);
        return {
            value: metric.metric_value,
            pillar: metric.pillar,
            reported_date: metric.reported_date ?? "",
        };
    }
}
exports.CompanyService = CompanyService;
