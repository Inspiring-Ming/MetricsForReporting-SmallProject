import { DynamoDBRepository } from "../repositories/dynamodb.repository";
import type { CompanyInfo, MetricRecord } from "../models/company.model";

/**
 * Company Service
 * Handles business logic for company-related operations
 */
export class CompanyService {
  private dynamoRepo: DynamoDBRepository;

  constructor(dynamoRepo?: DynamoDBRepository) {
    this.dynamoRepo = dynamoRepo || new DynamoDBRepository();
  }

  /**
   * Get company information including industry and name
   */
  async getCompanyInfo(permId: string): Promise<CompanyInfo> {
    return await this.dynamoRepo.getCompanyInfo(permId);
  }

  /**
   * Get a specific metric value for a company
   */
  async getMetric(
    permId: string,
    metricName: string,
    year: string
  ): Promise<MetricRecord> {
    return await this.dynamoRepo.getMetric(permId, metricName, year);
  }

  /**
   * Get metric value with formatted response
   */
  async getMetricValue(
    permId: string,
    metricName: string,
    year: string
  ): Promise<{
    value: string | number;
    pillar: string;
    reported_date: string;
  }> {
    const metric = await this.dynamoRepo.getMetric(permId, metricName, year);

    return {
      value: metric.metric_value,
      pillar: metric.pillar,
      reported_date: metric.reported_date ?? "",
    };
  }
}
