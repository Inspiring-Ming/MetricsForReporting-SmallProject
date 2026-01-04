"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDBRepository = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const dotenv_1 = __importDefault(require("dotenv"));
const errors_1 = require("../errors");
dotenv_1.default.config();
/**
 * DynamoDB Repository
 * Handles all direct database operations for company and metric data
 */
class DynamoDBRepository {
    constructor() {
        const dynamoDBClient = new client_dynamodb_1.DynamoDBClient({
            region: process.env.AWS_REGION || "ap-southeast-2",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
            },
        });
        this.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoDBClient);
        this.tableName = process.env.DYNAMODB_TABLE_NAME || "ESG-Metrics-Data";
    }
    /**
     * Get a specific metric by company ID, metric name, and year
     */
    async getMetric(permId, metricName, year) {
        const pk = `COMP#${permId}`;
        const sk = `YEAR#${year}#METRIC#${metricName}`;
        const command = new lib_dynamodb_1.GetCommand({
            TableName: this.tableName,
            Key: { PK: pk, SK: sk },
        });
        try {
            const response = await this.docClient.send(command);
            if (!response.Item) {
                console.log(`No data for "${metricName}" of perm id "${permId}" in the "${year}"`);
                throw new errors_1.NotFoundError(`No data for "${metricName}" of perm id "${permId}" in the "${year}"`);
            }
            return response.Item;
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError) {
                throw error;
            }
            throw new errors_1.DatabaseError(`Failed to retrieve metric: ${error.message || "Unknown error"}`);
        }
    }
    /**
     * Get company industry and name by company ID
     */
    async getCompanyInfo(permId) {
        const pk = `COMP#${permId}`;
        const command = new lib_dynamodb_1.QueryCommand({
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
                throw new errors_1.NotFoundError(`❌ No industry found for the given company perm id: "${permId}".`);
            }
            const item = response.Items[0];
            if (!item.industry) {
                throw new errors_1.InternalServerError(`❌ No industry field for perm id "${permId}" on metric(s) DynamoDB.`);
            }
            if (!item.company_name) {
                throw new errors_1.InternalServerError(`❌ No company_name field for perm id "${permId}" on metric(s) DynamoDB.`);
            }
            return {
                industry: item.industry,
                company_name: item.company_name,
            };
        }
        catch (error) {
            if (error instanceof errors_1.NotFoundError || error instanceof errors_1.InternalServerError) {
                throw error;
            }
            console.error("❌ Error querying industry:", error);
            throw new errors_1.DatabaseError(`Failed to retrieve company info: ${error.message || "Unknown error"}`);
        }
    }
}
exports.DynamoDBRepository = DynamoDBRepository;
