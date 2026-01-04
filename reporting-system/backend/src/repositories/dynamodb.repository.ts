import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import dotenv from "dotenv";
import type { CompanyInfo, MetricRecord } from "../models/company.model";
import { NotFoundError, DatabaseError, InternalServerError } from "../errors";

dotenv.config();

/**
 * DynamoDB Repository
 * Handles all direct database operations for company and metric data
 */
export class DynamoDBRepository {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoDBClient = new DynamoDBClient({
      region: process.env.AWS_REGION || "ap-southeast-2",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    this.docClient = DynamoDBDocumentClient.from(dynamoDBClient);
    this.tableName = process.env.DYNAMODB_TABLE_NAME || "ESG-Metrics-Data";
  }

  /**
   * Get a specific metric by company ID, metric name, and year
   */
  async getMetric(
    permId: string,
    metricName: string,
    year: string
  ): Promise<MetricRecord> {
    const pk = `COMP#${permId}`;
    const sk = `YEAR#${year}#METRIC#${metricName}`;

    const command = new GetCommand({
      TableName: this.tableName,
      Key: { PK: pk, SK: sk },
    });

    try {
      const response = await this.docClient.send(command);

      if (!response.Item) {
        console.log(`No data for "${metricName}" of perm id "${permId}" in the "${year}"`);
        throw new NotFoundError(
          `No data for "${metricName}" of perm id "${permId}" in the "${year}"`
        );
      }

      return response.Item as MetricRecord;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(
        `Failed to retrieve metric: ${error.message || "Unknown error"}`
      );
    }
  }

  /**
   * Get company industry and name by company ID
   */
  async getCompanyInfo(permId: string): Promise<CompanyInfo> {
    const pk = `COMP#${permId}`;

    const command = new QueryCommand({
      TableName: this.tableName,
      KeyConditionExpression: "PK = :pk",
      ExpressionAttributeValues: { ":pk": pk },
      ProjectionExpression: "industry, company_name",
      Limit: 1,
    });

    try {
      const response = await this.docClient.send(command);

      if (!response.Items || response.Items.length === 0) {
        console.log(`❌ No industry found for the given company perm id: "${permId}".`);
        throw new NotFoundError(`❌ No industry found for the given company perm id: "${permId}".`);
      }

      const item = response.Items[0] as Partial<CompanyInfo>;

      if (!item.industry) {
        throw new InternalServerError(
          `❌ No industry field for perm id "${permId}" on metric(s) DynamoDB.`
        );
      }

      if (!item.company_name) {
        throw new InternalServerError(
          `❌ No company_name field for perm id "${permId}" on metric(s) DynamoDB.`
        );
      }

      return {
        industry: item.industry,
        company_name: item.company_name,
      };
    } catch (error: any) {
      if (error instanceof NotFoundError || error instanceof InternalServerError) {
        throw error;
      }
      console.error("❌ Error querying industry:", error);
      throw new DatabaseError(
        `Failed to retrieve company info: ${error.message || "Unknown error"}`
      );
    }
  }
}
